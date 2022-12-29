<template>
  <Form ref="formRef" name="dynamic_form_item" class="w-full h-full overflow-y-auto border">
    <div class="mb-2">
      <Card title="基本信息">
        <Form.Item label="应用名称" name="name">
          <a-input autocomplete="off" v-model:value="form.name" />
        </Form.Item>
        <Form.Item label="应用描述" name="group">
          <a-textarea autocomplete="off" v-model:value="form.desc" />
        </Form.Item>
      </Card>
    </div>
    <div class="mb-2">
      <Card title="全局变量" />
    </div>
  </Form>
</template>

<script setup lang="ts">
  /**
   * TODO 计划将类型使用下拉菜单的形式展示，并支持动态增减
   */
  import { toRaw, toRefs, reactive, watch } from 'vue';
  import { Form, Card } from 'ant-design-vue';
  import { useAppInfo } from '/@/views/app/editor/hooks/useAppInfo';

  const props = defineProps({
    uuid: {
      type: String,
      required: true,
    },
  });

  const { uuid } = toRefs(props);

  const form = reactive({
    name: '未命名',
    desc: '',
  });

  const { info } = useAppInfo(uuid);
  watch(info, (val) => {
    if (val) {
      form.name = val.name;
      form.desc = val.desc;
    }
  });

  function getValue() {
    return {
      form: toRaw(form),
    };
  }
  defineExpose({
    getValue,
  });
</script>

<style scoped></style>
