# ContarERP - Comprobante Contable

Este proyecto es una aplicación web para la gestión integral de comprobantes contables en ContarERP, construida con arquitectura modular, desacoplamiento estricto de estilos y diseño responsivo para desktop y dispositivos móviles.

---

## 🛠️ Tecnologías y Arquitectura

- **Framework:** Vue 3 (Composition API con `<script setup>`).
- **Estado Global:** Pinia con persistencia (`pinia-plugin-persistedstate`).
- **Enrutamiento:** Vue Router (Configurado con `createWebHashHistory`).
- **Comunicación API:** Axios centralizado con interceptores automáticos de autenticación (`x-token` y `Authorization: Bearer <token>`).
- **Bundler:** Vite.

### Estructura de Directorios Clave
- `src/plugins/axios.js`: Configuración centralizada de Axios con detección de entornos (Local: `http://localhost:49256/api`, Producción: `https://api.contar.co/api`) y headers de token.
- `src/services/apiCliente.js`: Abstracción HTTP con funciones `getData`, `postData`, `putData`, `deleteData` (soporte de query params y JSON body en GET/POST).
- `src/stores/Auth.js`: Store de Pinia con persistencia para sesión (`token`, `userName`, `nombre`, `empresa`).
- `src/router/router.js`: Definición de rutas principales (`/`, `/login`, `/comprobanteContable`, `/digitarComprobante`, `/buscarComprobante`).
- `src/views/`: Componentes de vista (sin bloques `<style>` internos).
- `src/styles/`: Archivos CSS separados correspondientes a cada componente de vista y estilos globales.

---

## 🧭 Módulos y Flujos Implementados

### 1. Inicio (`/`)
- **Archivos:** `src/views/inicio.vue`, `src/styles/inicio.css`.
- Bienvenida institucional a ContarERP con fondos degradados ambientales.
- Barra superior con **menú hamburguesa** que abre un drawer lateral de módulos.
- Grid modular de tarjetas de acceso directo con animaciones interactivas (`hover` con destello radial y elevación).
- Redirección inteligente: si ya existe token activo en el store, ingresa directamente a `/comprobanteContable`; si no, redirige a `/login`.

### 2. Autenticación (`/login`)
- **Archivos:** `src/views/login.vue`, `src/styles/login.css`.
- Formulario de credenciales con el orden:
  1. **Empresa** (`Empresa`)
  2. **Usuario** (`userName`)
  3. **Contraseña** (`clave`) con botón toggle de visualización (icono ojo).
- Endpoint: `POST /Auth/login`.
- Pantalla de carga bloqueante (*overlay*) con spinner y backdrop blur mientras el servidor responde.
- Validación defensiva de respuestas (manejo de strings de error plano como `"Datos Incorrectos"` o formatos no estándar).

### 3. Panel de Comprobante Contable (`/comprobanteContable`)
- **Archivos:** `src/views/comprobanteContable.vue`, `src/styles/comprobanteContable.css`.
- Panel principal con información del usuario autenticado, botón para volver a Inicio y botón de cerrar sesión.
- Grid de módulos:
  - **Añadir Comprobante** (redirige a `/digitarComprobante`).
  - **Añadir Comprobante XML** (importación electrónica).
  - **Buscar Comprobante** (redirige a `/buscarComprobante`).

### 4. Digitar Comprobante (`/digitarComprobante`)
- **Archivos:** `src/views/digitarComprobante.vue`, `src/styles/digitarComprobante.css`.
- **Wizard de 3 Pasos:**
  - **Paso 1 (Cabecera):** NIT del tercero, observaciones y selector interactivo de fecha (por defecto actual o selección manual en formato ISO `YYYY-MM-DDT00:00:00`).
  - **Paso 2 (Movimientos y Asiento Contable):**
    - Carga de cuentas PUC y catálogo de naturalezas vía `GET /Contabilidad/CuentasPuc`.
    - Selector de filtro por Naturaleza (*Todas*, *Naturaleza Débito*, *Naturaleza Crédito*, *Naturaleza Especial*).
    - Buscador reactivo por **Número/Código**, **Nombre de la cuenta** (ej. *Teléfono*, *Equipo de telecomunicaciones*) o **Tipo/Título** (ej. *Activo Fijo*, *Bancos*).
    - Formulario dinámico según reglas contables del backend:
      - `base`: obligatorio si la cuenta es de tipo `"RF"` y `"basertncion": "True"`.
      - `departamento` y `cCosto`: obligatorios si `"dprtmntocsto": "True"`.
      - `proyecto` y `actividad`: obligatorios si `"jbno": "True"`.
    - Tabla interactiva de partida doble con cálculo de Débito, Crédito y diferencia en tiempo real.
    - Validación de asiento cuadrado, mínimo de movimientos (mínimo 2, o mínimo 3 si hay cuenta con retención `RF`), y congruencia de número de cruce.
    - Edición y eliminación en caliente de movimientos.
  - **Paso 3 (Resumen y Registro):**
    - Resumen de cabecera y tabla contable.
    - Modal de confirmación previa.
    - Pantalla de carga bloqueante mientras asienta el comprobante.
    - Endpoint: `POST /Contabilidad/ComprobanteContable`.
    - Modal de éxito que extrae y resalta el **Número de Batch** asignado por el servidor, con botón **OK** que redirige automáticamente a `/comprobanteContable`.

### 5. Buscar Comprobante (`/buscarComprobante`)
- **Archivos:** `src/views/buscarComprobante.vue`, `src/styles/buscarComprobante.css`.
- Selector de modo: consulta por **NIT Tercero** o por **Número de Batch**.
- Filtros de fecha en tiempo real: selector de **Año** (2012–2026 o Todos) y selector contextual de **Mes** (Enero–Diciembre).
- Extracción rigurosa de fecha contable para evitar desfasar comprobantes de cierre del 31 de diciembre.
- Endpoint: `GET /Contabilidad/ConsultarComprobante` (con query params `?nitTercero=...` o `?batch=...`).
- Visualización en tarjetas compactas de 2 filas:
  - **Fila 1:** Datos principales destacados (NIT, Cuenta Contable, Batch, Fecha, Débito en verde, Crédito en rojo).
  - **Fila 2:** Detalles complementarios en bloque secundario (Descripción, Base, Invc, Departamento, Centro de Costo, Actividad, Proyecto, Usuario, Fecha del Sistema).

---

## 🎨 Design System 2026

```css
/* ===================================================
   CONTAR ERP - DESIGN SYSTEM 2026
   =================================================== */

:root {

  /* ==========================================
     COLORES PRINCIPALES
     ========================================== */

  --primary: #2E97D4;
  --primary-hover: #2584BC;
  --primary-active: #1F6F9F;
  --primary-light: #66B7E5;

  --secondary: #003756;
  --secondary-hover: #0A4F76;
  --secondary-active: #083B58;
  --secondary-light: #115C86;

  /* ==========================================
     ACCENTS MODERNOS
     ========================================== */

  --accent: #00D4AA;
  --accent-hover: #00BB96;
  --accent-light: #8EF2DC;

  --electric-blue: #00C2FF;
  --electric-blue-light: #8EE5FF;

  /* ==========================================
     GRADIENTES
     ========================================== */

  --gradient-primary:
    linear-gradient(
      135deg,
      #003756 0%,
      #2E97D4 55%,
      #00C2FF 100%
    );

  --gradient-header:
    linear-gradient(
      135deg,
      #003756,
      #005E91,
      #2E97D4
    );

  --gradient-button:
    linear-gradient(
      135deg,
      #2E97D4,
      #00C2FF
    );

  --gradient-accent:
    linear-gradient(
      135deg,
      #00D4AA,
      #00C2FF
    );

  /* ==========================================
     FONDOS
     ========================================== */

  --background: #F7FAFC;
  --background-soft: #F1F5F9;

  --surface: #FFFFFF;
  --surface-hover: #F8FBFD;

  /* ==========================================
     TEXTO
     ========================================== */

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-white: #FFFFFF;

  /* ==========================================
     BORDES
     ========================================== */

  --border: #DCE3EA;
  --border-hover: #C5D0DB;
  --border-focus: #2E97D4;

  /* ==========================================
     ESTADOS
     ========================================== */

  --success: #22C55E;
  --success-bg: #DCFCE7;

  --warning: #F59E0B;
  --warning-bg: #FEF3C7;

  --danger: #EF4444;
  --danger-bg: #FEE2E2;

  --info: #0EA5E9;
  --info-bg: #E0F2FE;

  /* ==========================================
     SOMBRAS
     ========================================== */

  --shadow-sm:
    0 2px 8px rgba(0, 0, 0, 0.05);

  --shadow-md:
    0 8px 24px rgba(0, 55, 86, 0.10);

  --shadow-lg:
    0 12px 40px rgba(46, 151, 212, 0.18);

  --shadow-primary:
    0 8px 30px rgba(46, 151, 212, 0.25);

  /* ==========================================
     DASHBOARD FINANCIERO
     ========================================== */

  --income: #22C55E;
  --expense: #EF4444;
  --balance: #2E97D4;
  --pending: #F59E0B;
}
```

---

## 📜 Reglas de Desarrollo

1. **Separación de Estilos:** Ningún componente de vista (`.vue`) debe incluir etiquetas `<style>` con código embebido. Todos los estilos residen en sus respectivos archivos `.css` en `src/styles/` vinculados mediante `<style src="../styles/..."></style>`.
2. **Peticiones y Endpoints:** Usar siempre los wrappers de `apiCliente.js` con rutas relativas (ej. `/Contabilidad/...`), delegando a `axios.js` la resolución del baseURL (`Local` o `Producción`) y los encabezados de autorización (`x-token` y `Bearer`).
3. **Persistencia de Sesión:** Cualquier estado crítico de usuario debe guardarse en el store de Pinia (`Auth.js`) con persistencia activa.
4. **Responsividad:** Todas las interfaces deben ser completamente adaptables a dispositivos móviles (barras de búsqueda con ancho fluido, botones en nueva fila en pantallas pequeñas, scroll horizontal en tablas y cards compactas).
