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

Al arrancar se cargan automáticamente 75 Funko Pop! con fotos propias de cada pieza (`backend/seed/images/`), 11 ofertas de la semana, zonas de envío, cupones (`BIENVENIDO10`, `ENVIOGRATIS`, `FRIKI20`) y unas 72 ventas de 56 clientes en los últimos 90 días, para que el dashboard y el análisis tengan datos.

## Recorrido sugerido

1. **Cliente:** entra con `cliente@demo.local`, agrega productos al carrito, aplica el cupón `BIENVENIDO10` y ve a "Checkout". Escribe una ciudad (Bogotá, Medellín, Cali u otra) para ver el costo de envío.
2. **Pago simulado:** "Ir a pagar" abre la **pasarela simulada**. Elige "Aprobar pago" o "Rechazar pago". Un pago rechazado deja el pedido pendiente para reintentar o cancelar.
3. **Administrador:** entra con `admin@demo.local`; el inicio de sesión lleva directo al panel, que tiene su propia barra de navegación:
   - **Dashboard:** ventas netas (sin envío y con descuentos aplicados), ventas por día, ventas por producto e historial de ventas con filtros de periodo. Desde el historial se marca un pedido como enviado (con transportadora y guía) y luego como entregado.
   - **Análisis:** hallazgos calculados sobre el periodo elegido, cada uno con su gráfica, una recomendación y vista de tabla: inventario sin ventas, productos en riesgo de agotarse, margen y utilidad por producto, pedidos cerca del envío gratis, efecto de los cupones, concentración de ingresos, franquicias, días y horas de compra y ciudades.
   - **Productos:** crear, buscar, filtrar por estado y franquicia, editar (precio, stock, imágenes) y eliminar.

   Las cuentas de administrador pueden recorrer la tienda como vista previa, pero no comprar: no ven carrito ni favoritos y el backend rechaza sus pedidos.

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
- Estilo visual: Anton para titulares, Bricolage Grotesque para texto y Damion en las pegatinas; texturas de papel y riso en `frontend/public/textures/`, con modo claro y oscuro.
- Los correos (confirmación de compra, recuperación de contraseña) se imprimen en la consola del backend en lugar de enviarse.
- El login con Google aparece solo si configuras tu propio Client ID (`backend/.env.example`).
