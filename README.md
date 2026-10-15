# Juguetes para Frikis

Tienda en línea de Funko Pop! originales con catálogo, carrito, checkout con pago simulado, cuentas de cliente y administrador, gestión de productos y dashboard de ventas.

Este repositorio es la versión para **correr en local**: un solo comando levanta todo con datos de demostración.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose 2.24 o superior).
- Los puertos **3000** y **8000** libres.

No hace falta instalar Python, Node ni PostgreSQL, ni crear ningún archivo `.env`.

## Cómo correrlo

```bash
docker compose up --build
```

La primera vez tarda unos minutos (descarga imágenes e instala dependencias). Cuando el backend muestre `Demo lista`, abre:

| Qué | Dirección |
| --- | --- |
| Tienda | http://localhost:3000 |
| Panel de administración | http://localhost:3000/panel |
| Documentación de la API (Swagger) | http://localhost:8000/api/docs/ |
| Admin de Django | http://localhost:8000/admin/ |

Para detenerlo: `Ctrl + C` o `docker compose down`. Para borrar también la base de datos y empezar de cero: `docker compose down -v`.

## Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.local` | `Admin-Demo-2026!` |
| Cliente | `cliente@demo.local` | `Cliente-Demo-2026!` |

También puedes registrar clientes nuevos desde la tienda.

Al arrancar se cargan automáticamente 75 Funko Pop! con fotos propias de cada pieza (`backend/seed/images/`), 11 ofertas de la semana, zonas de envío, cupones (`BIENVENIDO10`, `ENVIOGRATIS`, `FRIKI20`) y unas 45 ventas de los últimos 30 días para que el dashboard tenga datos.

## Recorrido sugerido

1. **Cliente:** entra con `cliente@demo.local`, agrega productos al carrito, aplica el cupón `BIENVENIDO10` y ve a "Checkout". Escribe una ciudad (Bogotá, Medellín, Cali u otra) para ver el costo de envío.
2. **Pago simulado:** "Ir a pagar" abre la **pasarela simulada**. Elige "Aprobar pago" o "Rechazar pago". Un pago rechazado deja el pedido pendiente para reintentar o cancelar.
3. **Administrador:** entra con `admin@demo.local` y abre "Panel de administración":
   - **Dashboard:** ventas por día, ventas por producto e historial de ventas, con filtros de periodo.
   - **Productos:** crear, buscar, editar (precio, stock, imágenes) y eliminar.

## Pagos

Por defecto el pago usa una **pasarela simulada solo para entorno local**: no hay cobros ni cuentas externas, y el resultado pasa por el mismo procesamiento de notificaciones que la pasarela real. Por seguridad, la pasarela simulada solo funciona con `DEBUG=True`: fuera de desarrollo queda deshabilitada y Django la reporta como error de configuración (`payments.E001`).

La integración real es con [Bold](https://bold.co). Para probarla con tu propia cuenta de pruebas de Bold, copia `backend/.env.example` a `backend/.env`, define `PAYMENTS_PROVIDER=bold` y tus llaves, y cambia `NEXT_PUBLIC_PAYMENT_PROVIDER` a `bold` en `docker-compose.yml`. En local, Bold no puede devolver el resultado a la tienda (exige `https`), así que la prueba completa requiere un dominio con HTTPS.

## Tests

```bash
docker compose exec backend pytest -q
```

## Estructura

```
backend/    Django 5 + Django REST Framework (API en /api/v1/)
  apps/products   Catálogo, búsqueda y CRUD de administración
  seed/           Datos de demostración: catálogo, fotos, usuarios y ventas
  apps/orders     Checkout, pedidos, cupones y dashboard de ventas
  apps/payments   Pagos (Bold y pasarela simulada)
  apps/accounts   Usuarios, login, registro y favoritos
  apps/shipping   Zonas y costos de envío
  apps/reviews    Reseñas
frontend/   Next.js 16 + TypeScript + Tailwind
  src/app/(shop)        Páginas de la tienda
  src/app/(shop)/panel  Panel de administración
  src/lib/api.ts        Cliente de la API REST
docker-compose.yml      PostgreSQL 16, Redis, backend, worker y frontend
```

## Notas

- Si editas código del frontend, reinicia el contenedor (`docker compose restart frontend`): en Windows y macOS el modo de desarrollo no siempre detecta cambios en carpetas compartidas.
- Las fotos y los videos de la tienda son de nuestras propias piezas; los videos de la portada están en `frontend/public/media/`.
- Los correos (confirmación de compra, recuperación de contraseña) se imprimen en la consola del backend en lugar de enviarse.
- El login con Google aparece solo si configuras tu propio Client ID (`backend/.env.example`).
