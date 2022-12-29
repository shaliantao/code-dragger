import {
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue';
import { APP_RUN_STATE } from '@src/platform/executor/executor';

export const appStateMap = new Map([
  [APP_RUN_STATE.INITIAL, '初始化'],
  [APP_RUN_STATE.RUNNING, '运行中'],
  [APP_RUN_STATE.PAUSED, '暂停'],
  [APP_RUN_STATE.STOPED, '运行终止'],
  [APP_RUN_STATE.TIMEOUT, '运行超时'],
  [APP_RUN_STATE.SUCCESS, '运行成功'],
  [APP_RUN_STATE.ERROR, '运行失败'],
]);

export const iconStateMap = new Map([
  [APP_RUN_STATE.INITIAL, { icon: LoadingOutlined, color: '#0099ff' }],
  [APP_RUN_STATE.RUNNING, { icon: LoadingOutlined, color: '#0099ff' }],
  [APP_RUN_STATE.PAUSED, { icon: PauseCircleOutlined, color: '#ff9900' }],
  [APP_RUN_STATE.STOPED, { icon: MinusCircleOutlined, color: '#ff9900' }],
  [APP_RUN_STATE.TIMEOUT, { icon: ClockCircleOutlined, color: '#ff9900' }],
  [APP_RUN_STATE.SUCCESS, { icon: CheckCircleOutlined, color: '#00CC00' }],
  [APP_RUN_STATE.ERROR, { icon: ExclamationCircleOutlined, color: '#ff3300' }],
]);
