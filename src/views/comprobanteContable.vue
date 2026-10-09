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

const irADigitarComprobante = () => {
  router.push('/digitarComprobante');
};

const irABuscarComprobante = () => {
  router.push('/buscarComprobante');
};
</script>

<template>
  <div class="comprobante-page">
    <header class="comprobante-header">
      <div class="comprobante-title-group">
        <h1 class="comprobante-title">Comprobante Contable</h1>
        <p class="comprobante-subtitle">Selecciona una acción para gestionar los comprobantes del sistema</p>
      </div>

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

    <main class="comprobante-main">
      <div class="modules-grid">
        <!-- Card 1: Añadir Comprobante -->
        <article class="module-card" @click="irADigitarComprobante" role="button" tabindex="0">
          <div class="card-glow"></div>
          <div class="card-top">
            <div class="card-icon-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </div>
            <span class="card-tag">Disponible</span>
          </div>

          <div class="card-info">
            <h2 class="card-title">Añadir Comprobante</h2>
            <p class="card-description">
              Digita y registra nuevos comprobantes contables con validación de cuentas PUC y naturalezas.
            </p>
          </div>

          <div class="card-action">
            <span>Digitar comprobante</span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </article>

        <!-- Card 2: Añadir Comprobante XML -->
        <article class="module-card" role="button" tabindex="0">
          <div class="card-glow"></div>
          <div class="card-top">
            <div class="card-icon-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                <polyline points="16 16 12 12 8 16"></polyline>
              </svg>
            </div>
            <span class="card-tag">XML</span>
          </div>

          <div class="card-info">
            <h2 class="card-title">Añadir Comprobante XML</h2>
            <p class="card-description">
              Carga masiva e importación automática de comprobantes electrónicos a través de archivos XML.
            </p>
          </div>

          <div class="card-action">
            <span>Cargar archivo</span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </article>

        <!-- Card 3: Buscar Comprobante -->
        <article class="module-card" @click="irABuscarComprobante" role="button" tabindex="0">
          <div class="card-glow"></div>
          <div class="card-top">
            <div class="card-icon-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <span class="card-tag">Consultas</span>
          </div>

          <div class="card-info">
            <h2 class="card-title">Buscar Comprobante</h2>
            <p class="card-description">
              Filtra, consulta y visualiza el historial de comprobantes contables registrados en el periodo.
            </p>
          </div>

          <div class="card-action">
            <span>Buscar registros</span>
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style src="../styles/comprobanteContable.css"></style>
