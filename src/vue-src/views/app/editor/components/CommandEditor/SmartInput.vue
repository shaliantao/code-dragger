<template>
  <div v-if="isEnumSrc">
    <a-select class="w-full" :value="modelValue" @select="onValChange">
      <a-select-option :key="index" v-for="(item, index) of enumOptions" :value="item">{{
        item
      }}</a-select-option>
    </a-select>
  </div>
  <div v-else>
    <a-input-group compact class="!flex">
      <a-input v-if="isInputSrc" class="flex-1" :value="modelValue" @change="onInputChange" />
      <TreeSelect
        v-else-if="isOutputSrc"
        :value="modelValue"
        show-search
        class="flex-1"
        :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
        placeholder="请选择"
        allow-clear
        :tree-data="useableOutputNodes"
        :field-names="{
          label: 'name',
          value: 'key',
        }"
        @select="onValChange"
      >
        <template #title="{ key, name }">
          <span>{{ key?.includes('.') ? key.split('.')[1] : key }}</span>
          <span v-show="name" class="text-gray-400">{{ `(${name})` }}</span>
        </template>
      </TreeSelect>
      <a-select v-else-if="isGlobalSrc" class="flex-1" :value="modelValue" @select="onValChange">
        <a-select-opt-group label="字段映射">
          <a-select-option value="jack">Jack</a-select-option>
          <a-select-option value="lucy">Lucy</a-select-option>
        </a-select-opt-group>
        <a-select-opt-group label="全局变量">
          <a-select-option value="Yiminghe">yiminghe</a-select-option>
          <a-select-option value="Yiminghe1">yiminghe1</a-select-option>
        </a-select-opt-group>
      </a-select>
      <Tooltip title="手动输入">
        <a-button
          class="h-30px w-30px"
          v-show="showInputBtn"
          @click="(e) => onTypeChange(SrcType.Input, e)"
        >
          <Icon icon="ic:outline-keyboard-alt" />
        </a-button>
      </Tooltip>
      <Tooltip title="选取输出">
        <a-button
          class="h-30px w-30px"
          v-show="showOutputBtn"
          @click="(e) => onTypeChange(SrcType.Output, e)"
        >
          <Icon icon="material-symbols:output" />
        </a-button>
      </Tooltip>
      <Tooltip title="全局变量">
        <a-button
          class="h-30px w-30px"
          v-show="showGlobalBtn"
          @click="(e) => onTypeChange(SrcType.Global, e)"
        >
          <Icon icon="ant-design:global-outlined" />
        </a-button>
      </Tooltip>
    </a-input-group>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, toRef, unref, watch } from 'vue';
  import { Tooltip, TreeSelect } from 'ant-design-vue';
  import { ValueType, SrcType, IsEnum } from '@src/platform/common/enum';
  import { Icon } from '/@/components/Icon';
  import { valueTypeArr } from '/@/utils/mapping';
  import { useCommandEditorContext } from '../../hooks/useEditorContext';
  import {
    OutputArg,
    OutputNodes,
    BaseOutputArg,
    ObjectOutputArg,
  } from '@src/platform/common/types';
  import { cloneDeep } from 'lodash';

  const props = defineProps({
    isEnum: {
      type: Number as PropType<IsEnum>,
      defalut: IsEnum.No,
    },
    defaultVal: {
      type: String,
      default: '',
    },
    modelValue: {
      type: String,
      default: '',
    },
    srcType: {
      type: String as PropType<SrcType>,
      default: SrcType.Input,
    },
    valueType: {
      type: String as PropType<ValueType>,
      default: ValueType.Unknown,
    },
    autoSave: {
      type: Boolean,
      default: true,
    },
  });

  const emits = defineEmits(['update:srcType', 'update:modelValue']);

  const srcType = toRef(props, 'srcType');

  const isEnumSrc = computed(() => props.isEnum === IsEnum.Yes);

  const isCustomType = computed(() => !valueTypeArr.includes(props.valueType));

  // 如果是自定义类型，默认只能从输出选取
  if (isCustomType.value) {
    onTypeChange(SrcType.Output);
  }

  const isInputSrc = computed(() => srcType.value === SrcType.Input);
  const isOutputSrc = computed(() => srcType.value === SrcType.Output);
  const isGlobalSrc = computed(() => [SrcType.KeyMapping, SrcType.Global].includes(srcType.value));
  const showInputBtn = computed(() => !isCustomType.value && !isInputSrc.value);
  const showGlobalBtn = computed(() => !isCustomType.value && !isGlobalSrc.value);
  const showOutputBtn = computed(() => !isOutputSrc.value);

  const context = useCommandEditorContext();

  const useableOutputNodes = computed(() => {
    if (!isOutputSrc.value) {
      return [];
    }
    const outputNodes = unref(context.outputNodes);
    if (!outputNodes || outputNodes.length === 0) {
      return [];
    }
    return getUseableNodes(outputNodes);
  });
  if (!isEnumSrc.value) {
    watch(
      useableOutputNodes,
      async (value) => {
        // 为设置值时再启动自动负值
        if (props.modelValue === '') {
          const lastItem = [...value].pop();
          if (lastItem) {
            if (!lastItem.disabled) {
              onValChange(lastItem?.key);
            } else {
              const children = (lastItem as ObjectOutputArg).children;
              const item = [...children].pop()!;
              onValChange(item?.key);
            }
            await nextTick();
            // 需要将自动设置的默认值保存到节点，此操作打开可以减少用户的保存操作，但会带来一定歧义
            if (props.autoSave) {
              context.autoSave();
            }
          }
        }
      },
      {
        immediate: true,
      },
    );
  }
  const enumOptions = computed(() => {
    return props.defaultVal?.split(',') || [];
  });

  function onInputChange(e) {
    const value = e?.target?.value;
    onValChange(value);
  }

  function onValChange(value: string) {
    console.log('onValChange');
    emits('update:modelValue', value);
  }

  function onTypeChange(type: SrcType, e?) {
    console.log('onTypeChange');
    if (e) {
      // 如果是原生点击事件触发则清空modelValue
      onValChange('');
    }
    emits('update:srcType', type);
  }

  // 获取useableOutputNodes的最后一个元素作为默认值，如元素为禁用对象则获取对象子属性中的最后一个元素

  // 只保留类型相同的输出变量作为输入,UNKNOWN类型的输入可以接收所有类型的输出
  function getUseableNodes(nodes: OutputArg[]): OutputNodes[] {
    const outputNodes: OutputNodes[] = cloneDeep(nodes);
    const useableNodes: OutputArg[] = [];
    // 如果输入类型未知则接受全部输出类型
    if (props.valueType === ValueType.Unknown) {
      return outputNodes;
    }
    for (const node of outputNodes) {
      if (node.type === ValueType.Unknown) {
        useableNodes.push(node);
      } else if (node.type === props.valueType) {
        if (node.type === ValueType.Object) {
          Reflect.deleteProperty(node, 'children');
        }
        useableNodes.push(node);
      } else if (node.type === ValueType.Object) {
        node.children = getUseableNodes(node.children) as BaseOutputArg[];
        if (node.children.length !== 0) {
          node.disabled = true;
          useableNodes.push(node);
        }
      }
    }
    return useableNodes;
  }
</script>

<style scoped></style>
