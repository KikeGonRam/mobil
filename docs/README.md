# 📱 Proyecto Mobile - UrbanBlade/BarberPro

## Documentación Completa de Implementación

**Fecha de última actualización**: 1 de abril de 2026  
**Versión del proyecto**: 1.0.0  
**Framework**: React Native + Expo  
**Backend**: Laravel 11

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Estructura de Directorios](#estructura-de-directorios)
4. [Endpoints de API Implementados](#endpoints-de-api-implementados)
5. [Pantallas de la Aplicación](#pantallas-de-la-aplicacion)
6. [Componentes Reutilizables](#componentes-reutilizables)
7. [Sistema de Diseño](#sistema-de-diseno)
8. [Fases de Implementación](#fases-de-implementacion)
9. [Guía de Pruebas](#guia-de-pruebas)
10. [Despliegue](#despliegue)
11. [Mantenimiento](#mantenimiento)

---

## Fases Recientes

- [Fase 7 - Flujo principal, menu moderno y tema claro/oscuro](fase-7-flujo-landing-tema-menu.md)
- [Fase 8 - Vistas faltantes (admin inicial)](fase-8-vistas-faltantes-admin.md)
- [Fase 9 - Inventario y pagos](fase-9-inventario-pagos.md)
- [Fase 10 - Usuarios y clientes](fase-10-usuarios-clientes.md)

---

## 📊 Resumen Ejecutivo

### Estado del Proyecto

| Categoría | Progreso | Estado |
|-----------|----------|--------|
| **Autenticación** | 100% | ✅ Completo |
| **Gestión de Citas** | 100% | ✅ Completo |
| **Perfil de Usuario** | 100% | ✅ Completo |
| **Notificaciones** | 100% | ✅ Completo |
| **Portafolio (Barberos)** | 100% | ✅ Completo |
| **Dashboard** | 100% | ✅ Completo |
| **Catálogo** | 100% | ✅ Completo |
| **Diseño Consistente** | 100% | ✅ Completo |

### Funcionalidades Principales

1. **Autenticación con Laravel Sanctum**
   - Login con email/password
   - Tokens persistentes
   - Cierre de sesión

2. **Gestión de Citas**
   - Ver citas agendadas
   - Cancelar citas (clientes)
   - Actualizar estado (barberos)
   - Crear nuevas citas

3. **Perfil de Usuario**
   - Editar nombre y email
   - Cambiar contraseña
   - Eliminar cuenta

4. **Notificaciones**
   - Listar notificaciones
   - Marcar como leídas
   - Navegar desde notificación

5. **Portafolio (Barberos)**
   - Ver trabajos subidos
   - Galería de imágenes

---

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

```
Frontend Mobile
├── React Native 0.81.5
├── Expo SDK ~54.0.33
├── expo-router (navegación)
├── TypeScript ~5.9.2
└── React 19.1.0

Backend
├── Laravel 11
├── Sanctum (autenticación)
├── MySQL/PostgreSQL
└── API RESTful
```

### Flujo de Datos

```
┌─────────────┐      HTTP/JSON      ┌─────────────┐
│   Mobile    │ ←──────────────────→ │   Laravel   │
│   (Expo)    │      Bearer Token    │   (API)     │
└─────────────┘                     └─────────────┘
       │                                   │
       ▼                                   ▼
  AsyncStorage                        MySQL/PG
  (Token, User)                      (Datos)
```

---

## 📁 Estructura de Directorios

```
urbanblade/
├── app/                          # expo-router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── index.tsx             # Dashboard
│   │   ├── reservas.tsx          # Reservar cita
│   │   ├── cuenta.tsx            # Cuenta/Perfil
│   │   └── explore.tsx           # Catálogo
│   ├── appointments/
│   │   └── [id].tsx              # Detalle de cita
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry point
│   ├── login.tsx                 # Login
│   ├── notificaciones.tsx        # Notificaciones
│   ├── perfil.tsx                # Editar perfil
│   └── portafolio.tsx            # Portafolio barbero
├── components/
│   ├── ui/                       # UI components
│   ├── themed-text.tsx           # Texto temático
│   └── themed-view.tsx           # Vista temática
├── constants/
│   ├── config.ts                 # Configuración (API URL)
│   └── theme.ts                  # Colores, branding
├── contexts/
│   └── auth-context.tsx          # Auth provider
├── hooks/
│   ├── use-color-scheme.ts       # Dark/light mode
│   └── use-storage-state.ts      # AsyncStorage
├── lib/
│   └── api.ts                    # API client + types
├── docs/                         # Documentación
│   ├── fase-1-cancelar-citas.md
│   ├── fase-3-actualizar-estado-citas.md
│   ├── fase-4-notificaciones.md
│   ├── fase-6-portafolio-barbero.md
│   ├── fase-7-flujo-landing-tema-menu.md
│   ├── fase-8-vistas-faltantes-admin.md
│   ├── fase-9-inventario-pagos.md
│   ├── fase-10-usuarios-clientes.md
│   └── README.md (este archivo)
└── package.json
```

---

## 🔌 Endpoints de API Implementados

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Login usuario | ❌ |
| GET | `/api/v1/auth/me` | Obtener usuario actual | ✅ |
| POST | `/api/v1/auth/logout` | Cerrar sesión | ✅ |

### Citas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/appointments` | Listar citas | ✅ |
| POST | `/api/v1/appointments` | Crear cita | ✅ |
| DELETE | `/api/v1/appointments/{id}` | Cancelar cita | ✅ |
| PATCH | `/api/v1/appointments/{id}/status` | Actualizar estado | ✅ |

### Catálogo

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/services` | Listar servicios | ❌ |
| GET | `/api/v1/barbers` | Listar barberos | ❌ |
| GET | `/api/v1/availability/slots` | Disponibilidad | ✅ |

### Dashboard

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/dashboard` | Métricas dashboard | ✅ |

### Notificaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/notifications` | Listar notificaciones | ✅ |
| POST | `/api/v1/notifications/read-all` | Marcar como leídas | ✅ |

### Portafolio

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/barbers/{id}/portfolio` | Listar portafolio | ✅ |

---

## 📱 Pantallas de la Aplicación

### 1. Login (`/login`)
- Formulario email/password
- Validación de credenciales
- Redirección automática

### 2. Dashboard (`/(tabs)/`)
- KPIs principales
- Próximas citas
- Métricas por rol

### 3. Reservas (`/(tabs)/reservas`)
- Selección de servicio
- Selección de barbero
- Fecha y hora
- Confirmación

### 4. Cuenta (`/(tabs)/cuenta`)
- Información de usuario
- Lista de citas
- Botones de acción
- Badge de notificaciones

### 5. Explorar (`/(tabs)/explore`)
- Catálogo de servicios
- Lista de barberos
- Pull-to-refresh

### 6. Detalle de Cita (`/appointments/[id]`)
- Información completa
- Estado actual
- Botones de estado (barberos)
- Notas y detalles

### 7. Perfil (`/perfil`)
- Editar nombre/email
- Cambiar contraseña
- Eliminar cuenta

### 8. Notificaciones (`/notificaciones`)
- Lista de notificaciones
- Marcar como leídas
- Navegación contextual

### 9. Portafolio (`/portafolio`)
- Galería de trabajos
- Solo para barberos
- Imágenes y descripciones

---

## 🧩 Componentes Reutilizables

### Core Components

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `ThemedText` | `components/themed-text.tsx` | Texto con soporte dark/light |
| `ThemedView` | `components/themed-view.tsx` | View con soporte dark/light |
| `IconSymbol` | `components/ui/icon-symbol.tsx` | Iconos cross-platform |

### UI Components

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `Collapsible` | `components/ui/collapsible.tsx` | Contenedor expandible |
| `HapticTab` | `components/haptic-tab.tsx` | Tab con feedback háptico |
| `ExternalLink` | `components/external-link.tsx` | Links externos |

---

## 🎨 Sistema de Diseño

### Paleta de Colores

```typescript
const Brand = {
  gold: '#d4af37',        // Color principal
  goldDim: '#aa8c2c',     // Gold oscuro
  bgMain: '#0a0a0a',      // Fondo principal
  bgCard: '#141414',      // Fondo tarjetas
  bgAccent: '#1e1e1e',    // Fondo secundario
  line: '#333333',        // Bordes
  muted: '#b0b0b0',       // Texto secundario
};
```

### Tipografía

| Estilo | Tamaño | Peso | Uso |
|--------|--------|------|-----|
| Title | 28px | 900 | Títulos principales |
| Subtitle | 18px | 800 | Subtítulos |
| Default | 15px | 400 | Texto normal |
| Default SemiBold | 15px | 600 | Texto destacado |
| Label | 11px | 700 | Etiquetas |

### Border Radius

| Elemento | Radio |
|----------|-------|
| Cards | 20-24px |
| Botones | 16-18px |
| Pills | 999px |
| Iconos | 12-16px |

---

## 🚀 Fases de Implementación

### ✅ Fase 1: Cancelar Citas
- Endpoint: `DELETE /api/v1/appointments/{id}`
- Pantalla: `cuenta.tsx`
- Ver documentación: [fase-1-cancelar-citas.md](./fase-1-cancelar-citas.md)

### ✅ Fase 2: Editar Perfil
- Endpoints: `PATCH /api/v1/profile`, `DELETE /api/v1/profile`
- Pantalla: `perfil.tsx`
- Ver documentación: [fase-2-editar-perfil.md](./fase-2-editar-perfil.md)

### ✅ Fase 3: Actualizar Estado de Citas
- Endpoint: `PATCH /api/v1/appointments/{id}/status`
- Pantalla: `appointments/[id].tsx`
- Ver documentación: [fase-3-actualizar-estado-citas.md](./fase-3-actualizar-estado-citas.md)

### ✅ Fase 4: Notificaciones
- Endpoints: `GET /api/v1/notifications`, `POST /api/v1/notifications/read-all`
- Pantalla: `notificaciones.tsx`
- Ver documentación: [fase-4-notificaciones.md](./fase-4-notificaciones.md)

### ✅ Fase 5: Detalle de Cita
- Navegación dinámica con expo-router
- Pantalla: `appointments/[id].tsx`
- Incluido en Fase 3

### ✅ Fase 6: Portafolio del Barbero
- Endpoint: `GET /api/v1/barbers/{id}/portfolio`
- Pantalla: `portafolio.tsx`
- Ver documentación: [fase-6-portafolio-barbero.md](./fase-6-portafolio-barbero.md)

### ✅ Fase 7: Documentación Final
- Este archivo README.md
- Consolidación de todas las fases
- Guía completa de referencia

---

## 🧪 Guía de Pruebas

### Prerequisites

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar EXPO_PUBLIC_API_URL

# Ejecutar en desarrollo
npm run android
# o
npm run ios
```

### Test Cases por Funcionalidad

#### Autenticación
- [ ] Login con credenciales válidas
- [ ] Login con credenciales inválidas
- [ ] Logout
- [ ] Persistencia de sesión

#### Citas
- [ ] Listar citas
- [ ] Crear cita
- [ ] Cancelar cita
- [ ] Actualizar estado (barbero)
- [ ] Ver detalle de cita

#### Perfil
- [ ] Editar nombre
- [ ] Editar email
- [ ] Cambiar contraseña
- [ ] Eliminar cuenta

#### Notificaciones
- [ ] Listar notificaciones
- [ ] Marcar como leídas
- [ ] Navegar desde notificación

#### Portafolio
- [ ] Ver portafolio (barbero)
- [ ] Acceso restringido (no barbero)

---

## 📦 Despliegue

### Build de Producción

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Web
eas build --platform web
```

### Configuración Requerida

1. **API URL**: Configurar en `constants/config.ts`
2. **App Icon**: Actualizar en `assets/images/`
3. **Splash Screen**: Personalizar en `assets/images/`
4. **App Name**: Configurar en `app.json`

---

## 🔧 Mantenimiento

### Actualización de Dependencias

```bash
# Verificar actualizaciones
npx npm-check-updates

# Actualizar
npx npm-check-updates -u
npm install
```

### Limpieza de Caché

```bash
# Expo cache
npx expo start -c

# Node modules
rm -rf node_modules
npm install
```

---

## 📞 Soporte

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| API no conecta | Verificar URL en `config.ts` |
| Token expira | Revisar configuración de Sanctum |
| Imágenes no cargan | Verificar URLs absolutas |
| Build falla | Limpiar caché y node_modules |

### Recursos Adicionales

- [Documentación Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)

---

## 📄 Licencia

Propiedad privada - BarberPro/UrbanBlade

---

**Última actualización**: 1 de abril de 2026  
**Versión**: 1.0.0  
**Mantenido por**: Equipo de Desarrollo
