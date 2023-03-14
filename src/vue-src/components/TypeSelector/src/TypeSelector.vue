<template>
  <a-select
    v-bind="$attrs"
    placeholder="选择类型"
    class="w-full"
    :options="items"
    show-search
    @search="onSearch"
    @select="onSelect"
  >
    <template #dropdownRender="{ menuNode: menu }">
      <v-nodes :vnodes="menu" />
    </template>
    <template #notFoundContent>
      <div
        style="padding: 4px 8px; cursor: pointer"
        @mousedown="(e) => e.preventDefault()"
        @click="addItem"
      >
        <PlusOutlined /> 新增
      </div>
    </template>
  </a-select>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  export default defineComponent({
    components: {
      VNodes: (_, { attrs }) => {
        return attrs.vnodes;
      },
    },
  });
</script>

<script setup lang="ts">
  import { ref, unref, computed } from 'vue';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import { valueTypeArr } from '/@/utils/mapping';
  import { useTypesContext } from '../hooks/useTypeContext';

  const emits = defineEmits(['custom-type-change']);
  const props = defineProps({
    isDefaultType: {
      type: Boolean,
      default: false,
    },
  });
  const searchVal = ref('');

  const defaultArr = valueTypeArr;

  const defaultTypes = defaultArr.map((item) => ({ label: item, value: item }));

  const context = useTypesContext();

  const items = computed(() => {
    if (props.isDefaultType) {
      return defaultTypes;
    }
    const customTypes = unref(context.types).map((item) => ({ label: item, value: item }));
    const types = defaultTypes.concat(customTypes);
    return types;
  });

  const addItem = async () => {
    await context.setTypes(searchVal.value);
    searchVal.value = '';
  };
  function onSearch(val) {
    searchVal.value = val;
  }
  function onSelect(val) {
    if (!defaultArr.includes(val)) {
      emits('custom-type-change', val);
    }
  }
</script>

<style scoped></style>
