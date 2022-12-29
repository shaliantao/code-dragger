<template>
  <div>
    <div v-if="isListType">
      <a-row class="bg-gray-100 text-dark-50 mb-5px">
        <a-col :span="7">
          <span>列表项类型</span>
        </a-col>
        <a-col :span="7">
          <span>列表项名称</span>
        </a-col>
        <a-col :span="7">
          <span>列表项标识</span>
        </a-col>
      </a-row>
      <a-row class="mb-5px" :gutter="4">
        <a-col :span="7">
          <TypeSelector
            v-model:value="child.type"
            @custom-type-change="(type) => customTypeChange(child, type)"
          />
        </a-col>
        <a-col :span="7">
          <a-input v-model:value="child.name" :maxlength="10" placeholder="子项名称" />
        </a-col>
        <a-col :span="7">
          <a-input v-model:value="child.key" placeholder="子项标识" />
        </a-col>
      </a-row>
      <output-sub-editor ref="subItem" :output="child" />
    </div>
    <div v-if="isObjectType">
      <a-row class="bg-gray-100 text-dark-50 mb-5px" :gutter="4">
        <a-col :span="7">
          <span>子项类型</span>
        </a-col>
        <a-col :span="7">
          <span>子项名称</span>
        </a-col>
        <a-col :span="7">
          <span>子项标识</span>
        </a-col>
      </a-row>
      <a-row v-for="(item, index) in children" :key="index" :gutter="4" class="mb-5px">
        <a-col :span="7">
          <TypeSelector
            v-model:value="item.type"
            :is-basic="true"
            @custom-type-change="(type) => customTypeChange(item, type)"
          />
        </a-col>
        <a-col :span="7">
          <a-input v-model:value="item.name" :maxlength="10" placeholder="子项名称" />
        </a-col>
        <a-col :span="7">
          <a-input v-model:value="item.key" placeholder="子项标识" />
        </a-col>
        <a-col :span="2" class="button-right">
          <a-button
            type="primary"
            class="float-right"
            danger
            shape="circle"
            @click="delOutputChild(index)"
          >
            <minus-outlined />
          </a-button>
        </a-col>
      </a-row>
      <a-button type="primary" class="w-full mt-1" @click="addOutputChild">
        <plus-outlined />
      </a-button>
    </div>
  </div>
</template>
<script lang="ts">
  export default {
    name: 'OutputSubEditor',
  };
</script>
<script lang="ts" setup>
  import { computed, ref, unref, watch, PropType, toRefs, toRaw } from 'vue';
  import { PlusOutlined, MinusOutlined } from '@ant-design/icons-vue';
  import { cloneDeep } from 'lodash-es';
  import { buildShortUUID } from '/@/utils/uuid';
  import { ValueType } from '@src/platform/common/enum';
  import { OutputArg, BaseOutputArg, ListItemArg } from '@src/platform/common/types';
  import TypeSelector from './TypeSelector.vue';

  const initialObjectChild: () => BaseOutputArg = () => ({
    id: buildShortUUID(),
    name: '',
    key: '',
    type: ValueType.Unknown,
  });

  const initialListChild: () => ListItemArg = () => ({
    name: '',
    key: '',
    type: ValueType.Unknown,
  });

  const props = defineProps({
    output: {
      type: Object as PropType<OutputArg | ListItemArg>,
      required: true,
    },
  });
  const subItem = ref();
  const { output } = toRefs(props);

  const children = ref<BaseOutputArg[]>([initialObjectChild()]);
  const child = ref<ListItemArg>(initialListChild());

  const isObjectType = computed(() => unref(output).type === ValueType.Object);
  const isListType = computed(() => unref(output).type === ValueType.List);

  watch(
    () => unref(output).type,
    (type) => {
      if (type === ValueType.Object) {
        children.value = [initialObjectChild()];
      } else {
        children.value.length = 0;
      }
      if (type === ValueType.List) {
        child.value = initialListChild();
      } else {
        child.value = initialListChild();
      }
    },
  );
  watch(
    output,
    (val, oldVal) => {
      // output 引用改变时重新赋值
      if (val.type === ValueType.Object && val !== oldVal) {
        children.value = cloneDeep(unref(val).children) || [];
      }
      if (val.type === ValueType.List && val !== oldVal) {
        child.value = cloneDeep(unref(val).child) || initialListChild();
      }
    },
    {
      immediate: true,
    },
  );

  function addOutputChild() {
    unref(children).push(initialObjectChild());
  }
  function delOutputChild(i) {
    var index = unref(children).findIndex((_item, index) => index === i);
    if (index !== -1) {
      unref(children).splice(index, 1);
    }
  }

  function customTypeChange(item: BaseOutputArg | ListItemArg, type: string) {
    item.name === '' && (item.name = type);
  }

  function getData() {
    if (unref(isObjectType)) {
      return {
        children: toRaw(unref(children)),
      };
    } else if (unref(isListType)) {
      const res = unref(subItem)?.getData();
      child.value = { ...toRaw(unref(child)), ...res };
      return {
        child: unref(child),
      };
    }
  }

  defineExpose({
    getData,
  });
</script>
