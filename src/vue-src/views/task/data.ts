import { BasicColumn } from '/@/components/Table/src/types/table';
import { formatToDateTime, ONE_DAY_MS, DATE_TIME_FORMAT } from '/@/utils/dateUtil';
import { FormSchema } from '/@/components/Form/index';
import { ExecMode, CycleType } from '@src/platform/common/enum';
import dayjs from 'dayjs';
import { getEnableAppList } from '/@/api/biz/app';
import { getCycleInfo, getTimeByCron } from './util';

const range = (start: number, end: number) => {
  const result: number[] = [];

  for (let i = start; i < end; i++) {
    result.push(i);
  }

  return result;
};

export function getSchemas(): FormSchema[] {
  const schemas: FormSchema[] = [
    {
      field: 'appId',
      component: 'ApiSelect',
      label: '应用',
      rules: [
        {
          required: true,
          trigger: 'blur',
        },
      ],
      colProps: {
        span: 23,
      },
      componentProps: {
        api: getEnableAppList,
        labelField: 'app.appName',
        valueField: 'appId',
      },
      defaultValue: '',
    },
    {
      field: 'execMode',
      component: 'Select',
      label: '执行模式',
      colProps: {
        span: 23,
      },
      defaultValue: ExecMode.Quick,
      componentProps: {
        options: [
          {
            label: '快速执行',
            value: ExecMode.Quick,
            key: ExecMode.Quick,
          },
          {
            label: '周期执行',
            value: ExecMode.Cycle,
            key: ExecMode.Cycle,
          },
          {
            label: '定时执行',
            value: ExecMode.Timing,
            key: ExecMode.Timing,
          },
        ],
      },
    },
    {
      field: 'cycle',
      ifShow: (params) => params.values.execMode === ExecMode.Cycle,
      component: 'RadioButtonGroup',
      label: '周期',
      colProps: {
        span: 23,
      },
      componentProps: {
        options: [
          {
            label: '分',
            value: CycleType.Minute,
          },
          {
            label: '时',
            value: CycleType.Hour,
          },
          {
            label: '天',
            value: CycleType.Day,
          },
          {
            label: '周',
            value: CycleType.Week,
          },
          {
            label: '月',
            value: CycleType.Month,
          },
        ],
      },
      defaultValue: CycleType.Minute,
    },
    {
      field: 'cron',
      ifShow: (params) => params.values.execMode === ExecMode.Cycle,
      slot: 'cycle',
      component: 'Input',
      label: '',
      colProps: {
        span: 23,
      },
      defaultValue: '0 0/1 * * * ? *',
    },
    {
      field: 'validateRange',
      ifShow: (params) => params.values.execMode === ExecMode.Cycle,
      component: 'RangePicker',
      label: '生效时段',
      colProps: {
        span: 23,
      },
      componentProps: {
        showTime: true,
        allowClear: false,
        valueFormat: DATE_TIME_FORMAT,
        separator: '至',
        disabledDate(time) {
          return time.valueOf() < Date.now() - ONE_DAY_MS;
        },
      },
      defaultValue: [dayjs(), dayjs(Date.now() + ONE_DAY_MS * 30)],
    },
    {
      field: 'startTime',
      ifShow: (params) => params.values.execMode === ExecMode.Timing,
      component: 'DatePicker',
      label: '执行时间',
      colProps: {
        span: 23,
      },
      componentProps: {
        showNow: false,
        showTime: true,
        valueFormat: DATE_TIME_FORMAT,
        allowClear: false,
        disabledDate(time) {
          return time.valueOf() < Date.now() - ONE_DAY_MS;
        },
        disabledTime(time) {
          const currentHour = dayjs().hour();
          const selectHour = dayjs(time).hour();
          const currentMinute = dayjs().minute();
          const selectMinute = dayjs(time).minute();
          const currentSecond = dayjs().second();
          return {
            disabledHours: () => {
              return range(0, dayjs().hour());
            },
            disabledMinutes: () => {
              if (selectHour === currentHour) {
                return range(0, currentMinute);
              }
              return [];
            },
            disabledSeconds: () => {
              if (selectHour === currentHour && selectMinute == currentMinute) {
                return range(0, currentSecond);
              }
              return [];
            },
          };
        },
      },
      defaultValue: dayjs(),
    },
  ];

  return schemas;
}

export function getColumns(): BasicColumn[] {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      customRender: ({ record }) => {
        return record?.app.appName;
      },
    },
    {
      title: '执行模式',
      dataIndex: 'execMode',
    },
    {
      title: '执行时间',
      dataIndex: 'timeRange',
      customRender: ({ record }) => {
        if (record.execMode === ExecMode.Cycle) {
          return getCycleInfo(record.cycle, getTimeByCron(record.cycle, record.cron));
        } else if (record.execMode === ExecMode.Timing) {
          return formatToDateTime(record.startTime);
        }
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      customRender: ({ record }) => {
        return formatToDateTime(record.created_at);
      },
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      customRender: ({ record }) => {
        return formatToDateTime(record.updated_at);
      },
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.modifyTime - b.modifyTime,
    },
  ];
}
