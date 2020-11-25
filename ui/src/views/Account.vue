<template>
  <div>
    <h1 class="text-xl font-bold mb-4 px-2">Hey, {{ user.firstName }}!</h1>
    <div class="mb-12">
      <div class="border-t border-gray-600 py-4">
        <div>
          <div
            class="font-bold p-2 text-sm border-b border-gray-700 text-gray-500"
          >
            Email
          </div>
          <div class="p-2">{{ user.email }}</div>
        </div>
        <div>
          <div
            class="font-bold p-2 text-sm border-b border-gray-700 text-gray-500"
          >
            Date Of Birth
          </div>
          <div class="p-2">{{ user.dateOfBirth }}</div>
        </div>
      </div>

      <div class="flex flex-row -mx-2">
        <div class="mx-2 w-1/2">
          <div
            class="font-bold p-2 text-sm border-b border-gray-700 text-gray-500"
          >
            First Name
          </div>
          <div class="p-2">{{ user.firstName }}</div>
        </div>
        <div class="mx-2 w-1/2">
          <div
            class="font-bold p-2 text-sm border-b border-gray-700 text-gray-500"
          >
            Last Name
          </div>
          <div class="p-2">{{ user.lastName }}</div>
        </div>
      </div>
    </div>
    <div class="mb-12">
      <div class="text-md font-bold px-2 pb-4">Subscription</div>

      <div
        class="border border-gray-700 bg-gray-700 bg-opacity-50 rounded-md px-2 py-4 text-sm"
      >
        <div class="flex flex-row" v-if="user.subscription">
          <div class="flex-grow">
            <div class="font-bold mb-2">{{ user.subscription.plan.name }}</div>
            <div class="text-gray-400 text-xs">
              Your subscription will automatically renew on
              {{ user.subscription.renewsAt.split("T")[0] }}
            </div>
          </div>

          <div class="flex-grow-0 mt-4 mr-2 text-xs p-2" v-if="loading">
            Loading...
          </div>
          <div class="flex-grow-0 mt-4">
            <button
              class="bg-red-700 text-bold px-4 py-2 rounded-md text-xs"
              @click.prevent="cancelSubscription"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
        <div class="flex flex-row" v-else>
            <div class="flex-grow">
            You don't have an active subscription...
            </div>
            <div class="flex-grow-0">
            <router-link
              class="bg-red-700 text-bold px-4 py-2 rounded-md text-xs"
              to="/subscribe"
            >
              Subscribe Now
            </router-link>
          </div>


        </div>
      </div>



      <div v-if="confirmation" class="bg-green-900 border border-green-800 mt-4 rounded-md px-2 py-4 text-sm">{{ confirmation }}</div>
    </div>
    <!-- <div class="flex flex-row -mx-2">
         <div class="flex-grow mx-2">
            <div class="font-bold p-2 text-sm border-b border-gray-700">Email</div>
            <div class="p-2">{{ user.email }}</div>
        </div>
        <div class="flex-grow mx-2">
            <div class="font-bold p-2 text-sm border-b border-gray-700">Date Of Birth</div>
            <div class="p-2">{{ user.dateOfBirth }}</div>
        </div>
     </div> -->

    <!-- <pre>{{ user }}</pre> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { useApiWithAuth } from "../modules/api";
import { useAuth } from "../modules/auth";

interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default defineComponent({
  setup() {
    const { user } = useAuth();

    // Cancel
    const confirmation = ref();

    const { loading, del, } = useApiWithAuth("/auth/user/subscription");
    const cancelSubscription = () => {
      del().then(
        () =>
          (confirmation.value = `Your subscription will expire on ${
            user!.value!.subscription!.expiresAt
          }`)
      );
    };

    return { user, confirmation, cancelSubscription };
  },
});
</script>

<style>
</style>