# rural-hotel-platform
Plataforma integral de gestión para hoteles rurales y turismo (senderismo, actividades locales...)



info docker
# Desarrollo (con pgAdmin)
docker-compose --profile dev up

# Solo backend + BD (casa/producción)  
docker-compose up


db

Activar PostGIS (2 líneas SQL)

En SQLTools, nueva query:

sql
-- 1. Activar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Verificar
SELECT PostGIS_Version();

Ejecuta esto y pega el resultado.

Debería salir algo como:

text
3.4.2  r## 2024-01-25 ...