# Fase 7 - Flujo principal, menu moderno y tema claro/oscuro

Fecha: 2026-04-01
Estado: Completada

## Objetivo
Alinear el flujo principal de la app movil con Laravel web:
- Ruta principal publica en landing.
- Login como paso secundario.
- Menu movil mas moderno.
- Soporte de tema claro/oscuro/sistema con persistencia.

## Cambios implementados

### 1) Flujo de rutas principal (igual al enfoque web)
- `app/index.tsx` ahora redirige siempre a `/landing`.
- `app/_layout.tsx` usa `anchor: 'landing'`.
- Se agrego `Stack.Screen` para `landing` y `registro`.

### 2) Landing principal movil
- Se reemplazo `app/landing.tsx` por una vista 100% React Native.
- Se eliminaron elementos SVG no compatibles con runtime nativo.
- Se mantuvo estructura publica: descubrir servicios/barberos antes de login.
- CTA condicional:
  - Sin sesion: registro/login.
  - Con sesion: reservar/ir al panel.

### 3) Tema claro/oscuro/sistema
- Nuevo contexto: `contexts/theme-context.tsx`.
- Persistencia de preferencia con `useStorageState` (`urbanblade.theme.mode`).
- Nuevo hook `hooks/use-color-scheme.ts` conectado al contexto.
- `app/_layout.tsx` aplica tema dinamico a `ThemeProvider` + `StatusBar`.
- Boton de cambio de tema en landing y cuenta.

### 4) Menu movil moderno
- `app/(tabs)/_layout.tsx` actualizado:
  - Tab bar flotante, redondeada y con sombra.
  - Mejor espaciado visual para uso movil.
  - Se agrega tab `explore` (Descubrir), alineado con flujo publico.

## Archivos impactados
- `app/index.tsx`
- `app/_layout.tsx`
- `app/landing.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/cuenta.tsx`
- `constants/theme.ts`
- `hooks/use-color-scheme.ts`
- `contexts/theme-context.tsx`

## Verificacion
- Lint y typecheck ejecutados al finalizar esta fase.

## Notas
- El modo claro ya esta soportado en tema de navegacion/componentes tematicos.
- Varias pantallas heredadas usan estilos fijos oscuros; la homogeneizacion total de tema se recomienda en fase posterior de UI sweep.
