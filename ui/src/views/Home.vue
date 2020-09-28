<template>
  <div class="home container m-auto">
    <loading v-if="loading" />

    <div v-else>

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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Poster from "../components/Poster.vue";

import { useApi, useApiWithAuth } from "../modules/api";

export default defineComponent({
  components: { Poster },
  setup() {
    const { loading, data, error, get } = useApiWithAuth("/genres");

    get();

    return { loading, data };
  },
});
</script>
