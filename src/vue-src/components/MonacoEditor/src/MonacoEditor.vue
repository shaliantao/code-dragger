<template>
  <div id="container" ref="dom"></div>
</template>

<script lang="ts">
  export default {
    name: 'MonacoEditor',
    inheritAttrs: true,
  };
</script>
<script lang="ts" setup>
  import { onMounted, onUnmounted, ref, unref, watch } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as monaco from 'monaco-editor';
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  //import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

  const props = defineProps({
    modelValue: {
      type: String,
      required: true,
    },
  });

  const emit = defineEmits(['update:modelValue']);

  const dom = ref();
  self.MonacoEnvironment = {
    getWorker(_, label) {
      // if (label === 'json') {
      //   return new jsonWorker();
      // }
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
  let monacoInstance: monaco.editor.IStandaloneCodeEditor;
  onMounted(() => {
    const containerDom = unref(dom);
    monacoInstance = monaco.editor.create(containerDom, {
      language: 'javascript',
    });
    monacoInstance.setValue(props.modelValue);
    monacoInstance.onDidChangeModelContent((_event) => {
      const value = monacoInstance.getValue();
      emit('update:modelValue', value);
    });
    useResizeObserver(containerDom.parentElement, (entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      requestAnimationFrame(() => updateEditorHeight(width, height)); // folding
    });

    let prevHeight = 0;
    let prevWidth = 0;

    const updateEditorHeight = (width, height) => {
      const editorElement = monacoInstance.getDomNode();
      if (!editorElement) {
        return;
      }
      if (prevHeight !== height || prevWidth !== width) {
        prevHeight = height;
        prevWidth = width;

        editorElement.style.height = `${height - 30}px`;
        editorElement.style.width = `${width}px`;

        monacoInstance.layout();
      }
    };
  });

  watch(
    () => props.modelValue,
    (val) => {
      // 此处需要使用getValue获取到的值来进行判断，只在当前值与初始值不一样的情况下进行更新
      const currVal = monacoInstance.getValue();
      if (val !== currVal) {
        monacoInstance.setValue(val);
      }
    },
  );
  onUnmounted(() => {
    if (monacoInstance) {
      monacoInstance.dispose();
    }
  });
</script>

<style lang="less" scoped>
  #container {
    height: 100%;
  }
</style>
