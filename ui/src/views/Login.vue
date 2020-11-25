<template>
  <div
    class="min-h-screen bg-gray-800 fixed z-50 inset-0 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full bg-gray-900 px-8 py-16 rounded-lg">
      <div>
        <img
          class="mx-auto h-18 w-auto"
          src="../assets/neoflix-logo.png"
          alt="Workflow"
        />
        <h2
          class="mt-12 text-center text-3xl leading-9 font-extrabold text-gray-300"
        >
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm leading-5 text-gray-500">
          Or
          <router-link
            to="/register"
            href="#"
            class="font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline transition ease-in-out duration-150"
          >
            start your 14-day free trial
          </router-link>
        </p>
      </div>
      <form class="mt-12" @submit.prevent="submit">
        <div
          class="mb-12 text-red-100 py-2 pl-4 border-l-4 border-red-600 rounded-sm bg-red-900"
          v-if="errorMessage"
          v-html="errorMessage"
        />

        <div class="rounded-md shadow-sm">
          <div>
            <input
              aria-label="Email address"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              placeholder="Email address"
              v-model="email"
            />
          </div>
          <div class="-mt-px">
            <input
              aria-label="Password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              placeholder="Password"
              v-model="password"
            />
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              class="form-checkbox h-4 w-4 text-red-600 transition duration-150 ease-in-out"
              v-model="rememberMe"
            />
            <label
              for="remember_me"
              class="ml-2 block text-sm leading-5 text-gray-500"
            >
              Remember me
            </label>
          </div>

          <!-- <div class="text-sm leading-5">
            <router-link
              to="/register"
              class="font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline transition ease-in-out duration-150"
            >
              Don't have an account?
            </router-link>
          </div> -->
        </div>
        <div class="mt-6">
          <button
            type="submit"
            class="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red disabled:bg-red-900 active:bg-red-700 transition duration-150 ease-in-out"
            :disabled="loading"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                class="h-5 w-5 text-red-200 group-hover:text-red-200 transition ease-in-out duration-150"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            Sign in
          </button>
        </div>
        <div class="mt-6">
          <p class="mt-2 text-center text-sm leading-5 text-gray-500">
            Don't have an account?
            <router-link
              to="/register"
              class="font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline transition ease-in-out duration-150"
            >
              Register now.
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onErrorCaptured,
  reactive,
  ref,
  toRefs,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import { useApi } from "../modules/api";
import { useAuth } from "../modules/auth";

interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default defineComponent({
  setup() {
    const { loading, data, post, errorMessage } = useApi(
      "auth/login"
    );

    const { setUser } = useAuth();
    const router = useRouter();

    const payload = reactive<LoginPayload>({
      email: "adam@neo4j.com",
      password: "password",
      rememberMe: true,
    });

    const submit = () => {
      post(payload).then(() => {
        setUser(data.value, payload.rememberMe);

        router.push({ name: "home" });
      });
    };

    return {
      loading,
      submit,
      errorMessage,
      ...toRefs(payload),
    };
  },
});
</script>

