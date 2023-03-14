import type { InjectionKey, Ref } from 'vue';
import { OutputArg } from '@src/platform/common/types';
import { createContext, useContext } from '/@/hooks/core/useContext';
import { IGlobalVar } from '@src/platform/app/app';

export interface CommandEditorContextProps {
  outputNodes: Ref<OutputArg[]>;
  globalVars: Ref<IGlobalVar[]>;
  autoSave: () => void;
}

const key: InjectionKey<CommandEditorContextProps> = Symbol();

export function createCommandEditorContext(context: CommandEditorContextProps) {
  return createContext<CommandEditorContextProps>(context, key, { readonly: false });
}

export function useCommandEditorContext() {
  return useContext<CommandEditorContextProps>(key);
}
