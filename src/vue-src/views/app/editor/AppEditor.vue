<template>
  <PageWrapper class="h-full" contentClass="h-full">
    <div class="flex p-2 h-40px border mb-4px">
      <OperationBar :uuid="uuid" :isView="isView" :command-flow="commandFlow" @on-save="saveApp" />
    </div>
    <div class="flex h-[calc(100%-40px)]">
      <div class="w-200px h-full overflow-y-auto border">
        <CommandMenu />
      </div>
      <Dragger direction="Y" :prev-min="200" :prev-max="260" />
      <div class="flex flex-1 flex-col">
        <div class="flex-1">
          <CommandList ref="commandListRef" :uuid="uuid" />
        </div>
        <Dragger direction="X" :prev-min="200" :next-min="300" />
        <Tabs class="tabs" v-model:value="activeKey">
          <Tabs.TabPane key="1" tab="终端">
            <Terminal :path="path" />
          </Tabs.TabPane>
          <Tabs.TabPane key="2" tab="元素抓取" />
          <Tabs.TabPane key="3" tab="依赖">
            <!-- <Description @register="register" class="my-4" /> -->
          </Tabs.TabPane>
          <Tabs.TabPane key="4" tab="版本" />
        </Tabs>
      </div>
      <Dragger direction="Y" :next-min="300" :next-max="500" />
      <div>
        <AppInfoEditor ref="infoEditor" :uuid="uuid" :isView="isView" />
      </div>
    </div>
  </PageWrapper>
</template>
<script lang="ts">
  export default {
    name: 'AppEditor',
  };
</script>
<script lang="ts" setup>
  import { ref, unref, computed, toRef, onMounted } from 'vue';
  import { Tabs } from 'ant-design-vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import Terminal from '/@/components/Terminal';
  import CommandMenu from './components/CommandMenu.vue';
  import OperationBar from './components/OperationBar.vue';
  import CommandList from './components/CommandList.vue';
  import Dragger from '/@/components/Dragger';
  import AppInfoEditor from './components/AppInfoEditor.vue';
  import appSender from '/@/ipc/app';
  import PageWrapper from '/@/components/Page/src/PageWrapper.vue';
  import { OpEnum } from '/@/enums/opEnum';
  import { useAppTypes } from './hooks/useAppTypes';

  const props = defineProps({
    uuid: {
      type: String,
      required: true,
    },
    opType: {
      type: String as PropType<OpEnum>,
      required: true,
    },
  });

  const uuid = toRef(props, 'uuid');

  const isView = computed(() => props.opType === OpEnum.VIEW);

  const path = ref('');
  const activeKey = '1';
  const commandListRef = ref();
  const infoEditor = ref();

  const { createMessage } = useMessage();
  useAppTypes(uuid);

  const commandFlow = computed(() => {
    return unref(commandListRef)?.commandFlow || [];
  });

  async function saveApp() {
    const { form } = infoEditor.value.getValue();
    await appSender.saveApp(unref(uuid), unref(commandFlow), form);
    createMessage.success('保存成功');
  }
  async function getPath() {
    path.value = await appSender.getWorkspace(unref(uuid));
  }

  onMounted(() => {
    getPath();
  });
</script>
<style lang="less" scoped>
  .tabs :deep(.ant-tabs-nav) {
    background-color: #f2f2f2;
  }
</style>
