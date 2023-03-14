import { ref, unref, Ref, onUnmounted, watchEffect } from 'vue';
import groupSender from '/@/ipc/group';
import { createTypesContext } from '/@/components/TypeSelector';

export function useComponentTypes(groupKey: Ref<string>) {
  const types = ref<string[]>([]);
  async function getTypes() {
    types.value = await groupSender.getTypes();
  }
  async function setTypes(searchVal) {
    await groupSender.setTypes(unref(groupKey), searchVal);
  }
  const event = groupSender.onTypesChange(() => {
    getTypes();
  });

  createTypesContext({ types, setTypes });

  watchEffect(() => {
    getTypes();
  });

  createTypesContext({ types, setTypes });
  onUnmounted(() => {
    event.dispose();
  });
}
