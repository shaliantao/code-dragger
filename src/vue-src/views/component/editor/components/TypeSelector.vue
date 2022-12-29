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
  import { ref, unref, computed, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import groupSender from '/@/ipc/group';
  import { valueTypeArr, basicTypeArr } from '/@/utils/mapping';

  const { currentRoute } = useRouter();
  const { group } = unref(currentRoute)?.params || {};
  const props = defineProps({
    isBasic: {
      type: Boolean,
      default: false,
    },
  });
  const emits = defineEmits(['custom-type-change']);
  const customArr = ref<string[]>([]);
  const searchVal = ref('');
  async function getTypes() {
    customArr.value = await groupSender.getTypes();
  }
  const event = groupSender.onTypesChange(() => {
    getTypes();
  });
  getTypes();
  const defaultArr = props.isBasic ? basicTypeArr : valueTypeArr;

  const defaultTypes = defaultArr.map((item) => ({ label: item, value: item }));

  const items = computed(() => {
    const customTypes = customArr.value.map((item) => ({ label: item, value: item }));
    const types = defaultTypes.concat(customTypes);
    return types;
  });

  const addItem = async () => {
    await groupSender.setGroupTypes(group as string, searchVal.value);
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
  onUnmounted(() => event?.dispose());
</script>

<style scoped></style>
