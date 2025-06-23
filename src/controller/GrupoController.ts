import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { EstudianteRepository } from '../repositories/EstudianteRepository';
import { GrupoRepository } from '../repositories/GrupoRepository';

export class GrupoController {
  private grupoRepo = new GrupoRepository();
  private estudianteRepo = new EstudianteRepository();

  // API Methods for JSON responses
  async getAllGrupos(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const grupos = await this.grupoRepo.findAll(limit, offset);
    const total = await this.grupoRepo.count();
    const totalPages = Math.ceil(total / limit);

    return {
      grupos,
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

  async getGrupoById(id: number) {
    return await this.grupoRepo.findById(id);
  }

  async createGrupo(data: { nombre: string; identificador: string }) {
    return await this.grupoRepo.create(data);
  }

  async updateGrupo(id: number, data: { nombre: string; identificador: string }) {
    return await this.grupoRepo.update(id, data);
  }

  async deleteGrupo(id: number) {
    // Verificar si el grupo tiene estudiantes
    const estudiantes = await this.estudianteRepo.findByGrupo(id);
    if (estudiantes.length > 0) {
      throw new Error('No se puede eliminar un grupo que tiene estudiantes asignados');
    }
    return await this.grupoRepo.delete(id);
  }

  // Original view methods (kept for compatibility)
  async index(req: Request, res: Response): Promise<void> {
    try {
      const grupos = await this.grupoRepo.findAll();
      res.render('grupos/index', {
        grupos,
        title: 'Gestión de Grupos'
      });
    } catch (error) {
      console.error('Error in GrupoController.index:', error);
      res.status(500).render('error', {
        message: 'Error interno del servidor',
        error: error
      });
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const grupo = await this.grupoRepo.findById(id);

      if (!grupo) {
        req.flash?.('error', 'Grupo no encontrado');
        res.redirect('/grupos');
        return;
      }

      const estudiantes = await this.estudianteRepo.findByGrupo(id);

      res.render('grupos/show', {
        grupo,
        estudiantes,
        title: `Grupo: ${grupo.nombre}`
      });
    } catch (error) {
      console.error('Error in GrupoController.show:', error);
      res.status(500).render('error', {
        message: 'Error interno del servidor',
        error: error
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    res.render('grupos/create', {
      title: 'Crear Grupo'
    });
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render('grupos/create', {
          errors: errors.array(),
          oldData: req.body,
          title: 'Crear Grupo'
        });
        return;
      }

      const { nombre, identificador } = req.body;
      await this.grupoRepo.create({ nombre, identificador });

      req.flash?.('success', 'Grupo creado exitosamente');
      res.redirect('/grupos');
    } catch (error) {
      console.error('Error in GrupoController.store:', error);
      if ((error as Error).message?.includes('UNIQUE constraint failed')) {
        res.render('grupos/create', {
          errors: [{ msg: 'El identificador del grupo ya existe' }],
          oldData: req.body,
          title: 'Crear Grupo'
        });
      } else {
        req.flash?.('error', 'Error al crear el grupo');
        res.redirect('/grupos');
      }
    }
  }

  async edit(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const grupo = await this.grupoRepo.findById(id);

      if (!grupo) {
        req.flash?.('error', 'Grupo no encontrado');
        res.redirect('/grupos');
        return;
      }

      res.render('grupos/edit', {
        grupo,
        title: `Editar Grupo: ${grupo.nombre}`
      });
    } catch (error) {
      console.error('Error in GrupoController.edit:', error);
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
        const grupo = await this.grupoRepo.findById(parseInt(req.params.id));
        res.render('grupos/edit', {
          grupo,
          errors: errors.array(),
          title: `Editar Grupo: ${grupo?.nombre}`
        });
        return;
      }

      const id = parseInt(req.params.id);
      const { nombre, identificador } = req.body;

      const updated = await this.grupoRepo.update(id, { nombre, identificador });

      if (!updated) {
        req.flash?.('error', 'Grupo no encontrado');
        res.redirect('/grupos');
        return;
      }

      req.flash?.('success', 'Grupo actualizado exitosamente');
      res.redirect('/grupos');
    } catch (error) {
      console.error('Error in GrupoController.update:', error);
      if ((error as Error).message?.includes('UNIQUE constraint failed')) {
        const grupo = await this.grupoRepo.findById(parseInt(req.params.id));
        res.render('grupos/edit', {
          grupo,
          errors: [{ msg: 'El identificador del grupo ya existe' }],
          title: `Editar Grupo: ${grupo?.nombre}`
        });
      } else {
        req.flash?.('error', 'Error al actualizar el grupo');
        res.redirect('/grupos');
      }
    }
  }

  async destroy(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      // Verificar si el grupo tiene estudiantes
      const estudiantes = await this.estudianteRepo.findByGrupo(id);
      if (estudiantes.length > 0) {
        req.flash?.('error', 'No se puede eliminar un grupo que tiene estudiantes asignados');
        res.redirect('/grupos');
        return;
      }

      const deleted = await this.grupoRepo.delete(id);

      if (!deleted) {
        req.flash?.('error', 'Grupo no encontrado');
      } else {
        req.flash?.('success', 'Grupo eliminado exitosamente');
      }

      res.redirect('/grupos');
    } catch (error) {
      console.error('Error in GrupoController.destroy:', error);
      req.flash?.('error', 'Error al eliminar el grupo');
      res.redirect('/grupos');
    }
  }
}