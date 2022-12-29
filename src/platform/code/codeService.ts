import { Event, Emitter } from '@base/common/event';
import { Disposable } from '@src/base/common/lifecycle';
import { codeToAst } from '@src/platform/common/parser';
import { IComponentMeta, ComponentItem } from '@src/platform/component/component';
import {
  BaseOutputArg,
  InputArg,
  ObjectOutputArg,
  ListOutputArg,
  OutputArg,
} from '@src/platform/common/types';
import { SrcType, ValueType, IsEnum, ErrorHandling } from '@src/platform/common/enum';
import { ILogService } from '@base/log/logService';
import {
  ICodeService,
  InputsOutput,
  CodeError,
  CodeErrorType,
  valueTypeMap,
  basicType,
} from '@src/platform/code/code';
import {
  isArrayExpression,
  isObjectExpression,
  isReturnStatement,
  isObjectPattern,
  isObjectProperty,
  isIdentifier,
  isAssignmentPattern,
  isAssignmentExpression,
  isExpressionStatement,
  isMemberExpression,
} from '@babel/types';
import type {
  Statement,
  ReturnStatement,
  Expression,
  ObjectExpression,
  FunctionExpression,
  ExpressionStatement,
  AssignmentExpression,
} from '@babel/types';
import generate from '@babel/generator';

export class CodeService extends Disposable implements ICodeService {
  readonly _serviceBrand: undefined;
  private readonly _onTerminalData = this._register(new Emitter<string>());
  readonly onTerminalData: Event<string> = this._onTerminalData.event;
  constructor(@ILogService private readonly logService: ILogService) {
    super();
  }
  genGroupIndex(list: ComponentItem[]): string {
    const requiredArr = list.map(
      (item) => `const ${item.func} = require('./components/${item.func}');`,
    );
    const exportArr = list.map((item) => `${item.func},`);
    const code = `${requiredArr.join('\n')}\n\nmodule.exports = {\n${exportArr.join('\n')}\n};`;
    return code;
  }
  getModuleExport(meta: IComponentMeta): string {
    /**
     * 根据meta信息生成组件入口index.js文件内容
     */
    const MODULE_EXPORT = `\n const meta = ${JSON.stringify(meta)};
    module.exports = {
      run: async function(inputs, info) {
        try {
          console.log(JSON.stringify({ startTime: Date.now(), info, meta }));
          const code = require('./code.js');
          const res = await code(inputs);
          console.log(JSON.stringify({ endTime: Date.now(), result: res, info, meta }));
          return res;
        } catch(e) {
          console.error(JSON.stringify({ endTime: Date.now(), error: e.toString(), info, meta}));
          if (info.errorHandling === ${ErrorHandling.Stop}) {
            process.exit(0);
          }
        }
      }
    }`;
    return MODULE_EXPORT;
  }
  private _getBasicOutput(key: string, argument: Expression): BaseOutputArg {
    const type = valueTypeMap.get(argument.type) || ValueType.Unknown;
    const output = {
      name: '',
      key,
      type,
    } as BaseOutputArg;
    return output;
  }
  private _getObjectOutput(key: string, argument: ObjectExpression): ObjectOutputArg {
    const children: BaseOutputArg[] = argument.properties.map((item) => {
      const subOutput: BaseOutputArg = {
        name: '',
        key,
        type: ValueType.Unknown,
      };
      if (isObjectProperty(item)) {
        const { key, value } = item;
        if (isIdentifier(key)) {
          subOutput.key = key.name;
        }
        const type = valueTypeMap.get(value.type) || ValueType.Unknown;
        if (type !== ValueType.Object && type !== ValueType.List) {
          subOutput.type = type;
        } else {
          throw new CodeError(
            'return object only support base type',
            CodeErrorType.SingleObjectParam,
          );
        }
      }
      return subOutput;
    });
    const output: ObjectOutputArg = {
      name: '',
      key,
      type: ValueType.Object,
      children,
    };
    return output;
  }
  private _getListOutput(key: string): ListOutputArg {
    return {
      name: '',
      key,
      type: ValueType.List,
      child: { type: ValueType.Unknown, name: '', key: '' },
    };
  }
  private _getOutput(blockBody: Statement[]) {
    let output: Nullable<OutputArg> = null;
    // 获取导出函数返回值，有则复制到输出对象output属性上
    const returnNode: Nullable<ReturnStatement> =
      (blockBody.find((item) => isReturnStatement(item)) as ReturnStatement) || null;
    const argument = returnNode && returnNode.argument;
    if (argument) {
      const key = (isIdentifier(argument) && argument.name) || '';
      if (!isObjectExpression(argument) && !isArrayExpression(argument)) {
        output = this._getBasicOutput(key, argument);
      } else if (isObjectExpression(argument)) {
        output = this._getObjectOutput(key, argument);
      } else if (isArrayExpression(argument)) {
        output = this._getListOutput(key);
      }
    }
    return output;
  }
  private _getInputs(params) {
    let inputs: Nullable<InputArg[]> = null;
    if (params.length === 0) {
      return inputs;
    }
    // 获取导出函数输入参数对象，有则将参数解析到inputs属性上
    if (!(params.length === 1 && isObjectPattern(params[0]))) {
      throw new CodeError(
        'The exports function supports only one object parameter',
        CodeErrorType.SingleObjectParam,
      );
    }
    const { properties } = params[0];
    inputs = properties.map((item) => {
      const input: InputArg = {
        name: '',
        key: '',
        value: '',
        defaultVal: '',
        type: ValueType.Unknown,
        srcType: SrcType.Input,
        isEnum: IsEnum.No,
      };
      if (isObjectProperty(item)) {
        const { key, value } = item;
        if (isIdentifier(key)) {
          input.key = key.name;
        }
        if (isAssignmentPattern(value)) {
          const right = value.right;
          if (valueTypeMap.has(right.type)) {
            if (!(isArrayExpression(right) || isObjectExpression(right))) {
              input.defaultVal = (right as basicType).value.toString();
            } else {
              const code = generate(right).code;
              input.defaultVal = code;
            }
            input.type = valueTypeMap.get(right.type) || ValueType.Unknown;
          }
        }
      }
      return input;
    });
    if (inputs!.length !== 0) {
      inputs = inputs;
    }
    return inputs;
  }
  /** 检查是否存在默认导出的function */
  private _findExportsFunc(body: Statement[]): FunctionExpression {
    const exportRunFunc = body.find(
      (item) =>
        isExpressionStatement(item) &&
        isAssignmentExpression(item.expression) &&
        isMemberExpression(item.expression.left) &&
        isIdentifier(item.expression.left.object) &&
        item.expression.left.object.name === 'module' &&
        isIdentifier(item.expression.left.property) &&
        item.expression.left.property.name === 'exports',
    ) as ExpressionStatement | undefined;
    if (!exportRunFunc) {
      throw new CodeError(
        'Need export a function with module.exports',
        CodeErrorType.NeedExportsFunc,
      );
    }
    const expression = exportRunFunc.expression as AssignmentExpression;
    return expression.right as FunctionExpression;
  }
  private _getInputsOutput(exportsFunc: FunctionExpression) {
    const inputsOutput: InputsOutput = {
      inputs: null,
      output: null,
    };
    const { params, body: funcBody } = exportsFunc;
    const { body: blockBody } = funcBody;
    const inputs = this._getInputs(params);
    const output = this._getOutput(blockBody);
    inputs && (inputsOutput.inputs = inputs);
    output && (inputsOutput.output = output);
    return inputsOutput;
  }
  parseIOParmas(codeStr: string): InputsOutput {
    this.logService.info('parseIOParmas');
    const ast = codeToAst(codeStr);
    const { program } = ast;
    const { body } = program;
    const exportsFunc = this._findExportsFunc(body);
    const inputsOutput = this._getInputsOutput(exportsFunc);
    return inputsOutput;
  }
}
