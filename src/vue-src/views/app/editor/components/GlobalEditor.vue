<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    :title="idRef ? '编辑变量' : '新建变量'"
    @cancel="close"
    @ok="save"
  >
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" :model="model" />
    </div>
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import appSender from '/@/ipc/app';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { IGlobalVar } from '@src/platform/app/app';
  import { ValueType } from '@src/platform/common/enum';

  export default defineComponent({
    name: 'GlobalEditor',
    components: { BasicModal, BasicForm },
    setup(_props, { emit }) {
      const idRef = ref<string>('');
      const isEdit = ref<boolean>(false);

      const modelRef = ref({});
      const [
        registerForm,
        { getFieldsValue, setFieldsValue, resetFields, clearValidate, validate },
      ] = useForm({
        labelWidth: 100,
        schemas: [
          {
            field: 'name',
            component: 'Input',
            label: '变量名称',
            rules: [
              {
                required: true,
                pattern: /^[a-zA-Z_1-9]{2,14}$/,
                message: '限字母数字、_，长度2-10字符',
              },
            ],
            componentProps: {
              readonly: isEdit,
            },
            colProps: {
              span: 20,
            },
            defaultValue: '',
          },
          {
            field: 'type',
            component: 'TypeSelector',
            label: '类型',
            colProps: {
              span: 20,
            },
            componentProps: {
              listHeight: 140,
              allowClear: false,
              isDefaultType: true,
            },
            defaultValue: ValueType.Unknown,
          },
          {
            field: 'value',
            component: 'InputTextArea',
            label: '默认值',
            colProps: {
              span: 20,
            },
            componentProps: {
              rows: 6,
            },
          },
        ],
        showActionButtonGroup: false,
        actionColOptions: {
          span: 24,
        },
      });

      const [register, { closeModal }] = useModalInner((data) => {
        idRef.value = data.uuid;
        data.item && setFieldsValue(data.item);
        isEdit.value = !!data.item;
      });

      async function save() {
        try {
          await validate();
          const info = getFieldsValue();
          if (isEdit.value) {
            await appSender.editGlobalVar(idRef.value, info as IGlobalVar);
          } else {
            await appSender.addGlobalVar(idRef.value, info as IGlobalVar);
          }
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

      return { register, registerForm, model: modelRef, save, close, idRef };
    },
  });
</script>
