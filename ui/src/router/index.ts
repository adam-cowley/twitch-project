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
    path: '/genres/:id',
    name: 'genres.view',
    component: () => import(/* webpackChunkName: "genres.view" */ '../views/genres/View.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/movies/:id',
    name: 'movies.view',
    component: () => import(/* webpackChunkName: "movies.view" */ '../views/movies/View.vue'),
    meta: { requiresAuth: true },
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
  const { user } = useAuth()

  // Not logged into a guarded route?
  if ( to.meta.requiresAuth && !user?.value ) next({ name: 'login' })

  // Logged in for an auth route
  else if ( (to.name == 'login' || to.name == 'register') && user!.value ) next({ name: 'home' })

  // Carry On...
  else next()
})

export default router
