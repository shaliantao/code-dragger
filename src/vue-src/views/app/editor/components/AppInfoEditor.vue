<template>
  <div class="mb-2">
    <Card title="基本信息">
      <Form ref="formRef" name="dynamic_form_item" class="w-full">
        <Form.Item label="应用名称" name="name">
          <a-input autocomplete="off" v-model:value="form.name" :readonly="isView" />
        </Form.Item>
        <Form.Item label="应用描述" name="group">
          <a-textarea autocomplete="off" v-model:value="form.desc" :readonly="isView" />
        </Form.Item>
      </Form>
    </Card>
  </div>
  <Card title="全局变量" class="h-[calc(100%-165px)]" :body-style="{ height: '100%' }">
    <template #extra>
      <a-button shape="circle">
        <PlusOutlined v-if="!isView" @click="openModal(true, { uuid })" />
      </a-button>
    </template>
    <a-row class="bg-gray-100 text-dark-50 mb-5px">
      <a-col :span="12">
        <span>变量名称</span>
      </a-col>
      <a-col :span="12">
        <span>类型</span>
      </a-col>
    </a-row>
    <div class="overflow-y-auto">
      <Dropdown v-for="item in globalList" :key="item.name" :trigger="['contextmenu']">
        <a-row class="mb-5px text-gray-500" @dblclick="openModal(!isView, { uuid, item })">
          <a-col :span="12">
            <span>{{ item.name }}</span>
          </a-col>
          <a-col :span="12">
            <span>{{ item.type }}</span>
          </a-col>
        </a-row>
        <template v-if="!isView" #overlay>
          <Menu>
            <Menu.Item key="del" @click.stop="delGlobal">删除</Menu.Item>
          </Menu>
        </template>
      </Dropdown>
    </div>
  </Card>

  <GlobalEditor @register="register" @on-success="getGlobalList" />
</template>

<script setup lang="ts">
  import { ref, toRaw, toRefs, reactive, watch } from 'vue';
  import { Form, Card, Dropdown, Menu } from 'ant-design-vue';
  import appSender from '/@/ipc/app';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import { useAppInfo } from '/@/views/app/editor/hooks/useAppInfo';
  import { useModal } from '/@/components/Modal';
  import GlobalEditor from './GlobalEditor.vue';
  import { IGlobalVar } from '@src/platform/app/app';

  const props = defineProps({
    uuid: {
      type: String,
      required: true,
    },
    isView: {
      type: Boolean,
      required: true,
    },
  });

  const { uuid, isView } = toRefs(props);

  const globalList = ref<IGlobalVar[]>();

  const form = reactive({
    name: '未命名',
    desc: '',
  });

  const [register, { openModal }] = useModal();
  const { info } = useAppInfo(uuid);
  watch(info, (val) => {
    if (val) {
      form.name = val.name;
      form.desc = val.desc;
    }
  });

  function delGlobal() {}

  async function getGlobalList() {
    globalList.value = await appSender.getGlobalList(uuid.value);
  }
  getGlobalList();

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
