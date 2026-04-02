# Fase 10 - Usuarios y clientes

## Objetivo

Cerrar la brecha entre la web de Laravel y la app movil agregando las vistas de usuarios y clientes que aun faltaban en Expo.

## Alcance

- Se expusieron dos endpoints nuevos en Laravel:
  - `GET /api/v1/users`
  - `GET /api/v1/clients`
- Se añadieron las pantallas moviles:
  - `/usuarios`
  - `/clientes`
- Se integraron accesos directos desde la pantalla de cuenta.

## Comportamiento

### Usuarios

- Solo accesible para administradores.
- Incluye busqueda por nombre o correo.
- Permite filtrar por rol.
- Muestra estado de verificacion y fecha de registro.
- Tiene paginacion simple para navegar entre paginas.

### Clientes

- Accesible para administradores y recepcionistas.
- Incluye busqueda por nombre o correo.
- Muestra telefono, fecha de nacimiento, cantidad de citas y preferencias activas.
- Tiene paginacion simple.

## Archivos principales

- [app/Http/Controllers/Api/UserController.php](../example-app/app/Http/Controllers/Api/UserController.php)
- [app/Http/Controllers/Api/ClientController.php](../example-app/app/Http/Controllers/Api/ClientController.php)
- [routes/api.php](../example-app/routes/api.php)
- [urbanblade/lib/api.ts](../lib/api.ts)
- [urbanblade/app/usuarios.tsx](../app/usuarios.tsx)
- [urbanblade/app/clientes.tsx](../app/clientes.tsx)

## Validacion esperada

- `npm run lint` en la app movil.
- `php artisan test` en Laravel para confirmar que los cambios de API no rompen el backend.

## Estado

Fase completada como entrega funcional de lectura. El CRUD movil de usuarios y clientes queda para una fase posterior si se requiere.