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
    field: 'diffPlatform',
    component: 'Switch',
    label: '是否区分平台',
    colProps: {
      span: 20,
    },
    defaultValue: false,
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
      title: '应用名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'desc',
    },
    {
      title: '版本',
      dataIndex: 'version',
    },
    {
      title: '状态',
      dataIndex: 'published',
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
