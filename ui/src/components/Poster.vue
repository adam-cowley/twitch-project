<template>
  <div
    class="
    poster
    relative
    overflow-hidden
        flex flex-col m-2 bg-cover bg-center justify-end rounded-md bg-gray-700 border border-gray-900 shadow-lg
        hover:bg-top transition-all duration-200
        w-56 h-64
    "
    :style="style"
  >
    <router-link :to="to">
      <div class="flex bg-red-900 text-white bg-opacity-75 p-4 justify-between relative z-50">
        <h1 class="font-bold" v-html="title" />
        <div class="flex flex-col justify-end">
          <div
              v-for="(value, key) in stats"

              :key="key"
              class="bg-red-600 text-white rounded-full px-2 py-1 text-xs h-6"
          >
              <strong class="hidden" v-html="key" />
              <span v-if="value" v-html="value" />
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    route: String,
    id: [String, Number],
    title: String,
    poster: [String, null],
    stats: Object,
  },
  computed: {
    style() {
      return {
        "background-image": `url(${this.poster})`,
      };
    },
    to() {
      return {
        name: this.route,
        params: {
          id: this.id,
        },
      };
    },
  },
});
</script>

