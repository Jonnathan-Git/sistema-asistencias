import { database } from '../database/database';
import { Estudiante, EstudianteConAsistencia } from '../models/models';

export class EstudianteRepository {
  private db = database.getDatabase();

  async findAll(limit?: number, offset?: number): Promise<Estudiante[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, g.nombre as nombreGrupo 
        FROM estudiantes e 
        JOIN grupos g ON e.grupoId = g.id 
        ORDER BY e.nombre
      `;
      const params: any[] = [];

      if (limit !== undefined && offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Estudiante[]);
      });
    });
  }

  async count(grupoId?: number): Promise<number> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as count FROM estudiantes';
      const params: any[] = [];

      if (grupoId) {
        query += ' WHERE grupoId = ?';
        params.push(grupoId);
      }

      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve((row as any).count);
      });
    });
  }

  async findById(id: number): Promise<Estudiante | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT e.*, g.nombre as nombreGrupo 
         FROM estudiantes e 
         JOIN grupos g ON e.grupoId = g.id 
         WHERE e.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Estudiante || null);
        }
      );
    });
  }

  async findByGrupo(grupoId: number, limit?: number, offset?: number): Promise<Estudiante[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, g.nombre as nombreGrupo 
        FROM estudiantes e 
        JOIN grupos g ON e.grupoId = g.id 
        WHERE e.grupoId = ? 
        ORDER BY e.nombre
      `;
      const params: any[] = [grupoId];

      if (limit !== undefined && offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Estudiante[]);
      });
    });
  }

  async findByGrupoConAsistencia(grupoId: number, fecha: string): Promise<EstudianteConAsistencia[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          e.*,
          g.nombre as nombreGrupo,
          a.estado,
          a.id as asistenciaId
        FROM estudiantes e
        JOIN grupos g ON e.grupoId = g.id
        LEFT JOIN asistencias a ON e.id = a.estudianteId AND a.fecha = ?
        WHERE e.grupoId = ?
        ORDER BY e.nombre
      `;

      this.db.all(query, [fecha, grupoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as EstudianteConAsistencia[]);
      });
    });
  }

  async create(estudiante: Omit<Estudiante, 'id'> | Estudiante): Promise<Estudiante> {
    return new Promise((resolve, reject) => {
      if ('id' in estudiante && estudiante.id) {
        this.db.run(
          'INSERT INTO estudiantes (id, nombre, grupoId) VALUES (?, ?, ?)',
          [estudiante.id, estudiante.nombre, estudiante.grupoId],
          function (err) {
            if (err) reject(err);
            else {
              resolve({
                id: estudiante.id,
                nombre: estudiante.nombre,
                grupoId: estudiante.grupoId
              });
            }
          }
        );
      } else {
        this.db.run(
          'INSERT INTO estudiantes (nombre, grupoId) VALUES (?, ?)',
          [estudiante.nombre, estudiante.grupoId],
          function (err) {
            if (err) reject(err);
            else {
              resolve({
                id: this.lastID,
                nombre: estudiante.nombre,
                grupoId: estudiante.grupoId
              });
            }
          }
        );
      }
    });
  }

  async update(id: number, estudiante: Partial<Estudiante>): Promise<Estudiante | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (estudiante.nombre !== undefined) {
        updates.push('nombre = ?');
        values.push(estudiante.nombre);
      }

      if (estudiante.grupoId !== undefined) {
        updates.push('grupoId = ?');
        values.push(estudiante.grupoId);
      }

      if (updates.length === 0) {
        resolve(null);
        return;
      }

      values.push(id);
      const query = `UPDATE estudiantes SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(query, values, function (err) {
        if (err) reject(err);
        else {
          if (this.changes > 0) {
            resolve({
              id,
              nombre: estudiante.nombre || '',
              grupoId: estudiante.grupoId || 0
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM estudiantes WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }
}