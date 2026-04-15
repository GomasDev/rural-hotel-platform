# RuralHot - Plataforma de Gestión Hotelera Rural + Senderismo

**TFG DAW - Rafael Ballesteros Padial** | *Mayo 2026*

Plataforma SaaS integral que unifica gestión hotelera (PMS + motor reservas) con turismo activo geolocalizado para PYMES rurales.   
Stack principal: `NestJS + React + PostGIS`.

[![Status GitHub][github-status]][github] [![License][license-shield]][license]

[github-status]: https://img.shields.io/badge/status-prototyping-blue?style=flat&logo=github
[github]: https://github.com/GomasDev/rural-hotel-platform
[license-shield]: https://img.shields.io/badge/License-MIT-green?style=flat&logo=mit-license
[license]: LICENSE

---

## Características

- Gestión hotelera:
  - hoteles, habitaciones, categorías, ocupación
  - reservas (check-in/check-out)
  - prevención de overbooking
  - calendarios y estados
- Gestión de clientes y usuarios:
  - roles `super_admin`, `admin_hotel`, `cliente`
  - RBAC / permisos por rol
- Turismo activo:
  - rutas de senderismo basadas en PostGIS
  - geolocalización de actividades y puntos de interés
  - búsqueda por proximidad
- Motor de reservas:
  - reservas directas (sin OTAs)
  - pago Stripe (planeado, sandbox)
- Frontend SPA:
  - panel admin + panel cliente
  - UI responsive con TailwindCSS
- Mapas:
  - Leaflet + OpenStreetMap
  - visualización de rutas y alojamientos

---

## Stack Tecnológico

- Frontend: React 18 + TypeScript 5.6 + TailwindCSS
- Backend: NestJS 11 + TypeScript 5.6 + TypeORM
- Base de datos: PostgreSQL 16 + PostGIS 3.4
- Contenedores: Docker + Docker Compose
- Autenticación: JWT + bcrypt
- Emails: Nodemailer + Mailtrap

---

## Estructura del Repositorio

```
rural-hotel-platform/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── ...
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/          # React SPA
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── ...
│   ├── package.json
│   └── README.md
├── database/          # SQL schema
│   └── schema/01-mer-schema.sql
├── docker-compose.yml
└── README.md
```

---

## Instalación y ejecución local

```bash
git clone https://github.com/GomasDev/rural-hotel-platform.git
cd rural-hotel-platform

# Copiar variables de entorno
cp .env.example .env
# (Editar .env según la red local y credenciales)

# Levantar servicios
docker-compose up -d --build

# Frontend
cd frontend
npm install
npm run dev

# Backend
cd ../backend
npm install
npm run start:dev
```

---

## Pruebas

- Backend: `npm run test` (desde `backend/`)
- e2e: `npm run test:e2e` (desde `backend/`)
- Frontend: `npm run test` (desde `frontend/`) si aplica

---

## Notas de desarrollo

- Asegúrate de tener Docker/Docker Compose instalados.
- Para desarrollo local, `POSTGRES_HOST=host.docker.internal` o usar red Docker.
- PostGIS es requisito en el contenedor DB para rutas geoespaciales.
- Stripe y email deploy deben configurarse en `.env` en entorno de producción.

---

## Próximas mejoras

- Autorización completa con guards por recurso.
- Clientes con historial de facturas y estado de pago.
- Confirmaciones por email y webhook Stripe.
- Modo offline/litestream para rutas en móvil.
- Localización i18n (español + inglés).

---

## Licencia

- MIT (ver `LICENSE`)

---

## Contacto

- GitHub: `https://github.com/GomasDev/rural-hotel-platform`
- Autor: Rafael Ballesteros Padial


docker exec ruralhot-backend npm run test:e2e -- --verbose

test


seed

# Todo en un comando, sin entrar al contenedor
docker compose exec backend npm run seed
docker compose exec backend npm run seed:tourism