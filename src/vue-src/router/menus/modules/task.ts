import type { MenuModule } from '/@/router/types';
const task: MenuModule[] = [
  {
    orderNo: 40,
    menu: {
      path: '/studio/taskList',
      name: '执行计划',
      hideMenu: false,
      icon: 'fluent:task-list-square-rtl-24-filled',
      meta: {
        title: '执行计划',
      },
    },
  },
];
export default task;
