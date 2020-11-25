<template>
  <div
    class="min-h-screen bg-gray-800 fixed inset-0 z-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-gray-100"
  >
    <div class="max-w-md w-full bg-gray-900 px-8 py-16 rounded-lg">
      <div>
        <img
          class="mx-auto h-12 w-auto"
          src="../assets/neoflix-logo.png"
          alt="Workflow"
        />
        <h2
          class="mt-12 text-center text-3xl leading-9 font-extrabold text-gray-300"
        >
          Start your 14-day free trial now!
        </h2>
      </div>
      <form class="mt-12" @submit.prevent="submit">
        <FormValidation
          v-if="errorMessage"
          :errorMessage="errorMessage"
          :errorDetails="errorDetails"
          />


        <div class="rounded-md shadow-sm">
          <div>
            <input
              aria-label="Email address"
              name="email"
              type="email"
              class="appearance-none rounded-none relative block w-full px-3 py-4 border placeholder-gray-500 rounded-t-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              :class="computedClasses('email')"
              placeholder="Email address"
              v-model="email"
            />
          </div>
          <div class="-mt-px">
            <input
              aria-label="Password"
              name="password"
              type="password"
              class="appearance-none rounded-none relative block w-full px-3 py-4 border placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              :class="computedClasses('password')"
              placeholder="Password"
              v-model="password"
            />
          </div>
          <div class="-mt-px">
            <input
              aria-label="Date of Birth"
              name="dateOfBirth"
              type="date"
              class="appearance-none rounded-none relative block w-full px-3 py-4 border placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              :class="computedClasses('dateOfBirth')"
              placeholder="Date of Birth"
              v-model="dateOfBirth"
            />
          </div>
          <div class="-mt-px flex w-full">
            <input
              aria-label="First Name"
              name="firstName"
              type="text"
              class="appearance-none rounded-none relative block flex-grow px-3 py-4 border placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              :class="computedClasses('firstName')"
              placeholder="First Name (Optional)"
              v-model="firstName"
            />
            <!-- </div>
          <div class="-mt-px"> -->
            <input
              aria-label="Last Name"
              name="lastName"
              type="text"
              class="appearance-none rounded-none relative block flex-grow px-3 py-4 border placeholder-gray-500 rounded-br-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
              :class="computedClasses('lastName')"
              placeholder="Last Name (Optional)"
              v-model="lastName"
            />
          </div>
        </div>

        <div class="mt-6">
          <button
            type="submit"
            class="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red disabled:bg-red-900 active:bg-red-700 transition duration-150 ease-in-out"
            :disabled="loading"
          >
            Register
          </button>
        </div>
        <div class="mt-6">
          <p class="mt-2 text-center text-sm leading-5 text-gray-500">
            Already have an account?
            <router-link
              to="/login"
              class="font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline transition ease-in-out duration-150"
            >
              Login in now.
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
} from "vue";
import { useRouter } from 'vue-router'

import { useApi } from "../modules/api";
import { useAuth } from "../modules/auth"

// @ts-ignore
import FormValidation from '../components/FormValidation'

interface RegisterPayload {
  email?: string;
  password?: string;
  dateOfBirth?: Date;
  firstName?: string;
  lastName?: string;
}

export default defineComponent({
  components: { FormValidation, },
  setup() {
    const payload = reactive<RegisterPayload>({
      email: undefined,
      password: undefined,
      dateOfBirth: undefined,
      firstName: undefined,
      lastName: undefined,
    });

    const {
      error,
      loading,
      post,
      data,
      errorMessage,
      errorDetails,
      errorFields,
      computedClasses,
    } = useApi("/auth/register");

    const { setUser } = useAuth()
    const router = useRouter()

    const submit = () => {
      post(payload).then(() => {
        setUser(data.value, true)

        router.push({ name: 'home' })
      });
    };

    return {
      ...toRefs(payload),
      submit,
      loading,
      errorMessage,
      errorFields,
      errorDetails,
      computedClasses,
    };
  },
});
</script>

<style>
</style>