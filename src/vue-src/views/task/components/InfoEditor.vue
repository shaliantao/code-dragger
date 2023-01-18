<template>
  <BasicModal v-bind="$attrs" @register="register" title="新建任务" @cancel="close" @ok="save">
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" :model="modelRef">
        <template #cycle="{ model, field }">
          <CycleSelector v-model:cron="model[field]" v-model:cycle="model.cycle" />
        </template>
      </BasicForm>
    </div>
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { ExecMode } from '@src/platform/common/enum';
  import { createTask, updateTask } from '/@/api/biz/task';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import CycleSelector from './CycleSelector.vue';
  import { getSchemas } from '../data';
  import { Dayjs } from 'dayjs';
  import { formatToDateTime } from '/@/utils/dateUtil';
  import taskSender from '/@/ipc/task';

  export default defineComponent({
    components: { BasicModal, BasicForm, CycleSelector },
    setup(_props, { emit }) {
      const idRef = ref<number>();
      const modelRef = ref({});
      const schemas = getSchemas();
      const [
        registerForm,
        { setFieldsValue, getFieldsValue, resetFields, clearValidate, validate },
      ] = useForm({
        labelWidth: 100,
        schemas,
        showActionButtonGroup: false,
        actionColOptions: {
          span: 24,
        },
      });

      const [register, { closeModal }] = useModalInner((data) => {
        const { appId, cron, cycle, execMode, id, startTime, validateStart, validateEnd } =
          data || {};
        if (execMode === ExecMode.Cycle) {
          setFieldsValue({
            appId,
            execMode,
            cron,
            cycle,
            validateStart: formatToDateTime(validateStart),
            validateEnd: formatToDateTime(validateEnd),
          });
        } else if (execMode === ExecMode.Timing) {
          setFieldsValue({
            appId,
            execMode,
            startTime: formatToDateTime(startTime),
          });
        }

        idRef.value = id;
      });

      async function save() {
        try {
          await validate();
          const info = getFieldsValue();
          const data = {
            appId: info.appId,
            execMode: info.execMode,
          };
          if (info.execMode === ExecMode.Cycle) {
            const [validateStart, validateEnd]: [Dayjs, Dayjs] = info.validateRange;
            Object.assign(data, {
              cycle: info.cycle,
              cron: info.cron,
              validateStart: formatToDateTime(validateStart),
              validateEnd: formatToDateTime(validateEnd),
              startTime: null,
            });
          } else if (info.execMode === ExecMode.Timing) {
            Object.assign(data, {
              cycle: null,
              cron: null,
              validateStart: null,
              validateEnd: null,
              startTime: formatToDateTime(info.startTime),
            });
          }
          if (idRef.value) {
            await updateTask(idRef.value, data);
          } else {
            await createTask(data);
          }
          taskSender.syncTask();
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

      return { register, registerForm, modelRef, save, close };
    },
  });
</script>
