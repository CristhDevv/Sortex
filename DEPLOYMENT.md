# Guía de Despliegue Definitiva - SORTEX PWA

Este documento detalla los pasos finales para llevar Sortex a producción.

## 1. Variables de Entorno en Vercel

Configura estas variables en el dashboard de Vercel:

| Nombre | Valor |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key (Public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (**Privada**) |
| `VENDOR_JWT_SECRET` | String aleatorio (ej: `openssl rand -base64 32`) |

## 2. Preparación de Base de Datos (Supabase)

Ejecuta este SQL completo para inicializar la estructura:

```sql
-- Tablas Principales
CREATE TABLE vendors (...);
CREATE TABLE daily_assignments (...);
CREATE TABLE reports (...);
CREATE TABLE liquidations (...);
CREATE TABLE login_attempts (...);

-- RLS (Habilitar Seguridad)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Admin All" ON vendors FOR ALL USING (auth.role() = 'authenticated');
-- (Repetir para todas las tablas)
```

## 3. Almacenamiento (Storage)

1. Crea el bucket `reports-photos`.
2. Configúralo como **Privado**.
3. No requiere políticas adicionales; el sistema usa Signed URLs (vencimiento 60s) para la visualización segura del admin.

## 4. Optimización PWA

- El proyecto ya genera automáticamente `sw.js` en el build.
- Asegúrate de subir iconos de 192x192 y 512x512 a `/public/icons/` con los nombres `icon-192x192.png` y `icon-512x512.png`.

## 5. Mantenimiento

- **Limpieza de Intentos:** Se recomienda un cron job que limpie la tabla `login_attempts` cada 24 horas, aunque el sistema está diseñado para manejar el volumen actual sin problemas.
- **Zona Horaria:** El sistema utiliza `America/Bogota` por defecto. Si el negocio opera en otra zona, ajusta la constante `TIMEZONE` en los archivos de `/src/app/actions/`.

---
© 2026 Sortex Deployment Guide.
