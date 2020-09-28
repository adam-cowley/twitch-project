<template>
  <div id="genre-view">
    <loading v-if="loading" />
    <div class="container m-auto" v-else>
      <div>
        <h1 class="p-2 mt-4 font-bold text-xl">{{ data.name }}</h1>
      </div>

      <div><h1 class="p-2 mt-4 font-bold text-xl">Popular</h1></div>
      <div class="flex flex-wrap">
        <poster
          v-for="movie in data.popular"
          :key="movie.id"
          route="movies.view"
          :id="movie.id"
          :title="movie.title"
          :poster="movie.poster"
          :stats="{ popularity: movie.popularity }"
        />
      </div>

      <div><h1 class="p-2 mt-4 font-bold text-xl">Latest Releases</h1></div>
      <div class="flex flex-wrap">
        <poster
          v-for="movie in data.latest"
          :key="movie.id"
          route="movies.view"
          :id="movie.id"
          :title="movie.title"
          :poster="movie.poster"
          :stats="{ popularity: movie.popularity }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRoute } from "vue-router";
import { useApiWithAuth } from "../../modules/api";
// @ts-ignore
import Poster from "@/components/Poster.vue";

export default defineComponent({
  components: {
    Poster,
  },
  setup() {
    const route = useRoute();
    const id = route.params.id;

    const { loading, data, get } = useApiWithAuth(`/genres/${id}`);
    get();

    return { id, loading, data };
  },
});
</script>
