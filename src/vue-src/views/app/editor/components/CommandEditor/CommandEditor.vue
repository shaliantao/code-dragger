<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="register"
    :title="node?.name"
    width="60%"
    showFooter
    @close="onClose"
    @ok="onSave"
  >
    <component ref="editorRef" :is="activeComponent" :node="node" />
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { ref, unref, shallowRef } from 'vue';
  import { useDebounceFn } from '@vueuse/core';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { ComponentCommand, OutputArg } from '@src/platform/common/types';
  import { createCommandEditorContext } from '../../hooks/useEditorContext';
  import { getOutputNodes } from '../../utils';
  import { createAsyncComponent } from '/@/utils/factory/createAsyncComponent';

  const emit = defineEmits(['on-save', 'on-close', 'register']);

  const node = shallowRef<ComponentCommand>();
  const outputNodes = shallowRef<OutputArg[]>([]);
  const editorRef = ref();
  const activeComponent = shallowRef();

  function save(resetCurr?) {
    if (unref(editorRef)) {
      const data = unref(editorRef).getData();
      emit('on-save', data, resetCurr);
    }
  }

  function onSave() {
    save();
    onClose();
  }

  // 一个编辑框中短时间内可能多次触发自动保存，使用防抖合并调用
  const autoSave = useDebounceFn(() => {
    save(false);
  }, 100);

  function onClose() {
    emit('on-close');
    unref(editorRef)?.reset();
    closeDrawer();
  }

  createCommandEditorContext({ outputNodes, autoSave });

  // 动态导入Form文件夹下组件
  const modules = import.meta.glob('./Form/*.vue');

  const [register, { closeDrawer }] = useDrawerInner((data) => {
    const { task, parent } = data;
    node.value = task;
    const formType = task.formType.replace(/^\S/, (s) => s.toUpperCase()) + 'Form.vue';
    activeComponent.value = createAsyncComponent(modules[`./Form/${formType}`]);
    outputNodes.value = getOutputNodes(task, parent);
  });
</script>
