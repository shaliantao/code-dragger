<template>
  <a-form-item
    v-if="props.cycle === CycleType.Minute"
    label="分钟"
    name="minute"
    :label-col="labelCol"
  >
    <InputNumber v-model:value="form.minute" :min="1" :max="59" />
    <div class="cycle-info">
      <i class="a-icon-info"></i>
      <span>{{ cycleInfo }}</span>
    </div>
  </a-form-item>
  <a-row v-if="props.cycle === CycleType.Hour">
    <a-col :span="12">
      <a-form-item label="小时" name="hour" :label-col="labelCol">
        <InputNumber v-model:value="form.hour" :min="1" :max="23" />
        <div class="cycle-info">
          <i class="a-icon-info"></i>
          <span>{{ cycleInfo }}</span>
        </div>
      </a-form-item>
    </a-col>
    <a-col :span="12">
      <a-form-item label="分钟" name="minute">
        <InputNumber v-model:value="form.minute" :min="0" :max="59" />
      </a-form-item>
    </a-col>
  </a-row>
  <a-row v-if="props.cycle === CycleType.Week">
    <a-col :span="24">
      <a-form-item label="星期" name="week" :label-col="labelCol">
        <Checkbox.Group v-model:value="form.week">
          <Checkbox :key="value" v-for="[value, text] of weekMap" :value="value">{{
            text
          }}</Checkbox>
        </Checkbox.Group>
      </a-form-item>
    </a-col>
  </a-row>
  <a-form-item v-if="props.cycle === CycleType.Month" label="日期" name="day" :label-col="labelCol">
    <Select
      class="day-select"
      v-model:value="form.day"
      mode="multiple"
      placeholder="请选择"
      style="width: 70%"
    >
      <Select.Option v-for="item in 31" :key="item" :value="item">{{ item + '日' }}</Select.Option>
    </Select>
  </a-form-item>
  <a-row v-if="[CycleType.Day, CycleType.Week, CycleType.Month].includes(props.cycle)">
    <a-col :span="12">
      <a-form-item label="时" name="hour" :label-col="labelCol">
        <InputNumber v-model:value="form.hour" :min="0" :max="23" />
        <div class="cycle-info">
          <i class="a-icon-info"></i>
          <span>{{ cycleInfo }}</span>
        </div>
      </a-form-item>
    </a-col>
    <a-col :span="12">
      <a-form-item label="分" name="minute">
        <InputNumber v-model:value="form.minute" :min="0" :max="59" />
      </a-form-item>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
  import { InputNumber, Checkbox, Select } from 'ant-design-vue';
  import { getCycleInfo, getCronByTime, getTimeByCron } from '../util';
  import { weekMap } from '../util/mapping';
  import { CycleType } from '@src/platform/common/enum';
  import { computed, watchEffect, watch, reactive } from 'vue';

  const labelCol = { style: { width: '100px' } };
  const props = defineProps({
    cron: {
      type: String,
      required: true,
    },
    cycle: {
      type: String as PropType<CycleType>,
      required: true,
    },
  });
  const emits = defineEmits(['update:cron']);

  const initialForm = () => ({
    minute: 1,
    hour: 1,
    week: [2],
    day: [1],
  });

  const form = reactive({ ...initialForm(), ...getTimeByCron(props.cycle, props.cron) });

  watchEffect(
    () => {
      const cron = getCronByTime({ cycle: props.cycle, ...form });
      console.log('cron', cron);
      emits('update:cron', cron);
    },
    {
      flush: 'post',
    },
  );

  const cycleInfo = computed(() => {
    return getCycleInfo(props.cycle, form);
  });

  watch(
    () => props.cycle,
    () => {
      Object.assign(form, initialForm());
    },
  );
  watch([() => form.hour, () => form.minute], ([hour, minute], [prevHour, prevMinute]) => {
    if (hour === null) {
      form.hour = prevHour;
    } else if (minute === null) {
      form.minute = prevMinute;
    }
  });
  watch([() => form.week, () => form.day], ([week, day], [prevWeek, prevDay]) => {
    if (week.length === 0) {
      form.week = prevWeek;
    }
    if (day.length === 0) {
      form.day = prevDay;
    }
  });
</script>

<style lang="less" scoped>
  .day-select {
    width: 560px;
  }

  .cycle-info {
    width: 560px;
  }
</style>
