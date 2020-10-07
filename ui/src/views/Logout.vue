<template>
  <div
    class="loading"
  >

  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { useRouter } from "vue-router"
import { useAuth } from "../modules/auth"

interface LoginPayload {
    email: string;
    password: string;
    rememberMe: boolean;
}

export default defineComponent({
    setup() {
        const { logout } = useAuth()
        const router = useRouter()

        logout().then(() => router.push({ name: 'home' }))
    }
})
</script>

<style>
</style>