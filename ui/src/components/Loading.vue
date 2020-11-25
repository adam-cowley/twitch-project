<template>
  <div class="loading fixed inset-0 bg-gray-900 bg-opacity-50 z-20 flex flex-col justify-center">
    <div class="spinner m-auto ease-linear rounded-full border-8 border-t-8 border-gray-800 h-24 w-24">
       <span class="sr-only" v-html="message" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'loading',
  props: {
    message: {
      type: String,
      default: 'Loading...'
    }
  },
})
</script>

<style>
.loading .spinner {
  border-top-color: theme('colors.red.700');
}

.loading .spinner {
  -webkit-animation: spinner 1s linear infinite;
  animation: spinner 1s linear infinite;
}

@-webkit-keyframes spinner {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}

@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
