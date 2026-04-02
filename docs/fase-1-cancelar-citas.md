# Fase 1: Cancelar Citas

## 📋 Descripción
Implementación de la funcionalidad para cancelar citas desde la aplicación móvil, consumiendo el endpoint `DELETE /api/v1/appointments/{id}` del backend Laravel.

## ✅ Cambios Realizados

### 1. Actualización de `lib/api.ts`
Se agregó el método `cancelAppointment` al objeto `api`:

```typescript
cancelAppointment: (token: string, appointmentId: number) =>
  request<{ message: string }>(`/appointments/${appointmentId}`, { 
    token, 
    method: 'DELETE' 
  }),
```

**Parámetros:**
- `token`: Token de autenticación del usuario
- `appointmentId`: ID numérico de la cita a cancelar

**Retorna:**
- Objeto con mensaje de confirmación

### 2. Actualización de `app/(tabs)/cuenta.tsx`

#### Nuevos Estados
```typescript
const [cancellingId, setCancellingId] = useState<number | null>(null);
```

#### Nueva Función: `handleCancelAppointment`
- Muestra confirmación nativa con `Alert.alert`
- Valida que el usuario tenga token
- Llama a `api.cancelAppointment`
- Actualiza el estado local para reflejar el cambio
- Maneja errores con `ApiError`

#### Nueva UI en Lista de Citas
- **Header en cada cita**: Muestra nombre del servicio y estado alineados horizontalmente
- **Colores por estado**:
  - `pendiente`: Amarillo (`#fbbf24`)
  - `confirmada`: Azul (`#60a5fa`)
  - `en_proceso`: Morado (`#a78bfa`)
  - `completada`: Verde (`#34d399`)
  - `cancelada`: Rojo (`#f87171`)
  - `no_asistio`: Gris (`#9ca3af`)
- **Botón "Cancelar cita"**: 
  - Solo visible para citas con estado `pendiente`, `confirmada` o `en_proceso`
  - Muestra indicador de carga durante la cancelación
  - Se deshabilita mientras se procesa

#### Función Helper: `getStatusStyle`
Determina el estilo de color según el estado de la cita.

### 3. Nuevos Estilos en `StyleSheet`
```typescript
listItemHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
}
statusPending: { color: '#fbbf24' },
statusConfirmada: { color: '#60a5fa' },
statusEnProceso: { color: '#a78bfa' },
statusCompletada: { color: '#34d399' },
statusCancelada: { color: '#f87171' },
statusNoAsistio: { color: '#9ca3af' },
cancelButton: {
  marginTop: 10,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#ef4444',
  backgroundColor: '#ef4444',
  paddingVertical: 8,
  paddingHorizontal: 12,
  alignItems: 'center',
}
cancelButtonDisabled: { opacity: 0.5 },
cancelButtonText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 11,
  textTransform: 'uppercase',
}
```

## 🔒 Reglas de Negocio

### ¿Quién puede cancelar?
- **Cliente propietario**: Solo puede cancelar sus propias citas
- **Administrador**: Puede cancelar cualquier cita

### ¿Cuándo NO se puede cancelar?
- Citas con estado `cancelada`
- Citas con estado `completada`
- Citas con estado `no_asistio`

### ¿Qué pasa al cancelar?
1. El estado cambia a `cancelada`
2. Se registra `cancelada_en` con timestamp
3. Se notifica al cliente (vía sistema de notificaciones)
4. Se marca `cancellation_notified_at`

## 🧪 Pruebas Recomendadas

### Pruebas de UI
- [ ] Verificar que el botón "Cancelar cita" solo aparezca en citas cancelables
- [ ] Confirmar que los colores de estado coinciden con el diseño
- [ ] Validar que el indicador de carga aparece durante la cancelación

### Pruebas de Funcionalidad
- [ ] Cancelar cita pendiente → estado cambia a `cancelada`
- [ ] Intentar cancelar cita completada → botón no visible
- [ ] Cancelar y verificar que la lista se actualiza sin recargar
- [ ] Forzar error de red → mostrar mensaje de error apropiado

### Pruebas de Backend
```bash
# Testear endpoint directamente
curl -X DELETE http://localhost:8080/api/v1/appointments/1 \
  -H "Authorization: Bearer {token}"
```

## 📱 Capturas de Pantalla
_(Espacio para capturas de la implementación)_

## 🔗 Endpoints Relacionados
- `DELETE /api/v1/appointments/{id}` - Cancelar cita
- `GET /api/v1/appointments` - Listar citas (para refrescar lista)

## 🚀 Siguientes Pasos
- ✅ **Completado**: Fase 1
- ⏭️ **Siguiente**: Fase 2 - Editar perfil de usuario

## 📝 Notas Adicionales
- La confirmación de cancelación usa alertas nativas de iOS/Android
- El estado se actualiza optimistamente (sin recargar toda la lista)
- Los errores se manejan con mensajes descriptivos

---

**Fecha de implementación**: 1 de abril de 2026  
**Archivos modificados**: 2  
**Líneas agregadas**: ~120  
**Líneas modificadas**: ~40
