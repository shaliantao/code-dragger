import { computed, Ref } from 'vue';
import { APP_RUN_STATE } from '@src/platform/executor/executor';

export function useBtnShowState(runState: Ref<APP_RUN_STATE>) {
  const showStart = computed(() => {
    return ![APP_RUN_STATE.PAUSED, APP_RUN_STATE.RUNNING].includes(runState.value);
  });
  const showStop = computed(() => {
    return [APP_RUN_STATE.PAUSED, APP_RUN_STATE.RUNNING].includes(runState.value);
  });
  const showPause = computed(() => {
    return [APP_RUN_STATE.RUNNING].includes(runState.value);
  });
  const showResume = computed(() => {
    return [APP_RUN_STATE.PAUSED].includes(runState.value);
  });
  return {
    showStart,
    showStop,
    showPause,
    showResume,
  };
}
