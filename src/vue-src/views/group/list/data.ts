import { BasicColumn } from '/@/components/Table/src/types/table';
import { formatToDateTime } from '/@/utils/dateUtil';
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
    field: 'key',
    component: 'Input',
    label: '分组标识',
    rules: [
      {
        required: true,
        pattern: /^[A-Z][a-zA-Z_1-9]{2,14}$/,
        message: '首字母大写，限字母数字、_，长度3-15字符',
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
      title: '分组名称',
      dataIndex: 'name',
    },
    {
      title: '标识',
      dataIndex: 'key',
    },
    {
      title: '版本',
      dataIndex: 'version',
      customRender: ({ text }) => {
        return `v${text}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'published',
      customRender: ({ text }) => {
        return text ? '已发布' : '未发布';
      },
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
