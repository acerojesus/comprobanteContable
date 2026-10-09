<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/Auth.js';

const router = useRouter();
const authStore = useAuthStore();
const isMenuOpen = ref(false);

const irAComprobante = () => {
  isMenuOpen.value = false;
  // Si ya tiene sesión activa (token existente), entra directo a comprobanteContable
  if (authStore.token) {
    router.push('/comprobanteContable');
  } else {
    router.push('/login');
  }
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};
</script>

<template>
  <div class="inicio-container">
    <!-- Barra superior con menú hamburguesa -->
    <nav class="inicio-nav">
      <button class="hamburger-btn" @click="toggleMenu" aria-label="Abrir menú de módulos">
        <svg class="hamburger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </nav>

    <!-- Menú lateral / Drawer -->
    <div v-if="isMenuOpen" class="drawer-backdrop" @click="isMenuOpen = false"></div>
    <aside v-if="isMenuOpen" class="drawer-menu">
      <div class="drawer-header">
        <h3 class="drawer-title">Módulos del Sistema</h3>
        <button class="drawer-close-btn" @click="isMenuOpen = false" aria-label="Cerrar menú">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="drawer-options">
        <div class="drawer-item" @click="irAComprobante">
          <svg class="drawer-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Comprobante Contable</span>
        </div>
      </div>
    </aside>

    <header class="inicio-header">
      <div class="inicio-badge">
        <span class="badge-dot"></span>
        <span>Sistema de Gestión Contable</span>
      </div>
      <h1 class="inicio-title">
        Bienvenido a <span class="title-gradient">ContarERP</span>
      </h1>
      <p class="inicio-subtitle">
        Plataforma unificada para administración financiera y control de comprobantes contables.
      </p>
    </header>

    <main class="inicio-main">
      <div class="modules-grid">
        <article class="module-card" @click="irAComprobante" role="button" tabindex="0">
          <div class="card-glow"></div>
          <div class="card-top">
            <div class="card-icon-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span class="card-tag">Disponible</span>
          </div>

          <div class="card-info">
            <h2 class="card-title">Comprobante Contable</h2>
            <p class="card-description">
              Crea, consulta y gestiona los comprobantes contables con validación en tiempo real.
            </p>
          </div>

          <div class="card-action">
            <span>Acceder al módulo</span>
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

<style src="../styles/inicio.css"></style>