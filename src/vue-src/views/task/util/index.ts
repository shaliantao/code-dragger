import { CycleType } from '@src/platform/common/enum';
import { weekMap } from './mapping';

export const getCycleInfo = (cycle, data) => {
  const { minute, hour } = data || {};
  switch (cycle) {
    case CycleType.Minute:
      return `每隔${minute}分钟执行`;
    case CycleType.Hour:
      return `每隔${hour}个小时，在第${minute}分钟执行`;
    case CycleType.Day:
      return `每天的${hour}时${minute}分执行`;
    case CycleType.Week:
      let { week } = data || {};
      week = Array.isArray(week) ? week : week.split(',');
      return `每星期${week
        .map((item) => weekMap.get(parseInt(item, 10)))
        .join('、')}的${hour}时${minute}分执行`;
    case CycleType.Month:
      let { day } = data || {};
      day = Array.isArray(day) ? day : day.split(',');
      return `每月${day.join('、')}日的${hour}时${minute}分执行`;
    default:
      throw new Error('Error cycle type');
  }
};

export function getCronByTime({ cycle, day, week, hour, minute }) {
  if (Array.isArray(day)) {
    day = day.join(',');
  }
  if (Array.isArray(week)) {
    week = week.join(',');
  }
  switch (cycle) {
    case CycleType.Minute:
      return `0 0/${minute} * * * ? *`;
    case CycleType.Hour:
      return `0 ${minute} 0/${hour} * * ? *`;
    case CycleType.Day:
      return `0 ${minute} ${hour} * * ? *`;
    case CycleType.Week:
      return `0 ${minute} ${hour} ? 1-12 ${week} *`;
    case CycleType.Month:
      return `0 ${minute} ${hour} ${day} 1-12 ? *`;
    default:
      throw new Error('Invalid cycle type');
  }
}

export function getTimeByCron(cycle, cron) {
  const cronArr = cron.split(' ');
  switch (cycle) {
    case CycleType.Minute:
      return {
        minute: cronArr[1].split('/')[1],
      };
    case CycleType.Hour:
      return {
        minute: cronArr[1],
        hour: cronArr[2].split('/')[1],
      };
    case CycleType.Day:
      return {
        minute: cronArr[1],
        hour: cronArr[2],
      };
    case CycleType.Week:
      return {
        minute: cronArr[1],
        hour: cronArr[2],
        week: cronArr[5],
      };
    case CycleType.Month:
      return {
        minute: cronArr[1],
        hour: cronArr[2],
        day: cronArr[3],
      };
    default:
      throw new Error('Invalid cycle type');
  }
}
