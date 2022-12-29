<template>
  <Tabs v-model:activeKey="activeKey" type="card">
    <Tabs.TabPane key="basic" tab="基础">
      <div class="mb-2">
        <Card v-if="data?.inputs" size="small" title="输入">
          <a-row class="bg-gray-100 text-dark-50 mb-5px">
            <a-col :span="6">
              <span>名称</span>
            </a-col>
            <a-col :span="10">
              <span>值</span>
            </a-col>
          </a-row>
          <a-row class="mb-5px" v-for="input in data.inputs" :key="input.key">
            <a-col :span="6">
              <span>{{ input.name }}</span>
            </a-col>
            <a-col :span="10">
              <SmartInput
                v-model="input.value"
                v-model:srcType="input.srcType"
                :default-val="input.defaultVal"
                :is-enum="input.isEnum"
                :value-type="input.type"
              />
            </a-col>
          </a-row>
        </Card>
      </div>
      <div class="mb-2">
        <Card v-if="data?.output" size="small" title="输出">
          <a-row class="bg-gray-100 text-dark-50 mb-5px">
            <a-col :span="6">
              <span>名称</span>
            </a-col>
            <a-col :span="10">
              <span>标识</span>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="6">
              <span>{{ data.output.name }}</span>
            </a-col>
            <a-col :span="10">
              <a-input v-model:value="data.output.key" placeholder="标识" />
            </a-col>
          </a-row>
        </Card>
      </div>
    </Tabs.TabPane>
    <Tabs.TabPane key="advance" tab="高级">
      <Card v-if="data" size="small" title="错误处理">
        <a-row>
          <a-col :span="6">
            <span>处理方式</span>
          </a-col>
          <a-col :span="10">
            <a-select v-model:value="data.errorHandling" class="w-full">
              <a-select-option :value="ErrorHandling.Stop">终止执行</a-select-option>
              <a-select-option :value="ErrorHandling.Ignore">继续执行</a-select-option>
              <a-select-option :value="ErrorHandling.Retry">重试执行</a-select-option>
            </a-select>
          </a-col>
        </a-row>
      </Card>
    </Tabs.TabPane>
  </Tabs>
</template>

<script setup lang="ts">
  import { ref, toRef, unref, watchEffect } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import { Card, Tabs } from 'ant-design-vue';
  import { ComponentCommand } from '@src/platform/common/types';
  import { ErrorHandling } from '@src/platform/common/enum';
  import SmartInput from '../SmartInput.vue';

  const props = defineProps({
    node: {
      type: Object as PropType<ComponentCommand>,
      required: true,
    },
  });
  const nodeRef = toRef(props, 'node');

  const activeKey = ref('basic');
  const data = ref<Nullable<ComponentCommand>>(null);

  watchEffect(() => {
    data.value = cloneDeep(unref(nodeRef));
  });

  function getData() {
    return unref(data);
  }
  function reset() {
    data.value = null;
  }

  defineExpose({
    getData,
    reset,
  });
</script>

<style scoped></style>
