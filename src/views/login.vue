<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { postData } from '../services/apiCliente.js';
import { useAuthStore } from '../stores/Auth.js';

const router = useRouter();
const authStore = useAuthStore();

// Si ya tiene sesión con token, redirige directamente
onMounted(() => {
  if (authStore.token) {
    router.replace('/comprobanteContable');
  }
});

const formData = reactive({
  Empresa: '',
  userName: '',
  clave: ''
});

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  errorMessage.value = '';

  if (!formData.Empresa || !formData.userName || !formData.clave) {
    errorMessage.value = 'Por favor, diligencie todos los campos.';
    return;
  }

  isLoading.value = true;

  try {
    const payload = {
      Empresa: formData.Empresa,
      userName: formData.userName,
      clave: formData.clave
    };

    const response = await postData('/Auth/login', payload);

    if (response && response.result === 1 && response.data && response.data.token) {
      authStore.setSession({
        token: response.data.token,
        userName: response.data.userName,
        nombre: response.data.nombre,
        empresa: response.data.empresa
      });

      router.push('/comprobanteContable');
    } else {
      errorMessage.value =
        typeof response === 'string'
          ? response
          : (response && response.message) || 'Datos Incorrectos. Verifica tus credenciales.';
    }
  } catch (error) {
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage.value = error.response.data;
      } else if (error.response.data.message) {
        errorMessage.value = error.response.data.message;
      } else {
        errorMessage.value = 'Datos Incorrectos.';
      }
    } else {
      errorMessage.value = 'Error de conexión con el servidor. Intente nuevamente.';
    }
  } finally {
    isLoading.value = false;
  }
};

const volverInicio = () => {
  router.push('/');
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <header class="login-header">
        <div class="login-logo-badge">
          <svg class="login-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 class="login-title">Iniciar Sesión</h2>
        <p class="login-subtitle">Ingresa tus credenciales para acceder a ContarERP</p>
      </header>

      <div v-if="errorMessage" class="login-error">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <!-- 1. Empresa -->
        <div class="form-group">
          <label for="empresa">Empresa</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l8-4v18"></path>
              <path d="M19 21V11l-6-4"></path>
            </svg>
            <input
              id="empresa"
              v-model="formData.Empresa"
              type="text"
              placeholder="Ej. MiEmpresa S.A.S"
              :disabled="isLoading"
              autocomplete="organization"
              required
            />
          </div>
        </div>

        <!-- 2. Usuario -->
        <div class="form-group">
          <label for="userName">Usuario</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input
              id="userName"
              v-model="formData.userName"
              type="text"
              placeholder="Ej. admin_contable"
              :disabled="isLoading"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <!-- 3. Contraseña con ojito toggle -->
        <div class="form-group">
          <label for="clave">Contraseña</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              id="clave"
              v-model="formData.clave"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              :disabled="isLoading"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="btn-toggle-password"
              @click="toggleShowPassword"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
              tabindex="-1"
            >
              <!-- Icono Ojito Abierto -->
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <!-- Icono Ojito Tachado -->
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="isLoading">
          Iniciar Sesión
        </button>
      </form>

      <button type="button" class="btn-back" @click="volverInicio" :disabled="isLoading">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver al inicio
      </button>
    </div>

    <!-- Pantalla de carga bloqueante -->
    <div v-if="isLoading" class="loading-overlay" aria-live="assertive" role="alert">
      <div class="loading-modal">
        <div class="spinner"></div>
        <p class="loading-text">Autenticando usuario...</p>
        <p class="loading-subtext">Por favor espere un momento</p>
      </div>
    </div>
  </div>
</template>

<style src="../styles/login.css"></style>
