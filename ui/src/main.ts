import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Loading from '@/components/Loading.vue'

import '@/assets/css/tailwind.css'

createApp(App)
    .use(store)
    .use(router)
    .component('loading', Loading)
    .mount('#app')
