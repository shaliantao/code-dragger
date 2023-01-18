import { BasicColumn } from '/@/components/Table/src/types/table';
import { formatToDateTime } from '/@/utils/dateUtil';
import { FormSchema } from '/@/components/Form/index';

export const schemas: FormSchema[] = [
  {
    field: 'username',
    component: 'Input',
    label: '账号',
    rules: [{ required: true, min: 3, max: 20, message: '需在3-20字符之间' }],
    colProps: {
      span: 20,
    },
    defaultValue: '',
  },
  {
    field: 'password',
    component: 'StrengthMeter',
    rules: [{ required: true, message: '请输入密码' }],
    label: '密码',
    colProps: {
      span: 20,
    },
  },
  {
    field: 'confirmPassword',
    component: 'InputPassword',
    rules: [{ required: true }],
    label: '确认密码',
    colProps: {
      span: 20,
    },
  },
  {
    field: 'mobile',
    component: 'Input',
    label: '手机号',
    rules: [
      {
        pattern: /^1[3456789]\d{9}$/,
        message: '请输入有效的手机号码',
      },
    ],
    colProps: {
      span: 20,
    },
  },
  {
    field: 'email',
    component: 'Input',
    label: '邮箱',
    rules: [
      {
        type: 'email',
        message: '请输入有效的邮箱',
      },
    ],
    colProps: {
      span: 20,
    },
  },
];

export function getColumns(): BasicColumn[] {
  return [
    {
      title: '用户名',
      dataIndex: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
    },
    {
      title: '用户角色',
      dataIndex: 'role',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      customRender: ({ text }) => {
        return formatToDateTime(text);
      },
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      customRender: ({ text }) => {
        return formatToDateTime(text);
      },
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.modifyTime - b.modifyTime,
    },
  ];
}
