<template>
  <div class="container">
    <a-button type="text" class="close !border-none" @click="onClose"><close-outlined /></a-button>
    <div class="content">
      <div class="title">
        <component
          :is="activeComponent?.icon"
          class="mr-1"
          :style="{ fontSize: '18px', color: activeComponent?.color }"
        />
        {{ runningData.title }} {{ stateData }}
      </div>
      <div v-if="runState === APP_RUN_STATE.ERROR" class="msg">
        <p class="err">错误信息</p>
      </div>
      <div v-else class="msg">
        <p>执行节点: {{ runningData.msg }}</p>
      </div>
    </div>
    <div class="footer">
      <a-button v-show="showResume" type="text" class="!border-none" @click="onResume()">
        <PauseCircleOutlined />
        继续
      </a-button>
      <a-button v-show="showPause" type="text" class="!border-none" @click="onPause()">
        <PauseCircleOutlined />
        暂停
      </a-button>
      <a-button v-show="showStop" type="text" class="!border-none" @click="onStop()">
        <PauseCircleOutlined />
        终止
      </a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onUnmounted } from 'vue';
  import { PauseCircleOutlined, CloseOutlined } from '@ant-design/icons-vue';
  import executorSender from '/@/ipc/executor';
  import { appStateMap, iconStateMap } from '/@/views/progress/mapping';
  import { useBtnShowState } from '/@/views/app/editor/hooks/useBtnShowState';
  import { APP_RUN_STATE, ICommandStart, IAppStartWithMeta } from '@src/platform/executor/executor';

  const runState = ref<APP_RUN_STATE>(APP_RUN_STATE.INITIAL);
  const commandStart = ref<Nullable<ICommandStart>>(null);
  const appStart = ref<Nullable<IAppStartWithMeta>>(null);
  const activeComponent = computed(() => {
    return iconStateMap.get(runState.value);
  });

  const runStateEvent = executorSender.onRunStateChange((state) => {
    runState.value = state;
  });
  const commandStartEvevt = executorSender.onCommandStart((data) => {
    commandStart.value = data;
  });
  const appStartEvevt = executorSender.onAppStart((data) => {
    appStart.value = data;
  });

  const { showStop, showPause, showResume } = useBtnShowState(runState);

  const stateData = computed(() => {
    const state = runState.value;
    return appStateMap.get(state);
  });

  const runningData = computed(() => {
    const { meta: commandMeta } = commandStart.value || {};
    const { meta: appMeta } = appStart.value || {};
    return {
      title: appMeta?.name || '未知应用',
      msg: commandMeta?.name || '未知指令',
    };
  });

  function onStop() {
    executorSender.stop();
  }
  function onPause() {
    executorSender.pause();
  }
  function onResume() {
    executorSender.resume();
  }
  function onClose() {
    executorSender.closeFloatWin();
  }
  onUnmounted(() => {
    runStateEvent?.dispose();
    commandStartEvevt?.dispose();
    appStartEvevt?.dispose();
  });
</script>

<style lang="less" scoped>
  .container {
    display: flex;
    flex-direction: column;
    width: calc(100vw);
    height: calc(100vh);

    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

    .close {
      font-size: 15px;
      font-weight: 700;
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 9;
    }

    .content {
      flex: 1;
      padding: 20px 10px 0 40px;

      .title {
        color: #303133;
        font-size: 18px;
        line-height: 25px;
        font-weight: 700;
      }

      .msg {
        color: #606266;
        font-size: 14px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        height: calc(100vh - 75px);
      }

      .err {
        color: #f56c6c;
      }

      .title,
      p {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .footer {
      height: 30px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      color: #303133;
      background: #dcdfe6;
    }
  }
</style>
