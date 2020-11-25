<template>
  <div class="subscribe">
    <h1 class="text-xl font-bold text-center">Subscribe to Neoflix...</h1>

    <loading v-if="loading" />

    <loading v-else-if="plan" />

    <div v-else class="flex flex-wrap">
      <div
        v-for="p in data"
        :key="p.id"
        class="plan relative overflow-hidden flex flex-col m-2 bg-cover bg-center justify-between rounded-md bg-gray-700 border border-gray-900 shadow-lg hover:bg-top transition-all duration-200 p-4 w-64"
      >
        <div class="text-white text-lg mb-2 font-bold">
          {{ p.name }}
        </div>

        <div class="text-sm">
          <div class="mb-2 text-gray-400 mb-4">
            Includes access to
            <strong class="text-red-600">{{ genreList(p.genres) }}</strong>
          </div>
          <div class="text-gray-200 mb-4">
            Only <strong>{{ p.price }}</strong> for
            <strong>{{ formatDuration(p.duration) }}</strong> days
          </div>
        </div>

        <div class="flex-grow"></div>

        <button class="p-2 bg-red-900 text-white font-bold rounded-md" @click.prevent="setPlan(p)">
          Subscribe Now
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useApi, useApiWithAuth } from "../modules/api";
import { useAuth } from "../modules/auth";

export default defineComponent({
  setup() {
    const { user } = useAuth();

    // Get Plans
    const { get, loading, data } = useApiWithAuth("/plans");
    get();


    // Form State
    const plan = ref()
    const setPlan = (input: any) => {
      plan.value = input



      // @ts-ignore
      const stripe = window.Stripe(process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY)

      const { post, loading, data } = useApiWithAuth("/checkout");

      post({ planId: input.id })
        .then(res => stripe.redirectToCheckout({ sessionId: res.id }))
    }

    // Checkout


    return {
      loading, data,

      plan, setPlan
     };
  },

  methods: {
    // setPlan(plan: number) {
    //   this.plan = plan
    // },
    genreList(genres: Record<string, any>[]) {
      const last = genres.pop();

      if (!genres.length) {
        return last!.name;
      }

      return genres.map((row) => row.name).join(", ") + " and " + last!.name;
    },
    formatDuration(duration: string) {
      return duration.match(/[0-9]+D/)![0].replace(/[^0-9]/, "");
    },
  },
});
</script>
