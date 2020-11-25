<template>
  <div class="subscribe">
    <h1 class="text-xl font-bold text-center">Subscribe to Neoflix...</h1>

    <loading v-if="loading" />

    <pre>{{data}}</pre>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi, useApiWithAuth } from "../modules/api";
import { useAuth } from "../modules/auth";

export default defineComponent({
  setup() {
    const { user, setUser } = useAuth()
    const router = useRouter()
    const route = useRoute()

    // Get Plans
    const { post, loading, data } = useApiWithAuth("/checkout/verify")

    post({ id: route.query.session_id })
      .then(res => {
        if ( res.payment_status === 'paid' ) {
          return router.push({ name: 'home' })
        }

        return router.push({ name: 'subscription.cancelled' })
      })
  },

  methods: {

  },
});
</script>
