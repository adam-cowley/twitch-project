<template>
  <div class="app flex flex-col fixed h-screen w-screen bg-gray-800">
    <loading v-if="authenticating" />
    <template v-else>
      <top-nav class="bg-gray-800" />
      <div class="flex flex-row flex-grow overflow-hidden">
        <navigation class="bg-gray-900" />
        <div class="flex-grow h-full overflow-auto p-4">
          <router-view />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import { useAuth } from "./modules/auth";
// @ts-ignore
import TopNav from '@/components/layout/Header';
// @ts-ignore
import Navigation from '@/components/layout/Navigation';
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  components: { TopNav, Navigation },
  setup() {
    const { authenticating, user } = useAuth()
    const router = useRouter()
    const route = useRoute()

    watch([ user ], () => {
      if ( authenticating.value === false && route.meta.requiresAuth === true && user?.value) {
        console.log('redirecting home in app.vue');

        router.push({ name: 'home' })
      }
      else if ( authenticating.value !== false ) router.push({ name: 'login' })
    })

    return { authenticating, user }
  }
})
</script>>

<style>
body {
  @apply text-gray-200;
}
header h1 {
  @apply bg-red-900;
}
</style>