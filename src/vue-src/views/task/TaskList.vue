<template>
  <page-wrapper class="page-container">
    <div class="flex gap-2 mb-2">
      <a-button @click="createTask">新建任务</a-button>
    </div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'execMode'">
          <Tag v-if="record.execMode === ExecMode.Cycle" color="#A5A6A7">
            <template #icon><SyncOutlined /></template>周期执行</Tag
          >
          <Tag v-else-if="record.execMode === ExecMode.Timing" color="#A5A6A7">
            <template #icon><ClockCircleOutlined /> </template>定时执行</Tag
          >
        </template>
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
    <InfoEditor
      @register="register"
      @on-success="onSuccess"
      :width="600"
      :body-style="{ height: '350px' }"
    />
  </page-wrapper>
</template>

<script lang="ts" setup>
  import { getTaskList, delTask } from '/@/api/biz/task';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useModal } from '/@/components/Modal';
  import taskSender from '/@/ipc/task';
  import { BasicTable, TableAction, useTable } from '/@/components/Table';
  import InfoEditor from './components/InfoEditor.vue';
  import { getColumns } from './data';
  import { Tag } from 'ant-design-vue';
  import { ExecMode } from '@src/platform/common/enum';
  import { SyncOutlined, ClockCircleOutlined } from '@ant-design/icons-vue';

  const { createConfirm } = useMessage();
  const [register, { openModal }] = useModal();

  async function createTask() {
    openModal(true);
  }

  function handleEdit(row) {
    openModal(true, row);
  }

  async function handleDel({ id }) {
    await createConfirm({
      content: '删除后将失去所有数据，确认删除吗？',
      iconType: 'warning',
      async onOk() {
        await delTask(id);
        taskSender.syncTask();
        reload();
      },
    });
  }

  async function getList(params) {
    const res = await getTaskList(params);
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
