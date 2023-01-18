import type { AppRouteModule } from '/@/router/types';

const progress: AppRouteModule = {
  path: '/progress',
  name: 'Progress',
  component: () => import('/@/views/progress/Progress.vue'),
  meta: {
    title: 'progress',
  },
};

export default progress;
