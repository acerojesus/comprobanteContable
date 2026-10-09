import { createRouter, createWebHashHistory } from "vue-router";
import inicio from "../views/inicio.vue";
import login from "../views/login.vue";
import comprobanteContable from "../views/comprobanteContable.vue";

const rutas = [
  { path: "/", name: "inicio", component: inicio },
  { path: "/login", name: "login", component: login },
  { path: "/comprobanteContable", name: "comprobanteContable", component: comprobanteContable },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: rutas,
});

export default router;