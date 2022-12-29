import type { AppRouteModule } from '/@/router/types';

const about: AppRouteModule = {
  path: '/progress',
  name: 'Progress',
  component: () => import('/@/views/progress/Progress.vue'),
  meta: {
    title: 'process',
  },
};

export default about;
