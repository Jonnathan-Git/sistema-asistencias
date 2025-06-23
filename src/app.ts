import express from 'express';
import path from 'path';
import moment from 'moment';
import cors from 'cors';
import routes from './routes';
import { database } from './database/database';

// Extend Request interface to include session and flash
declare global {
  namespace Express {
    interface Request {
      session?: any;
      flash?: (type: string, message?: string) => string[];
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar moment en español
moment.locale('es');

// Middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware para simular métodos HTTP
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    req.method = method;
  }
  next();
});

// Middleware para flash messages (simulado)
app.use((req, res, next) => {
  if (!req.session) {
    (req as any).session = {};
  }

  (req as any).flash = (type: string, message?: string) => {
    if (!message) {
      const messages = (req as any).session[type] || [];
      delete (req as any).session[type];
      return messages;
    }

    if (!(req as any).session[type]) {
      (req as any).session[type] = [];
    }
    (req as any).session[type].push(message);
  };

  next();
});

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.moment = moment;
  res.locals.success = (req as any).flash('success');
  res.locals.error = (req as any).flash('error');
  next();
});

// Rutas API
app.use('/api', routes);

// Servir archivos HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/estudiantes', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/estudiantes.html'));
});

app.get('/grupos', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/grupos.html'));
});

app.get('/asistencias', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/asistencias.html'));
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Página no encontrada',
    message: 'La ruta solicitada no existe'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Manejar cierre de la aplicación
process.on('SIGINT', () => {
  console.log('\nCerrando aplicación...');
  database.close();
  process.exit(0);
});

export default app;