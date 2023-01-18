import { ref, watch, shallowRef, Ref, ComputedRef } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import componentSender from '/@/ipc/component';
import type { InputsOutput } from '@src/platform/code/code';

export function useCodeParse(code: Ref<string> | ComputedRef<string>) {
  const alertStr = ref('Parsing...');
  const alertType = ref<'info' | 'warning'>('info');
  const ioParams = shallowRef<Nullable<InputsOutput>>(null);
  watch(
    code,
    useDebounceFn(async (code: string) => {
      try {
        alertStr.value = 'Parsing...';
        const res = await componentSender.parseIOParams(code);
        ioParams.value = res;
        alertStr.value = 'Parse success';
        alertType.value = 'info';
      } catch (e: any) {
        alertStr.value = e.message;
        alertType.value = 'warning';
      }
    }, 500),
  );
  return {
    alertStr,
    alertType,
    ioParams,
  };
}
