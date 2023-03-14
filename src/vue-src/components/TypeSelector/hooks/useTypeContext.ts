import type { InjectionKey, Ref } from 'vue';
import { createContext, useContext } from '/@/hooks/core/useContext';

export interface TypesContextProps {
  types: Ref<string[]>;
  setTypes: (type: string) => void;
}

const key: InjectionKey<TypesContextProps> = Symbol();

export function createTypesContext(context: TypesContextProps) {
  return createContext<TypesContextProps>(context, key, { readonly: false });
}

export function useTypesContext() {
  return useContext<TypesContextProps>(key);
}
