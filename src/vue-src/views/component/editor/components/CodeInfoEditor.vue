<template>
  <Form ref="formRef" :model="form" name="dynamic_form_item" class="w-full h-full overflow-y-auto">
    <div class="mb-2">
      <Card title="基本信息">
        <Form.Item label="组件名称" name="name">
          <a-input autocomplete="off" v-model:value="form.name" />
        </Form.Item>
        <Form.Item label="所属分组" name="group">
          <span> {{ form.group }} </span>
        </Form.Item>
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
            <span>枚举&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;默认值</span>
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
            <a-input v-model:value="input.defaultVal" placeholder="默认值">
              <template #addonBefore>
                <a-select v-model:value="input.isEnum">
                  <a-select-option :value="IsEnum.Yes">是</a-select-option>
                  <a-select-option :value="IsEnum.No">否</a-select-option>
                </a-select>
              </template>
            </a-input>
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
  </Form>
</template>

<script setup lang="ts">
  /**
   * TODO 计划将类型使用下拉菜单的形式展示，并支持动态增减
   */
  import { ref, unref, toRaw, toRefs, reactive, PropType, watch } from 'vue';
  import { Form, Card } from 'ant-design-vue';
  import { IsEnum } from '@src/platform/common/enum';
  import type { InputsOutput } from '@src/platform/code/code';
  import { useComponentInfo } from '../hooks/useComponentInfo';
  import { useInputOutput } from '../hooks/useInputOutput';
  import OutputSubEditor from './OutputSubEditor.vue';
  import TypeSelector from './TypeSelector.vue';
  import { InputArg, OutputArg } from '@src/platform/common/types';

  const props = defineProps({
    ioParams: {
      type: [Object, null] as PropType<Nullable<InputsOutput>>,
      required: true,
    },
    group: {
      type: String,
      required: true,
    },
    func: {
      type: String,
      required: true,
    },
  });

  const { group, func, ioParams } = toRefs(props);
  const subEditorRef = ref();
  const form = reactive({
    name: '未命名',
    diffPlatform: false,
    group: '',
  });

  const { info } = useComponentInfo(group, func);
  watch(info, (val) => {
    if (val) {
      form.name = val.name;
      form.diffPlatform = val.diffPlatform;
      form.group = val.group;
    }
  });

  const { output, inputs } = useInputOutput(group, func, ioParams, getOutput);

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

  function getValue() {
    return {
      inputs: unref(inputs),
      output: getOutput(),
      form: toRaw(form),
    };
  }
  defineExpose({
    getValue,
  });
</script>

<style scoped></style>
