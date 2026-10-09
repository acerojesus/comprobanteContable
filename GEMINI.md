# ContarERP - Comprobante Contable

Este proyecto es una aplicación web para la gestión de comprobantes contables, construida con tecnologías modernas y una arquitectura escalable.

## 🛠️ Tecnologías y Arquitectura

- **Framework:** Vue 3 (Composition API)
- **Estado Global:** Pinia con persistencia (`pinia-plugin-persistedstate`).
- **Enrutamiento:** Vue Router (Configurado con `createWebHashHistory`).
- **Comunicación API:** Axios con una instancia centralizada y personalizada.
- **Bundler:** Vite.

### Estructura de Directorios Clave
- `src/plugins/axios.js`: Configuración de Axios con interceptores para manejo de tokens (`x-token`).
- `src/services/apiCliente.js`: Capa de abstracción para peticiones HTTP (GET, POST, PUT, DELETE).
- `src/stores/Auth.js`: Manejo de la sesión y token de autenticación.
- `src/views/`: Componentes de página (actualmente `inicio.vue`).

---

## 🎨 Design System 2026

Los siguientes estilos son los mandatos visuales para el proyecto. Deben usarse preferentemente a través de variables CSS para mantener la consistencia.

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

## 📜 Reglas de Desarrollo

1. **Estilo:** Seguir el Design System 2026 para todos los nuevos componentes.
2. **Peticiones:** Usar siempre los wrappers de `apiCliente.js` para asegurar que el token se envíe correctamente.
3. **Persistencia:** Cualquier estado crítico de usuario debe guardarse en el store de Pinia para que sobreviva a recargas de página.
