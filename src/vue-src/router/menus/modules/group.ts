import type { MenuModule } from '/@/router/types';
const menu: MenuModule[] = [
  {
    orderNo: 30,
    menu: {
      path: '/studio/groupList',
      name: '分组管理',
      hideMenu: false,
      icon: 'mdi:puzzle',
      meta: {
        // affix: true,
        title: '分组管理',
      },
    },
  },
];
export default menu;
