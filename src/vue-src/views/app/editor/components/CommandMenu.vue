<template>
  <div
    v-show="menuList && menuList.length !== 0"
    class="group-menu"
    v-for="menu in menuList"
    :key="menu.id"
  >
    <span class="node-parent-menu" @click="menu.open = !menu.open">
      <CaretDownOutlined style="font-size: 12px" v-if="menu.open" />
      <CaretRightOutlined style="font-size: 12px" v-else />
      &nbsp;{{ menu.name }}
    </span>
    <draggable
      v-show="menu.open"
      class="node-menu"
      tag="ul"
      :list="menu.children"
      item-key="id"
      v-bind="sourceOptions"
      :move="onMove"
      :clone="customClone"
      @end="onEnd"
    >
      <template #item="{ element }">
        <li class="node-menu-item q-pa-sm">
          {{ (element && element.name) || '' }}
        </li>
      </template>
    </draggable>
  </div>
  <div class="flex h-full justify-center items-center" v-show="!menuList || menuList.length === 0">
    <Spin />
  </div>
</template>

<script lang="ts" setup>
  import draggable, { Event, MoveEvent } from 'vuedraggable';
  import { Spin } from 'ant-design-vue';
  import { CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons-vue';
  import { cloneDeep } from 'lodash-es';
  import { CommandNode } from '@src/platform/common/types';
  import { buildUUID } from '/@/utils/uuid';
  import { useCommandList } from '../hooks/useCommandList';

  const { menuList } = useCommandList();
  function customClone(item) {
    const node = cloneDeep(item);
    node.id = buildUUID();
    if (['if', 'else', 'elseif', 'forEach'].includes(node.type)) {
      node.tasks = [];
    }
    return node;
  }

  function onMove(evt: MoveEvent<CommandNode>) {
    const { to } = evt ?? {};
    return !to.className.includes('list-group');
  }

  function onEnd(evt: Event) {
    window.console.log('end:', evt);
  }

  const sourceOptions = {
    animation: 200,
    group: { name: 'commande', pull: 'clone', put: false },
    disabled: false,
    ghostClass: 'ghost',
    preventOnFilter: false,
    sort: false,
  };
</script>
<style lang="less">
  .group-menu {
    border-bottom: solid 1px #f2f2f2;

    .node-parent-menu {
      cursor: pointer;
      height: 32px;
      line-height: 32px;
      width: 100%;
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #4a4a4a;
      background-color: #f6f6f6;
      padding-left: 5px;
      border-bottom: solid 1px #f1f1f1;
    }

    .node-parent-menu:hover {
      background-color: #f2f2f2;
    }

    .node-menu {
      list-style: none;
      padding: 5px;
      margin-bottom: 0px;

      .node-menu-item {
        font-size: 12px;
        color: #565758;
        width: 100%;
        border: 1px dashed #e0e3e7;
        margin: 5px 0 5px 0;
        padding: 5px;
        border-radius: 5px;
        padding-left: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:hover {
          /* 设置可移动样式*/
          cursor: move;
          background-color: #f0f7ff;
          border: 1px dashed #1879ff;
          border-left: 4px solid #1879ff;
          padding-left: 5px;
        }
      }
    }
  }
</style>
