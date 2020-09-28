<template>
  <div id="genre-view">
    <loading v-if="loading" />
    <div class="container m-auto">
      <div>
        <h1 class="p-2 mt-4 font-bold text-xl">{{ id}}</h1>
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
    const route = useRoute()
    const id = route.params.id

    // const { loading, data, get } = useApiWithAuth(`/movies/${id}`);
    // get();

    return { id, loading: true }
  },
});
</script>
