<template>
  <Tabs v-if="data" v-model:activeKey="activeKey" type="card" class="h-full">
    <Tabs.TabPane key="basic" tab="基础">
      <div class="h-full overflow-y-auto">
        <div class="mb-2 h-2/3">
          <Card size="small" title="自定义代码" class="h-full" :body-style="{ height: '100%' }">
            <Alert class="h-30px" :message="alertStr" :type="alertType" />
            <div class="h-[calc(100%-60px)]">
              <MonacoEditor v-model="data.code" />
            </div>
          </Card>
        </div>
        <div class="mb-2">
          <Card v-if="inputs" title="输入">
            <a-row :gutter="4" class="bg-gray-100 text-dark-50 mb-5px">
              <a-col :span="5">
                <span>类型</span>
              </a-col>
              <a-col :span="5">
                <span>名称</span>
              </a-col>
              <a-col :span="4">
                <span>标识</span>
              </a-col>
              <a-col :span="10">
                <span>值</span>
              </a-col>
            </a-row>
            <a-row class="mb-5px" :gutter="4" v-for="input in inputs" :key="input.key">
              <a-col :span="5">
                <TypeSelector
                  v-model:value="input.type"
                  placeholder="类型"
                  @custom-type-change="(type) => customTypeChange(type, input)"
                />
              </a-col>
              <a-col :span="5">
                <a-input v-model:value="input.name" placeholder="名称" />
              </a-col>
              <a-col :span="4">
                <a-input v-model:value="input.key" placeholder="标识" :readonly="true" />
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
          <Card v-if="output" title="输出">
            <a-row :gutter="4" class="bg-gray-100 text-dark-50 mb-5px">
              <a-col :span="7">
                <span>类型</span>
              </a-col>
              <a-col :span="7">
                <span>名称</span>
              </a-col>
              <a-col :span="7">
                <span>标识</span>
              </a-col>
            </a-row>
            <a-row :gutter="4" class="mb-2">
              <a-col :span="7">
                <TypeSelector
                  v-model:value="output.type"
                  placeholder="类型"
                  @custom-type-change="(type) => customTypeChange(type, output)"
                />
              </a-col>
              <a-col :span="7">
                <a-input v-model:value="output.name" placeholder="名称" />
              </a-col>
              <a-col :span="7">
                <a-input v-model:value="output.key" placeholder="标识" />
              </a-col>
            </a-row>
            <OutputSubEditor ref="subEditorRef" :output="output" />
          </Card>
        </div>
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
  import { computed, ref, toRef, unref, watchEffect } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import { Card, Tabs, Alert } from 'ant-design-vue';
  import { ErrorHandling } from '@src/platform/common/enum';
  import { CodeCommand, InputArg, OutputArg } from '@src/platform/common/types';
  import SmartInput from '../SmartInput.vue';
  import OutputSubEditor from '/@/views/component/editor/components/OutputSubEditor.vue';
  import TypeSelector from '/@/views/component/editor/components/TypeSelector.vue';
  import { useCodeParse } from '/@/hooks/code/useCodeParse';
  import { useInputOutput } from '/@/hooks/code/useInputOutput';
  import { createAsyncComponent } from '/@/utils/factory/createAsyncComponent';

  const MonacoEditor = createAsyncComponent(() => import('/@/components/MonacoEditor'));

  const props = defineProps({
    node: {
      type: Object as PropType<CodeCommand>,
      required: true,
    },
  });
  const nodeRef = toRef(props, 'node');
  const subEditorRef = ref();
  const activeKey = ref('basic');
  const data = ref<Nullable<CodeCommand>>(null);
  const { alertStr, alertType, ioParams } = useCodeParse(computed(() => unref(data)?.code || ''));

  const initialIoParams = computed(() => ({
    inputs: unref(nodeRef)?.inputs,
    output: unref(nodeRef)?.output,
  }));

  const { output, inputs } = useInputOutput(initialIoParams, ioParams, getOutput);

  function customTypeChange(type: string, item?: Nullable<OutputArg> | InputArg) {
    item?.name === '' && (item.name = type);
  }

  function getOutput(): Nullable<OutputArg> {
    if (output?.value) {
      const subData = unref(subEditorRef).getData();
      const { name, key, type } = output.value;
      return { name, key, type, ...subData };
    } else {
      return null;
    }
  }

  watchEffect(() => {
    data.value = cloneDeep(unref(nodeRef));
  });

  function getData() {
    return {
      ...unref(data),
      inputs: unref(inputs),
      output: getOutput(),
    };
  }
  function reset() {
    data.value = null;
    inputs && (inputs.value = null);
    output && (output.value = null);
  }

  defineExpose({
    getData,
    reset,
  });
</script>

<style scoped></style>
