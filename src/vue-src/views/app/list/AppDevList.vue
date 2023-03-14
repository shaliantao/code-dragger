<template>
  <div class="flex gap-2 my-2">
    <a-button class="" @click="createApp">创建应用</a-button>
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
              label: record.published ? '上架' : '发布',
              disabled: publishDisabled,
              onClick: record.published
                ? handleUpload.bind(null, record)
                : handlePublish.bind(null, record),
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
</template>

<script lang="ts" setup>
  import { useGo } from '/@/hooks/web/usePage';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, TableAction, useTable } from '/@/components/Table';
  import InfoEditor from './components/InfoEditor.vue';
  import appSender from '/@/ipc/app';
  import { OpEnum } from '/@/enums/opEnum';
  import { Badge, Tag } from 'ant-design-vue';

  import { getDevColumns } from './data';
  import { ref } from 'vue';

  const go = useGo();
  const { createConfirm, createMessage } = useMessage();
  const [register, { openModal }] = useModal();
  const publishDisabled = ref(false);

  async function createApp() {
    openModal(true);
  }

  function handleEdit({ id }) {
    go({
      name: 'AppEditor',
      params: { uuid: id, opType: OpEnum.EDIT },
    });
  }

  async function handlePublish({ id }) {
    publishDisabled.value = true;
    const hide = createMessage.loading('发布中');
    await appSender.publish(id);
    publishDisabled.value = false;
    createMessage.success('发布成功');
    reload();
    hide();
  }

  async function handleUpload() {
    createMessage.loading('上架中');
  }

  async function handleDel({ id }) {
    await createConfirm({
      content: '删除后将失去所有数据，确认删除吗？',
      iconType: 'warning',
      async onOk() {
        await appSender.delApp(id);
        reload();
      },
    });
  }

  async function getAppList() {
    const list = await appSender.getList();
    return list;
  }
  const [registerTable, { reload }] = useTable({
    pagination: false,
    api: getAppList,
    columns: getDevColumns(),
    rowKey: 'id',
    showIndexColumn: false,
    actionColumn: {
      width: 200,
      title: '操作',
      dataIndex: 'action',
    },
  });
</script>
