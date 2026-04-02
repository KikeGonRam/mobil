# Fase 4: Notificaciones

## 📋 Descripción
Implementación de pantalla de notificaciones y sistema para mostrar notificaciones del backend Laravel, consumiendo los endpoints `/api/v1/notifications` y `/api/v1/notifications/read-all`.

## ✅ Cambios Realizados

### 1. Actualización de `lib/api.ts`

#### Nuevos Métodos de API

**`getNotifications(token)`**
```typescript
getNotifications: (token: string) =>
  request<{ data: NotificationRecord[] }>('/notifications', { token }),
```

**`markNotificationsRead(token)`**
```typescript
markNotificationsRead: (token: string) =>
  request<{ message: string }>('/notifications/read-all', { token, method: 'POST' }),
```

#### Nuevo Tipo: `NotificationRecord`
```typescript
export type NotificationRecord = {
  id: number;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};
```

### 2. Nueva Pantalla: `app/notificaciones.tsx`

#### Estados Locales
```typescript
const [notifications, setNotifications] = useState<NotificationWithMessage[]>([]);
const [loading, setLoading] = useState(true);
const [markingRead, setMarkingRead] = useState(false);
```

#### Funciones Principales

**`loadNotifications()`**
- Carga todas las notificaciones del usuario
- Maneja error 404 silenciosamente (endpoint no disponible)
- Muestra error genérico para otros fallos

**`handleMarkAllRead()`**
- Marca todas las notificaciones como leídas
- Actualiza optimistamente el estado local
- Muestra feedback de éxito/error

**`handleNotificationPress(notification)`**
- Navega al detalle según el tipo de notificación
- Soporta navegación a citas (`/appointments/{id}`)

#### UI Components

**Header**
- Título "Notificaciones"
- Subtítulo con contador de no leídas

**Botón "Marcar todas como leídas"**
- Solo visible si hay no leídas
- Muestra loading durante la acción

**Lista de Notificaciones**
- Tarjeta por notificación
- Indicador visual (● lleno/vacío) según estado
- Color gold para no leídas
- Título, mensaje y fecha formateada
- Navegación al tocar

**Empty State**
- Icono 🔔
- Mensaje "Sin notificaciones"
- Copy explicativo

### 3. Actualización de `app/(tabs)/cuenta.tsx`

#### Nuevo Estado
```typescript
const [unreadNotifications, setUnreadNotifications] = useState(0);
```

#### Nueva Función: `loadUnreadNotifications()`
- Carga notificaciones y cuenta las no leídas
- Se ejecuta al montar el componente
- Ignora errores silenciosamente

#### Botón "Notificaciones" con Badge
- Muestra contador de no leídas
- Badge dorado con número
- Navega a `/notificaciones`

#### Nuevos Estilos
```typescript
notificationButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
}
badge: {
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: Brand.gold,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 5,
}
badgeText: {
  color: '#000',
  fontWeight: '900',
  fontSize: 10,
}
```

## 🎨 Diseño de Notificaciones

### Estructura Visual
```
┌─────────────────────────────────────────┐
│  ●  Nueva cita agendada                 │
│     Tu cita del 2026-04-03 a las 10:00  │
│     1 abr, 2026 14:30                   │
├─────────────────────────────────────────┤
│  ○  Cita confirmada                     │
│     Tu cita ha sido confirmada por...   │
│     1 abr, 2026 12:15                   │
└─────────────────────────────────────────┘
```

### Estados Visuales

| Estado | Indicador | Color | Fondo |
|--------|-----------|-------|-------|
| No leída | ● (lleno) | Gold `#d4af37` | `rgba(212,175,55,0.03)` |
| Leída | ○ (vacío) | Gris `#b0b0b0` | Normal |

## 🔒 Reglas de Negocio

### Tipos de Notificaciones Soportados
1. **Cita agendada**: Cuando un cliente crea una nueva cita
2. **Cita confirmada**: Cuando el barbero confirma la cita
3. **Cita cancelada**: Cuando se cancela una cita
4. **Recordatorio**: Recordatorio de cita próxima (futuro)

### Flujo de Notificaciones
```
Backend (Laravel) → Notificación creada → Base de datos
                                      ↓
Mobile App ← GET /notifications ← JSON response
                                      ↓
                               Mostrar en UI
                                      ↓
                          Usuario toca → Navegar
                                      ↓
                    Marcar como leída ← POST /read-all
```

## 📱 Estructura de la Pantalla

```
┌──────────────────────────────────────┐
│  Notificaciones                      │
│  Tienes 3 notificaciones sin leer    │
├──────────────────────────────────────┤
│  [Marcar todas como leídas]          │
├──────────────────────────────────────┤
│  ●  Nueva cita agendada              │
│     Tu cita del 2026-04-03...        │
│     1 abr, 2026 14:30                │
├──────────────────────────────────────┤
│  ●  Cita confirmada                  │
│     Tu cita ha sido confirmada...    │
│     1 abr, 2026 12:15                │
├──────────────────────────────────────┤
│  ○  Recordatorio                     │
│     Tu cita es mañana a las 10:00    │
│     31 mar, 2026 09:00               │
├──────────────────────────────────────┤
│  (scroll para más...)                │
└──────────────────────────────────────┘
```

## 🧪 Pruebas Recomendadas

### Pruebas de UI
- [ ] Verificar que el badge muestra el número correcto
- [ ] Confirmar que notificaciones no leídas tienen ● dorado
- [ ] Validar que notificaciones leídas tienen ○ gris
- [ ] Verificar empty state cuando no hay notificaciones

### Pruebas de Funcionalidad
- [ ] Cargar notificaciones desde backend
- [ ] Marcar todas como leídas → contador a 0
- [ ] Tocar notificación → navegar a cita
- [ ] Forzar error 404 → manejar silenciosamente
- [ ] Forzar error de red → mostrar mensaje

### Pruebas de Backend
```bash
# Listar notificaciones
curl http://localhost:8080/api/v1/notifications \
  -H "Authorization: Bearer {token}"

# Marcar como leídas
curl -X POST http://localhost:8080/api/v1/notifications/read-all \
  -H "Authorization: Bearer {token}"
```

## 🔗 Endpoints Relacionados
- `GET /api/v1/notifications` - Listar notificaciones
- `POST /api/v1/notifications/read-all` - Marcar todas como leídas

## 🚀 Siguientes Pasos
- ✅ **Completado**: Fase 1 - Cancelar citas
- ✅ **Completado**: Fase 2 - Editar perfil
- ✅ **Completado**: Fase 3 - Actualizar estados
- ✅ **Completado**: Fase 4 - Notificaciones
- ⏭️ **Siguiente**: Fase 5 - Detalle de cita individual

## 📝 Notas Adicionales
- El badge de notificaciones se actualiza al cargar la pantalla
- Las notificaciones se marcan como leídas manualmente
- El endpoint 404 se maneja silenciosamente (puede no estar implementado)
- Futuro: Integrar con expo-notifications para push notifications

---

**Fecha de implementación**: 1 de abril de 2026  
**Archivos creados**: 1  
**Archivos modificados**: 2  
**Líneas agregadas**: ~280  
**Líneas modificadas**: ~40
