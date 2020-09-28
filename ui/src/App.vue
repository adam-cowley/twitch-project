<template>
  <div id="app">
    <loading v-if="authenticating" />
    <div v-else>
      <navigation />
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import { useAuth } from "./modules/auth";
// @ts-ignore
import Navigation from '@/components/Navigation';
import { useRouter } from "vue-router";


export default defineComponent({
  components: { Navigation },
  setup() {
    const { authenticating, user } = useAuth()

    const router = useRouter()

    watch([ user ], () => {
      if (user?.value) router.push({ name: 'home' })
      else router.push({ name: 'login' })
    })

    return { authenticating, user }
  }
})
</script>>

<style>

</style>
