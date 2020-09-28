<template>
  <div class="about">
    <h1>This is an about page</h1>

   <loading />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useAuth } from "../modules/auth";


export default defineComponent({
  setup() {
    const { user } = useAuth()

    return { user }
  },
})
</script>
