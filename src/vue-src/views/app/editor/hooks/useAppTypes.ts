import { ref, unref, Ref, onUnmounted, watchEffect } from 'vue';
import groupSender from '/@/ipc/group';
import appSender from '/@/ipc/app';
import { createTypesContext } from '/@/components/TypeSelector';

export function useAppTypes(uuid: Ref<string>) {
  const types = ref<string[]>([]);
  async function getTypes() {
    const groupTypes = await groupSender.getTypes();
    const appTypes = await appSender.getTypes(unref(uuid));
    types.value = [...groupTypes, ...appTypes];
  }
  async function setTypes(searchVal) {
    await appSender.setTypes(unref(uuid), searchVal);
  }
  const appEvent = appSender.onTypesChange(() => {
    getTypes();
  });
  const groupEvent = groupSender.onTypesChange(() => {
    getTypes();
  });
  watchEffect(() => {
    getTypes();
  });

  createTypesContext({ types, setTypes });
  onUnmounted(() => {
    appEvent.dispose();
    groupEvent.dispose();
  });
}
