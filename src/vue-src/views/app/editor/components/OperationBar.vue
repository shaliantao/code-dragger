<template>
  <div class="flex-1">
    <div class="flex gap-2">
      <a-button v-show="showStart" type="primary" @click="startApp">
        <PlayCircleOutlined />
        开始应用
      </a-button>
      <a-button v-show="showStop" @click="stopApp">
        <PoweroffOutlined />
        停止应用
      </a-button>
      <a-button v-show="showResume" type="primary" @click="resumeApp">
        <PlayCircleOutlined />
        恢复应用
      </a-button>
      <a-button v-show="showPause" @click="pauseApp">
        <PauseCircleOutlined />
        暂停应用
      </a-button>
    </div>
  </div>
  <div class="w-100 text-right">
    <a-button @click="saveApp">保存应用</a-button>
  </div>
</template>

<script lang="ts" setup>
  import { ref, toRaw, onUnmounted } from 'vue';
  import { PoweroffOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons-vue';
  import { CommandNode } from '@src/platform/common/types';
  import { APP_RUN_STATE } from '@src/platform/executor/executor';
  import executorSender from '/@/ipc/executor';
  import appSender from '/@/ipc/app';
  import { useBtnShowState } from '/@/views/app/editor/hooks/useBtnShowState';

  const props = defineProps({
    uuid: {
      type: String,
      required: true,
    },
    commandFlow: {
      type: [Array, null] as PropType<Nullable<CommandNode[]>>,
      default: () => [],
    },
  });

  const emits = defineEmits(['on-save']);

  const runState = ref<APP_RUN_STATE>(APP_RUN_STATE.INITIAL);

  const event = executorSender.onRunStateChange((state) => {
    console.log('onRunStateChange');
    runState.value = state;
  });

  const { showStart, showStop, showPause, showResume } = useBtnShowState(runState);

  async function saveApp() {
    try {
      if (props.commandFlow) {
        emits('on-save');
        await appSender.saveFlow(props.uuid, toRaw(props.commandFlow));
      }
    } catch (err) {
      console.log(`error${err}`);
    }
  }

  async function startApp() {
    try {
      await saveApp();
      await executorSender.start(props.uuid);
    } catch (err) {
      console.log(`error${err}`);
    }
  }
  async function stopApp() {
    try {
      await executorSender.stop();
    } catch (err) {
      console.log(`error${err}`);
    }
  }
  async function pauseApp() {
    try {
      await executorSender.pause();
    } catch (err) {
      console.log(`error${err}`);
    }
  }
  async function resumeApp() {
    try {
      await executorSender.resume();
    } catch (err) {
      console.log(`error${err}`);
    }
  }
  onUnmounted(() => event?.dispose());
</script>
