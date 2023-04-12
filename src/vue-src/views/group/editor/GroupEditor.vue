<template>
  <page-wrapper class="h-full" contentClass="h-full">
    <div class="flex p-2 h-40px">
      <div class="flex-1">
        <a-button @click="createComponent">创建组件</a-button>
      </div>
      <div class="flex gap-2">
        <a-button @click="handleSubmit" :disabled="saveDisabled">保存并同步</a-button>
      </div>
    </div>
    <div class="flex h-[calc(100%-40px)]">
      <div class="flex flex-1 flex-col">
        <div class="flex-1 overflow-auto">
          <BasicTable @register="registerTable">
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'action'">
                <TableAction
                  :actions="[
                    {
                      label: '编辑',
                      onClick: handleEdit.bind(null, record),
                    },
                    {
                      label: '删除',
                      onClick: handleDel.bind(null, record),
                    },
                  ]"
                />
              </template>
            </template>
          </BasicTable>
        </div>
        <Dragger direction="X" :next-max="500" :next-min="200" :next-initial="200" />
        <Tabs class="tabs" v-model:value="activeKey">
          <Tabs.TabPane key="1" tab="终端">
            <Terminal :path="path" />
          </Tabs.TabPane>
          <Tabs.TabPane key="2" tab="依赖">
            <Description @register="register" class="my-4" />
          </Tabs.TabPane>
          <Tabs.TabPane key="3" tab="版本">
            <BasicTable @register="registerVersionTable">
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'action'">
                  <TableAction
                    :actions="[
                      {
                        label: '编辑',
                        onClick: handleEdit.bind(null, record),
                      },
                      {
                        label: '启用',
                        onClick: handleDel.bind(null, record),
                      },
                    ]"
                  />
                </template>
              </template>
            </BasicTable>
          </Tabs.TabPane>
        </Tabs>
      </div>
      <Dragger direction="Y" :next-min="300" :next-max="500" />
      <div class="w-80">
        <GroupInfoEditor ref="infoEditorRef" :group-key="groupKey" />
      </div>
    </div>
    <NewCompEditor @register="registerModal" />
  </page-wrapper>
</template>
<script lang="ts">
  export default {
    name: 'GroupEditor',
  };
</script>
<script lang="ts" setup>
  import {
    ref,
    unref,
    toRef,
    onActivated,
    watchEffect,
    computed,
    ComputedRef,
    onMounted,
  } from 'vue';
  import { BasicTable, TableAction, useTable } from '/@/components/Table';
  import { Tabs } from 'ant-design-vue';
  import { useGo } from '/@/hooks/web/usePage';
  import { useModal } from '/@/components/Modal';
  import { useMessage } from '/@/hooks/web/useMessage';
  import Terminal from '/@/components/Terminal';
  import groupSender from '/@/ipc/group';
  import componentSender from '/@/ipc/component';
  import Dragger from '/@/components/Dragger';
  import { Description, DescItem, useDescription } from '/@/components/Description/index';
  import NewCompEditor from './components/NewCompEditor.vue';
  import GroupInfoEditor from './components/GroupInfoEditor.vue';
  import { getColumns, getVersionColumns } from './data';

  const props = defineProps({
    groupKey: {
      type: String,
      required: true,
    },
  });

  const go = useGo();
  const { createConfirm, createMessage } = useMessage();
  const [registerModal, { openModal }] = useModal();

  const groupKey = toRef(props, 'groupKey');
  const path = ref('');
  const infoEditorRef = ref();
  const dependencies = ref();
  const activeKey = '3';

  const schema: ComputedRef<DescItem[]> = computed(() => {
    return Object.keys(dependencies.value || {}).map((key) => ({
      field: key,
      label: key,
    })) as DescItem[];
  });
  const [register] = useDescription({
    data: dependencies,
    schema: schema,
    column: 3,
  });

  onActivated(() => {
    reload();
    reloadVersions();
  });
  watchEffect(async () => {
    const info = await groupSender.getPackageInfo(unref(groupKey));
    dependencies.value = info.dependencies;
  });

  async function createComponent() {
    openModal(true, { group: unref(groupKey) });
  }

  function handleEdit({ group, func }) {
    go({
      name: 'ComponentEditor',
      params: { group, func },
    });
  }
  const saveDisabled = ref(false);

  async function handleDel({ group, func }) {
    await createConfirm({
      content: '删除后将失去所有数据，确认删除吗？',
      iconType: 'warning',
      async onOk() {
        await componentSender.delComponent(group, func);
        reload();
      },
    });
  }

  async function handleSubmit() {
    const form = unref(infoEditorRef)?.getValue();
    saveDisabled.value = true;
    const hide = createMessage.loading('同步中');
    await groupSender.setGroupInfo(unref(groupKey), form);
    saveDisabled.value = false;
    hide();
    unref(infoEditorRef).reload();
    getPath();
  }
  async function getPath() {
    path.value = await groupSender.getWorkspace(unref(groupKey));
  }

  onMounted(() => {
    getPath();
  });

  async function getGroupComponents() {
    const list = await groupSender.getComponentList(unref(groupKey));
    return list;
  }

  async function getGroupVersions() {
    const list = await groupSender.getVersions(unref(groupKey));
    return list.versions;
  }

  const [registerTable, { reload }] = useTable({
    pagination: false,
    api: getGroupComponents,
    columns: getColumns(),
    rowKey: 'id',
    actionColumn: {
      width: 160,
      title: '操作',
      dataIndex: 'action',
    },
  });
  const [registerVersionTable, { reload: reloadVersions }] = useTable({
    pagination: false,
    api: getGroupVersions,
    columns: getVersionColumns(),
    rowKey: 'id',
    actionColumn: {
      width: 160,
      title: '操作',
      dataIndex: 'action',
    },
  });
</script>
<style lang="less" scoped>
  .tabs :deep(.ant-tabs-nav) {
    background-color: #f2f2f2;
  }
</style>
