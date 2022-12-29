import type { MenuModule } from '/@/router/types';
const menu: MenuModule[] = [
  {
    orderNo: 10,
    menu: {
      path: '/studio/appList',
      name: '应用管理',
      hideMenu: false,
      icon: 'material-symbols:grid-view-rounded',
      meta: {
        title: '应用管理',
      },
    },
  },
];
export default menu;
