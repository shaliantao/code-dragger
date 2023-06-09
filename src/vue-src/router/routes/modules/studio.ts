import type { AppRouteModule } from '/@/router/types';

import { LAYOUT } from '/@/router/constant';

const studio: AppRouteModule = {
  path: '/studio',
  name: 'Studio',
  component: LAYOUT,
  redirect: '/studio/appList',
  meta: {
    orderNo: 10,
    icon: 'ion:grid-outline',
    title: '任务管理',
  },
  children: [
    {
      path: 'appStore',
      name: 'AppStore',
      component: () => import('/@/views/app/store/AppStore.vue'),
      meta: {
        // affix: true,
        title: '应用市场',
        ignoreKeepAlive: true,
      },
    },
    {
      path: 'appList',
      name: 'AppList',
      component: () => import('/@/views/app/list/AppList.vue'),
      meta: {
        // affix: true,
        title: '应用列表',
        ignoreKeepAlive: true,
      },
    },
    {
      path: 'appEditor/:opType/:uuid',
      name: 'AppEditor',
      component: () => import('/@/views/app/editor/AppEditor.vue'),
      props: (route) => ({ uuid: route.params.uuid, opType: route.params.opType }),
      meta: {
        // affix: true,
        title: '应用编辑器',
        hideMenu: true,
        currentActiveMenu: '/studio/appList',
      },
    },
    {
      path: 'componentEditor/:group/:func',
      name: 'ComponentEditor',
      component: () => import('/@/views/component/editor/ComponentEditor.vue'),
      props: (route) => ({ group: route.params.group, func: route.params.func }),
      meta: {
        // affix: true,
        title: '组件编辑器',
        hideMenu: true,
        currentActiveMenu: '/studio/componentList',
      },
    },
    {
      path: 'groupList',
      name: 'GroupList',
      component: () => import('/@/views/group/list/GroupList.vue'),
      meta: {
        title: '分组列表',
        ignoreKeepAlive: true,
      },
    },
    {
      path: 'groupEditor/:groupKey',
      name: 'GroupEditor',
      component: () => import('/@/views/group/editor/GroupEditor.vue'),
      props: (route) => ({ groupKey: route.params.groupKey }),
      meta: {
        title: '分组编辑器',
        hideMenu: true,
        currentActiveMenu: '/studio/groupList',
      },
    },
    {
      path: 'taskList',
      name: 'TaskList',
      component: () => import('/@/views/task/TaskList.vue'),
      meta: {
        title: '执行计划',
        ignoreKeepAlive: true,
      },
    },
    {
      path: 'userList',
      name: 'UserList',
      component: () => import('/@/views/user/UserList.vue'),
      meta: {
        title: '用户列表',
        ignoreKeepAlive: true,
      },
    },
  ],
};

export default studio;
