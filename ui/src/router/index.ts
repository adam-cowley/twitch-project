import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../modules/auth'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/register',
    name: 'register',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "register" */ '../views/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/logout',
    name: 'logout',
    component: () => import(/* webpackChunkName: "logout" */ '../views/Logout.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/genres',
    name: 'genres.list',
    // component: () => import(/* webpackChunkName: "genres.view" */ '../views/genres/List.vue'),
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/genres/:id',
    name: 'genres.view',
    component: () => import(/* webpackChunkName: "genres.view" */ '../views/genres/View.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/movies/',
    name: 'movies.list',
    // component: () => import(/* webpackChunkName: "movies.view" */ '../views/movies/Home.vue'),
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/movies/:id',
    name: 'movies.view',
    component: () => import(/* webpackChunkName: "movies.view" */ '../views/movies/View.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/subscribe',
    name: 'subscribe',
    component: () => import(/* webpackChunkName: "subscribe" */ '../views/Subscribe.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/subscribe/success',
    name: 'subscribe.success',
    component: () => import(/* webpackChunkName: "subscribe.success" */ '../views/SubscribeSuccess.vue'),
  },
  {
    path: '/subscribe/cancelled',
    name: 'subscribe.cancelled',
    component: () => import(/* webpackChunkName: "subscribe.cancelled" */ '../views/SubscribeCancelled.vue'),
  },
  {
    path: '/account',
    name: 'account',
    component: () => import(/* webpackChunkName: "account" */ '../views/Account.vue'),
  },
  {
    path: '/*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const { authenticating, user } = useAuth()


  // Not logged into a guarded route?
  if ( authenticating.value === false && to.meta.requiresAuth === true && !user?.value ) {
    console.log('requires auth, redirect to login');

    next({ name: 'login' })
  }

  // Redirect user to route if they don't have the correct subscription
  // else if ( to.meta.requiresAuth === true && !user?.value?.subscription  && to.name!.toString().startsWith('subscribe') === false ) {
  //   console.log('requires valid subscription, redirect to subscribe');
  //   next({ name: 'subscribe' })
  // }

  // Logged in for an auth route
  // else if ( (to.name == 'login' || to.name == 'register') && user!.value ) {
  //   console.log('login or register, has a user so send home');

  //   next({ name: 'home' })
  // }

  // Carry On...
  else next()
})

export default router
