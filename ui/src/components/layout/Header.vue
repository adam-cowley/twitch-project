<template>
  <header class="h-16 relative z-50">
    <div class="m-auto flex flex-column justify-between items-center">
      <h1 class="flex flex-col w-56 h-16 justify-center text-center flex-grow-0 p-2 mr-4">
        <router-link to="/" class="pl-2">
          <img src="../../assets/neoflix-logo.png" alt="Neoflix" />
        </router-link>
      </h1>
      <div class="flex-grow"></div>

      <ul class="flex flex-column flex-grow-0 pr-2">
        <template v-if="user">
          <li class="relative flex justify-center">
            <router-link class="block p-4 text-sm text-white" to="/account">My Account</router-link>
          </li>
          <li class="relative flex justify-center">
            <router-link class="flex flex-row py-2" to="/logout">
              <div
                class="flex w-8 h-8 mr-1 rounded-full bg-red-700 text-white flex-col justify-center text-center text-xs leading-none | hover:bg-red-600"
              >
                {{ initials }}
              </div>
            </router-link>
          </li>
        </template>
        <template v-else>
          <li>
            <router-link class="block px-4 py-2 text-white" to="/login">Login</router-link>
          </li>
          <li>
            <router-link
              class="block px-4 py-2 text-white bg-red-700 hover:bg-red-500 font-bold rounded-md"
              to="/register"
              >Register</router-link
            >
          </li>
        </template>
      </ul>
    </div>
  </header>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuth } from "../../modules/auth";

export default defineComponent({
  setup() {
    const { user } = useAuth();

    const greeting = computed(() => {
      return user?.value && user.value.firstName
        ? `Hey, ${user.value.firstName}`
        : "Welcome back!";
    });

    const initials = computed(
      () =>
        user?.value &&
        [user.value.firstName?.substr(0, 1), user.value.lastName?.substr(0, 1)]
          .filter((e) => !!e)
          .join("")
    );

    return { user, greeting, initials };
  },
});
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
