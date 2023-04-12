import { formatToDateTime } from '/@/utils/dateUtil';
import { BasicColumn } from '/@/components/Table/src/types/table';
import { FormSchema } from '/@/components/Form/index';

export const schemas: FormSchema[] = [
  {
    field: 'name',
    component: 'Input',
    label: '名称',
    rules: [{ required: true }],
    colProps: {
      span: 20,
    },
    defaultValue: '',
  },
  {
    field: 'func',
    component: 'Input',
    label: '方法名',
    rules: [
      {
        required: true,
        pattern: /^[a-zA-Z_]{3,14}$/,
        message: '限字母、_，长度3-15字符',
      },
    ],
    colProps: {
      span: 20,
    },
    defaultValue: '',
  },
  {
    field: 'desc',
    component: 'InputTextArea',
    label: '描述',
    colProps: {
      span: 20,
    },
  },
];

export function getColumns(): BasicColumn[] {
  return [
    {
      title: '组件名称',
      dataIndex: 'name',
    },
    {
      title: '方法名',
      dataIndex: 'func',
    },
    {
      title: '描述',
      dataIndex: 'desc',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      customRender: ({ text }) => {
        return formatToDateTime(text);
      },
    },
    {
      title: '修改时间',
      dataIndex: 'modifyTime',
      customRender: ({ text }) => {
        return formatToDateTime(text);
      },
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.modifyTime - b.modifyTime,
    },
  ];
}

export function getVersionColumns(): BasicColumn[] {
  return [
    {
      title: '版本',
      dataIndex: 'version',
    },
    {
      title: '作者',
      dataIndex: 'author',
      customRender: ({ value }) => {
        return value.username;
      },
    },
    {
      title: '发版日志',
      dataIndex: 'changeLog',
    },
    {
      title: '启用中',
      dataIndex: 'enabled',
      customRender: ({ text }) => {
        return text ? '是' : '否';
      },
    },
    {
      title: '编辑中',
      dataIndex: 'editable',
      customRender: ({ text }) => {
        return text ? '是' : '否';
      },
    },
  ];
}
