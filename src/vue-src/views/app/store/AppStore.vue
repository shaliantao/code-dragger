<template>
  <page-wrapper class="page-container">
    <div class="mb-2">
      <Card title="最新">
        <template #extra>
          <a-button type="link" size="small">更多</a-button>
        </template>

        <CardGrid v-for="item in items" :key="item.title" class="!md:w-1/4 !w-full">
          <span class="flex">
            <Icon :icon="item.icon" :color="item.color" size="30" />
            <span class="text-lg ml-4">{{ item.title }}</span>
          </span>
          <div class="flex mt-2 h-10 text-secondary">{{ item.desc }}</div>
          <div class="flex justify-between text-secondary">
            <a>获取</a>
            <span>{{ item.date }}</span>
          </div>
        </CardGrid>
      </Card>
    </div>
    <div class="mb-2">
      <Card title="财务">
        <template #extra>
          <a-button type="link" size="small">更多</a-button>
        </template>

        <CardGrid v-for="item in items" :key="item.title" class="!md:w-1/4 !w-full">
          <span class="flex">
            <Icon :icon="item.icon" :color="item.color" size="30" />
            <span class="text-lg ml-4">{{ item.title }}</span>
          </span>
          <div class="flex mt-2 h-10 text-secondary">{{ item.desc }}</div>
          <div class="flex justify-between text-secondary">
            <a>获取</a>
            <span>{{ item.date }}</span>
          </div>
        </CardGrid>
      </Card>
    </div>
    <div class="mb-2">
      <Card title="京东">
        <template #extra>
          <a-button type="link" size="small">更多</a-button>
        </template>

        <CardGrid v-for="item in items" :key="item.title" class="!md:w-1/4 !w-full">
          <span class="flex">
            <Icon :icon="item.icon" :color="item.color" size="30" />
            <span class="text-lg ml-4">{{ item.title }}</span>
          </span>
          <div class="flex mt-2 h-10 text-secondary">{{ item.desc }}</div>
          <div class="flex justify-between text-secondary">
            <a>获取</a>
            <span>{{ item.date }}</span>
          </div>
        </CardGrid>
      </Card>
    </div>
  </page-wrapper>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Card } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { groupItems } from './data';

  export default defineComponent({
    components: { Card, Icon, CardGrid: Card.Grid },
    setup() {
      return { items: groupItems };
    },
  });
</script>
