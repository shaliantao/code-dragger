<template>
  <page-wrapper class="page-container">
    <div class="flex gap-2 mb-2">
      <a-button @click="createApp">创建管理员</a-button>
    </div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'role'">
          <Tag v-if="record.role === RoleEnum.SUPER" color="#3b5999">超级管理员</Tag>
          <Tag v-else-if="record.role === RoleEnum.ADMIN" color="#55acee">普通管理员</Tag>
          <Tag v-else-if="record.role === RoleEnum.USER" color="#A5A6A7">普通用户</Tag>
        </template>
        <template v-if="column.dataIndex === 'action'">
          <TableAction
            :actions="
              record.role !== RoleEnum.USER
                ? [
                    {
                      label: '编辑',
                      onClick: handleEdit.bind(null, record),
                    },
                    {
                      label: '删除',
                      onClick: handleDel.bind(null, record),
                    },
                  ]
                : [
                    {
                      label: '删除',
                      onClick: handleDel.bind(null, record),
                    },
                  ]
            "
          />
        </template>
      </template>
    </BasicTable>
    <InfoEditor @register="register" @on-success="onSuccess" />
  </page-wrapper>
</template>

<script lang="ts" setup>
  import { getUserList, delUser } from '/@/api/biz/user';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, TableAction, useTable } from '/@/components/Table';
  import InfoEditor from './components/InfoEditor.vue';
  import { getColumns } from './data';
  import { RoleEnum } from '/@/enums/roleEnum';
  import { Tag } from 'ant-design-vue';

  const { createConfirm } = useMessage();
  const [register, { openModal }] = useModal();

  async function createApp() {
    openModal(true);
  }

  function handleEdit() {}

  async function handleDel({ id }) {
    await createConfirm({
      content: '删除后将失去所有数据，确认删除吗？',
      iconType: 'warning',
      async onOk() {
        await delUser(id);
        reload();
      },
    });
  }

  async function getList(params) {
    const res = await getUserList(params);
    return res.data;
  }

  function onSuccess() {
    reload();
  }

  const [registerTable, { reload }] = useTable({
    api: getList,
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
