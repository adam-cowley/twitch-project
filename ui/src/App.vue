<template>
  <div id="app">
    <div class="loading fixed inset-0 bg-blue-200" v-if="authenticating">
      Loading...
    </div>
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
import Navigation from '@/components/Header';
import { useRouter } from "vue-router";
// import Login from './components/Login';

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
body {
  @apply bg-gray-800 text-white;
}

/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
} */
</style>
