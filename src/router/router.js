import { createRouter, createWebHashHistory } from "vue-router"
import inicio from "../views/inicio.vue"

const rutas = [
    {path: "/",  component: inicio}
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: rutas
})

export default router