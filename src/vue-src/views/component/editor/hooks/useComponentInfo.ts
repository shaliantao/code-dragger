import { ref, watchEffect, Ref, unref } from 'vue';
import componentSender from '/@/ipc/component';
import { IComponentMeta } from '@src/platform/component/component';

export function useComponentInfo(group: Ref<string>, func: Ref<string>) {
  const info = ref<IComponentMeta | null>(null);
  watchEffect(async () => {
    info.value = await componentSender.getComponentInfo(unref(group), unref(func));
  });
  return {
    info,
  };
}
