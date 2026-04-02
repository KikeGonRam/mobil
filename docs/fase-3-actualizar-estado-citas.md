# Fase 3: Actualizar Estado de Citas (Barberos)

## 📋 Descripción
Implementación de pantalla de detalle de cita y funcionalidad para que los barberos puedan actualizar el estado de las citas asignadas, consumiendo el endpoint `PATCH /api/v1/appointments/{id}/status` del backend Laravel.

## ✅ Cambios Realizados

### 1. Nueva Pantalla: `app/appointments/[id].tsx`

#### Parámetros de Ruta
- `id`: ID numérico de la cita (parámetro dinámico en expo-router)

#### Estados Locales
```typescript
const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
const [loading, setLoading] = useState(true);
const [updating, setUpdating] = useState(false);
```

#### Funciones Principales

**`loadAppointment()`**
- Carga todas las citas del usuario
- Busca la cita específica por ID
- Maneja errores de carga

**`handleUpdateStatus(newStatus)`**
- Muestra confirmación antes de actualizar
- Llama a `api.updateAppointmentStatus`
- Actualiza el estado local optimistamente
- Maneja errores con feedback al usuario

#### UI Components

**Header**
- Título "Detalle de cita"
- Subtítulo descriptivo

**Tarjeta de Estado Actual**
- Badge con color según el estado
- Nombre del estado legible

**Tarjetas de Información**
- Servicio (nombre, precio, duración)
- Fecha y hora (inicio, fin)
- Barbero asignado
- Cliente (si aplica)
- Notas opcionales

**Grid de Estados (solo barberos)**
- 6 botones con los estados posibles
- Estado actual resaltado
- Botones deshabilitados durante actualización
- Colores distintivos por estado

### 2. Actualización de `app/(tabs)/cuenta.tsx`

#### Navegación a Detalle
- Cada cita ahora es un `Pressable`
- Al tocar: navega a `/appointments/{id}`
- Botón "Cancelar cita" evita propagación del evento

#### Cambio de Estructura
```typescript
// Antes: <View> estático
// Ahora: <Pressable> navegable
<Pressable
  key={String(appointment.id)}
  onPress={() => router.push(`/appointments/${appointment.id}`)}
  style={styles.listItem}>
```

### 3. API: `lib/api.ts` (Fase 1)
Ya se había agregado el método `updateAppointmentStatus`:

```typescript
updateAppointmentStatus: (
  token: string,
  appointmentId: number,
  payload: { estado: string; notas?: string }
) =>
  request<{ message: string; data: AppointmentRecord }>(
    `/appointments/${appointmentId}/status`, 
    { token, method: 'PATCH', body: payload }
  ),
```

## 🎨 Estados Disponibles

| Estado | Color | Descripción |
|--------|-------|-------------|
| `pendiente` | Amarillo `#fbbf24` | Cita recién agendada |
| `confirmada` | Azul `#60a5fa` | Cliente confirmó asistencia |
| `en_proceso` | Morado `#a78bfa` | Servicio en ejecución |
| `completada` | Verde `#34d399` | Servicio finalizado |
| `cancelada` | Rojo `#f87171` | Cita cancelada |
| `no_asistio` | Gris `#9ca3af` | Cliente no llegó |

## 🔒 Reglas de Negocio

### ¿Quién puede actualizar estados?
- **Barbero asignado**: Solo puede actualizar citas donde es el barbero asignado
- **Administrador**: No tiene acceso desde esta pantalla (solo web)

### Flujo Típico de Estados
```
pendiente → confirmada → en_proceso → completada
     ↓
cancelada
```

### Validaciones
- Solo el barbero asignado ve los botones de estado
- El estado actual aparece deshabilitado (ya está activo)
- Se muestra confirmación antes de cambiar estado
- Loading state durante la actualización

## 📱 Estructura de la Pantalla

```
┌─────────────────────────────────┐
│  Detalle de cita                │
│  Información completa...        │
├─────────────────────────────────┤
│  Estado actual: [Completada] ✓  │
├─────────────────────────────────┤
│  Servicio                       │
│  • Nombre: Corte Clásico        │
│  • Precio: $250.00 MXN          │
│  • Duración: 30 min             │
├─────────────────────────────────┤
│  Fecha y hora                   │
│  • Fecha: 2026-04-03            │
│  • Hora inicio: 10:00           │
│  • Hora fin: 10:30              │
├─────────────────────────────────┤
│  Barbero                        │
│  • Nombre: Juan Pérez           │
├─────────────────────────────────┤
│  Cliente                        │
│  • Nombre: Carlos López         │
├─────────────────────────────────┤
│  Notas                          │
│  "Corte degradado a los lados"  │
├─────────────────────────────────┤
│  Gestionar estado               │
│  Como barbero asignado...       │
│  ┌──────────┐ ┌──────────┐     │
│  │Pendiente │ │Confirmada│     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │En proceso│ │Completada│     │
│  └──────────┘ └──────────┘     │
├─────────────────────────────────┤
│  [Volver]                       │
└─────────────────────────────────┘
```

## 🧪 Pruebas Recomendadas

### Pruebas de UI
- [ ] Verificar que todos los campos se muestran correctamente
- [ ] Confirmar que los colores de estado coinciden
- [ ] Validar que solo barberos ven la sección "Gestionar estado"
- [ ] Verificar que el barbero correcto ve los botones

### Pruebas de Funcionalidad
- [ ] Cambiar estado de `pendiente` a `confirmada`
- [ ] Cambiar estado de `confirmada` a `en_proceso`
- [ ] Cambiar estado de `en_proceso` a `completada`
- [ ] Intentar cambiar desde la app con usuario no barbero
- [ ] Forzar error de red → mostrar mensaje de error

### Pruebas de Backend
```bash
# Testear endpoint directamente
curl -X PATCH http://localhost:8080/api/v1/appointments/1/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"estado": "confirmada"}'
```

## 🔗 Endpoints Relacionados
- `PATCH /api/v1/appointments/{id}/status` - Actualizar estado
- `GET /api/v1/appointments` - Listar citas (para cargar detalle)

## 🚀 Siguientes Pasos
- ✅ **Completado**: Fase 1 - Cancelar citas
- ✅ **Completado**: Fase 2 - Editar perfil
- ✅ **Completado**: Fase 3 - Actualizar estados
- ⏭️ **Siguiente**: Fase 4 - Notificaciones push

## 📝 Notas Adicionales
- La pantalla usa ruta dinámica `[id].tsx` de expo-router
- El estado se actualiza optimistamente (sin recargar)
- Los barberos solo ven esta funcionalidad si son los asignados
- El diseño mantiene consistencia con el resto de la app

---

**Fecha de implementación**: 1 de abril de 2026  
**Archivos creados**: 1  
**Archivos modificados**: 1  
**Líneas agregadas**: ~350  
**Líneas modificadas**: ~20
