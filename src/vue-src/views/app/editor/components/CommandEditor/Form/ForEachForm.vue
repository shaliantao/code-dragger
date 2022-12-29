<template>
  <div>
    <div v-if="data" class="mb-2">
      <Card size="small" title="输入">
        <a-row class="mb-5px">
          <a-col :span="6">
            <span>列表</span>
          </a-col>
          <a-col :span="10">
            <SmartInput
              v-model="data.items"
              v-model:srcType="data.srcType"
              :value-type="ValueType.List"
            />
          </a-col>
        </a-row>
      </Card>
    </div>
    <div class="mb-2">
      <Card v-if="data?.output" size="small" title="输出">
        <a-row>
          <a-col :span="6">
            <span>输出循环项至</span>
          </a-col>
          <a-col :span="10">
            <a-input v-model:value="data.output.key" placeholder="标识" />
          </a-col>
        </a-row>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, toRef, unref, watchEffect, watch, computed } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import { Card } from 'ant-design-vue';
  import { ForEachCommand, ListOutputArg } from '@src/platform/common/types';
  import { useCommandEditorContext } from '/@/views/app/editor/hooks/useEditorContext';
  import SmartInput from '../SmartInput.vue';
  import { SrcType, ValueType } from '@src/platform/common/enum';

  const props = defineProps({
    node: {
      type: Object as PropType<ForEachCommand>,
      required: true,
    },
  });
  const nodeRef = toRef(props, 'node');

  const data = ref<Nullable<ForEachCommand>>(null);

  const context = useCommandEditorContext();

  const useableOutputNodes = computed(() => {
    return unref(context.outputNodes);
  });

  watchEffect(() => {
    data.value = cloneDeep(unref(nodeRef));
  });

  watch(
    () => data.value?.items,
    (val) => {
      if (data.value?.srcType === SrcType.Output && val) {
        const listOutput = useableOutputNodes.value?.find(
          (item) => item.key === val,
        ) as ListOutputArg;
        if (listOutput) {
          const child = listOutput.child;
          if (child) {
            data.value.output = child;
          }
        }
      }
    },
  );

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
