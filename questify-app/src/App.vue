<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useTheme } from '@/composables/useTheme';

const { loadThemeFromStorage } = useTheme();

onMounted(() => {
  loadThemeFromStorage();
});
</script>
