<template>
  <div class="about">
    <h1>This is an about page</h1>

    <p>email: {{ user.email }}</p>
    <p>dob: {{ user.dateOfBirth }}</p>
    <p>first: {{ user.firstName }}</p>
    <p>last: {{ user.lastName }}</p>
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
