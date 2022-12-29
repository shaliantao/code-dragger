<template>
  <BasicModal v-bind="$attrs" @register="register" title="创建组件" @cancel="close" @ok="save">
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" :model="model" />
    </div>
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref, unref } from 'vue';
  import { useGo } from '/@/hooks/web/usePage';
  import componentSender from '/@/ipc/component';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { schemas } from '../data';

  export default defineComponent({
    components: { BasicModal, BasicForm },
    setup() {
      const go = useGo();
      const groupKey = ref('');

      const modelRef = ref({});
      const [registerForm, { getFieldsValue, resetFields, clearValidate, validate }] = useForm({
        labelWidth: 100,
        schemas,
        showActionButtonGroup: false,
        actionColOptions: {
          span: 24,
        },
      });

      const [register, { closeModal }] = useModalInner((data) => {
        const { group } = data;
        groupKey.value = group;
      });

      async function save() {
        try {
          await validate();
          const group = unref(groupKey);
          const info = getFieldsValue();
          await componentSender.newComponent({ group, ...info });
          go({
            name: 'ComponentEditor',
            params: { group, func: info.func },
          });
          close();
        } catch (err) {
          console.log(`error${err}`);
        }
      }

      function close() {
        closeModal();
        resetFields();
        clearValidate();
      }

      return { register, registerForm, model: modelRef, save, close };
    },
  });
</script>
