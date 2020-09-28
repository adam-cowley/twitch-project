# How to Build an Authentication into a Vue3 Application

I've recently started a livestream on the [Neo4j Twitch Channel](https://neo4j.com/twitch) about building [Web Applications with Neo4j and TypeScript](https://www.youtube.com/playlist?list=PL9Hl4pk2FsvX-Y5-phtnqY4hJaWeocOkq), working on an example project for Neoflix - a fictional streaming service.

I've been a long time user of Vue.js, but without proper TypeScript support, I was finding it hard to justify building a Vue-based front end as part of the Stream, after all Vue2's TypeScript support seemed to be lacking.  My only real option was Angular, and [I got frustrated by that pretty quickly](https://twitter.com/adamcowley/status/1288497006802022401).

With [Vue v3's official release last week](https://github.com/vuejs/vue-next/releases/tag/v3.0.0?ref=madewithvuejs.com), along with improved TypeScript support, it gave me a good excuse to experiment and see how I could encorporate this into the Neoflix project.

## Vue 3 and the Composition API

One drawback to Vue 2 was the increased complexity as an application grew, the re-use of functionality and readability of components becomes a problem.  One example I've seen mentioned a few times is the problem of Sorting results or Pagination.  In a Vue2 application, your options were either to duplicate the functionality across components or use a Mixin.  The drawback of a Mixin is that it's still not clear what data and methods are bound to a component.

The new [Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) allows us to extract repeatable elements into their own files which can be used across components in a more logical way.


The new `setup` function on each component gives you a convenient way to import and reuse functionality.  Anything returned from the setup function will be bound to the component.  For the search & pagination example, you could write a composition function to perform the specific logic for retrieving search results, while another composition function would provide  more generic functionality required to implement previous and next buttons in the UI:

``` ts
export default defineComponent({
  setup() {
    const { loading, data, getResults } = useSearch()
    const { nextPage, previousPage } = usePagination()

    // Anything returned here will be available in the component - eg this.loading
    return { loading, data, getResults, nextPage, previousPage }
  }
})
```

Compared to Vue 2's Mixins, the setup function allows you to quickly see which properties and methods are bound to the component without opening multiple files.

The official documentation has [a great write up on [the Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html#why-composition-api) and there is a great [Vue Mastery video on the Composition API](https://www.vuemastery.com/courses/vue-3-essentials/why-the-composition-api/) which explain the problem and solution well.

I will assume that you've watched the video and read the docs and will jump straight into a concrete example - **Authentication**.

## The Authentication Problem

Authentication is a problem that many apps will have to overcome.  A User may be required to provide their login credentials in order to view certain pages on a site or subscribe to access certain features.

In the case of Neoflix, Users are required to register and purchase a subscription before they can view or stream the catalogue of Films and TV Shows.  A HTTP `POST` request to `/auth/register` will create a new account, and a `POST` request to `/auth/login` will issue the user with a [JWT token](https://jwt.io) which will be passed to each request.


## Managing State Composition Functions

As the Users details will be required across multiple components, we will need to save this to the application's global state.  On researching the differences between versions 2 and 3, I came across an article that explains that [Vuex may not be required for global state management in Vue 3](https://dev.to/blacksonic/you-might-not-need-vuex-with-vue-3-52e4) which will cut down the number of dependencies.

This pattern feels a lot like [React Hooks](https://reactjs.org/docs/hooks-intro.html) where you call a function to create a _reference_ and a setter function, then use reference within the render function.

The article provides this code example to explain how it works:

``` ts
import { reactive, provide, inject } from 'vue';

export const stateSymbol = Symbol('state');
export const createState = () => reactive({ counter: 0 });

export const useState = () => inject(stateSymbol);
export const provideState = () => provide(
  stateSymbol,
  createState()
);
```

You can use the `inject` function to register a state object using a symbol, then use the `provide` function to recall the state later on.

Or more simply, you can just create a reactive variable and then return it within a function along with any methods required to manipulate the state:

```ts
import { ref } from 'vuex'

const useState = () => {
  const counter = ref(1)

  const increment = () => counter.value++
}

const { counter, increment } = useState()
increment() // counter will be 2
```


The whole `use[Something]` pattern feels a little _React Hook_-like, which at the start made me feel a little like "If I wanted to use Hooks then I could just use React" - but that thought has faded over time and now it makes sense.


## API Interactions

In order to interact with API, we will use the [axois](https://www.npmjs.com/package/axios) package.

```
npm i --save axios
```

 We can create an API instance with some basic config which will be used across the application.

``` ts
// src/modules/api.ts
export const api = axios.create({
  baseURL: process.env.VUE_APP_API || 'http://localhost:3000/'
})
```

Better yet, to avoid duplicating the code required to call the API, we could create a composition function that we could use for all API interactions across the application.  To do this we can create a provider function that exposes some useful variables that will be useful to handle loading state inside any component:

* `loading: boolean` - An indicator to let us know if the hook is currently loading data
* `data: any` - Once the data has been loaded, update the property
* `error?: Error` - If anything goes wrong, it would be useful to show display the error message within the API

In order for a component update on the change of a variable, we need to create a **ref**erence to a  **reactive** variable.  We can do this by importing the `ref` function.  The function takes a single optional argument which is the initial state.

For example, when we use this hook, the `loading` state should be true by default and set to false once the API call succeeds.  The data and error variables will be undefined until the request completes.

We can then return those variables in an object in order to deconstruct them within the component's `setup` function.

``` ts
// src/modules/api.ts
import { ref } from 'vue'

export const useApi(endpoint: string) => {
  const loading = ref(true)
  const data = ref()
  const error = ref()

  // ...
  return {
    loading, data, error
  }
}
```

To update these variables, you set `.value` on the reactive object - for example `loading.value = false`.

We can then create some computed variables to use within the component using the `computed` function exported from the Vue.  For example, if the API returns an error we can use a computed `errorMessage` property to extract the message or details from the API response.

``` ts
// src/modules/api.ts
import { ref, computed } from 'vue'

const errorMessage = computed(() => {
  if (error.value) {
    return error.value.message
  }
})

const errorDetails = computed(() => {
  if ( error.value && error.value.response ) {
    return error.value.response.data.message
  }
})
```

On validation error, Neoflix's Nest.js API returns a `400 Bad Request` which includes the individual errors in an array.  These can be extracted and converted into an object using `Array.reduce`:

``` ts
const errorFields = computed(() => {
  if (error.value && Array.isArray(error.value.response.data.message)) {

    return (error.value.response.data.message as string[]).reduce((acc: Record<string, any>, msg: string) => {
      let [ field ] = msg.split(' ')

      if (!acc[field]) {
        acc[field] = []
      }

      acc[field].push(msg)

      return acc
    }, {}) // eg. { email: [ 'email is required' ] }
  }
})
```

Finally, we can create a method to wrap a `GET` or `POST` request and update the reactive variables on success or error:

``` ts
const post = (payload?: Record<string, any>) => {
  loading.value = true
  error.value = undefined

  return api.post(endpoint, payload)
    // Update data
    .then(res => data.value = res.data)
    .catch(e => {
      // If anything goes wrong, update the error variable
      error.value = e

      throw e
    })
    // Finally set loading to false
    .finally(() => loading.value = false)
}
```

Putting it all together, the function will look like this:

``` ts
// src/modules/api.ts
export const useApi(endpoint: string) => {
  const data = ref()
  const loading = ref(false)
  const error = ref()

  const errorMessage = computed(() => { /* ... */ })
  const errorDetails = computed(() => { /* ... */ })
  const errorFields = computed(() => { /* ... */ })

  const get = (query?: Record<string, any>) => { /* ... */ }
  const post = (payload?: Record<string, any>) => { /* ... */ }

  return {
    data, loading, error,
    errorMessage, errorDetails, errorFields,
    get, post,
  }
}
```

Now we have a _hook_ that can be used across the application when we need to send a request to the API.

## Registering a User


The `POST /auth/register` endpoint requires an email, password, date of birth and optionally accepts a first name and last name.  As we're building a TypeScript application we can define this as an interface which will ensure the code is consistent:

``` ts
// src/views/Register.vue
interface RegisterPayload {
  email: string;
  password: string;
  dateOfBirth: Date;
  firstName?: string;
  lastName?: string;
}
```

In Vue 3, you cann the `defineComponent` rather than returning a plain Object.  In this case, we have one function, `setup` which uses the composition function to create an API.

As part of the setup function, we can call `useApi` to interact with the API.  In this case we want to send a `POST` request to `/auth/register` so we can use the `useApi` function above to extract the variables required in the component.

``` ts
// src/views/Register.vue
import { useApi } from '@/modules/api'

export default defineComponent({
  setup() {
    // Our setup function
    const {
      error,
      loading,
      post,
      data,
      errorMessage,
      errorDetails,
      errorFields,
    } = useApi('/auth/register');

    // ...

    return {
      error,
      loading,
      post,
      data,
      errorMessage,
      errorDetails,
      errorFields,
    }
  },
});
```

The `post` method from our `useApi` hook requires a payload, so we can initialise these in the setup function.  Previously, we used the `ref` function to create individual reactive properties but this can get a little unweildy when deconstructing.

Instead, we can use the `reactive` function exported from `vue` - this will save us the trouble of calling `.value` on each property when passing it to the `post` function.  When passing these to the component, we can turn them back into reactive properties using the `toRefs` function.

``` ts
// src/views/Register.vue
import { reactive, toRefs } from 'vue'

const payload = reactive<RegisterPayload>({
  email: undefined,
  password: undefined,
  dateOfBirth: undefined,
  firstName: undefined,
  lastName: undefined,
});

// ...

return {
  ...toRefs(payload), // email, password, dateOfBirth, firstName, lastName
  error,
  loading,
  post,
  data,
  errorMessage,
  errorDetails,
  errorFields,
}
```

We can then create a `submit` method which can be used within component to trigger the request to the API.  This will call the post method exported from `useApi` , which under the hood fires the request and updates `error` , `loading` and `post` .

``` ts
const submit = () => {
  post(payload).then(() => {
    // Update user information in global state

    // Redirect to the home page
  });
};
```

I will omit the entire `<template>` portion of this query but the variables are used in the same way as a Vue 2 application.  For example, the email and password are assigned to inputs using `v-model` and the submit function can be assigned to the `@submit` event on the `<form>` tag.

``` html
<form @submit.prevent="send">
    <input v-model="email" />
    <input v-model="password" />
    <!-- etc... -->
</form>
```

![register form](https://raw.githubusercontent.com/adam-cowley/twitch-project/master/images/register.png)

[View the component code here...](https://github.com/adam-cowley/twitch-project/blob/master/ui/src/views/Register.vue)

## Saving the User into Global state

In order to use the user's authentication details across the application, we can create another hook which references a global state object.  Again, this is typescript so we should create interfaces to represent the state:

``` ts
// src/modules/auth.ts
interface User {
    id: string;
    email: string;
    dateOfBirth: Date;
    firstName: string;
    lastName: string;
    access_token: string;
}

interface UserState {
    authenticating: boolean;
    user?: User;
    error?: Error;
}
```

The next step is to create an initial state for the module:

``` ts
// src/modules/auth.ts
const state = reactive<AuthState>({
    authenticating: false,
    user: undefined,
    error: undefined,
})
```

We can then create a `useAuth` function which will provide the current state and methods for setting the current user once successfully authenticated or unsetting the user on logout.

``` ts
// src/modules/auth.ts
export const useAuth = () => {
  const setUser = (payload: User, remember: boolean) => {
    if ( remember ) {
      // Save
      window.localStorage.setItem(AUTH_KEY, payload[ AUTH_TOKEN ])
    }

    state.user = payload
    state.error = undefined
  }

  const logout = (): Promise<void> => {
    window.localStorage.removeItem(AUTH_KEY)
    return Promise.resolve(state.user = undefined)
  }

  return {
    setUser,
    logout,
    ...toRefs(state), // authenticating, user, error
  }
}
```

We can then piece the

```ts
// src/views/Register.vue
import { useRouter } from 'vue-router'
import { useApi } from "../modules/api";
import { useAuth } from "../modules/auth";

// ...
export default defineComponent({
  components: { FormValidation, },
  setup() {
    // Reactive variables for the Register form
    const payload = reactive<RegisterPayload>({
      email: undefined,
      password: undefined,
      dateOfBirth: undefined,
      firstName: undefined,
      lastName: undefined,
    });

    // State concerning the API call
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

    // Function for setting the User
    const { setUser } = useAuth()

    // Instance of Vue-Router
    const router = useRouter()

    const submit = () => {
      // Send POST request to `/auth/register` with the payload
      post(payload).then(() => {
        // Set the User in the Auth module
        setUser(data.value, true)

        // Redirect to the home page
        router.push({ name: 'home' })
      })
    }


    return {
      ...toRefs(payload),
      submit,
      loading,
      errorMessage,
      errorFields,
      errorDetails,
      computedClasses,
    }
  }
})
```

### Remembering the User

The auth module above uses `window.localStorage` to save the user's access token (`AUTH_TOKEN`) - if the user returns to the site, we can use that value when the user next visits the site to re-authenticate them.

In order to watch for a change of a reactive variable, we can use the `watch` function.  This accepts two arguments; an array of reactive variables and a callback function.  We can use this to call  the `/auth/user` endpoint to verify the token.  If the API returns a valid response, we should set the user in the global state, otherwise remove the token from local storage.

```ts
// src/modules/auth.ts
const AUTH_KEY = 'neoflix_token'

const token = window.localStorage.getItem(AUTH_KEY)

if ( token ) {
  state.authenticating = true

  const { loading, error, data, get } = useApi('/auth/user')

  get({}, token)

  watch([ loading ], () => {
    if ( error.value ) {
      window.localStorage.removeItem(AUTH_KEY)
    }
    else if ( data.value ) {
      state.user = data.value
    }

    state.authenticating = false
  })
}
```

## Login

![login form](https://raw.githubusercontent.com/adam-cowley/twitch-project/master/images/login.png)

The setup function for the login component is almost identical, except we are calling a different API endpoint:

```ts
const {
  loading,
  data,
  error,
  post,
  errorMessage,
  errorFields
} = useApi("auth/login")

// Authentication details
const { setUser } = useAuth();

// Router instance
const router = useRouter();

// Component data
const payload = reactive<LoginPayload>({
  email: undefined,
  password: undefined,
  rememberMe: false,
});

// On submit, send POST request to /auth/login
const submit = () => {
  post(payload).then(() => {
    // If successful, update the Auth state
    setUser(data.value, payload.rememberMe);

    // Redirect to the home page
    router.push({ name: "home" });
  });
};

return {
  loading,
  submit,
  errorMessage,
  ...toRefs(payload),
};
```

## Using the Data in a Component

To use the User's information inside a component we can import the same `useAuth` function and access the `user` value.

For example, we may want to add a personalised welcome message to the top navigation.

![navigation with user details filled](https://raw.githubusercontent.com/adam-cowley/twitch-project/master/images/navigation.png)

The user's first name is not required during the Neoflix registration, so we can use the `computed` function to return a conditional property.  If the user has a firstName we will display a `Hey, {firstName}` message, otherwise fall back to a generic `Welcome back!` message.

```ts
// src/components/Navigation.vue
import { computed, defineComponent } from "vue";
import { useAuth } from "../modules/auth";

export default defineComponent({
  setup() {
    const { user } = useAuth()

    const greeting = computed(() => {
      return user?.value && user.value.firstName
        ? `Hey, ${user.value.firstName}!`
        : 'Welcome back!'
    })

    return { user, greeting }
  }
})
```

## Logging Out

We've already added a `logout` method to the return of `useAuth`.  This can be called from the `setup` method of a new component to clear the user's information and redirect them back to the login page.

```ts
// src/views/Logout.vue
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

    logout().then(() => router.push({ name: 'login' }))
  }
})
```


## Protecting Routes

In this application, the user should be restricted to the login or register routes unless they are logged in.  As we are using [vue-router](https://router.vuejs.org/) in this application we can use [Route Meta Fields](https://router.vuejs.org/guide/advanced/meta.html) to define which routes should be protected:

```ts
// src/router/index.ts
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { requiresAuth: true },
  },
  // ...
}
```

If `requiresAuth` is set to true, we should check the user provided by `useAuth`.  If the user has not been set, we should return redirect the user to the login page.

We can work out whether the user is logged in by accessing the `user` object returned by `useAuth`.  If the current route's meta data indicates that the route is restricted, we should redirect them to the login page.

Conversely, if a user is on the login or register page but has already logged in we should redirect them back to the home page.

```ts
// src/router/index.ts
router.beforeEach((to, from, next) => {
  const { user } = useAuth()

  // Not logged into a guarded route?
  if ( to.meta.requiresAuth && !user?.value ) next({ name: 'login' })

  // Logged in for an auth route
  else if ( (to.name == 'login' || to.name == 'register') && user!.value ) next({ name: 'home' })

  // Carry On...
  else next()
})
```


## Conclusion

The more I get used to the new Composition API, the more I like it.  It is still early days and the aren't a lot of examples around for Vue 3, so it may emerge at some point that the content in this post is not the best way to do things.  If you are doing things differently, let me know in the comments.

I will be building out the application as part of my livestream on the [Neo4j Twitch Channel](https://neo4j.com/twitch).  Join me every Tuesday at 13:00 BST, 14:00 CEST or catch up with the videos on the [on the Neo4j YouTube Channel](https://www.youtube.com/playlist?list=PL9Hl4pk2FsvX-Y5-phtnqY4hJaWeocOkq).

[All of the code built during the stream is available on Github](https://github.com/adam-cowley/twitch-project).