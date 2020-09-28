<template>
    <header class="bg-black p-2 h-16 relative z-50">
        <div class="container m-auto flex flex-column justify-between items-center">
        <h1 class="flex-grow-0 mr-4">
          <router-link to="/">
            <img src="../assets/neoflix-logo.png" alt="Neoflix" />
          </router-link>
        </h1>

        <ul class="flex flex-column flex-grow-0">
            <li><router-link class="block px-4 py-2" to="/">Home</router-link></li>
            <li><router-link class="block px-4 py-2" to="/about">Series</router-link></li>
            <li><router-link class="block px-4 py-2" to="/">Films</router-link></li>
            <li><router-link class="block px-4 py-2" to="/about">Latest</router-link></li>
        </ul>

        <div class="flex-grow"></div>

        <ul class="flex flex-column flex-grow-0">
            <template v-if="user">
              <li><router-link class="block px-4 py-2" to="/logout">{{ greeting }}!</router-link></li>
              <li><router-link class="block px-4 py-2" to="/logout">Logout</router-link></li>
            </template>
            <template v-else>
              <li><router-link class="block px-4 py-2" to="/login">Login</router-link></li>
              <li><router-link class="block px-4 py-2 bg-red-600 hover:bg-red-500 font-bold rounded-md" to="/register">Register</router-link></li>
            </template>
        </ul>
        </div>
    </header>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuth } from "../modules/auth";

export default defineComponent({
  setup() {
    const { user } = useAuth()

    const greeting = computed(() => {
      return user?.value && user.value.firstName ? `Hey, ${user.value.firstName}` : 'Welcome back!'
    })

    return { user, greeting }
  }
})

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 img {
   width: 100px;
}
/*
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
} */
</style>
