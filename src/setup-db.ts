import { database } from './database/database';
import { GrupoRepository } from './repositories/GrupoRepository';
import { EstudianteRepository } from './repositories/EstudianteRepository';
import * as fs from 'fs';
import * as path from 'path';

const grupoRepo = new GrupoRepository();
const estudianteRepo = new EstudianteRepository();

async function setupDatabase() {
    try {
        console.log('Iniciando configuración de la base de datos...');

        // Leer datos de grupos desde el archivo JSON
        const gruposPath = path.join(__dirname, '../GruposInit.json');
        const gruposData = JSON.parse(fs.readFileSync(gruposPath, 'utf8'));

        // Leer datos de estudiantes desde el archivo JSON
        const estudiantesPath = path.join(__dirname, '../EstudiantesInit.json');
        const estudiantesData = JSON.parse(fs.readFileSync(estudiantesPath, 'utf8'));

        // Insertar grupos
        console.log('Insertando grupos...');
        for (const row of gruposData[0].rows) {
            const grupo = {
                id: parseInt(row[0]),
                nombre: row[1],
                identificador: row[2]
            };

            try {
                await grupoRepo.create(grupo);
                console.log(`Grupo creado: ${grupo.nombre} (${grupo.identificador})`);
            } catch (error: any) {
                if (error.message?.includes('UNIQUE constraint failed')) {
                    console.log(`Grupo ya existe: ${grupo.nombre} (${grupo.identificador})`);
                } else {
                    console.error(`Error al crear grupo ${grupo.nombre}:`, error);
                }
            }
        }

        // Insertar estudiantes
        console.log('Insertando estudiantes...');
        for (const row of estudiantesData[0].rows) {
            const estudiante = {
                id: parseInt(row[0]),
                nombre: row[1],
                grupoId: parseInt(row[2])
            };

            try {
                await estudianteRepo.create(estudiante);
                console.log(`Estudiante creado: ${estudiante.nombre} (Grupo ID: ${estudiante.grupoId})`);
            } catch (error: any) {
                if (error.message?.includes('UNIQUE constraint failed')) {
                    console.log(`Estudiante ya existe: ${estudiante.nombre}`);
                } else {
                    console.error(`Error al crear estudiante ${estudiante.nombre}:`, error);
                }
            }
        }

        console.log('Configuración de la base de datos completada exitosamente');
        console.log(`Total grupos insertados: ${gruposData[0].rows.length}`);
        console.log(`Total estudiantes insertados: ${estudiantesData[0].rows.length}`);
    } catch (error) {
        console.error('Error en la configuración de la base de datos:', error);
    } finally {
        database.close();
    }
}

setupDatabase(); 