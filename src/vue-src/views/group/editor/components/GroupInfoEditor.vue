<template>
  <Form ref="formRef" name="dynamic_form_item" class="w-full h-full overflow-y-auto">
    <div class="mb-2">
      <Card title="基本信息">
        <Form.Item label="名称" name="name">
          <a-input autocomplete="off" v-model:value="form.name" />
        </Form.Item>
        <Form.Item label="标识" name="key">
          <span> {{ groupInfo.key }} </span>
        </Form.Item>
        <Form.Item label="版本" name="version">
          <span> v{{ groupInfo.version }} </span>
        </Form.Item>
        <Form.Item label="是否发布" name="group">
          <span> {{ groupInfo.published }} </span>
        </Form.Item>
        <Form.Item label="是否启用" name="group">
          <span> {{ groupInfo.enabled }} </span>
        </Form.Item>
        <Form.Item label="是否区分平台" name="diffPlatform">
          <span> {{ groupInfo.diffPlatform }} </span>
        </Form.Item>
        <Form.Item label="描述" name="desc">
          <a-textarea autocomplete="off" v-model:value="form.desc" />
        </Form.Item>
      </Card>
    </div>
  </Form>
</template>

<script setup lang="ts">
  /**
   * TODO 计划将类型使用下拉菜单的形式展示，并支持动态增减
   */
  import { toRaw, toRefs, reactive, watch, computed, unref } from 'vue';
  import { Form, Card } from 'ant-design-vue';
  import { useGroupInfo } from '../hooks/useGroupInfo';

  const props = defineProps({
    groupKey: {
      type: String,
      required: true,
    },
  });

  const { groupKey } = toRefs(props);
  const form = reactive({
    name: '未命名',
    desc: '',
  });

  const { info, reload } = useGroupInfo(groupKey);
  watch(info, (val) => {
    if (val) {
      form.name = val.name;
      form.desc = val.desc;
    }
  });

  const groupInfo = computed(() => {
    const { key, version, enabled, published, diffPlatform } = unref(info) || {};
    return {
      key,
      version,
      enabled: enabled ? '是' : '否',
      published: published ? '是' : '否',
      diffPlatform: diffPlatform ? '是' : '否',
    };
  });

  function getValue() {
    return toRaw(form);
  }
  defineExpose({
    getValue,
    reload,
  });
</script>

<style scoped></style>
