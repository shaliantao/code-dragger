import type { MenuModule } from '/@/router/types';
const store: MenuModule[] = [
  {
    orderNo: 10,
    menu: {
      path: '/studio/appStore',
      name: '应用商店',
      hideMenu: false,
      icon: 'material-symbols:add-home-work-rounded',
      meta: {
        title: '应用商店',
      },
    },
  },
];
export default store;
