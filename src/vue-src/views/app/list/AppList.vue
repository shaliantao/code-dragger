<template>
  <page-wrapper class="page-container">
    <Tabs v-model:activeKey="activeKey" type="card">
      <Tabs.TabPane key="mine" tab="开发的应用">
        <AppDevList />
      </Tabs.TabPane>
      <Tabs.TabPane key="download" tab="下载的应用">
        <AppDownloadList />
      </Tabs.TabPane>
    </Tabs>
  </page-wrapper>
</template>

<script lang="ts" setup>
  import { Tabs } from 'ant-design-vue';
  import { ref, Ref } from 'vue';
  import AppDevList from './AppDevList.vue';
  import AppDownloadList from './AppDownloadList.vue';

  const activeKey: Ref<'mine' | 'download'> = ref('mine');
</script>
