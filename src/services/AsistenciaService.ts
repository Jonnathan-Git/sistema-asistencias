import ExcelJS from 'exceljs';
import moment from 'moment';
import { AsistenciaRepository } from '../repositories/AsistenciaRepository';
import { EstudianteRepository } from '../repositories/EstudianteRepository';
import { GrupoRepository } from '../repositories/GrupoRepository';

export class AsistenciaService {
  private asistenciaRepo = new AsistenciaRepository();
  private grupoRepo = new GrupoRepository();
  private estudianteRepo = new EstudianteRepository();

  async generarReporteExcel(
    tipo: 'diario' | 'semanal' | 'mensual',
    fecha: string,
    grupoId?: number
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Asistencias');

    let fechaInicio: string;
    let fechaFin: string;
    let titulo: string;

    switch (tipo) {
      case 'diario':
        fechaInicio = fechaFin = fecha;
        titulo = `Reporte Diario - ${moment(fecha).format('DD/MM/YYYY')}`;
        break;
      case 'semanal':
        const inicioSemana = moment(fecha).startOf('week');
        const finSemana = moment(fecha).endOf('week');
        fechaInicio = inicioSemana.format('YYYY-MM-DD');
        fechaFin = finSemana.format('YYYY-MM-DD');
        titulo = `Reporte Semanal - ${inicioSemana.format('DD/MM/YYYY')} al ${finSemana.format('DD/MM/YYYY')}`;
        break;
      case 'mensual':
        const inicioMes = moment(fecha).startOf('month');
        const finMes = moment(fecha).endOf('month');
        fechaInicio = inicioMes.format('YYYY-MM-DD');
        fechaFin = finMes.format('YYYY-MM-DD');
        titulo = `Reporte Mensual - ${moment(fecha).format('MMMM YYYY')}`;
        break;
    }

    // Título del reporte
    worksheet.addRow([titulo]);
    worksheet.getRow(1).font = { bold: true, size: 16 };
    
    if (grupoId) {
      const grupo = await this.grupoRepo.findById(grupoId);
      worksheet.addRow([`Grupo: ${grupo?.nombre} (${grupo?.identificador})`]);
      worksheet.getRow(2).font = { bold: true };
    }

    worksheet.addRow([]);

    // Encabezados
    const headers = ['Fecha', 'Estudiante', 'Grupo', 'Estado', 'Descripción'];
    worksheet.addRow(headers);
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    // Datos
    const asistencias = await this.asistenciaRepo.findByRangoFechas(fechaInicio, fechaFin, grupoId);
    
    asistencias.forEach(asistencia => {
      const descripcion = this.getDescripcionEstado(asistencia.estado);
      worksheet.addRow([
        moment(asistencia.fecha).format('DD/MM/YYYY'),
        asistencia.nombreEstudiante,
        asistencia.nombreGrupo,
        asistencia.estado,
        descripcion
      ]);
    });

    // Estadísticas
    worksheet.addRow([]);
    worksheet.addRow(['Resumen de Asistencias']);
    worksheet.lastRow!.font = { bold: true };

    const estadisticas = await this.asistenciaRepo.getEstadisticas(grupoId);
    estadisticas.forEach((stat: any) => {
      const descripcion = this.getDescripcionEstado(stat.estado);
      worksheet.addRow([
        `${descripcion}:`,
        stat.cantidad,
        `${stat.porcentaje}%`
      ]);
    });

    // Ajustar ancho de columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private getDescripcionEstado(estado: string): string {
    switch (estado) {
      case 'P': return 'Presente';
      case 'A': return 'Ausente';
      case 'T': return 'Tardío';
      case 'J': return 'Justificada';
      default: return 'Desconocido';
    }
  }

  async marcarAsistenciasMasivas(
    fecha: string,
    grupoId: number,
    asistencias: { estudianteId: number; estado: 'P' | 'A' | 'T' | 'J' }[]
  ): Promise<void> {
    for (const asistencia of asistencias) {
      await this.asistenciaRepo.upsert({
        fecha,
        estudianteId: asistencia.estudianteId,
        grupoId,
        estado: asistencia.estado
      });
    }
  }
}