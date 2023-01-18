import { Ref, ref, unref, watch, toRaw, watchEffect, ComputedRef } from 'vue';
import { cloneDeep } from 'lodash-es';
import type { InputsOutput } from '@src/platform/code/code';
import type { InputArg, OutputArg } from '@src/platform/common/types';
import { ValueType } from '@src/platform/common/enum';

export type IWrapWithRef<T> = {
  [P in keyof T]: Ref<Nullable<T[P]>>;
};

export function useInputOutput(
  initialIoParams: ComputedRef<InputsOutput> | Ref<InputsOutput>,
  ioParams: Ref<Nullable<InputsOutput>>,
  getOutput: () => Nullable<OutputArg>,
): IWrapWithRef<InputsOutput> {
  const inputs = ref<Nullable<InputArg[]>>(null);
  const output = ref<Nullable<OutputArg>>(null);

  watchEffect(() => {
    inputs.value = unref(initialIoParams).inputs || null;
    output.value = unref(initialIoParams).output || null;
  });
  /**
   * 监听根据code解析出的ioParams，并与历史ioParams合并后赋值给输入输出
   */
  watch(ioParams, (val) => {
    if (val !== null) {
      // 合并新旧输入状态，如果key相同保留老状态中的‘名称’，‘类型’和‘默认值’如果有新的用新的，没有用旧的
      const newInputs = cloneDeep(toRaw(val).inputs);
      const newOutput = cloneDeep(toRaw(val).output);
      if (newInputs && newInputs.length !== 0) {
        inputs.value = newInputs.map((input) => {
          const oldInput = unref(inputs)?.find((item) => item.key === input.key);
          if (oldInput) {
            // name 和 isEnum无法解析，直接使用历史值
            input.name = oldInput.name;
            input.isEnum = oldInput.isEnum;
            input.value = oldInput.value;
            input.srcType = oldInput.srcType;
            // type 和 defaultVal根据新解析出的结果，决定是否使用历史值
            input.type === ValueType.Unknown && (input.type = oldInput.type);
            !input.defaultVal && (input.defaultVal = oldInput.defaultVal);
          }
          return input;
        });
      } else {
        inputs.value = null;
      }
      if (!newOutput) {
        output.value = null;
        return;
      }
      const oldOutput = getOutput();
      if (oldOutput) {
        newOutput.name = oldOutput.name;
        !newOutput.key && (newOutput.key = oldOutput.key);
        // 如果新输出类型未知，则使用旧输出类型
        if (newOutput.type === ValueType.Unknown) {
          (newOutput as OutputArg).type = oldOutput.type;
        }
        // 如果新旧输出类型都是List，并且新输出没有child，或child的type为Unknow，则使用旧的输出child
        if (newOutput.type === ValueType.List && oldOutput.type === ValueType.List) {
          (!newOutput.child || newOutput.child.type === ValueType.Unknown) &&
            (newOutput.child = oldOutput.child);
        }
        // 如果新旧输出类型都是Object，并且新输出没有children，则使用旧的输出children
        if (newOutput.type === ValueType.Object && oldOutput.type === ValueType.Object) {
          if (!newOutput.children) {
            newOutput.children = oldOutput.children;
          } else {
            newOutput.children = newOutput.children.map((child) => {
              const oldChild = oldOutput.children.find((oldChild) => oldChild.key === child.key);
              if (!oldChild) {
                return child;
              }
              child.name = oldChild.name;
              child.type === ValueType.Unknown && (child.type = oldChild.type);
              return child;
            });
          }
        }
      }
      output.value = newOutput;
    }
  });

  return { inputs, output };
}
