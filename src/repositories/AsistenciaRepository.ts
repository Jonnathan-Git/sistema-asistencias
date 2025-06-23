import { database } from '../database/database';
import { Asistencia, AsistenciaCompleta } from '../models/models';

export class AsistenciaRepository {
  private db = database.getDatabase();

  async findByFechaYGrupo(fecha: string, grupoId: number): Promise<AsistenciaCompleta[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.*,
          e.nombre as nombreEstudiante,
          g.nombre as nombreGrupo
        FROM asistencias a
        JOIN estudiantes e ON a.estudianteId = e.id
        JOIN grupos g ON a.grupoId = g.id
        WHERE a.fecha = ? AND a.grupoId = ?
        ORDER BY e.nombre
      `;
      
      this.db.all(query, [fecha, grupoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as AsistenciaCompleta[]);
      });
    });
  }

  async findByRangoFechas(fechaInicio: string, fechaFin: string, grupoId?: number): Promise<AsistenciaCompleta[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          a.*,
          e.nombre as nombreEstudiante,
          g.nombre as nombreGrupo
        FROM asistencias a
        JOIN estudiantes e ON a.estudianteId = e.id
        JOIN grupos g ON a.grupoId = g.id
        WHERE a.fecha BETWEEN ? AND ?
      `;
      
      const params: any[] = [fechaInicio, fechaFin];
      
      if (grupoId) {
        query += ' AND a.grupoId = ?';
        params.push(grupoId);
      }
      
      query += ' ORDER BY a.fecha DESC, e.nombre';
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as AsistenciaCompleta[]);
      });
    });
  }

  async upsert(asistencia: Omit<Asistencia, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO asistencias (fecha, estudianteId, grupoId, estado)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(
        query,
        [asistencia.fecha, asistencia.estudianteId, asistencia.grupoId, asistencia.estado],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM asistencias WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async deleteByFechaYEstudiante(fecha: string, estudianteId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM asistencias WHERE fecha = ? AND estudianteId = ?',
        [fecha, estudianteId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  async getEstadisticas(grupoId?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          estado,
          COUNT(*) as cantidad,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM asistencias ${grupoId ? 'WHERE grupoId = ?' : ''}), 2) as porcentaje
        FROM asistencias 
        ${grupoId ? 'WHERE grupoId = ?' : ''}
        GROUP BY estado
      `;
      
      const params = grupoId ? [grupoId, grupoId] : [];
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}