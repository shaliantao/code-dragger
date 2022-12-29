<template>
  <div class="terminal-area" ref="containerRef"></div>
</template>
<script lang="ts">
  export default {
    name: 'Terminal',
    inheritAttrs: true,
  };
</script>
<script lang="ts" setup>
  import 'xterm/css/xterm.css';
  import { ref, onUnmounted, watch, onActivated, toRef, onMounted } from 'vue';
  import { onBeforeRouteLeave } from 'vue-router';
  import { useDebounceFn } from '@vueuse/core';
  import { Terminal } from 'xterm';
  import { FitAddon } from 'xterm-addon-fit';
  import terminalSender from '/@/ipc/terminal';
  import { addResizeListener, removeResizeListener } from '/@/utils/event/index';

  const props = defineProps({
    path: {
      type: String,
      required: true,
    },
  });
  const path = toRef(props, 'path');
  // Terminal DOM
  const containerRef = ref<HTMLElement>();

  // 该标志用来阻止页面卸载后不应执行的操作
  let isLeave = false;

  let dispose: () => void;

  // 初始化后台进程
  async function initTerminalProcess(path) {
    await terminalSender.createProcess(path);
    async function dispose() {
      await terminalSender.killProcess(path);
    }
    return dispose;
  }
  const fitAddon = new FitAddon();
  // 初始化前台页面
  function initTerminalWeb(path) {
    const terminal = new Terminal({
      fontSize: 14,
      cursorBlink: true,
      theme: {
        background: '#293247',
      },
    });
    terminal.loadAddon(fitAddon);
    if (containerRef.value !== undefined) {
      terminal.open(containerRef.value);
    }
    terminal.focus();
    terminal.onData((data) => {
      terminalSender.writeTerminalData(path, data);
    });

    const event = terminalSender.onTerminalData((data) => {
      if (data.cwd === path) {
        return terminal.write(data.data);
      }
    });

    const resizeProcess = useDebounceFn(() => {
      terminalSender.resizeProcess(path, terminal.cols, terminal.rows);
    }, 200);
    const resizeWeb = useDebounceFn(() => {
      fitAddon.fit();
    }, 200);

    let width = 0;
    let height = 0;
    const onResize = ({ contentRect }) => {
      if (
        (contentRect.width !== 0 && width !== contentRect.width) ||
        (contentRect.height !== 0 && height !== contentRect.height)
      ) {
        width = contentRect.width;
        height = contentRect.height;
        if (!isLeave) {
          // 调整terminalProcess行列大小
          resizeProcess();
          resizeWeb();
        }
      }
    };
    addResizeListener(containerRef.value, onResize);

    function dispose() {
      event?.dispose();
      terminal.dispose();
      removeResizeListener(containerRef.value, onResize);
    }
    return dispose;
  }

  async function init(path) {
    const processDispose = await initTerminalProcess(path);
    const webDispose = initTerminalWeb(path);
    return async () => {
      await processDispose();
      webDispose();
    };
  }

  watch(path, async (currPath, prevPath) => {
    if (currPath !== prevPath) {
      await dispose?.();
      dispose = await init(currPath);
    }
  });
  onActivated(() => (isLeave = false));
  onBeforeRouteLeave(() => (isLeave = true));
  onMounted(() => {
    setTimeout(() => {
      fitAddon.fit();
    }, 70); // 而且不能是0 ,xterm 生成时间在2ms左右
  });
  onUnmounted(() => {
    isLeave = true;
    dispose?.();
  });
</script>
<style lang="less" scoped>
  .terminal-area {
    height: 100%;

    :deep(.xterm) {
      height: 100%;
      overflow: hidden;
    }
  }
</style>
