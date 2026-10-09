<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/Auth.js';
import { getData, postData } from '../services/apiCliente.js';

const router = useRouter();
const authStore = useAuthStore();

// ==========================================
// ESTADO GENERAL Y CATÁLOGO PUC
// ==========================================
const pasoActual = ref(1); // 1: Datos Generales, 2: Movimientos / Asiento, 3: Resumen y Envío
const catalogoPucRaw = ref(null);
const listaCuentas = ref([]);
const mapNaturalezas = ref({}); // { [tipo]: { titulo, detalle, naturaleza } }
const estadoCargaPuc = ref('cargando');
const mensajeErrorPuc = ref('');

// ==========================================
// PASO 1: DATOS CABECERA
// ==========================================
const cabecera = reactive({
  nitTercero: '',
  observaciones: '',
  usarFechaManual: false,
  fecha: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
});

// ==========================================
// PASO 2: MOVIMIENTOS Y ASIENTO CONTABLE
// ==========================================
const movimientos = ref([]);
const indexMovimientoEditando = ref(null); // null si es nuevo

// Buscador de Cuenta PUC
const modoBusquedaCuenta = ref('codigo'); // 'codigo' | 'tipo'
const queryBusquedaCuenta = ref('');
const naturalezaSeleccionada = ref('todas'); // 'todas' | 'Naturaleza Débito' | 'Naturaleza Crédito' | 'Naturaleza Especial'
const cuentaSeleccionada = ref(null); // Cuenta elegida antes de llenar campos

// Formulario de edición/creación del movimiento actual
const formMovimiento = reactive({
  debito: 0,
  credito: 0,
  descripcion: '',
  cruce: '',
  base: 0,
  departamento: '',
  cCosto: '',
  proyecto: '',
  actividad: ''
});

// ==========================================
// PASO 3: CONFIRMACIÓN Y ENVÍO
// ==========================================
const mostrarModalConfirmacion = ref(false);
const mostrarModalExito = ref(false);
const batchRegistrado = ref(null);
const enviandoComprobante = ref(false);
const errorEnvio = ref('');
const exitoEnvio = ref('');

// ==========================================
// HELPERS PARA NORMALIZAR Y PARSEAR PUC
// ==========================================
const isTrue = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.trim().toLowerCase() === 'true';
  return false;
};

const cargarCatalogoPUC = async () => {
  estadoCargaPuc.value = 'cargando';
  try {
    const response = await getData('/Contabilidad/CuentasPuc');
    catalogoPucRaw.value = response;

    if (response && response.result === 1 && response.data) {
      // 1. Mapear Naturalezas y Tipos
      const natData = response.data.naturaleza || {};
      const tempMap = {};

      Object.entries(natData).forEach(([nombreNaturaleza, tiposObj]) => {
        if (tiposObj && typeof tiposObj === 'object') {
          Object.entries(tiposObj).forEach(([codTipo, info]) => {
            tempMap[codTipo] = {
              naturaleza: nombreNaturaleza,
              titulo: info.titulo || codTipo,
              detalle: info.detalle || ''
            };
          });
        }
      });
      mapNaturalezas.value = tempMap;

      // 2. Extraer y enriquecer lista de cuentas
      const cuentasArray = response.data.cuentas || [];
      listaCuentas.value = cuentasArray.map((c) => {
        const infoTipo = mapNaturalezas.value[c.tipo] || {
          naturaleza: 'General',
          titulo: c.tipo || 'Sin Tipo',
          detalle: ''
        };

        return {
          cuenta: String(c.cuenta),
          descripcion: c.descripcion || '',
          tipo: c.tipo || '',
          tipoTitulo: infoTipo.titulo,
          tipoDetalle: infoTipo.detalle,
          naturaleza: infoTipo.naturaleza,
          requiereBase: c.tipo === 'RF' && isTrue(c.basertncion),
          requiereDeptoCosto: isTrue(c.dprtmntocsto),
          requiereProyectoActividad: isTrue(c.jbno)
        };
      });

      estadoCargaPuc.value = 'exito';
    } else {
      estadoCargaPuc.value = 'error';
      mensajeErrorPuc.value = (response && response.message) || 'Error al obtener cuentas PUC.';
    }
  } catch (error) {
    console.error('Error al cargar PUC:', error);
    estadoCargaPuc.value = 'error';
    mensajeErrorPuc.value = error.message || 'Error de conexión.';
  }
};

onMounted(() => {
  if (!authStore.token) {
    router.replace('/login');
    return;
  }
  cargarCatalogoPUC();
});

// ==========================================
// FILTRADO DE CUENTAS PUC
// ==========================================
const cuentasFiltradas = computed(() => {
  const q = queryBusquedaCuenta.value.trim().toLowerCase();

  // Filtrado base por naturaleza si se seleccionó una específica
  let base = listaCuentas.value;
  if (naturalezaSeleccionada.value !== 'todas') {
    base = base.filter((c) => {
      const nat = (c.naturaleza || '').toLowerCase();
      const sel = naturalezaSeleccionada.value.toLowerCase();
      return nat.includes(sel) || sel.includes(nat);
    });
  }

  if (!q) {
    return base.slice(0, 30);
  }

  if (modoBusquedaCuenta.value === 'codigo') {
    // Busca por número de código O por descripción/nombre de la cuenta (teléfono, equipo de telecomunicaciones, etc.)
    return base.filter(
      (c) => c.cuenta.includes(q) || c.descripcion.toLowerCase().includes(q)
    ).slice(0, 40);
  } else {
    // Busca por título del tipo O por descripción/nombre de la cuenta O detalle del tipo
    return base.filter(
      (c) => c.tipoTitulo.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q) || c.tipo.toLowerCase() === q
    ).slice(0, 40);
  }
});

const seleccionarCuentaParaMovimiento = (cuenta) => {
  cuentaSeleccionada.value = cuenta;
  queryBusquedaCuenta.value = '';
};

const deseleccionarCuenta = () => {
  cuentaSeleccionada.value = null;
};

// ==========================================
// CÁLCULOS Y TOTALES DEL ASIENTO
// ==========================================
const totalDebito = computed(() => {
  return movimientos.value.reduce((acc, m) => acc + (Number(m.debito) || 0), 0);
});

const totalCredito = computed(() => {
  return movimientos.value.reduce((acc, m) => acc + (Number(m.credito) || 0), 0);
});

const diferenciaAsiento = computed(() => {
  return Math.abs(totalDebito.value - totalCredito.value);
});

const asientoBalanceado = computed(() => {
  return movimientos.value.length > 0 && diferenciaAsiento.value < 0.01;
});

// Validación de mínimo de movimientos:
// Mínimo 2 movimientos normalmente; pero si alguna cuenta es RF con base=true, mínimo 3
const hayCuentaRFConBase = computed(() => {
  return movimientos.value.some((m) => m.requiereBase);
});

const minimoMovimientosRequeridos = computed(() => {
  return hayCuentaRFConBase.value ? 3 : 2;
});

const cumpleMinimoMovimientos = computed(() => {
  return movimientos.value.length >= minimoMovimientosRequeridos.value;
});

// Validación de número de cruce uniforme (si se envía, debe ser igual en todos)
const crucesValidos = computed(() => {
  const cruces = movimientos.value
    .map((m) => (m.cruce !== undefined && m.cruce !== null ? String(m.cruce).trim() : ''))
    .filter((c) => c !== '');

  if (cruces.length === 0) return true; // Ninguno tiene cruce (válido)
  // Si alguno tiene cruce, todos los movimientos deben tener el mismo cruce
  if (cruces.length !== movimientos.value.length) return false;
  const primerCruce = cruces[0];
  return cruces.every((c) => c === primerCruce);
});

const paso2Valido = computed(() => {
  return (
    cumpleMinimoMovimientos.value &&
    asientoBalanceado.value &&
    crucesValidos.value
  );
});

// ==========================================
// AGREGAR / EDITAR / ELIMINAR MOVIMIENTO
// ==========================================
const errorFormMovimiento = ref('');

const limpiarFormularioMovimiento = () => {
  cuentaSeleccionada.value = null;
  indexMovimientoEditando.value = null;
  formMovimiento.debito = 0;
  formMovimiento.credito = 0;
  formMovimiento.descripcion = '';
  formMovimiento.cruce = '';
  formMovimiento.base = 0;
  formMovimiento.departamento = '';
  formMovimiento.cCosto = '';
  formMovimiento.proyecto = '';
  formMovimiento.actividad = '';
  errorFormMovimiento.value = '';
};

const guardarMovimiento = () => {
  errorFormMovimiento.value = '';

  if (!cuentaSeleccionada.value) {
    errorFormMovimiento.value = 'Debes seleccionar una cuenta contable.';
    return;
  }

  const deb = Number(formMovimiento.debito) || 0;
  const cred = Number(formMovimiento.credito) || 0;

  if (deb <= 0 && cred <= 0) {
    errorFormMovimiento.value = 'Debe ingresar un valor mayor a cero en Débito o Crédito.';
    return;
  }
  if (deb > 0 && cred > 0) {
    errorFormMovimiento.value = 'Un movimiento contable no puede tener Débito y Crédito al mismo tiempo.';
    return;
  }

  // Validaciones según reglas backend de la cuenta seleccionada:
  if (cuentaSeleccionada.value.requiereBase && (!formMovimiento.base || Number(formMovimiento.base) <= 0)) {
    errorFormMovimiento.value = 'La base es obligatoria para esta cuenta de retención (RF).';
    return;
  }

  if (cuentaSeleccionada.value.requiereDeptoCosto) {
    if (!formMovimiento.departamento || !formMovimiento.cCosto) {
      errorFormMovimiento.value = 'El Departamento y Centro de Costo son obligatorios para esta cuenta.';
      return;
    }
  }

  if (cuentaSeleccionada.value.requiereProyectoActividad) {
    if (!formMovimiento.proyecto || !formMovimiento.actividad) {
      errorFormMovimiento.value = 'El Proyecto y Actividad son obligatorios para esta cuenta.';
      return;
    }
  }

  const nuevoMov = {
    cuentaPuc: cuentaSeleccionada.value.cuenta,
    descripcionCuenta: cuentaSeleccionada.value.descripcion,
    tipoTitulo: cuentaSeleccionada.value.tipoTitulo,
    tipo: cuentaSeleccionada.value.tipo,
    requiereBase: cuentaSeleccionada.value.requiereBase,
    requiereDeptoCosto: cuentaSeleccionada.value.requiereDeptoCosto,
    requiereProyectoActividad: cuentaSeleccionada.value.requiereProyectoActividad,
    debito: deb,
    credito: cred,
    descripcion: formMovimiento.descripcion.trim() || 'Movimiento contable',
    cruce: formMovimiento.cruce ? String(formMovimiento.cruce).trim() : null,
    base: cuentaSeleccionada.value.requiereBase ? Number(formMovimiento.base) || 0 : (Number(formMovimiento.base) || 0),
    departamento: cuentaSeleccionada.value.requiereDeptoCosto ? Number(formMovimiento.departamento) || formMovimiento.departamento : null,
    cCosto: cuentaSeleccionada.value.requiereDeptoCosto ? Number(formMovimiento.cCosto) || formMovimiento.cCosto : null,
    proyecto: cuentaSeleccionada.value.requiereProyectoActividad ? formMovimiento.proyecto : null,
    actividad: cuentaSeleccionada.value.requiereProyectoActividad ? formMovimiento.actividad : null
  };

  if (indexMovimientoEditando.value !== null) {
    movimientos.value[indexMovimientoEditando.value] = nuevoMov;
  } else {
    movimientos.value.push(nuevoMov);
  }

  limpiarFormularioMovimiento();
};

const editarMovimiento = (index) => {
  const mov = movimientos.value[index];
  indexMovimientoEditando.value = index;

  // Encontrar la cuenta en listaCuentas
  const cEncontrada = listaCuentas.value.find((c) => c.cuenta === String(mov.cuentaPuc));
  if (cEncontrada) {
    cuentaSeleccionada.value = cEncontrada;
  } else {
    cuentaSeleccionada.value = {
      cuenta: String(mov.cuentaPuc),
      descripcion: mov.descripcionCuenta || '',
      tipoTitulo: mov.tipoTitulo || '',
      tipo: mov.tipo || '',
      requiereBase: mov.requiereBase,
      requiereDeptoCosto: mov.requiereDeptoCosto,
      requiereProyectoActividad: mov.requiereProyectoActividad
    };
  }

  formMovimiento.debito = mov.debito || 0;
  formMovimiento.credito = mov.credito || 0;
  formMovimiento.descripcion = mov.descripcion || '';
  formMovimiento.cruce = mov.cruce || '';
  formMovimiento.base = mov.base || 0;
  formMovimiento.departamento = mov.departamento || '';
  formMovimiento.cCosto = mov.cCosto || '';
  formMovimiento.proyecto = mov.proyecto || '';
  formMovimiento.actividad = mov.actividad || '';
};

const eliminarMovimiento = (index) => {
  movimientos.value.splice(index, 1);
  if (indexMovimientoEditando.value === index) {
    limpiarFormularioMovimiento();
  }
};

// ==========================================
// VALIDACIONES Y NAVEGACIÓN ENTRE PASOS
// ==========================================
const errorPaso1 = ref('');

const avanzarPaso1 = () => {
  errorPaso1.value = '';
  if (!cabecera.nitTercero || String(cabecera.nitTercero).trim() === '') {
    errorPaso1.value = 'El NIT del tercero es obligatorio.';
    return;
  }
  if (!cabecera.observaciones || cabecera.observaciones.trim() === '') {
    errorPaso1.value = 'Las observaciones son obligatorias.';
    return;
  }
  pasoActual.value = 2;
};

const avanzarPaso2 = () => {
  if (!paso2Valido.value) return;
  pasoActual.value = 3;
};

// ==========================================
// FORMATOS
// ==========================================
const formatearMoneda = (val) => {
  if (val === undefined || val === null) return '$0.00';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2
  }).format(val);
};

// ==========================================
// ENVÍO FINAL AL BACKEND (POST)
// ==========================================
const confirmarYRegistrar = async () => {
  mostrarModalConfirmacion.value = false;
  enviandoComprobante.value = true;
  errorEnvio.value = '';
  exitoEnvio.value = '';

  const detallePayload = movimientos.value.map((m) => {
    const item = {
      cuentaPuc: String(m.cuentaPuc),
      debito: Number(m.debito) || 0,
      credito: Number(m.credito) || 0,
      descripcion: m.descripcion || 'entrada'
    };

    if (m.cruce) item.cruce = String(m.cruce);
    if (m.base !== undefined && m.base !== null && Number(m.base) > 0) item.base = Number(m.base);
    if (m.departamento !== null && m.departamento !== '') item.departamento = Number(m.departamento) || m.departamento;
    if (m.cCosto !== null && m.cCosto !== '') item.cCosto = Number(m.cCosto) || m.cCosto;
    if (m.proyecto) item.proyecto = String(m.proyecto);
    if (m.actividad) item.actividad = String(m.actividad);

    return item;
  });

  const payload = {
    nitTercero: Number(cabecera.nitTercero) || cabecera.nitTercero,
    observaciones: cabecera.observaciones.trim(),
    detalle: detallePayload
  };

  // Si el usuario especificó fecha manual, se envía en formato ISO; de lo contrario se omite
  if (cabecera.usarFechaManual && cabecera.fecha) {
    payload.fecha = `${cabecera.fecha}T00:00:00`;
  }

  try {
    const response = await postData('/Contabilidad/ComprobanteContable', payload);
    console.log('--- RESPUESTA DIGITAR COMPROBANTE ---', response);

    // Extraer batch de la respuesta si viene en data o message
    let batchEncontrado = null;
    if (response) {
      if (typeof response.data === 'number' || typeof response.data === 'string') {
        batchEncontrado = response.data;
      } else if (response.data && response.data.batch) {
        batchEncontrado = response.data.batch;
      } else if (response.message) {
        const matchBatch = String(response.message).match(/batch\s*[:#]?\s*(\d+)/i) || String(response.message).match(/(\d+)/);
        if (matchBatch) {
          batchEncontrado = matchBatch[1];
        }
      }
    }

    batchRegistrado.value = batchEncontrado;
    exitoEnvio.value = response?.message || 'Comprobante contable registrado con éxito.';
    mostrarModalExito.value = true;
  } catch (error) {
    console.error('Error al registrar comprobante:', error);
    if (error.response && error.response.data) {
      errorEnvio.value = typeof error.response.data === 'string'
        ? error.response.data
        : error.response.data.message || 'Error al procesar el comprobante.';
    } else {
      errorEnvio.value = 'Error al comunicarse con el servidor.';
    }
  } finally {
    enviandoComprobante.value = false;
  }
};

const aceptarExitoEIrAInicio = () => {
  mostrarModalExito.value = false;
  router.push('/comprobanteContable');
};

const reiniciarFormulario = () => {
  cabecera.nitTercero = '';
  cabecera.observaciones = '';
  cabecera.usarFechaManual = false;
  cabecera.fecha = new Date().toISOString().slice(0, 10);
  movimientos.value = [];
  limpiarFormularioMovimiento();
  pasoActual.value = 1;
  exitoEnvio.value = '';
  errorEnvio.value = '';
};

const volver = () => {
  router.push('/comprobanteContable');
};
</script>

<template>
  <div class="digitar-page">
    <header class="digitar-header">
      <div class="digitar-title-group">
        <h1 class="digitar-title">Digitar Comprobante</h1>
        <p class="digitar-subtitle">Asistente paso a paso para registro y cuadre de asientos contables</p>
      </div>

      <div class="digitar-actions">
        <button class="btn-nav-back" @click="volver">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Volver al menú</span>
        </button>
      </div>
    </header>

    <main class="digitar-main">
      <!-- Indicador de Pasos del Wizard -->
      <nav class="wizard-steps-bar" aria-label="Progreso del comprobante">
        <div class="wizard-step-item" :class="{ active: pasoActual === 1, completed: pasoActual > 1 }">
          <div class="step-number">1</div>
          <div class="step-info">
            <span class="step-label">Paso 1</span>
            <span class="step-name">Cabecera</span>
          </div>
        </div>

        <div class="step-separator"></div>

        <div class="wizard-step-item" :class="{ active: pasoActual === 2, completed: pasoActual > 2 }">
          <div class="step-number">2</div>
          <div class="step-info">
            <span class="step-label">Paso 2</span>
            <span class="step-name">Movimientos (Asiento)</span>
          </div>
        </div>

        <div class="step-separator"></div>

        <div class="wizard-step-item" :class="{ active: pasoActual === 3 }">
          <div class="step-number">3</div>
          <div class="step-info">
            <span class="step-label">Paso 3</span>
            <span class="step-name">Resumen y Registro</span>
          </div>
        </div>
      </nav>

      <!-- ========================================================
           PASO 1: CABECERA Y DATOS GENERALES
           ======================================================== -->
      <section v-if="pasoActual === 1" class="wizard-content-card">
        <div class="wizard-step-header">
          <h2 class="step-heading">Información del Comprobante</h2>
          <p class="step-subheading">Ingresa el NIT del tercero, las observaciones y la fecha contable.</p>
        </div>

        <div v-if="errorPaso1" class="balance-status-box unbalanced">
          <span>⚠️ {{ errorPaso1 }}</span>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="nit">NIT Tercero <span class="required-star">*</span></label>
            <input
              id="nit"
              v-model="cabecera.nitTercero"
              type="text"
              class="input-field"
              placeholder="Ej. 900123456"
              required
            />
          </div>

          <div class="form-group">
            <label for="obs">Observaciones <span class="required-star">*</span></label>
            <textarea
              id="obs"
              v-model="cabecera.observaciones"
              class="input-field"
              placeholder="Descripción general del comprobante contable..."
              rows="3"
              required
            ></textarea>
          </div>
        </div>

        <!-- Pregunta interactiva de fecha -->
        <div class="date-toggle-box">
          <div class="date-question">
            <span class="date-question-text">
              📅 La fecha por defecto es la actual. ¿Deseas ingresar una fecha diferente?
            </span>
            <div class="radio-pills">
              <button
                type="button"
                class="radio-btn"
                :class="{ active: !cabecera.usarFechaManual }"
                @click="cabecera.usarFechaManual = false"
              >
                No (Fecha actual)
              </button>
              <button
                type="button"
                class="radio-btn"
                :class="{ active: cabecera.usarFechaManual }"
                @click="cabecera.usarFechaManual = true"
              >
                Sí (Elegir fecha)
              </button>
            </div>
          </div>

          <div v-if="cabecera.usarFechaManual" class="form-group" style="max-width: 280px;">
            <label for="fechaManual">Seleccionar Fecha Contable:</label>
            <input
              id="fechaManual"
              v-model="cabecera.fecha"
              type="date"
              class="input-field"
            />
          </div>
        </div>

        <div class="wizard-footer">
          <div></div>
          <button type="button" class="btn-wizard-next" @click="avanzarPaso1">
            <span>Siguiente: Movimientos</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </section>

      <!-- ========================================================
           PASO 2: GESTIÓN DE MOVIMIENTOS Y ASIENTO CONTABLE
           ======================================================== -->
      <section v-if="pasoActual === 2" class="wizard-content-card">
        <div class="wizard-step-header">
          <h2 class="step-heading">Asiento Contable y Movimientos</h2>
          <p class="step-subheading">
            Digita los movimientos. Mínimo {{ minimoMovimientosRequeridos }} registros requeridos
            <span v-if="hayCuentaRFConBase">(3 debido a cuentas de retención RF)</span>.
            El débito debe ser exactamente igual al crédito.
          </p>
        </div>

        <div class="movimientos-layout">
          <!-- CASO A: BUSCADOR DE CUENTA (Si no hay cuenta seleccionada actualmente) -->
          <div v-if="!cuentaSeleccionada" class="buscador-cuenta-section">
            <div class="buscador-selector-bar">
              <span class="selector-label">Buscar cuenta por:</span>
              <div class="selector-buttons">
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: modoBusquedaCuenta === 'codigo' }"
                  @click="modoBusquedaCuenta = 'codigo'"
                >
                  Número / Código
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: modoBusquedaCuenta === 'tipo' }"
                  @click="modoBusquedaCuenta = 'tipo'"
                >
                  Tipo / Título de Cuenta
                </button>
              </div>

              <!-- Filtro de Naturaleza -->
              <div class="naturaleza-filter-wrapper">
                <label for="naturaleza-select" class="selector-label">Naturaleza:</label>
                <select id="naturaleza-select" v-model="naturalezaSeleccionada" class="filter-select">
                  <option value="todas">Todas las naturalezas</option>
                  <option value="Naturaleza Débito">Naturaleza Débito</option>
                  <option value="Naturaleza Crédito">Naturaleza Crédito</option>
                  <option value="Naturaleza Especial">Naturaleza Especial</option>
                </select>
              </div>
            </div>

            <div class="search-cuenta-input-wrapper">
              <svg class="search-cuenta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                v-model="queryBusquedaCuenta"
                type="text"
                class="search-cuenta-input"
                :placeholder="modoBusquedaCuenta === 'codigo' ? 'Escribe el número o nombre de la cuenta (ej. 15281001, Teléfono, Equipo)...' : 'Escribe el tipo o nombre de la cuenta (ej. Activo Fijo, Gastos, Teléfono)...'"
              />
            </div>

            <!-- Grid de Cards de Cuentas PUC encontradas -->
            <div class="cuentas-results-grid" v-if="cuentasFiltradas.length > 0">
              <article
                v-for="c in cuentasFiltradas"
                :key="c.cuenta"
                class="cuenta-card"
              >
                <div class="cuenta-card-header">
                  <span class="cuenta-numero">{{ c.cuenta }}</span>
                  <span class="cuenta-tipo-badge">{{ c.naturaleza }}</span>
                </div>

                <div class="cuenta-descripcion">{{ c.descripcion }}</div>

                <div class="cuenta-tipo-info" v-if="c.tipoTitulo">
                  <span class="tipo-titulo">{{ c.tipoTitulo }}</span>
                  <span class="tipo-detalle" v-if="c.tipoDetalle">{{ c.tipoDetalle }}</span>
                </div>

                <button
                  type="button"
                  class="btn-seleccionar-cuenta"
                  @click="seleccionarCuentaParaMovimiento(c)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Seleccionar Cuenta</span>
                </button>
              </article>
            </div>
            <div v-else style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              No se encontraron cuentas que coincidan con la búsqueda.
            </div>
          </div>

          <!-- CASO B: CUENTA SELECCIONADA -> FORMULARIO CON CAMPOS OBLIGATORIOS -->
          <div v-else class="movimiento-form">
            <!-- Banner de la cuenta elegida con botón para cambiarla -->
            <div class="cuenta-seleccionada-banner">
              <div class="cuenta-sel-info">
                <span class="cuenta-sel-num">Cuenta: {{ cuentaSeleccionada.cuenta }}</span>
                <span class="cuenta-sel-desc">{{ cuentaSeleccionada.descripcion }}</span>
                <span class="cuenta-sel-tipo">{{ cuentaSeleccionada.tipoTitulo }} ({{ cuentaSeleccionada.tipo }})</span>
              </div>
              <button type="button" class="btn-cambiar-cuenta" @click="deseleccionarCuenta">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                <span>Cambiar Cuenta</span>
              </button>
            </div>

            <div v-if="errorFormMovimiento" class="balance-status-box unbalanced">
              <span>⚠️ {{ errorFormMovimiento }}</span>
            </div>

            <!-- Campos Básicos -->
            <div class="form-grid-2">
              <div class="form-group">
                <label for="debito">Débito <span class="required-star">*</span></label>
                <input
                  id="debito"
                  v-model.number="formMovimiento.debito"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input-field"
                  placeholder="0.00"
                />
              </div>

              <div class="form-group">
                <label for="credito">Crédito <span class="required-star">*</span></label>
                <input
                  id="credito"
                  v-model.number="formMovimiento.credito"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input-field"
                  placeholder="0.00"
                />
              </div>

              <div class="form-group">
                <label for="movDesc">Descripción del Movimiento</label>
                <input
                  id="movDesc"
                  v-model="formMovimiento.descripcion"
                  type="text"
                  class="input-field"
                  placeholder="Ej. Entrada de mercancía, Pago factura..."
                />
              </div>

              <div class="form-group">
                <label for="cruce">Cruce (Opcional - Uniforme en todos)</label>
                <input
                  id="cruce"
                  v-model="formMovimiento.cruce"
                  type="text"
                  class="input-field"
                  placeholder="Ej. 1050"
                />
              </div>
            </div>

            <!-- Campos Condicionales según reglas del backend -->
            <div class="form-grid-2">
              <!-- Base (Obligatorio si RF y basertncion = true) -->
              <div class="form-group" v-if="cuentaSeleccionada.requiereBase">
                <label for="base">Base de Retención <span class="required-star">* (Obligatorio RF)</span></label>
                <input
                  id="base"
                  v-model.number="formMovimiento.base"
                  type="number"
                  step="0.01"
                  class="input-field"
                  placeholder="Monto base de retención"
                  required
                />
              </div>

              <!-- Departamento y Centro de Costo (Obligatorio si dprtmntocsto = true) -->
              <template v-if="cuentaSeleccionada.requiereDeptoCosto">
                <div class="form-group">
                  <label for="depto">Departamento <span class="required-star">* (Obligatorio)</span></label>
                  <input
                    id="depto"
                    v-model="formMovimiento.departamento"
                    type="number"
                    class="input-field"
                    placeholder="Código departamento"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="costo">Centro de Costo <span class="required-star">* (Obligatorio)</span></label>
                  <input
                    id="costo"
                    v-model="formMovimiento.cCosto"
                    type="number"
                    class="input-field"
                    placeholder="Código centro de costo"
                    required
                  />
                </div>
              </template>

              <!-- Proyecto y Actividad (Obligatorio si jbno = true) -->
              <template v-if="cuentaSeleccionada.requiereProyectoActividad">
                <div class="form-group">
                  <label for="proy">Proyecto <span class="required-star">* (Obligatorio)</span></label>
                  <input
                    id="proy"
                    v-model="formMovimiento.proyecto"
                    type="text"
                    class="input-field"
                    placeholder="Nombre o código de proyecto"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="act">Actividad <span class="required-star">* (Obligatorio)</span></label>
                  <input
                    id="act"
                    v-model="formMovimiento.actividad"
                    type="text"
                    class="input-field"
                    placeholder="Código de actividad"
                    required
                  />
                </div>
              </template>
            </div>

            <div class="form-actions-row">
              <button
                type="button"
                class="btn-cancelar-edicion"
                v-if="indexMovimientoEditando !== null"
                @click="limpiarFormularioMovimiento"
              >
                Cancelar Edición
              </button>
              <button type="button" class="btn-agregar-mov" @click="guardarMovimiento">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{{ indexMovimientoEditando !== null ? 'Actualizar Movimiento' : 'Agregar Movimiento al Asiento' }}</span>
              </button>
            </div>
          </div>

          <!-- TABLA DEL ASIENTO CONTABLE (Cuenta, Débito, Crédito + Totales) -->
          <div class="asiento-table-container">
            <div class="asiento-table-header">
              <h3 class="asiento-title">Movimientos Registrados ({{ movimientos.length }})</h3>
              <div v-if="indexMovimientoEditando !== null" style="font-size: 0.85rem; color: var(--primary); font-weight: 700;">
                ✏️ Editando fila #{{ indexMovimientoEditando + 1 }}
              </div>
            </div>

            <table class="asiento-table" v-if="movimientos.length > 0">
              <thead>
                <tr>
                  <th style="width: 45%;">Cuenta PUC</th>
                  <th class="col-num" style="width: 20%;">Débito</th>
                  <th class="col-num" style="width: 20%;">Crédito</th>
                  <th style="width: 15%; text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(m, i) in movimientos"
                  :key="i"
                  :class="{ 'editing-row': indexMovimientoEditando === i }"
                  @click="editarMovimiento(i)"
                  title="Haz clic para editar esta fila"
                >
                  <td>
                    <div class="cuenta-row-detalle">
                      <span class="cuenta-row-code">{{ m.cuentaPuc }}</span>
                      <span class="cuenta-row-desc">{{ m.descripcionCuenta }} - {{ m.descripcion }}</span>
                    </div>
                  </td>
                  <td class="col-num" style="color: var(--income); font-weight: 700;">
                    {{ formatearMoneda(m.debito) }}
                  </td>
                  <td class="col-num" style="color: var(--expense); font-weight: 700;">
                    {{ formatearMoneda(m.credito) }}
                  </td>
                  <td @click.stop>
                    <div class="row-actions">
                      <button type="button" class="btn-row-action" @click="editarMovimiento(i)" title="Editar">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button type="button" class="btn-row-action delete" @click="eliminarMovimiento(i)" title="Eliminar">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>TOTALES</td>
                  <td class="col-num" style="color: var(--income);">
                    {{ formatearMoneda(totalDebito) }}
                  </td>
                  <td class="col-num" style="color: var(--expense);">
                    {{ formatearMoneda(totalCredito) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            <div v-else style="text-align: center; color: var(--text-muted); padding: 2rem;">
              No hay movimientos en el asiento. Selecciona una cuenta arriba para comenzar a digitar.
            </div>

            <!-- Estado de Cuadre del Asiento -->
            <div
              class="balance-status-box"
              :class="asientoBalanceado ? 'balanced' : 'unbalanced'"
              v-if="movimientos.length > 0"
            >
              <div v-if="asientoBalanceado">
                ✅ Asiento Cuadrado (Partida Doble Correcta)
              </div>
              <div v-else>
                ❌ Asiento Descuadrado: Diferencia de {{ formatearMoneda(diferenciaAsiento) }}
              </div>

              <div style="font-size: 0.85rem;">
                <span v-if="!cumpleMinimoMovimientos">
                  ⚠️ Se requieren mínimo {{ minimoMovimientosRequeridos }} movimientos.
                </span>
                <span v-else-if="!crucesValidos">
                  ⚠️ Si se especifica cruce, debe ser el mismo número en todos los movimientos.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-footer">
          <button type="button" class="btn-wizard-prev" @click="pasoActual = 1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Anterior: Cabecera</span>
          </button>

          <button
            type="button"
            class="btn-wizard-next"
            :disabled="!paso2Valido"
            @click="avanzarPaso2"
          >
            <span>Siguiente: Resumen</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </section>

      <!-- ========================================================
           PASO 3: RESUMEN Y REGISTRO FINAL
           ======================================================== -->
      <section v-if="pasoActual === 3" class="wizard-content-card">
        <div class="wizard-step-header">
          <h2 class="step-heading">Resumen del Comprobante</h2>
          <p class="step-subheading">Verifica toda la información antes de asentar el comprobante en el sistema.</p>
        </div>

        <div v-if="errorEnvio" class="balance-status-box unbalanced">
          <span>❌ {{ errorEnvio }}</span>
        </div>
        <div v-if="exitoEnvio" class="balance-status-box balanced">
          <span>🎉 {{ exitoEnvio }}</span>
        </div>

        <div class="resumen-card">
          <div class="resumen-section">
            <h3 class="resumen-section-title">Datos Generales</h3>
            <div class="resumen-grid-info">
              <div>
                <span class="field-label">NIT Tercero:</span>
                <p class="field-value highlight">{{ cabecera.nitTercero }}</p>
              </div>
              <div>
                <span class="field-label">Fecha Contable:</span>
                <p class="field-value">
                  {{ cabecera.usarFechaManual ? cabecera.fecha : 'Actual (Automática del servidor)' }}
                </p>
              </div>
              <div style="grid-column: 1 / -1;">
                <span class="field-label">Observaciones:</span>
                <p class="field-value">{{ cabecera.observaciones }}</p>
              </div>
            </div>
          </div>

          <div class="resumen-section">
            <h3 class="resumen-section-title">Asiento Contable ({{ movimientos.length }} Movimientos)</h3>
            <table class="asiento-table">
              <thead>
                <tr>
                  <th>Cuenta PUC</th>
                  <th>Descripción</th>
                  <th class="col-num">Débito</th>
                  <th class="col-num">Crédito</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in movimientos" :key="i">
                  <td><strong>{{ m.cuentaPuc }}</strong> ({{ m.descripcionCuenta }})</td>
                  <td>{{ m.descripcion }}</td>
                  <td class="col-num" style="color: var(--income); font-weight: 700;">{{ formatearMoneda(m.debito) }}</td>
                  <td class="col-num" style="color: var(--expense); font-weight: 700;">{{ formatearMoneda(m.credito) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2">TOTAL CUADRADO</td>
                  <td class="col-num" style="color: var(--income);">{{ formatearMoneda(totalDebito) }}</td>
                  <td class="col-num" style="color: var(--expense);">{{ formatearMoneda(totalCredito) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="wizard-footer">
          <button
            type="button"
            class="btn-wizard-prev"
            :disabled="enviandoComprobante"
            @click="pasoActual = 2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Anterior: Modificar Asiento</span>
          </button>

          <button
            v-if="!exitoEnvio"
            type="button"
            class="btn-registrar-final"
            :disabled="enviandoComprobante"
            @click="mostrarModalConfirmacion = true"
          >
            <span v-if="!enviandoComprobante">Registrar Comprobante</span>
            <span v-else>Guardando...</span>
          </button>

          <button
            v-else
            type="button"
            class="btn-registrar-final"
            @click="reiniciarFormulario"
          >
            Registrar Otro Comprobante
          </button>
        </div>
      </section>
    </main>

    <!-- MODAL DE CONFIRMACIÓN AL REGISTRAR -->
    <div v-if="mostrarModalConfirmacion" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-dialog-header">
          <div class="modal-icon-wrapper">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="modal-title">¿Confirmar Registro?</h3>
        </div>

        <p class="modal-body-text">
          ¿Estás seguro de registrar este comprobante contable para el NIT <strong>{{ cabecera.nitTercero }}</strong>
          con un valor total de <strong>{{ formatearMoneda(totalDebito) }}</strong>?
          Una vez asentado, los movimientos afectarán el catálogo contable.
        </p>

        <div class="modal-dialog-actions">
          <button type="button" class="btn-modal-cancel" @click="mostrarModalConfirmacion = false">
            Cancelar
          </button>
          <button type="button" class="btn-modal-confirm" @click="confirmarYRegistrar">
            Sí, Registrar Comprobante
          </button>
        </div>
      </div>
    </div>

    <!-- PANTALLA DE CARGA BLOQUEANTE MIENTRAS SE GUARDA EN EL SERVIDOR -->
    <div v-if="enviandoComprobante" class="loading-overlay" aria-live="assertive" role="alert">
      <div class="loading-modal">
        <div class="spinner"></div>
        <p class="loading-text">Asentando comprobante contable...</p>
        <p class="loading-subtext">Por favor espere mientras el servidor registra el lote</p>
      </div>
    </div>

    <!-- MODAL DE ÉXITO CON BATCH Y REDIRECCIÓN AL INICIO -->
    <div v-if="mostrarModalExito" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-dialog-header">
          <div class="modal-icon-wrapper success">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 class="modal-title">¡Comprobante Registrado!</h3>
        </div>

        <div class="modal-body-text">
          <p>{{ exitoEnvio }}</p>
          <div class="batch-result-highlight" v-if="batchRegistrado">
            <span class="batch-label">Número de Batch Asignado</span>
            <span class="batch-number">#{{ batchRegistrado }}</span>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.5rem;">
            Presiona OK para regresar a la pantalla de inicio.
          </p>
        </div>

        <div class="modal-dialog-actions">
          <button type="button" class="btn-modal-confirm" @click="aceptarExitoEIrAInicio">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../styles/digitarComprobante.css"></style>
