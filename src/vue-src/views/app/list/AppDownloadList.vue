<template>
  <div class="flex gap-2 my-2">
    <a-button class="" @click="getApp">获取应用</a-button>
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
              label: '查看',
              onClick: handleView.bind(null, record),
            },
            {
              label: '复制',
              onClick: handleCopy.bind(null, record),
            },
          ]"
        />
      </template>
    </template>
  </BasicTable>
</template>

<script lang="ts" setup>
  import { useGo } from '/@/hooks/web/usePage';
  //import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicTable, TableAction, useTable } from '/@/components/Table';
  import appSender from '/@/ipc/app';
  import { OpEnum } from '/@/enums/opEnum';
  import { Badge, Tag } from 'ant-design-vue';

  import { getDownloadColumns } from './data';

  const go = useGo();
  //const { createConfirm, createMessage } = useMessage();

  function handleView({ id }) {
    go({
      name: 'AppEditor',
      params: { uuid: id, opType: OpEnum.VIEW },
    });
  }

  function getApp() {
    go({
      name: 'AppStore',
    });
  }

  async function handleCopy() {}

  async function getAppList() {
    const list = await appSender.getList();
    return list;
  }
  const [registerTable] = useTable({
    pagination: false,
    api: getAppList,
    columns: getDownloadColumns(),
    rowKey: 'id',
    showIndexColumn: false,
    actionColumn: {
      width: 200,
      title: '操作',
      dataIndex: 'action',
    },
  });
</script>
