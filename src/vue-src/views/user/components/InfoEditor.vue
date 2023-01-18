<template>
  <BasicModal v-bind="$attrs" @register="register" title="创建用户" @cancel="close" @ok="save">
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" :model="model" />
    </div>
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { createUser } from '/@/api/biz/user';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { schemas } from '../data';

  export default defineComponent({
    components: { BasicModal, BasicForm },
    setup(_props, { emit }) {
      const modelRef = ref({});
      const [registerForm, { getFieldsValue, resetFields, clearValidate, validate }] = useForm({
        labelWidth: 100,
        schemas,
        showActionButtonGroup: false,
        actionColOptions: {
          span: 24,
        },
      });

      const [register, { closeModal }] = useModalInner();

      async function save() {
        try {
          await validate();
          const info = getFieldsValue();
          await createUser(info);
          emit('on-success');
          close();
        } catch (err) {
          console.log(`error: ${err}`);
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
