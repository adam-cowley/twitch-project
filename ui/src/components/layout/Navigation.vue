<template>
    <nav class="nav flex flex-col flex-grow-0 flex-shrink-0 w-56 pt-8 py-2 relative">
      <ul class="mb-8">
        <li>
          <router-link to="/">Home</router-link>
        </li>
        <li>
          <router-link to="/movies">Movies</router-link>
        </li>
        <li>
          <router-link to="/genres">Genres</router-link>
        </li>
        <li>
          <router-link to="/movies">Actors</router-link>
        </li>
        <li>
          <router-link to="/movies">Directors</router-link>
        </li>
        <li>
          <router-link to="/movies">My List</router-link>
        </li>
      </ul>
    </nav>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuth } from "../../modules/auth";

export default defineComponent({
  setup() {
    const { user } = useAuth()

    const greeting = computed(() => {
      return user?.value && user.value.firstName ? `Hey, ${user.value.firstName}` : 'Welcome back!'
    })

    const initials = computed(() => user?.value && [ user.value.firstName.substr(0, 1), user.value.lastName.substr(0, 1) ].filter(e => !!e).join('') )

    return { user, greeting, initials }
  }
})

</script>


<style>
.nav {
  @apply text-gray-200 text-sm;
}
  .nav li {

  }
  .nav li a {
    @apply flex border-l-4 border-transparent py-2 pl-4 text-red-100;


  }
  .nav li a:hover {
    @apply border-gray-600 bg-gray-800 text-white;
  }
  .nav li a.router-link-active {
    @apply border-red-600 bg-red-900 text-white;
  }


</style>