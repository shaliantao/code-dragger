import { ref, watchEffect, Ref, unref } from 'vue';
import groupSender from '/@/ipc/group';
import { IGroupInfo } from '@src/platform/group/group';

export function useGroupInfo(key: Ref<string>) {
  const info = ref<IGroupInfo | null>(null);
  watchEffect(async () => {
    reload();
  });
  async function reload() {
    info.value = await groupSender.getGroupInfo(unref(key));
  }
  return {
    info,
    reload,
  };
}
