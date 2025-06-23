import { database } from '../database/database';
import { Grupo } from '../models/models';

export class GrupoRepository {
  private db = database.getDatabase();

  async findAll(limit?: number, offset?: number): Promise<Grupo[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM grupos ORDER BY nombre';
      const params: any[] = [];

      if (limit !== undefined && offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Grupo[]);
      });
    });
  }

  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM grupos', (err, row) => {
        if (err) reject(err);
        else resolve((row as any).count);
      });
    });
  }

  async findById(id: number): Promise<Grupo | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM grupos WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Grupo || null);
      });
    });
  }

  async create(grupo: Omit<Grupo, 'id'> | Grupo): Promise<Grupo> {
    return new Promise((resolve, reject) => {
      // Si el grupo tiene un ID específico, usarlo; si no, dejar que SQLite genere uno
      if ('id' in grupo && grupo.id) {
        this.db.run(
          'INSERT INTO grupos (id, nombre, identificador) VALUES (?, ?, ?)',
          [grupo.id, grupo.nombre, grupo.identificador],
          function (err) {
            if (err) reject(err);
            else {
              resolve({
                id: grupo.id,
                nombre: grupo.nombre,
                identificador: grupo.identificador
              });
            }
          }
        );
      } else {
        this.db.run(
          'INSERT INTO grupos (nombre, identificador) VALUES (?, ?)',
          [grupo.nombre, grupo.identificador],
          function (err) {
            if (err) reject(err);
            else {
              resolve({
                id: this.lastID,
                nombre: grupo.nombre,
                identificador: grupo.identificador
              });
            }
          }
        );
      }
    });
  }

  async update(id: number, grupo: Partial<Grupo>): Promise<Grupo | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (grupo.nombre !== undefined) {
        updates.push('nombre = ?');
        values.push(grupo.nombre);
      }

      if (grupo.identificador !== undefined) {
        updates.push('identificador = ?');
        values.push(grupo.identificador);
      }

      if (updates.length === 0) {
        resolve(null);
        return;
      }

      values.push(id);
      const query = `UPDATE grupos SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(query, values, function (err) {
        if (err) reject(err);
        else {
          if (this.changes > 0) {
            resolve({
              id,
              nombre: grupo.nombre || '',
              identificador: grupo.identificador || ''
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
      this.db.run('DELETE FROM grupos WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }
}