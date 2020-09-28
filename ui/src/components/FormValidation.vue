<template>
  <div
    class="mb-12 text-red-100 py-2 pl-4 border-l-4 border-red-600 rounded-sm bg-red-900"
    v-if="errorMessage"
  >
    <div class="mb-4 font-bold">{{ errorMessage }}</div>
    <ul v-if="errorDetails">
      <li
        class="text-sm"
        v-for="error in errorDetails"
        :key="error"
        v-html="error"
      />
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";


export default defineComponent({
    name: 'FormValidation',
    props: {
        errorMessage: String,
        errorDetails: Array,
        errorFields: Object,
    },
})

</script>