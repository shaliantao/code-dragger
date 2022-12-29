<template>
  <div>
    <div v-if="data" class="mb-2">
      <Card size="small" title="输入">
        <a-row class="mb-5px">
          <a-col :span="6">
            <span>值1</span>
          </a-col>
          <a-col :span="10">
            <SmartInput v-model="data.leftValue" v-model:srcType="data.leftSrcType" />
          </a-col>
        </a-row>
        <a-row class="mb-5px">
          <a-col :span="6">
            <span>关系</span>
          </a-col>
          <a-col :span="10">
            <SmartInput v-model="data.operator" :default-val="operator" :is-enum="IsEnum.Yes" />
          </a-col>
        </a-row>
        <a-row class="mb-5px">
          <a-col :span="6">
            <span>值2</span>
          </a-col>
          <a-col :span="10">
            <SmartInput v-model="data.rightValue" v-model:srcType="data.rightSrcType" />
          </a-col>
        </a-row>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, toRef, unref, watchEffect } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import { Card } from 'ant-design-vue';
  import { IfCommand } from '@src/platform/common/types';
  import { IsEnum } from '@src/platform/common/enum';
  import SmartInput from '../SmartInput.vue';

  const props = defineProps({
    node: {
      type: Object as PropType<IfCommand>,
      required: true,
    },
  });
  const nodeRef = toRef(props, 'node');

  const operator = '>,<,>=,<=,==,!=';

  const data = ref<Nullable<IfCommand>>(null);

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
