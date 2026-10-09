<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/Auth.js';

const router = useRouter();
const authStore = useAuthStore();

// Si intenta ingresar sin token o sesión, lo enviamos al login
onMounted(() => {
  if (!authStore.token) {
    router.replace('/login');
  }
});

const irAInicio = () => {
  router.push('/');
};

const cerrarSesion = () => {
  authStore.clearSession();
  router.push('/login');
};
</script>

<template>
  <div class="comprobante-page">
    <header class="comprobante-header">
      <h1 class="comprobante-title">Comprobante Contable</h1>
      
      <div class="user-info-bar">
        <div class="user-details" v-if="authStore.userName">
          <span class="user-name">{{ authStore.nombre || authStore.userName }}</span>
          <span class="user-empresa">Empresa: {{ authStore.empresa }}</span>
        </div>
        <div class="header-actions">
          <button class="btn-nav-inicio" @click="irAInicio" title="Ir al Inicio">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Inicio</span>
          </button>
          <button class="btn-logout" @click="cerrarSesion">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    <main class="comprobante-body">
      <div class="placeholder-box">
        <h2>Módulo de Comprobantes Contables</h2>
        <p>Pronto se añadirán las funcionalidades detalladas de gestión de comprobantes.</p>
      </div>
    </main>
  </div>
</template>

<style src="../styles/comprobanteContable.css"></style>
