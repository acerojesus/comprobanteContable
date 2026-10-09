import { createRouter, createWebHashHistory } from "vue-router";
import inicio from "../views/inicio.vue";
import login from "../views/login.vue";
import comprobanteContable from "../views/comprobanteContable.vue";
import digitarComprobante from "../views/digitarComprobante.vue";
import buscarComprobante from "../views/buscarComprobante.vue";

const rutas = [
  { path: "/", name: "inicio", component: inicio },
  { path: "/login", name: "login", component: login },
  { path: "/comprobanteContable", name: "comprobanteContable", component: comprobanteContable },
  { path: "/digitarComprobante", name: "digitarComprobante", component: digitarComprobante },
  { path: "/buscarComprobante", name: "buscarComprobante", component: buscarComprobante },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: rutas,
});

export default router;