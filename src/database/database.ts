import sqlite3 from 'sqlite3';
import path from 'path';

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // En Render, usar /tmp para la base de datos SQLite
    if (process.env.NODE_ENV === 'production') {
      this.dbPath = '/tmp/database.sqlite';
    } else {
      this.dbPath = path.join(__dirname, '../../database.sqlite');
    }
  }

  getDatabase(): sqlite3.Database {
    if (!this.db) {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error al conectar con la base de datos:', err);
        } else {
          console.log('Conectado a la base de datos SQLite');
          this.initializeTables();
        }
      });
    }
    return this.db;
  }

  private initializeTables() {
    if (!this.db) return;

    // Crear tabla grupos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS grupos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        identificador TEXT UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error al crear tabla grupos:', err);
      } else {
        console.log('Tabla grupos inicializada');
      }
    });

    // Crear tabla estudiantes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        grupoId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grupoId) REFERENCES grupos (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error al crear tabla estudiantes:', err);
      } else {
        console.log('Tabla estudiantes inicializada');
      }
    });

    // Crear tabla asistencias
    this.db.run(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estudianteId INTEGER NOT NULL,
        fecha DATE NOT NULL,
        estado TEXT NOT NULL CHECK (estado IN ('P', 'A', 'T', 'J')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estudianteId) REFERENCES estudiantes (id) ON DELETE CASCADE,
        UNIQUE(estudianteId, fecha)
      )
    `, (err) => {
      if (err) {
        console.error('Error al crear tabla asistencias:', err);
      } else {
        console.log('Tabla asistencias inicializada');
        console.log('Database tables initialized successfully');
      }
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error al cerrar la base de datos:', err);
        } else {
          console.log('Base de datos cerrada');
        }
      });
    }
  }
}

export const database = new Database();