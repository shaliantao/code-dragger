<template>
  <nested-draggable
    class="task-container"
    :curr-node-id="currNodeId"
    :tasks="commandFlow"
    :parent="{ type: CommandType.Top, tasks: commandFlow }"
    @click-node="onClick"
    @dblclick-node="onDblclick"
    @change-node="onChangeNode"
    @del-node="onDel"
    v-bind="targetOptions"
  />
  <CommandEditor @on-save="onSave" @on-close="onClose" @register="register" />
</template>

<script setup lang="ts">
  import { watchEffect, unref, ref, computed, onUnmounted } from 'vue';
  import appSender from '/@/ipc/app';
  import executorSender from '/@/ipc/executor';
  import { CommandType } from '@src/platform/common/enum';
  import { CommandNode } from '@src/platform/common/types';
  import { useDrawer } from '/@/components/Drawer';
  import CommandEditor from './CommandEditor';
  import NestedDraggable from './NestedDraggable.vue';

  const props = defineProps({
    uuid: {
      type: String,
      required: true,
    },
  });

  const [register, { openDrawer }] = useDrawer();
  const commandFlow = ref<CommandNode[]>([]);

  function onChangeNode(event, parent) {
    if (event.hasOwnProperty('added')) {
      const { element } = event.added;
      openEditor(element, parent);
    } else if (event.hasOwnProperty('moved')) {
      const { element } = event.moved;
      openEditor(element, parent);
    }
  }

  function onClick(_event, task) {
    setCurrNode(task);
  }

  function onDblclick(_event, task, parent) {
    openEditor(task, parent);
  }

  function onDel(_event, task, parent) {
    const { tasks } = parent;
    const index = tasks.findIndex((item) => item.id === task.id);
    tasks.splice(index, 1);
  }

  let currNode = ref<Nullable<CommandNode>>(null);
  let currId = ref<string>();

  function resetCurrNode() {
    currNode.value = null;
  }

  function onSave(newNode, resetCurr = true) {
    const curr = unref(currNode);
    if (curr !== null) {
      if (curr.id === newNode.id) {
        for (let key in newNode) {
          if (newNode.hasOwnProperty(key)) {
            curr && (curr[key] = newNode[key]);
          }
        }
      }
    }
    resetCurr && resetCurrNode();
  }
  function setCurrNode(task) {
    currNode.value = task;
  }

  const currNodeId = computed(() => {
    return unref(currId) || unref(currNode)?.id || '';
  });

  function onClose() {
    resetCurrNode();
  }

  function openEditor(task, parent) {
    setCurrNode(task);
    if (task.type === CommandType.Else) {
      return;
    }
    openDrawer(true, { task, parent });
  }

  watchEffect(async () => {
    const flowList = await appSender.showFlow(unref(props.uuid));
    commandFlow.value = flowList;
  });

  const event1 = executorSender.onCommandStart(({ info }) => {
    currId.value = info?.id;
  });
  const event2 = executorSender.onAppEnd(() => {
    currId.value = '';
  });

  onUnmounted(() => {
    event1?.dispose?.();
    event2?.dispose?.();
  });

  const targetOptions = {
    animation: 200,
    group: { name: 'commande', put: true },
    disabled: false,
    ghostClass: 'ghost',
  };
  defineExpose({
    commandFlow,
  });
</script>
