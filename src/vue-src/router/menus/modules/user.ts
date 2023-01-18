import type { MenuModule } from '/@/router/types';
const user: MenuModule[] = [
  {
    orderNo: 50,
    menu: {
      path: '/studio/userList',
      name: '用户管理',
      hideMenu: false,
      icon: 'ph:user-fill',
      meta: {
        title: '用户管理',
      },
    },
  },
];
export default user;
