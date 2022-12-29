declare module 'vuedraggable' {
  import { ComponentOptions, Component } from 'vue';

  export interface DraggedContext<T> {
    index: number;
    futureIndex: number;
    element: T;
  }

  export interface DropContext<T> {
    index: number;
    component: Component;
    element: T;
    list: T[];
  }

  export interface Rectangle {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  }

  export interface Event {
    from: Element;
    to: Element;
    item: Element;
    clone: Element;
    oldIndex: number | undefined;
    newIndex: number | undefined;
    oldDraggableIndex: number | undefined;
    newDraggableIndex: number | undefined;
    pullMode: 'clone' | boolean | undefined;
  }

  export interface MoveEvent<T> {
    originalEvent: DragEvent;
    dragged: Element;
    draggedContext: DraggedContext<T>;
    draggedRect: Rectangle;
    related: Element;
    relatedContext: DropContext<T>;
    relatedRect: Rectangle;
    from: Element;
    to: Element;
    willInsertAfter: boolean;
    isTrusted: boolean;
  }

  export interface ChangeItem<T> {
    newIndex?: number;
    oldIndex?: number;
    element: T;
  }
  export type ChangeEvent<T> =
    | { added: ChangeItem<T> }
    | { removed: ChangeItem<T> | { moved: ChangeItem<T> } };

  const draggableComponent: ComponentOptions<Component>;

  export default draggableComponent;
}
