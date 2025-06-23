# Sistema de Asistencias

Sistema de control de asistencias para profesores desarrollado con Node.js, Express, TypeScript y SQLite.

## 🚀 Despliegue en Render

### Pasos para desplegar:

1. **Crear cuenta en Render**
   - Ve a [render.com](https://render.com)
   - Crea una cuenta gratuita

2. **Conectar repositorio**
   - Haz clic en "New +"
   - Selecciona "Web Service"
   - Conecta tu repositorio de GitHub

3. **Configurar el servicio**
   - **Name**: `sistema-asistencias` (o el nombre que prefieras)
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **Variables de entorno (opcional)**
   - `NODE_ENV`: `production`

5. **Desplegar**
   - Haz clic en "Create Web Service"
   - Render construirá y desplegará tu aplicación automáticamente

### Características del despliegue:

- ✅ **SQLite compatible**: La base de datos se crea automáticamente en `/tmp`
- ✅ **Datos reales**: Se cargan 9 grupos y 136 estudiantes reales desde archivos JSON
- ✅ **SSL automático**: Tu aplicación tendrá HTTPS automáticamente
- ✅ **Dominio personalizado**: Puedes agregar tu propio dominio
- ✅ **Despliegue automático**: Cada push a GitHub actualiza la aplicación

### Estructura del proyecto:

```
├── src/
│   ├── app.ts                 # Aplicación principal
│   ├── database/
│   │   └── database.ts        # Configuración de SQLite
│   ├── models/
│   │   └── models.ts          # Tipos TypeScript
│   ├── repositories/          # Acceso a datos
│   ├── controllers/           # Lógica de negocio
│   ├── routes/                # Rutas API
│   └── services/              # Servicios
├── public/                    # Archivos estáticos (HTML, CSS, JS)
├── dist/                      # Código compilado
├── GruposInit.json           # Datos reales de grupos
├── EstudiantesInit.json      # Datos reales de estudiantes
└── package.json
```

### Datos iniciales:

El sistema incluye datos reales de:
- **9 grupos**: Tercero 1-4, Segundo 1-3, Transición 1-3
- **136 estudiantes**: Distribuidos en los diferentes grupos
- **Datos reales**: Nombres y apellidos de estudiantes reales

### API Endpoints:

- `GET /api/grupos` - Obtener grupos
- `POST /api/grupos` - Crear grupo
- `GET /api/estudiantes` - Obtener estudiantes
- `POST /api/estudiantes` - Crear estudiante
- `GET /api/asistencias` - Obtener asistencias
- `POST /api/asistencias` - Guardar asistencias

### Desarrollo local:

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Construir
npm run build

# Ejecutar
npm start

# Configurar base de datos con datos reales
npm run setup-db
```

### Tecnologías utilizadas:

- **Backend**: Node.js, Express, TypeScript
- **Base de datos**: SQLite
- **Frontend**: HTML, CSS (Bootstrap), JavaScript
- **Despliegue**: Render

### Notas importantes:

- La base de datos SQLite se crea automáticamente en Render
- Los datos se reinician cada vez que se despliega (en el plan gratuito)
- Para persistencia de datos, considera usar un plan de pago o migrar a PostgreSQL
- Los datos iniciales se cargan desde `GruposInit.json` y `EstudiantesInit.json` 