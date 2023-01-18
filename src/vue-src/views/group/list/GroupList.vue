<template>
  <page-wrapper class="page-container">
    <div class="flex gap-2 mb-2">
      <a-button @click="createGroup">创建分组</a-button>
    </div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'version'">
          <Badge :count="`v${record.version}`" :number-style="{ backgroundColor: '#108ee9' }" />
        </template>
        <template v-if="column.dataIndex === 'published'">
          <Tag v-if="record.published" color="#87d068">已发布</Tag>
          <Tag v-else color="#A5A6A7">未发布</Tag>
        </template>
        <template v-if="column.dataIndex === 'action'">
          <TableAction
            :actions="[
              {
                label: '编辑',
                onClick: handleEdit.bind(null, record),
              },
              {
                label: '发布',
                onClick: handlePublish.bind(null, record),
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
    <InfoEditor @register="register" />
  </page-wrapper>
</template>

<script lang="ts" setup>
  import { useGo } from '/@/hooks/web/usePage';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useModal } from '/@/components/Modal';
  import groupSender from '/@/ipc/group';
  import { BasicTable, TableAction, useTable } from '/@/components/Table';
  import InfoEditor from './components/InfoEditor.vue';
  import { getColumns } from './data';
  import { ref } from 'vue';
  import { Badge, Tag } from 'ant-design-vue';

  const go = useGo();
  const publishDisabled = ref(false);
  const { createConfirm, createMessage } = useMessage();
  const [register, { openModal }] = useModal();

  async function createGroup() {
    openModal(true);
  }

  async function getGroupList() {
    const list = await groupSender.getList();
    return list;
  }

  function handleEdit({ key }) {
    go({
      name: 'GroupEditor',
      params: { groupKey: key },
    });
  }

  async function handlePublish({ key }) {
    publishDisabled.value = true;
    const hide = createMessage.loading('发布中');
    await groupSender.publish(key);
    publishDisabled.value = false;
    hide();
    reload();
  }

  async function handleDel({ key }) {
    await createConfirm({
      content: '删除后将失去所有数据，确认删除吗？',
      iconType: 'warning',
      async onOk() {
        await groupSender.delGroup(key);
        reload();
      },
    });
  }

  const [registerTable, { reload }] = useTable({
    api: getGroupList,
    columns: getColumns(),
    rowKey: 'id',
    showIndexColumn: false,
    actionColumn: {
      width: 160,
      title: '操作',
      dataIndex: 'action',
    },
  });
</script>
