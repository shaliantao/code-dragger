import { withInstall } from '/@/utils/index';
import typeSelector from './src/TypeSelector.vue';

export * from './hooks/useTypeContext';
export const TypeSelector = withInstall(typeSelector);
