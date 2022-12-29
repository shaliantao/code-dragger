import { ref, watchEffect, Ref, unref } from 'vue';
import appSender from '/@/ipc/app';
import { IAppMeta } from '@src/platform/app/app';

export function useAppInfo(uuid: Ref<string>) {
  const info = ref<IAppMeta | null>(null);
  watchEffect(async () => {
    info.value = await appSender.getAppInfo(unref(uuid));
  });
  return {
    info,
  };
}
