<template>
  <ConfigProvider :locale="getAntdLocale" :componentSize="componentSize">
    <AppProvider>
      <RouterView />
    </AppProvider>
  </ConfigProvider>
</template>

<script lang="ts" setup>
  import { ConfigProvider } from 'ant-design-vue';
  import { AppProvider } from '/@/components/Application';
  import { useTitle } from '/@/hooks/web/useTitle';
  import { useGo } from '/@/hooks/web/usePage';
  import { useLocale } from '/@/locales/useLocale';
  import { componentSize } from '/@/settings/componentSetting';
  import httpSender from '/@/ipc/http';

  const go = useGo();
  httpSender.onLogout(() => {
    go('/login');
  });

  // support Multi-language
  const { getAntdLocale } = useLocale();
  // Listening to page changes and dynamically changing site titles
  useTitle();
</script>
