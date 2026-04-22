# Sortex - Sistema de Gestión de Lotería PWA

Sortex es una Progressive Web App (PWA) de alto rendimiento diseñada para la gestión segura y eficiente de negocios de lotería. Permite el control total de vendedores, asignaciones diarias de boletería, auditoría fotográfica de reportes y liquidaciones financieras automatizadas.

## 🚀 Tecnologías Principales

- **Frontend:** Next.js 14 (App Router) con Tailwind CSS.
- **Backend:** Next.js Server Actions y Supabase (PostgreSQL).
- **Autenticación:** 
  - Admin: Supabase Auth.
  - Vendedores: Custom JWT Auth con PIN hasheado (bcrypt).
- **Seguridad:** Row Level Security (RLS) y Rate Limiting persistente.
- **PWA:** Service Workers con estrategia Network First para uso móvil.
- **Reportes:** jsPDF para PDF y SheetJS para Excel.

## 📂 Estructura del Proyecto

```text
src/
├── app/
│   ├── (auth)/             # Login de Administrador
│   ├── admin/              # Panel de Control (Vendedores, Reportes, Liquidación)
│   ├── vendor/             # Portal del Vendedor (Login, Dashboard, Captura)
│   ├── actions/            # Lógica de servidor (Auth, DB, Storage)
│   └── layout.tsx          # Configuración global y fuentes
├── lib/
│   └── supabase.ts         # Clientes de Supabase (Anon y Admin)
├── middleware.ts           # Protección de rutas Admin y Vendor
public/
├── icons/                  # Iconos de la PWA
└── manifest.json           # Configuración de instalación PWA
```

## 🛠️ Instalación Local

1.  **Clonar el repositorio:**
    ```bash
    git clone [url-del-repo]
    cd sortex
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` con las llaves de tu proyecto Supabase (ver `DEPLOYMENT.md`).

4.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```

## 🔐 Credenciales de Prueba (Demo)

### Administrador
- **URL:** `/login`
- **Email:** `admin@sortex.com` (Debes crearlo en Supabase Auth)
- **Contraseña:** `sortex2026`

### Vendedor (Ejemplo)
- **URL:** `/vendor/login`
- **Alias:** `vendedor1`
- **PIN:** `1234`

## 📝 Instrucciones para el Administrador

1.  **Crear el primer Vendedor:**
    - Ve a `/admin/vendors`.
    - Haz clic en "Agregar Vendedor".
    - Ingresa un Nombre, un Alias único y un PIN de 4 dígitos.
    - Asegúrate de que el estado sea "Activo".
2.  **Asignación Diaria:**
    - Ve a `/admin/assignments`.
    - Selecciona el vendedor y la fecha.
    - Ingresa la cantidad de boletas entregadas y el valor por boleta.
3.  **Liquidación:**
    - Al final del día, revisa los reportes fotográficos en `/admin/reports`.
    - En `/admin/liquidations`, ingresa las boletas devueltas según la foto y confirma el cobro.

---
© 2026 Sortex - Gestión Profesional de Lotería.
