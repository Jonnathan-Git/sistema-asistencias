import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { EstudianteRepository } from '../repositories/EstudianteRepository';
import { GrupoRepository } from '../repositories/GrupoRepository';

// Extend Request interface to include flash method
declare global {
  namespace Express {
    interface Request {
      flash?: (type: string, message?: string) => string[];
    }
  }
}

export class EstudianteController {
  private estudianteRepo = new EstudianteRepository();
  private grupoRepo = new GrupoRepository();

  // API Methods for JSON responses
  async getEstudiantes(grupoId?: number | null, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    let estudiantes: any[];
    let total: number;

    if (grupoId) {
      estudiantes = await this.estudianteRepo.findByGrupo(grupoId, limit, offset);
      total = await this.estudianteRepo.count(grupoId);
    } else {
      estudiantes = await this.estudianteRepo.findAll(limit, offset);
      total = await this.estudianteRepo.count();
    }

    const totalPages = Math.ceil(total / limit);

    return {
      estudiantes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async getAllEstudiantesByGrupo(grupoId: number) {
    // Get all students from a group without pagination (for attendance, etc.)
    return await this.estudianteRepo.findByGrupo(grupoId);
  }

  async getEstudianteById(id: number) {
    return await this.estudianteRepo.findById(id);
  }

  async createEstudiante(data: { nombre: string; grupoId: number }) {
    return await this.estudianteRepo.create(data);
  }

  async updateEstudiante(id: number, data: { nombre: string; grupoId: number }) {
    return await this.estudianteRepo.update(id, data);
  }

  async deleteEstudiante(id: number) {
    return await this.estudianteRepo.delete(id);
  }

  // Original view methods (kept for compatibility)
  async index(req: Request, res: Response): Promise<void> {
    try {
      const grupoId = req.query.grupoId ? parseInt(req.query.grupoId as string) : null;
      const estudiantes = grupoId
        ? await this.estudianteRepo.findByGrupo(grupoId)
        : await this.estudianteRepo.findAll();

      const grupos = await this.grupoRepo.findAll();

      res.render('estudiantes/index', {
        estudiantes,
        grupos,
        selectedGrupoId: grupoId,
        title: 'Gestión de Estudiantes'
      });
    } catch (error) {
      console.error('Error in EstudianteController.index:', error);
      res.status(500).render('error', {
        message: 'Error interno del servidor',
        error: error
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const grupos = await this.grupoRepo.findAll();
      res.render('estudiantes/create', {
        grupos,
        title: 'Crear Estudiante'
      });
    } catch (error) {
      console.error('Error in EstudianteController.create:', error);
      res.status(500).render('error', {
        message: 'Error interno del servidor',
        error: error
      });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const grupos = await this.grupoRepo.findAll();
        res.render('estudiantes/create', {
          grupos,
          errors: errors.array(),
          oldData: req.body,
          title: 'Crear Estudiante'
        });
        return;
      }

      const { nombre, grupoId } = req.body;
      await this.estudianteRepo.create({ nombre, grupoId: parseInt(grupoId) });

      req.flash?.('success', 'Estudiante creado exitosamente');
      res.redirect('/estudiantes');
    } catch (error) {
      console.error('Error in EstudianteController.store:', error);
      req.flash?.('error', 'Error al crear el estudiante');
      res.redirect('/estudiantes');
    }
  }

  async edit(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const estudiante = await this.estudianteRepo.findById(id);

      if (!estudiante) {
        req.flash?.('error', 'Estudiante no encontrado');
        res.redirect('/estudiantes');
        return;
      }

      const grupos = await this.grupoRepo.findAll();

      res.render('estudiantes/edit', {
        estudiante,
        grupos,
        title: `Editar Estudiante: ${estudiante.nombre}`
      });
    } catch (error) {
      console.error('Error in EstudianteController.edit:', error);
      res.status(500).render('error', {
        message: 'Error interno del servidor',
        error: error
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const estudiante = await this.estudianteRepo.findById(parseInt(req.params.id));
        const grupos = await this.grupoRepo.findAll();
        res.render('estudiantes/edit', {
          estudiante,
          grupos,
          errors: errors.array(),
          title: `Editar Estudiante: ${estudiante?.nombre}`
        });
        return;
      }

      const id = parseInt(req.params.id);
      const { nombre, grupoId } = req.body;

      const updated = await this.estudianteRepo.update(id, {
        nombre,
        grupoId: parseInt(grupoId)
      });

      if (!updated) {
        req.flash?.('error', 'Estudiante no encontrado');
        res.redirect('/estudiantes');
        return;
      }

      req.flash?.('success', 'Estudiante actualizado exitosamente');
      res.redirect('/estudiantes');
    } catch (error) {
      console.error('Error in EstudianteController.update:', error);
      req.flash?.('error', 'Error al actualizar el estudiante');
      res.redirect('/estudiantes');
    }
  }

  async destroy(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = await this.estudianteRepo.delete(id);

      if (!deleted) {
        req.flash?.('error', 'Estudiante no encontrado');
      } else {
        req.flash?.('success', 'Estudiante eliminado exitosamente');
      }

      res.redirect('/estudiantes');
    } catch (error) {
      console.error('Error in EstudianteController.destroy:', error);
      req.flash?.('error', 'Error al eliminar el estudiante');
      res.redirect('/estudiantes');
    }
  }
}