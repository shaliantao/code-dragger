<template>
  <draggable
    class="command-list"
    tag="ul"
    :list="tasks"
    v-bind="$attrs"
    item-key="id"
    @change="(e) => onChange(e, parent)"
  >
    <template #item="{ element }">
      <li
        class="command-item"
        :class="element.id === currNodeId && 'command-active'"
        @click="(e) => onClick(e, element, parent)"
        @dblclick="(e) => onDblclick(e, element, parent)"
      >
        <div class="flex justify-between">
          <span class="command-name">{{ element.name }}</span>
          <a-button
            type="link"
            class="self-center !text-gray-400"
            @click="(e) => onDel(e, element, parent)"
            @dblclick.stop
          >
            <Icon icon="clarity:close-line" />
          </a-button>
        </div>

        <nested-draggable
          v-if="element.tasks"
          v-bind="$attrs"
          :curr-node-id="currNodeId"
          :tasks="element.tasks"
          :parent="{ ...element, parent: parent }"
          @click-node="onClick"
          @dblclick-node="onDblclick"
          @change-node="onChange"
          @del-node="onDel"
        />
      </li>
    </template>
  </draggable>
</template>
<script lang="ts">
  export default {
    name: 'NestedDraggable',
    inheritAttrs: true,
  };
</script>
<script setup lang="ts">
  import { CommandNode, ParentNode } from '@src/platform/common/types';
  import { Icon } from '/@/components/Icon';
  import draggable, { ChangeEvent } from 'vuedraggable';

  defineProps({
    currNodeId: {
      type: String,
      required: true,
    },
    tasks: {
      type: Array as PropType<CommandNode[]>,
      required: true,
    },
    parent: {
      type: Object as PropType<ParentNode>,
      required: true,
    },
  });

  const emit = defineEmits<{
    (e: 'change-node', event: ChangeEvent<CommandNode>, parent: ParentNode): void;
    (e: 'click-node', event: MouseEvent, task: CommandNode, parent: ParentNode): void;
    (e: 'dblclick-node', event: MouseEvent, task: CommandNode, parent: ParentNode): void;
    (e: 'del-node', event: MouseEvent, task: CommandNode, parent: ParentNode): void;
  }>();

  function onChange(event: ChangeEvent<CommandNode>, parent: ParentNode) {
    emit('change-node', event, parent);
  }

  function onClick(event: MouseEvent, task: CommandNode, parent: ParentNode) {
    event.stopPropagation();
    emit('click-node', event, task, parent);
  }

  function onDblclick(event: MouseEvent, task: CommandNode, parent: ParentNode) {
    event.stopPropagation();
    emit('dblclick-node', event, task, parent);
  }

  function onDel(event: MouseEvent, task: CommandNode, parent: ParentNode) {
    event.stopPropagation();
    emit('del-node', event, task, parent);
  }
</script>
<style lang="less" scoped>
  .command-list {
    height: 100%;
    min-height: 60px;
    border: 1px solid rgb(235, 235, 235);
    padding: 10px 10px 20px;
    margin: 0;
    overflow-y: auto;

    .command-item {
      width: 100%;
      border: 1px dashed #e0e3e7;
      margin: 5px 0 5px 0;
      padding: 5px;
      border-radius: 5px;
      padding-left: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .command-name {
        line-height: 24px;
        color: #565758;
      }

      .desc-name {
        color: gray;
        font-size: 12px;
      }
    }

    .command-active,
    .command-item:hover {
      /* 设置移动样式*/
      cursor: move;
      background-color: #f0f7ff;
      border: 1px dashed #1879ff;
      border-left: 4px solid #1879ff;
      padding-left: 5px;
    }
  }
</style>
