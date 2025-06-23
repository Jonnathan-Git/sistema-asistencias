import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import moment from 'moment';
import { AsistenciaRepository } from '../repositories/AsistenciaRepository';
import { EstudianteRepository } from '../repositories/EstudianteRepository';
import { AsistenciaService } from '../services/AsistenciaService';
import { GrupoRepository } from '../repositories/GrupoRepository';

export class AsistenciaController {
  private asistenciaRepo = new AsistenciaRepository();
  private grupoRepo = new GrupoRepository();
  private estudianteRepo = new EstudianteRepository();
  private asistenciaService = new AsistenciaService();

  // API Methods for JSON responses
  async getAsistencias(fecha: string, grupoId: number) {
    return await this.asistenciaRepo.findByFechaYGrupo(fecha, grupoId);
  }

  // Original view methods (updated for API compatibility)
  async index(req: Request, res: Response): Promise<void> {
    try {
      const grupos = await this.grupoRepo.findAll();
      const fecha = req.query.fecha as string || new Date().toISOString().split('T')[0];
      const grupoId = req.query.grupoId ? parseInt(req.query.grupoId as string) : null;

      let estudiantes: any[] = [];
      let asistencias: any[] = [];
      let grupoSeleccionado = null;

      if (grupoId) {
        estudiantes = await this.estudianteRepo.findByGrupo(grupoId);
        grupoSeleccionado = await this.grupoRepo.findById(grupoId);
        asistencias = await this.asistenciaRepo.findByFechaYGrupo(fecha, grupoId);
      }

      res.render('asistencias/index', {
        grupos,
        estudiantes,
        asistencias,
        fecha,
        grupoId,
        grupoSeleccionado,
        title: 'Control de Asistencias'
      });
    } catch (error) {
      console.error('Error in AsistenciaController.index:', error);
      res.status(500).render('error', {
        message: 'Error interno del servidor',
        error: error
      });
    }
  }

  async guardarAsistencias(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { fecha, grupoId, asistencias } = req.body;

      // Validar que el grupo existe
      const grupo = await this.grupoRepo.findById(grupoId);
      if (!grupo) {
        res.status(400).json({ error: 'Grupo no encontrado' });
        return;
      }

      // Obtener estudiantes del grupo
      const estudiantes = await this.estudianteRepo.findByGrupo(grupoId);
      const estudiantesIds = estudiantes.map(e => e.id);

      // Validar que todos los estudiantes pertenecen al grupo
      const asistenciasIds = Object.keys(asistencias).map(id => parseInt(id));
      const estudiantesInvalidos = asistenciasIds.filter(id => !estudiantesIds.includes(id));

      if (estudiantesInvalidos.length > 0) {
        res.status(400).json({ error: 'Algunos estudiantes no pertenecen al grupo' });
        return;
      }

      // Guardar asistencias
      const resultados = [];
      for (const [estudianteId, estado] of Object.entries(asistencias)) {
        const asistencia = await this.asistenciaRepo.upsert({
          fecha,
          estudianteId: parseInt(estudianteId),
          grupoId,
          estado: estado as 'P' | 'A' | 'T' | 'J'
        });
        resultados.push(asistencia);
      }

      res.json({
        message: 'Asistencias guardadas correctamente',
        asistencias: resultados
      });
    } catch (error) {
      console.error('Error in AsistenciaController.guardarAsistencias:', error);
      res.status(500).json({ error: 'Error al guardar asistencias' });
    }
  }

  async eliminarAsistencia(req: Request, res: Response): Promise<void> {
    try {
      const { fecha, estudianteId } = req.params;
      const deleted = await this.asistenciaRepo.deleteByFechaYEstudiante(fecha, parseInt(estudianteId));

      if (!deleted) {
        res.status(404).json({ error: 'Asistencia no encontrada' });
        return;
      }

      res.json({ message: 'Asistencia eliminada correctamente' });
    } catch (error) {
      console.error('Error in AsistenciaController.eliminarAsistencia:', error);
      res.status(500).json({ error: 'Error al eliminar asistencia' });
    }
  }

  async exportarReporte(req: Request, res: Response): Promise<void> {
    try {
      const { tipo, fecha, grupoId } = req.query;

      if (!tipo || !fecha || !grupoId) {
        res.status(400).json({ error: 'Tipo, fecha y grupoId son requeridos' });
        return;
      }

      const grupo = await this.grupoRepo.findById(parseInt(grupoId as string));
      if (!grupo) {
        res.status(404).json({ error: 'Grupo no encontrado' });
        return;
      }

      const estudiantes = await this.estudianteRepo.findByGrupo(parseInt(grupoId as string));
      const asistencias = await this.asistenciaRepo.findByFechaYGrupo(fecha as string, parseInt(grupoId as string));

      // Crear reporte CSV
      let csvContent = 'Estudiante,Estado\n';

      estudiantes.forEach(estudiante => {
        const asistencia = asistencias.find((a: any) => a.estudianteId === estudiante.id);
        const estado = asistencia ? asistencia.estado : 'A';
        csvContent += `${estudiante.nombre},${estado}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=asistencias_${grupo.identificador}_${fecha}.csv`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error in AsistenciaController.exportarReporte:', error);
      res.status(500).json({ error: 'Error al exportar reporte' });
    }
  }
}