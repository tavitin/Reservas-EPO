# Sistema de Reservas EPO

Sistema web para reservar recursos escolares (proyectores, laptops, etc.) entre maestros.

## Stack tecnológico

| Capa       | Tecnología                  |
|------------|-----------------------------|
| Frontend   | React 18 + Vite + Tailwind  |
| Backend    | Node.js + Express           |
| Base datos | PostgreSQL 15               |
| Contenedor | Docker + Docker Compose     |
| Auth       | JWT (8 horas)               |

---

## Roles

| Rol     | Permisos |
|---------|----------|
| Admin   | CRUD recursos, CRUD maestros, ver/cancelar todas las reservas |
| Maestro | Ver recursos, crear/cancelar sus propias reservas |

---

## Instalación — Desarrollo local

### Requisitos
- Docker Desktop instalado y corriendo
- Git

### Pasos

```bash
# 1. Clona el repositorio
git clone <url-repo>
cd Reserva_EPO

# 2. Copia el archivo de variables de entorno del backend
cp backend/.env.example backend/.env

# 3. Levanta todos los contenedores
docker-compose up -d --build

# 4. Espera ~30 segundos y verifica que todo esté corriendo
docker-compose ps
```

### Acceso
| Servicio  | URL                    |
|-----------|------------------------|
| Frontend  | http://localhost:3000  |
| Backend   | http://localhost:4000  |
| PostgreSQL| localhost:5432         |

### Credenciales por defecto
```
Email:    admin@epo.edu.mx
Password: Admin2024!
```
> Cambia la contraseña del admin desde el primer inicio de sesión.

---

## Instalación — Producción (servidor Linux)

### Requisitos del servidor
- Ubuntu 20.04+ / Debian 11+
- Docker Engine instalado
- Docker Compose v2
- Dominio apuntando al servidor (opcional pero recomendado)

### Pasos

```bash
# 1. Clona el repositorio en el servidor
git clone <url-repo>
cd Reserva_EPO

# 2. Crea el archivo de variables de producción
cp .env.prod.example .env.prod

# 3. Edita .env.prod con valores seguros
nano .env.prod
# Cambia TODAS las contraseñas y el JWT_SECRET

# 4. Genera un JWT_SECRET seguro (copia el resultado en .env.prod)
openssl rand -base64 48

# 5. Construye y levanta en producción
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 6. Verifica los contenedores
docker-compose -f docker-compose.prod.yml ps
docker logs reserva_epo_backend
```

### Acceso en producción
- La app estará disponible en el **puerto 80** del servidor.
- Si tienes dominio: `http://tu-dominio.com`

---

## Comandos útiles

```bash
# Ver logs del backend en tiempo real
docker logs -f reserva_epo_backend

# Ver logs de la base de datos
docker logs -f reserva_epo_db

# Detener todos los contenedores
docker-compose down

# Detener Y eliminar volúmenes (borra todos los datos)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart backend

# Acceder a la base de datos
docker exec -it reserva_epo_db psql -U epo_user -d reserva_epo

# Backup de la base de datos
docker exec reserva_epo_db pg_dump -U epo_user reserva_epo > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker exec -i reserva_epo_db psql -U epo_user -d reserva_epo
```

---

## Estructura del proyecto

```
Reserva_EPO/
├── backend/
│   ├── src/
│   │   ├── config/         # db.js, seed.js, init.sql
│   │   ├── controllers/    # auth, recursos, reservas, usuarios
│   │   ├── middlewares/    # auth.js (JWT), roles.js
│   │   └── routes/         # auth, recursos, reservas, usuarios
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # axios configurado con interceptores
│   │   ├── components/     # Layout, Navbar
│   │   ├── context/        # AuthContext
│   │   └── pages/
│   │       ├── admin/      # Dashboard, Recursos, Maestros, Reservas
│   │       └── maestro/    # Dashboard, NuevaReserva, MisReservas
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml       # Desarrollo
├── docker-compose.prod.yml  # Producción
└── .env.prod.example
```

---

## API Endpoints

```
POST   /api/auth/login                   Login
GET    /api/auth/me                      Perfil actual

GET    /api/recursos                     Listar recursos
POST   /api/recursos                     Crear recurso (admin)
PUT    /api/recursos/:id                 Editar recurso (admin)
DELETE /api/recursos/:id                 Eliminar recurso (admin)

GET    /api/reservas                     Listar reservas (admin: todas, maestro: propias)
POST   /api/reservas                     Crear reserva
PUT    /api/reservas/:id/cancelar        Cancelar reserva
GET    /api/reservas/disponibilidad      Verificar disponibilidad

GET    /api/usuarios                     Listar maestros (admin)
POST   /api/usuarios                     Crear maestro (admin)
PUT    /api/usuarios/:id/toggle          Activar/desactivar maestro (admin)
PUT    /api/usuarios/me/password         Cambiar contraseña propia
```

---

## Seguridad — Checklist para producción

- [ ] Cambiar `ADMIN_DEFAULT_PASS` en `.env.prod`
- [ ] Usar un `JWT_SECRET` aleatorio de al menos 48 caracteres
- [ ] Cambiar contraseña de PostgreSQL
- [ ] Configurar HTTPS (Nginx + Certbot recomendado)
- [ ] Configurar `CORS_ORIGIN` con tu dominio real
- [ ] Hacer backups periódicos de la base de datos
- [ ] No exponer el puerto 5432 al exterior
