import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AsistenciaController } from '../controller/AsistenciaController';
import { GrupoController } from '../controller/GrupoController';
import { EstudianteController } from '../controller/EstudianteController';

const router = Router();

// Instancias de controladores
const asistenciaController = new AsistenciaController();
const grupoController = new GrupoController();
const estudianteController = new EstudianteController();

// API Routes for Grupos
router.get('/grupos', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await grupoController.getAllGrupos(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

router.get('/grupos/:id', async (req: Request, res: Response) => {
  try {
    const grupo = await grupoController.getGrupoById(parseInt(req.params.id));
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json(grupo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
});

router.post('/grupos', [
  body('nombre').trim().isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('identificador').trim().isLength({ min: 1 }).withMessage('El identificador es requerido'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const grupo = await grupoController.createGrupo(req.body);
    res.status(201).json(grupo);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'El identificador del grupo ya existe' });
    } else {
      res.status(500).json({ error: 'Error al crear grupo' });
    }
  }
});

router.put('/grupos/:id', [
  body('nombre').trim().isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('identificador').trim().isLength({ min: 1 }).withMessage('El identificador es requerido'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const grupo = await grupoController.updateGrupo(parseInt(req.params.id), req.body);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json(grupo);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'El identificador del grupo ya existe' });
    } else {
      res.status(500).json({ error: 'Error al actualizar grupo' });
    }
  }
});

router.delete('/grupos/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await grupoController.deleteGrupo(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json({ message: 'Grupo eliminado correctamente' });
  } catch (error: any) {
    if (error.message?.includes('tiene estudiantes')) {
      res.status(400).json({ error: 'No se puede eliminar un grupo que tiene estudiantes asignados' });
    } else {
      res.status(500).json({ error: 'Error al eliminar grupo' });
    }
  }
});

// API Routes for Estudiantes
router.get('/estudiantes', async (req: Request, res: Response) => {
  try {
    const grupoId = req.query.grupoId ? parseInt(req.query.grupoId as string) : null;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await estudianteController.getEstudiantes(grupoId, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Route to get all students from a group without pagination (for attendance, etc.)
router.get('/estudiantes/grupo/:grupoId/todos', async (req: Request, res: Response) => {
  try {
    const grupoId = parseInt(req.params.grupoId);
    const estudiantes = await estudianteController.getAllEstudiantesByGrupo(grupoId);
    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiantes del grupo' });
  }
});

router.get('/estudiantes/:id', async (req: Request, res: Response) => {
  try {
    const estudiante = await estudianteController.getEstudianteById(parseInt(req.params.id));
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

router.post('/estudiantes', [
  body('nombre').trim().isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('grupoId').isInt({ min: 1 }).withMessage('El grupo es requerido'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const estudiante = await estudianteController.createEstudiante(req.body);
    res.status(201).json(estudiante);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear estudiante' });
  }
});

router.put('/estudiantes/:id', [
  body('nombre').trim().isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('grupoId').isInt({ min: 1 }).withMessage('El grupo es requerido'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const estudiante = await estudianteController.updateEstudiante(parseInt(req.params.id), req.body);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

router.delete('/estudiantes/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await estudianteController.deleteEstudiante(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json({ message: 'Estudiante eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

// API Routes for Asistencias
router.get('/asistencias', async (req: Request, res: Response) => {
  try {
    const { fecha, grupoId } = req.query;
    if (!fecha || !grupoId) {
      return res.status(400).json({ error: 'Fecha y grupoId son requeridos' });
    }

    const asistencias = await asistenciaController.getAsistencias(fecha as string, parseInt(grupoId as string));
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
});

router.post('/asistencias', [
  body('fecha').isISO8601().withMessage('Fecha inválida'),
  body('grupoId').isInt({ min: 1 }).withMessage('Grupo requerido'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await asistenciaController.guardarAsistencias(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar asistencias' });
  }
});

router.get('/asistencias/exportar', async (req: Request, res: Response) => {
  try {
    await asistenciaController.exportarReporte(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar reporte' });
  }
});

router.delete('/asistencias/:fecha/:estudianteId', async (req: Request, res: Response) => {
  try {
    await asistenciaController.eliminarAsistencia(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar asistencia' });
  }
});

export default router;