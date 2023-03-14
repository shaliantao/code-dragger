<template>
  <page-wrapper class="h-full" contentClass="h-full">
    <div class="flex h-full">
      <div class="flex flex-1 flex-col">
        <div class="flex-1" ref="codeRef">
          <Alert class="h-30px" :message="alertStr" :type="alertType" banner />
          <div style="position: absolute" :style="`height: ${heightRef}px; width: ${widthRef}px`">
            <MonacoEditor v-model="code" />
          </div>
        </div>
        <Dragger direction="X" :next-max="500" :next-min="200" />
        <Tabs class="tabs" v-model:value="activeKey">
          <Tabs.TabPane key="1" tab="终端">
            <Terminal :path="path" />
          </Tabs.TabPane>
          <Tabs.TabPane key="2" tab="依赖">
            <Description @register="register" class="my-4" />
          </Tabs.TabPane>
        </Tabs>
      </div>
      <Dragger direction="Y" :next-min="500" :next-max="600" />
      <div class="w-80">
        <CodeInfoEditor :ioParams="ioParams" :group="group" :func="func" />
      </div>
    </div>
  </page-wrapper>
</template>
<script lang="ts">
  export default {
    name: 'ComponentEditor',
  };
</script>
<script lang="ts" setup>
  import { ref, unref, toRefs, watchEffect, watch, ComputedRef, computed, onMounted } from 'vue';
  import { useDebounceFn, useResizeObserver } from '@vueuse/core';
  import { Alert, Tabs } from 'ant-design-vue';
  import Terminal from '/@/components/Terminal';
  import { Description, DescItem, useDescription } from '/@/components/Description/index';
  import componentSender from '/@/ipc/component';
  import Dragger from '/@/components/Dragger';
  import { createAsyncComponent } from '/@/utils/factory/createAsyncComponent';
  import CodeInfoEditor from './components/CodeInfoEditor.vue';
  import { useCodeParse } from '/@/hooks/code/useCodeParse';

  const MonacoEditor = createAsyncComponent(() => import('/@/components/MonacoEditor'));

  const props = defineProps({
    group: {
      type: String,
      required: true,
    },
    func: {
      type: String,
      required: true,
    },
  });

  const { group, func } = toRefs(props);
  const path = ref('');
  const activeKey = '1';
  const dependencies = ref();
  const codeRef = ref();
  const code = ref('');
  const heightRef = ref(0);
  const widthRef = ref(0);

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
  useResizeObserver(codeRef, (entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;
    heightRef.value = height;
    widthRef.value = width;
  });

  watchEffect(async () => {
    // const info = await componentSender.getPackageInfo(unref(group), unref(func));
    // dependencies.value = info.dependencies;
    const res = await componentSender.showCode(unref(group), unref(func));
    code.value = res;
  });

  watch(
    code,
    useDebounceFn(async () => {
      await componentSender.saveCode(unref(group), unref(func), unref(code));
    }, 500),
  );

  const { alertStr, alertType, ioParams } = useCodeParse(code);

  async function getPath() {
    path.value = await componentSender.getWorkspace(unref(group), unref(func));
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
