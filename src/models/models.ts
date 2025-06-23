export interface Grupo {
  id: number;
  nombre: string;
  identificador: string;
}

export interface Estudiante {
  id: number;
  nombre: string;
  grupoId: number;
}

export interface Asistencia {
  id: number;
  fecha: string;
  estudianteId: number;
  grupoId: number;
  estado: 'P' | 'A' | 'T' | 'J'; // Presente, Ausente, Tardío, Justificada
}

export interface AsistenciaCompleta extends Asistencia {
  nombreEstudiante: string;
  nombreGrupo: string;
}

export interface EstudianteConAsistencia extends Estudiante {
  estado?: 'P' | 'A' | 'T' | 'J';
  asistenciaId?: number;
}