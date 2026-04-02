# Fase 6: Portafolio del Barbero

## 📋 Descripción
Implementación de pantalla para visualizar el portafolio de trabajos del barbero, consumiendo el endpoint `/api/v1/barbers/{id}/portfolio` del backend Laravel.

## ✅ Cambios Realizados

### 1. Actualización de `lib/api.ts`

#### Nuevo Método de API

**`getBarberPortfolio(token, barberId)`**
```typescript
getBarberPortfolio: (token: string, barberId: number) =>
  request<{ data: WorkRecord[] }>(`/barbers/${barberId}/portfolio`, { token }),
```

#### Nuevo Tipo: `WorkRecord`
```typescript
export type WorkRecord = {
  id: number;
  title: string;
  description?: string | null;
  work_date: string;
  images: { id: number; image: string }[];
  barber?: { id: number; name: string };
};
```

### 2. Nueva Pantalla: `app/portafolio.tsx`

#### Estados Locales
```typescript
const [works, setWorks] = useState<WorkRecord[]>([]);
const [loading, setLoading] = useState(true);
const [barberId, setBarberId] = useState<number | null>(null);
```

#### Funciones Principales

**`loadPortfolio()`**
- Carga todos los trabajos del barbero
- Maneja errores de carga
- Se ejecuta cuando cambia `barberId`

#### UI Components

**Header**
- Título "Mi portafolio"
- Subtítulo descriptivo

**Grid de Trabajos**
- Tarjeta por trabajo realizado
- Imagen principal del trabajo
- Contador de imágenes adicionales (+N)
- Título del trabajo
- Descripción (truncada a 2 líneas)
- Fecha de realización

**Empty State**
- Icono ✂️ (tijeras)
- Mensaje "Sin trabajos en el portafolio"
- Hint: "Usa la versión web para subir nuevos trabajos"

**Acceso Restringido**
- Pantalla de error para no barberos
- Mensaje "Acceso restringido - Solo disponible para barberos"
- Botón "Volver"

### 3. Actualización de `app/(tabs)/cuenta.tsx`

#### Botón Condicional "Portafolio"
```typescript
{user?.roles?.includes('barbero') && (
  <Pressable onPress={() => router.push('/portafolio')} style={styles.secondaryButton}>
    <ThemedText style={styles.secondaryButtonText}>Portafolio</ThemedText>
  </Pressable>
)}
```

## 🎨 Diseño del Portafolio

### Estructura de Tarjeta
```
┌─────────────────────────────────────┐
│  [IMAGEN DEL TRABAJO]               │
│                            [+3]     │
├─────────────────────────────────────┤
│  Corte Fade con Degradado           │
│  Cliente satisfecho con el nuevo... │
│  15 mar, 2026                       │
└─────────────────────────────────────┘
```

### Reglas de Visualización

| Elemento | Comportamiento |
|----------|---------------|
| Imagen principal | Primera imagen del array |
| Múltiples imágenes | Badge "+N" en esquina inferior |
| Sin imagen | Placeholder "Sin imagen" |
| Descripción larga | Truncar a 2 líneas con `numberOfLines` |

## 🔒 Reglas de Negocio

### ¿Quién puede ver el portafolio?
- **Barberos**: Solo pueden ver SU PROPIO portafolio
- **Clientes**: No tienen acceso (pantalla de error)
- **Administradores**: No tienen acceso desde móvil (solo web)

### ¿Qué se muestra?
- Trabajos subidos por el barbero
- Imágenes, título, descripción y fecha
- Orden: Más recientes primero

### Limitaciones
- **No se puede subir desde la app**: Solo web
- **No se puede eliminar desde la app**: Solo web
- **No se puede editar desde la app**: Solo web

## 📱 Estructura de la Pantalla

```
┌──────────────────────────────────────┐
│  Mi portafolio                       │
│  Tus trabajos y realizaciones...     │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐ │
│  │ [IMAGEN]                       │ │
│  │                        [+2]    │ │
│  ├────────────────────────────────┤ │
│  │ Corte Clásico                  │ │
│  │ Degradado perfecto con...      │ │
│  │ 15 mar, 2026                   │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ [IMAGEN]                       │ │
│  ├────────────────────────────────┤ │
│  │ Barba Completa                 │ │
│  │ Perfilado y tratamiento...     │ │
│  │ 12 mar, 2026                   │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## 🧪 Pruebas Recomendadas

### Pruebas de UI
- [ ] Verificar que las imágenes se cargan correctamente
- [ ] Confirmar que el contador "+N" aparece con múltiples imágenes
- [ ] Validar que descripciones largas se truncan
- [ ] Verificar empty state cuando no hay trabajos

### Pruebas de Funcionalidad
- [ ] Cargar portafolio con usuario barbero
- [ ] Intentar acceder con usuario no barbero → mostrar error
- [ ] Forzar error de red → mostrar mensaje de error
- [ ] Verificar que barber_id se obtiene del usuario

### Pruebas de Backend
```bash
# Testear endpoint directamente
curl http://localhost:8080/api/v1/barbers/1/portfolio \
  -H "Authorization: Bearer {token}"
```

## 🔗 Endpoints Relacionados
- `GET /api/v1/barbers/{id}/portfolio` - Listar portafolio
- `POST /barbero/{id}/works` - Subir trabajo (solo web)
- `DELETE /portfolio/{work}` - Eliminar trabajo (solo web)

## 🚀 Siguientes Pasos
- ✅ **Completado**: Fase 1 - Cancelar citas
- ✅ **Completado**: Fase 2 - Editar perfil
- ✅ **Completado**: Fase 3 - Actualizar estados
- ✅ **Completado**: Fase 4 - Notificaciones
- ✅ **Completado**: Fase 5 - Detalle de cita
- ✅ **Completado**: Fase 6 - Portafolio
- ⏭️ **Siguiente**: Fase 7 - Documentación final

## 📝 Notas Adicionales
- El portafolio es de solo lectura en la app móvil
- Para subir/eliminar/editar trabajos, usar la versión web
- Las imágenes se cargan desde el backend (URLs absolutas)
- El diseño mantiene consistencia con el resto de la app

---

**Fecha de implementación**: 1 de abril de 2026  
**Archivos creados**: 1  
**Archivos modificados**: 2  
**Líneas agregadas**: ~250  
**Líneas modificadas**: ~10
