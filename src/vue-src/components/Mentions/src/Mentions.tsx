import {
  watch,
  computed,
  defineComponent,
  reactive,
  ref,
  StyleValue,
  unref,
  PropType,
  toRef,
  nextTick,
} from 'vue';
import { onClickOutside } from '@vueuse/core';
import { SelectedOption, NodeName } from './types';
import './index.less';
import {
  createDivWithBr,
  createTag,
  createZeroSpace,
  dom2Json,
  json2Dom,
  ZERO_SPACE,
} from './util';

export default defineComponent({
  props: {
    selectedNode: {
      type: Object as PropType<SelectedOption | null>,
      default: null,
    },
    value: {
      type: String,
      required: true,
    },
  },
  emits: ['update:value', 'change'],

  setup(props, { emit, slots }) {
    const state = reactive({
      active: false,
      focusNode: {} as Node,
      focusOffset: 0,
    });

    const editorRef = ref<HTMLDivElement>();
    const selectorRef = ref<HTMLDivElement>();
    const selectorPos = ref<DOMRect | null>(null);
    const selectedNode = toRef(props, 'selectedNode');

    watch(selectedNode, (node) => {
      if (node) {
        onSelect(node.value, node.label);
      }
    });

    function onInput(e: any) {
      const selection = getSelection() as Selection;
      const range = selection?.getRangeAt(0) as Range;
      const container =
        range.startContainer.nodeName === NodeName.TEXT
          ? range.startContainer.parentNode
          : range.startContainer;
      Array.from((container as Node).childNodes).forEach((el) => {
        if (
          el.nodeName === NodeName.BR &&
          el.previousSibling &&
          el.previousSibling.nodeName !== NodeName.A
        ) {
          // 删除独立存在的BR标签,BR不能是头节点，防止正常换行被误删
          el.remove();
        }
        // if (el.nodeName === NodeName.A && (el.nextSibling === null || el.nextSibling?.textContent === '')) {
        //   container?.appendChild(document.createElement(NodeName.BR))
        // }
      });
      const childNodes = editorRef.value!.childNodes;
      if (
        childNodes.length === 0 ||
        (childNodes.length === 1 && childNodes[0].nodeName === NodeName.BR)
      ) {
        const divWithBr = createDivWithBr();
        editorRef.value!.innerHTML = '';
        editorRef.value!.append(divWithBr);
      }
      if (e.data === '@') {
        // 打开选择弹窗
        state.active = true;

        selectorPos.value = range.getBoundingClientRect() as DOMRect;

        state.focusNode = selection?.focusNode as Node;
        // 缓存光标所在节点位置
        state.focusOffset = selection?.focusOffset as number;
      }
      getValue();
    }

    function onSelect(value: string, label: string) {
      state.active = false;
      if (value) {
        unref(editorRef)?.focus();
        const range = getSelection()?.getRangeAt(0) as Range;
        // 选中输入的 @ 符
        range.setStart(state.focusNode, state.focusOffset - 1);
        range.setEnd(state.focusNode, state.focusOffset);
        // 删除选中输入的 @ 符
        range.deleteContents();
        // 创建元素节点
        const tag = createTag({ label, value });
        // 插入元素节点
        range.insertNode(tag);
        range.collapse();
        // 插入0宽空格，主要用来连通文字选中状态
        const zeroSpace = createZeroSpace();
        range.insertNode(zeroSpace);
        range.collapse();

        getValue();
      }
    }

    function onKeyLeft(e: KeyboardEvent) {
      // 处理左键点击时遇到零宽空格时光标的跳转逻辑，保证光标正常跳转
      const range = getSelection()?.getRangeAt(0) as Range;
      const node = range?.startContainer as Node;
      if (
        range.collapsed &&
        node.nodeName === NodeName.TEXT &&
        node.nodeValue?.startsWith(ZERO_SPACE) &&
        range.startOffset === 1
      ) {
        e.preventDefault();
        range.setStart(node.previousSibling?.previousSibling as Node, 0);
        range.setEnd(
          node.previousSibling?.previousSibling as Node,
          node.previousSibling?.previousSibling?.nodeValue?.length || 0,
        );
        range.collapse();
      }
    }

    function onKeyRight(e: KeyboardEvent) {
      // 处理右键点击时遇到零宽空格时光标的跳转逻辑，保证光标正常跳转
      const range = getSelection()?.getRangeAt(0) as Range;
      const node = range?.startContainer as Node;
      if (
        range.collapsed &&
        node.nodeName === NodeName.TEXT &&
        node.nodeValue?.startsWith(ZERO_SPACE) &&
        range.startOffset === 0
      ) {
        e.preventDefault();
        if (node.nodeValue === ZERO_SPACE) {
          // 当插入零宽空格是独立节点，跳到下个节点移动一位
          let nextNode = node.nextSibling;
          if (nextNode?.nodeName === NodeName.A) {
            nextNode = nextNode?.nextSibling;
            range.setStart(nextNode as Node, 1);
            range.setEnd(nextNode as Node, 1);
          } else {
            nextNode = nextNode?.parentNode?.nextSibling || null;
            if (nextNode) {
              range.setStart(nextNode as Node, 1);
              range.setEnd(nextNode as Node, 1);
            }
          }
        } else {
          range.setStart(node as Node, 2);
          range.setEnd(node as Node, 2);
        }
        range.collapse();
      }
    }

    function onKeydown(e: KeyboardEvent) {
      const keyCode = e.keyCode;
      if (keyCode === 39) {
        onKeyRight(e);
      } else if (keyCode === 37) {
        onKeyLeft(e);
      }
    }
    function onBlur() {
      state.active = false;
      selectorPos.value = null;
    }

    onClickOutside(selectorRef, onBlur);

    const editorProps = {
      onInput,
      onKeydown,
    };

    const selectorStyle = computed((): StyleValue => {
      const { top = 0, left = 0 } = selectorPos.value || {};
      return { top: `${top + 20}px`, left: `${left - 15}px` };
    });

    function getValue() {
      const json = dom2Json(editorRef.value!.childNodes);
      console.log(JSON.stringify(json));
      emit('update:value', JSON.stringify(json));
      emit('change', JSON.stringify(json));
    }

    async function initValue(value: string) {
      await nextTick();
      const dom = json2Dom(JSON.parse(value));
      editorRef.value!.innerHTML = '';
      editorRef.value!.append(dom);
    }

    initValue(props.value);

    return () => {
      return (
        <div class="container">
          <div ref={editorRef} class="editor" contenteditable="true" {...editorProps}>
            <div>
              <br />
            </div>
          </div>
          {state.active && (
            <div ref={selectorRef} class="selector" style={unref(selectorStyle)}>
              {slots.default?.()}
            </div>
          )}
        </div>
      );
    };
  },
});
