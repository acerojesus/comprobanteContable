import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from "./router/router.js"
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const myApp = createApp(App)

myApp.use(router)

myApp.use(pinia)

myApp.mount('#app')