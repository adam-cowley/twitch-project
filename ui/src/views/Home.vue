<template>
  <div class="home">
    <loading v-if="loading" />

    <template v-else>
      <div v-if="subscription?.plan.id === 0" class="bg-red-800 p-4 text-xs font-bold rounded-md flex flex-row">
        <div class="flex-grow flex flex-col justify-center">
        Your free trial expires on {{ subscription.expiresAt.split('T')[0]}}
        </div>
        <router-link to="/subscribe" class="bg-red-600 rounded-md px-2 py-2">Upgrade Now</router-link>
      </div>

    <div><h1 class="p-2 mt-4 font-bold text-xl">Genres</h1></div>
    <div class="flex flex-wrap">
      <poster v-for="genre in data" :key="genre.id"
        route="genres.view"
        :id="genre.id"
        :title="genre.name"
        :poster="genre.poster"
        :stats="{ count: genre.totalMovies }"
      />
    </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Poster from "../components/Poster.vue";

import { useApi, useApiWithAuth } from "../modules/api";
import { useAuth } from "../modules/auth";

export default defineComponent({
  components: { Poster },
  setup() {
    const { user } = useAuth()
    const { loading, data, error, get } = useApiWithAuth("/genres");

    get();

    return { loading, data, subscription: user?.value?.subscription };
  },
});
</script>
