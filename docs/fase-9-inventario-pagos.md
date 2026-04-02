# Fase 9 - Inventario y pagos

Fecha: 2026-04-01
Estado: Completada

## Objetivo
Cubrir las vistas faltantes del panel web relacionadas con:
- Inventario de productos y movimientos.
- Pagos y registro de cobros.

## Cambios en backend Laravel

### 1) API móvil para inventario
Se añadieron endpoints JSON en `routes/api.php` con dos vistas de datos:
- `GET /api/v1/inventory/products`
- `GET /api/v1/inventory/movements`

Controller nuevo:
- `app/Http/Controllers/Api/InventoryController.php`

Datos expuestos:
- Productos con stock, minimo, categoria, precio y alerta de bajo stock.
- Movimientos recientes con tipo, cantidad, motivo, fecha y relacion de producto.

### 2) API móvil para pagos
Se añadieron endpoints JSON en `routes/api.php`:
- `GET /api/v1/payments`
- `POST /api/v1/payments`

Controller nuevo:
- `app/Http/Controllers/Api/PaymentController.php`

Datos expuestos:
- Pago registrado con monto, metodo, propina, recibo y cita asociada.
- Creacion de pago reutilizando `PaymentService` para mantener la misma logica que Laravel web.

## Cambios en mobile

### 1) Vista de inventario
Archivo:
- `app/inventario.tsx`

Incluye:
- Resumen de productos, bajo stock y movimientos.
- Lista de productos con tarjetas visuales.
- Lista de movimientos recientes.
- Acceso desde Cuenta para roles de administrador y recepcionista.

### 2) Vista de pagos
Archivo:
- `app/pagos.tsx`

Incluye:
- Resumen de pagos y citas.
- Selector de cita.
- Formulario rapido para registrar pago.
- Lista de pagos recientes.
- Acceso desde Cuenta para roles de administrador y recepcionista.

### 3) Navegacion
Se agregaron las pantallas al root stack en `app/_layout.tsx`.

## Archivos impactados
- `routes/api.php`
- `app/Http/Controllers/Api/InventoryController.php`
- `app/Http/Controllers/Api/PaymentController.php`
- `urbanblade/lib/api.ts`
- `urbanblade/app/inventario.tsx`
- `urbanblade/app/pagos.tsx`
- `urbanblade/app/_layout.tsx`
- `urbanblade/app/(tabs)/cuenta.tsx`

## Verificacion
- Lint y typecheck del proyecto movil ejecutados durante la fase.

## Siguientes fases sugeridas
- Fase 10: Usuarios y clientes.
- Fase 11: Logs y configuracion global persistente.
