import path from 'path';
import t, { BinaryExpression, Identifier, Node, IfStatement, Statement } from '@babel/types';
import generate from '@babel/generator';
import { CommandType, SrcType, ValueType } from '@src/platform/common/enum';
import {
  CommandNode,
  CodeCommand,
  ComponentCommand,
  IfCommand,
  ElseIfCommand,
  ElseCommand,
  ForEachCommand,
} from '@src/platform/common/types';
import { templateToAst } from '@src/platform/common/parser';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { Disposable } from '@src/base/common/lifecycle';
import {
  ICommandService,
  IRequiredGroupDep,
  IReturnObj,
  RunTemplateObj,
} from '@src/platform/command/command';
import { ICodeMeta } from '@src/platform/app/app';

export class CommandService extends Disposable implements ICommandService {
  readonly _serviceBrand: undefined;
  private _outputVarSet = new Set<string>(); // 记录代码中用到的output变量集合
  private _requiredGroupSet = new Set<string>(); // 记录需要引入的分组key及版本
  private _requiredCodeMap = new Map<string, ICodeMeta>();
  private _requiredGroupDeps: IRequiredGroupDep[] = [];
  constructor(
    @ILogService private readonly logService: ILogService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
  }
  private get commandToAst() {
    return {
      [CommandType.Code]: this.toCodeAst.bind(this),
      [CommandType.Component]: this.toComponentAst.bind(this),
      [CommandType.If]: this.toIfAst.bind(this),
      [CommandType.ElseIf]: this.toElseIfAst.bind(this),
      [CommandType.Else]: this.toElseAst.bind(this),
      [CommandType.ForEach]: this.toForEachAst.bind(this),
    };
  }
  private getInputAstValue(type: ValueType, value: string) {
    const astFuncMap = {
      [ValueType.Unknown]: t.stringLiteral,
      [ValueType.String]: t.stringLiteral,
      [ValueType.Boolean]: t.booleanLiteral,
      [ValueType.Number]: t.numericLiteral,
    };

    try {
      if (type === ValueType.List) {
        const ast = templateToAst(value);
        return ast.expression;
      } else if (type === ValueType.Object) {
        const ast = templateToAst(`(${value})`);
        return ast.expression;
      } else {
        let val;
        if (type === ValueType.Boolean) {
          val = Boolean(value);
        } else if (type === ValueType.Number) {
          val = Number.parseInt(value, 10);
        } else {
          val = value;
        }
        return ((astFuncMap[type] as any) || t.stringLiteral)(val);
      }
    } catch (e) {
      this.logService.error('get ast value error: ' + e);
    }
  }
  private getAstValue(srcType: SrcType, type: ValueType, value = '') {
    let astVal;
    try {
      if (srcType === SrcType.Input) {
        astVal = this.getInputAstValue(type, value);
      } else if (srcType === SrcType.Output && value?.includes('.')) {
        const [parentKey, subKey] = value.split('.');
        astVal = t.memberExpression(t.identifier(parentKey), t.identifier(subKey));
      } else if (srcType == SrcType.Global) {
        astVal = t.memberExpression(
          t.memberExpression(t.identifier('global'), t.identifier(value)),
          t.identifier('value'),
        );
      } else if (value === '') {
        astVal = t.identifier('undefined');
      } else {
        astVal = t.identifier(value);
      }
      return astVal;
    } catch (e) {
      this.logService.error('getAstValue Error: ', e);
    }
  }
  private toCodeAst(item: CodeCommand): t.Statement {
    const { code, inputs, output, id, name, errorHandling } = item;
    this._requiredCodeMap.set(id, { code, meta: { inputs, output, id, name, errorHandling } });
    // eslint-disable-next-line prettier/prettier
    let templateStr = `await ${`code_${id}`}.run(%%inputs%%, ${JSON.stringify({
      id,
      errorHandling,
    })});`;
    const templateObj: RunTemplateObj = {
      inputs: t.objectExpression(
        inputs?.map(({ srcType, type, key, value }) => {
          const astVal = this.getAstValue(srcType, type, value);
          return t.objectProperty(t.identifier(key), astVal);
        }) || [],
      ),
    };
    if (output?.key) {
      if (!this._outputVarSet.has(output?.key)) {
        this._outputVarSet.add(output?.key);
        templateStr = `let %%output%% = ${templateStr}`;
      } else {
        templateStr = `%%output%% = ${templateStr}`;
      }

      templateObj.output = t.identifier(output.key);
    }

    const ast = templateToAst(templateStr, templateObj);
    return ast as t.Statement;
  }
  private toComponentAst(item: ComponentCommand): t.Statement {
    const { inputs, output, id, group, func, errorHandling, version } = item;
    this._requiredGroupSet.add(`${group}&${version}`);
    // eslint-disable-next-line prettier/prettier
    let templateStr = `await ${`${group}_v${version}`}.${func}.run(%%inputs%%, ${JSON.stringify({
      id,
      errorHandling,
    })});`;
    const templateObj: RunTemplateObj = {
      inputs: t.objectExpression(
        inputs?.map(({ srcType, type, key, value }) => {
          const astVal = this.getAstValue(srcType, type, value);
          return t.objectProperty(t.identifier(key), astVal);
        }) || [],
      ),
    };
    if (output?.key) {
      if (!this._outputVarSet.has(output?.key)) {
        this._outputVarSet.add(output?.key);
        templateStr = `let %%output%% = ${templateStr}`;
      } else {
        templateStr = `%%output%% = ${templateStr}`;
      }

      templateObj.output = t.identifier(output.key);
    }

    const ast = templateToAst(templateStr, templateObj);
    return ast as t.Statement;
  }
  private toIfAst(item: IfCommand): t.Statement {
    const { leftSrcType, leftValue, rightSrcType, rightValue, operator, tasks } = item;
    const templateStr = `if (%%testExp%%) {
      %%content%%
    }`;
    const left = this.getAstValue(leftSrcType, ValueType.String, leftValue);
    const right = this.getAstValue(rightSrcType, ValueType.String, rightValue);
    const templateObj: {
      content?: Node[];
      testExp: BinaryExpression;
    } = {
      testExp: t.binaryExpression(operator, left, right),
    };
    if (tasks) {
      templateObj.content = this.jsonToAstArr(tasks);
    }
    const ast = templateToAst(templateStr, templateObj);
    return ast as t.Statement;
  }
  private toElseIfAst(item: ElseIfCommand): t.Statement {
    const { leftSrcType, leftValue, rightSrcType, rightValue, operator, tasks } = item;
    const templateStr = `if (%%testExp%%) {
      %%content%%
    }`;
    const left = this.getAstValue(leftSrcType, ValueType.String, leftValue);
    const right = this.getAstValue(rightSrcType, ValueType.String, rightValue);
    const templateObj: {
      content?: Node[];
      testExp: BinaryExpression;
    } = {
      testExp: t.binaryExpression(operator, left, right),
    };
    if (tasks) {
      templateObj.content = this.jsonToAstArr(tasks);
    }
    const ast = templateToAst(templateStr, templateObj) as Statement;
    return ast as t.Statement;
  }
  private toElseAst(item: ElseCommand): t.Statement {
    const { tasks } = item;
    const templateStr = `{
      %%content%%
    }`;
    const templateObj: {
      content?: Node[];
    } = {};
    if (tasks) {
      templateObj.content = this.jsonToAstArr(tasks);
    }
    const ast = templateToAst(templateStr, templateObj) as Statement;
    return ast as t.Statement;
  }
  private toForEachAst(item: ForEachCommand) {
    const { srcType, items, output, tasks } = item;
    const templateStr = `for (const %%output%% of %%items%%) {
      %%content%%
    }`;
    const list = this.getAstValue(srcType, ValueType.List, items);
    const templateObj: {
      content?: Node[];
      output: Identifier;
      items: Identifier;
    } = {
      output: t.identifier(output.key),
      items: list,
    };
    if (tasks) {
      templateObj.content = this.jsonToAstArr(tasks);
    }
    const ast = templateToAst(templateStr, templateObj);
    return ast as t.Statement;
  }
  private getRequiredGroupAstArr() {
    const astArr = [...this._requiredGroupSet].map((item) => {
      const [groupKey, version] = item.split('&');
      const localPath = path.join(this.environmentService.groupPath, groupKey, `v${version}`);
      this._requiredGroupDeps.push({ groupKey, version, localPath });
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(`${groupKey}_v${version}`),
          t.callExpression(t.identifier('require'), [t.stringLiteral(localPath)]),
        ),
      ]);
    });
    return astArr;
  }
  private getRequiredCodeAstArr() {
    const astArr = Array.from(this._requiredCodeMap.keys()).map((key) => {
      const localPath = `.${path.sep}${path.join('components', key)}`;
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(`code_${key}`),
          t.callExpression(t.identifier('require'), [t.stringLiteral(localPath)]),
        ),
      ]);
    });
    return astArr;
  }
  private getGlobalAst() {
    return templateToAst('const global = require("./global.json")');
  }
  private getRequiredAstArr() {
    return [...this.getRequiredGroupAstArr(), ...this.getRequiredCodeAstArr(), this.getGlobalAst()];
  }
  private combineJudgeAst(judgeAstMap: Map<CommandType, IfStatement>): Node {
    const nodes = [...judgeAstMap.values()];
    nodes.reduce((prev, curr) => {
      prev.alternate = curr;
      return curr;
    });
    // 处理完成，清除Map
    judgeAstMap.clear();
    return nodes[0];
  }
  private jsonToAstArr(jsonArr: CommandNode[]): Node[] {
    // 存储分支类型的ast节点，统一处理
    const tempJudgeAstMap = new Map<CommandType, IfStatement>();
    const astArr: Node[] = [];
    const jsonArrLength = jsonArr.length;
    jsonArr.forEach((item, index) => {
      const type = item.type;
      const toAstFunc = this.commandToAst[type] as any;
      const ast = toAstFunc(item);
      if (CommandType.If === type) {
        // 有未拼接的分支表达式，开始拼接
        if (tempJudgeAstMap.size !== 0) {
          const combAst = this.combineJudgeAst(tempJudgeAstMap);
          astArr.push(combAst);
        }
        tempJudgeAstMap.set(type, ast);
      } else if ([CommandType.ElseIf, CommandType.Else].includes(type)) {
        if (!tempJudgeAstMap.has(CommandType.If)) {
          throw new Error('else if or else statement must after if statement');
        }
        tempJudgeAstMap.set(type, ast);
        if (CommandType.Else === type) {
          const combAst = this.combineJudgeAst(tempJudgeAstMap);
          astArr.push(combAst);
        }
      } else {
        // 有未拼接的分支表达式，开始拼接
        if (tempJudgeAstMap.size !== 0) {
          const combAst = this.combineJudgeAst(tempJudgeAstMap);
          astArr.push(combAst);
        }
        astArr.push(ast);
      }
      // 已经是最后一个指令，并且tempJudgeAstMap不为空，开始拼接
      if (index + 1 === jsonArrLength && tempJudgeAstMap.size !== 0) {
        const combAst = this.combineJudgeAst(tempJudgeAstMap);
        astArr.push(combAst);
      }
    });

    return astArr;
  }
  private jsonToProgramAst(jsonArr: CommandNode[]): t.Program {
    const templateStr = `
    (async function () {
      %%content%%
      process.exit(0);
    })();
  `;
    try {
      const astArr = this.jsonToAstArr(jsonArr);
      const requiredArr = this.getRequiredAstArr();
      const program = templateToAst(templateStr, {
        content: astArr,
      });
      const ast = t.program([...requiredArr, program as t.Statement]);
      return ast;
    } catch (e) {
      const error = 'json to ast error: ' + e;
      this.logService.error(error);
      throw new Error(error);
    }
  }
  private clearSet() {
    this._outputVarSet.clear();
    this._requiredGroupSet.clear();
    this._requiredCodeMap.clear();
    this._requiredGroupDeps.length = 0;
  }
  jsonToCode(jsonArr: CommandNode[]): IReturnObj {
    this.clearSet();
    const ast = this.jsonToProgramAst(jsonArr);
    const codeStr = generate(ast).code;
    return {
      code: codeStr,
      requiredGroupDeps: this._requiredGroupDeps,
      requiredCodeMap: this._requiredCodeMap,
    };
  }
  dispose(): void {
    super.dispose();
    this.clearSet();
  }
}
