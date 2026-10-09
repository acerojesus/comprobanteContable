<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/Auth.js';
import { getData } from '../services/apiCliente.js';

const router = useRouter();
const authStore = useAuthStore();

// Modo de búsqueda: 'nit' o 'batch'
const modoBusqueda = ref('nit');
const valorBusqueda = ref('');
const anioSeleccionado = ref('todos');
const mesSeleccionado = ref('todos');
const isLoading = ref(false);
const movimientos = ref([]);
const mensaje = ref('');
const errorMensaje = ref('');
const haBuscado = ref(false);

// Lista de años desde 2012 hasta 2026 en orden descendente
const aniosDisponibles = Array.from({ length: 2026 - 2012 + 1 }, (_, i) => 2026 - i);

// Meses del año
const mesesDisponibles = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' },
];

onMounted(() => {
  if (!authStore.token) {
    router.replace('/login');
  }
});

// Si el año cambia a 'todos', reseteamos mes a 'todos'
watch(anioSeleccionado, (nuevoAnio) => {
  if (nuevoAnio === 'todos') {
    mesSeleccionado.value = 'todos';
  }
});

const seleccionarModo = (modo) => {
  modoBusqueda.value = modo;
  valorBusqueda.value = '';
  errorMensaje.value = '';
};

const formatearMoneda = (valor) => {
  if (valor === undefined || valor === null) return '$0.00';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2
  }).format(valor);
};

// Extrae año y mes exactos del movimiento según la fecha contable
const extraerFechaContable = (item) => {
  const fechaStr = item.fecha || item.fechaSistema || '';
  if (!fechaStr) return { anio: null, mes: null };

  // Formato habitual: DD/MM/YYYY o D/M/YYYY
  const match = String(fechaStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return {
      mes: parseInt(match[2], 10),
      anio: parseInt(match[3], 10)
    };
  }

  // Fallback ISO: YYYY-MM-DD
  const matchIso = String(fechaStr).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (matchIso) {
    return {
      anio: parseInt(matchIso[1], 10),
      mes: parseInt(matchIso[2], 10)
    };
  }

  return { anio: null, mes: null };
};

// Filtrado de movimientos por año y mes exactos
const movimientosFiltrados = computed(() => {
  return movimientos.value.filter((item) => {
    const { anio, mes } = extraerFechaContable(item);

    // Filtro por año
    if (anioSeleccionado.value !== 'todos') {
      if (anio !== Number(anioSeleccionado.value)) {
        return false;
      }
    }

    // Filtro por mes (solo activo si hay año seleccionado)
    if (anioSeleccionado.value !== 'todos' && mesSeleccionado.value !== 'todos') {
      if (mes !== Number(mesSeleccionado.value)) {
        return false;
      }
    }

    return true;
  });
});

const nombreMesSeleccionado = computed(() => {
  if (mesSeleccionado.value === 'todos') return '';
  const m = mesesDisponibles.find((m) => m.valor === Number(mesSeleccionado.value));
  return m ? m.nombre : '';
});

const ejecutarBusqueda = async () => {
  if (!valorBusqueda.value || String(valorBusqueda.value).trim() === '') {
    errorMensaje.value = `Por favor, ingresa el ${modoBusqueda.value === 'nit' ? 'NIT del tercero' : 'número de batch'}.`;
    return;
  }

  isLoading.value = true;
  errorMensaje.value = '';
  mensaje.value = '';
  haBuscado.value = true;

  const valorNumerico = Number(valorBusqueda.value);
  const valorLimpio = !isNaN(valorNumerico) ? valorNumerico : valorBusqueda.value;

  const queryParams = {};
  if (modoBusqueda.value === 'nit') {
    queryParams.nitTercero = valorLimpio;
  } else if (modoBusqueda.value === 'batch') {
    queryParams.batch = valorLimpio;
  }

  try {
    // Petición GET con query params: ?nitTercero=... o ?batch=...
    const response = await getData('/Contabilidad/ConsultarComprobante', queryParams);

    console.log('--- RESPUESTA CONSULTA COMPROBANTE ---');
    console.log(response);

    if (response && response.result === 1 && Array.isArray(response.data)) {
      movimientos.value = response.data;
      mensaje.value = response.message || 'Comprobantes consultados con éxito';
    } else if (response && Array.isArray(response.data)) {
      movimientos.value = response.data;
      mensaje.value = response.message || '';
    } else {
      movimientos.value = [];
      errorMensaje.value = (response && response.message) || 'No se encontraron comprobantes para la consulta.';
    }
  } catch (error) {
    console.error('Error al consultar comprobantes:', error);
    movimientos.value = [];
    if (error.response && error.response.data) {
      errorMensaje.value = typeof error.response.data === 'string'
        ? error.response.data
        : error.response.data.message || 'Error al realizar la consulta.';
    } else {
      errorMensaje.value = 'Error de conexión con el servidor.';
    }
  } finally {
    isLoading.value = false;
  }
};

const volver = () => {
  router.push('/comprobanteContable');
};
</script>

<template>
  <div class="buscar-page">
    <header class="buscar-header">
      <div class="buscar-title-group">
        <h1 class="buscar-title">Buscar Comprobante</h1>
        <p class="buscar-subtitle">Consulta de movimientos contables registrados por NIT o Batch</p>
      </div>

      <div class="buscar-actions">
        <button class="btn-nav-back" @click="volver">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Volver</span>
        </button>
      </div>
    </header>

    <main class="buscar-main">
      <!-- Selector de Modo, Filtros de Fecha y Barra Buscadora -->
      <section class="search-control-panel">
        <div class="mode-selector">
          <span class="selector-label">Consultar por:</span>
          <div class="selector-buttons">
            <button
              type="button"
              class="mode-btn"
              :class="{ active: modoBusqueda === 'nit' }"
              @click="seleccionarModo('nit')"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>NIT Tercero</span>
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: modoBusqueda === 'batch' }"
              @click="seleccionarModo('batch')"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Número de Batch</span>
            </button>
          </div>

          <!-- Filtros de Año y Mes -->
          <div class="date-filters-group">
            <div class="filter-item">
              <label for="anio-select" class="selector-label">Año:</label>
              <select id="anio-select" v-model="anioSeleccionado" class="filter-select">
                <option value="todos">Todos los años</option>
                <option v-for="anio in aniosDisponibles" :key="anio" :value="anio">
                  {{ anio }}
                </option>
              </select>
            </div>

            <!-- El selector de Mes aparece cuando se selecciona un año específico -->
            <div class="filter-item" v-if="anioSeleccionado !== 'todos'">
              <label for="mes-select" class="selector-label">Mes:</label>
              <select id="mes-select" v-model="mesSeleccionado" class="filter-select">
                <option value="todos">Todos los meses</option>
                <option v-for="mes in mesesDisponibles" :key="mes.valor" :value="mes.valor">
                  {{ mes.nombre }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <form class="search-form" @submit.prevent="ejecutarBusqueda">
          <div class="search-input-wrapper">
            <svg class="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="valorBusqueda"
              type="text"
              class="search-input"
              :placeholder="modoBusqueda === 'nit' ? 'Escribe el NIT del tercero (ej. 900123456)...' : 'Escribe el número de Batch (ej. 101)...'"
              :disabled="isLoading"
              autofocus
            />
          </div>
          <button type="submit" class="search-submit-btn" :disabled="isLoading">
            <span v-if="!isLoading">Buscar</span>
            <span v-else>Consultando...</span>
          </button>
        </form>
      </section>

      <!-- Mensajes de Error -->
      <div v-if="errorMensaje" class="message-box error">
        <span>⚠️ {{ errorMensaje }}</span>
      </div>

      <!-- Resultados: Cards de Movimiento (2 Filas) -->
      <section v-if="movimientosFiltrados.length > 0" class="results-container">
        <div class="results-header">
          <h2 class="results-count">
            Movimientos Encontrados ({{ movimientosFiltrados.length }}
            <span v-if="anioSeleccionado !== 'todos'">
              en
              <span v-if="mesSeleccionado !== 'todos'"> {{ nombreMesSeleccionado }} de </span>
              {{ anioSeleccionado }}
            </span>)
          </h2>
          <span class="results-badge" v-if="mensaje">{{ mensaje }}</span>
        </div>

        <article
          v-for="(item, index) in movimientosFiltrados"
          :key="index"
          class="movimiento-card"
        >
          <!-- Fila 1: Datos Principales -->
          <div class="card-row-primary">
            <div class="field-group">
              <span class="field-label">NIT</span>
              <span class="field-value highlight">{{ item.nit }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Cuenta Contable</span>
              <span class="field-value">{{ item.cuentaContable }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Batch</span>
              <span class="field-value highlight">#{{ item.batch }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Fecha</span>
              <span class="field-value">{{ item.fecha }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Débito</span>
              <span class="field-value debito">{{ formatearMoneda(item.debito) }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Crédito</span>
              <span class="field-value credito">{{ formatearMoneda(item.credito) }}</span>
            </div>
          </div>

          <!-- Fila 2: Detalles Secundarios Pequeños -->
          <div class="card-row-secondary">
            <div class="mini-field" v-if="item.descripcion">
              <span class="mini-label">Descripción:</span>
              <span class="mini-value">{{ item.descripcion }}</span>
            </div>

            <div class="mini-field" v-if="item.base !== undefined">
              <span class="mini-label">Base:</span>
              <span class="mini-value">{{ formatearMoneda(item.base) }}</span>
            </div>

            <div class="mini-field" v-if="item.invc">
              <span class="mini-label">Invc:</span>
              <span class="mini-value">{{ item.invc }}</span>
            </div>

            <div class="mini-field" v-if="item.departamento">
              <span class="mini-label">Depto:</span>
              <span class="mini-value">{{ item.departamento }}</span>
            </div>

            <div class="mini-field" v-if="item.centroCosto">
              <span class="mini-label">C. Costo:</span>
              <span class="mini-value">{{ item.centroCosto }}</span>
            </div>

            <div class="mini-field" v-if="item.actividad">
              <span class="mini-label">Actividad:</span>
              <span class="mini-value">{{ item.actividad }}</span>
            </div>

            <div class="mini-field" v-if="item.proyecto">
              <span class="mini-label">Proyecto:</span>
              <span class="mini-value">{{ item.proyecto }}</span>
            </div>

            <div class="mini-field" v-if="item.usuario">
              <span class="mini-label">Usuario:</span>
              <span class="mini-value">{{ item.usuario }}</span>
            </div>

            <div class="mini-field" v-if="item.fechaSistema">
              <span class="mini-label">F. Sistema:</span>
              <span class="mini-value">{{ item.fechaSistema }}</span>
            </div>
          </div>
        </article>
      </section>

      <!-- Estado cuando la consulta trajo datos pero el filtro de fecha no coincide -->
      <div v-else-if="movimientos.length > 0 && movimientosFiltrados.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 class="empty-title">
          Sin movimientos para {{ mesSeleccionado !== 'todos' ? nombreMesSeleccionado + ' de ' : '' }}{{ anioSeleccionado }}
        </h3>
        <p class="empty-desc">
          Hay {{ movimientos.length }} movimientos en total para este comprobante, pero ninguno coincide con el periodo seleccionado.
        </p>
      </div>

      <!-- Estado vacío cuando no hay resultados en la consulta -->
      <div v-else-if="haBuscado && !isLoading && !errorMensaje" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 class="empty-title">Sin resultados</h3>
        <p class="empty-desc">No se encontraron movimientos registrados con el criterio ingresado.</p>
      </div>
    </main>
  </div>
</template>

<style src="../styles/buscarComprobante.css"></style>
