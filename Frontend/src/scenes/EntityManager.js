import { Drone } from './Drone.js';
import { Portadrones } from './Portadrones.js';
import { Projectile } from './Projectile.js';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        
        // Acá van a vivir nuestras unidades
        this.unidades = new Map(); 

        // Escuchamos al NetworkManager
        this.scene.events.on('ACTUALIZAR_PARTIDA', (data) => this.sincronizar(data));
        this.scene.events.on('APLICAR_DANO', (data) => this.aplicarDano(data));
    }

    sincronizar(data) {
        // Backend sends: {tipo: 'ACTUALIZAR_PARTIDA', datos: {...}}
        // Extract the actual game data from datos object
        const gameData = data.datos || data;
        
        // Check if elementos array exists
        if (!gameData.elementos) {
            console.warn('ACTUALIZAR_PARTIDA sin elementos:', data);
            return;
        }
      
        // Solo loguear el total de elementos, no cada uno
        // console.log('EntityManager.sincronizar - Recibidos', gameData.elementos.length, 'elementos');
        
        // ACTUALIZAR_PARTIDA es un update INCREMENTAL - solo actualiza/crea elementos recibidos
        // NO elimina elementos que no están en el mensaje
        gameData.elementos.forEach(datosUnidad => {
            // Solo loguear elementos nuevos o con información crítica de debug
            // console.log('Elemento recibido:', datosUnidad.id, 'clase=', datosUnidad.clase, 'tipoEquipo=', datosUnidad.tipoEquipo, 'x=', datosUnidad.x, 'y=', datosUnidad.y, 'z=', datosUnidad.z);

            // Si el elemento está marcado como DESTRUIDO, eliminarlo del frontend
            if (datosUnidad.estado === 'DESTRUIDO') {
                if (this.unidades.has(datosUnidad.id)) {
                    console.log(`[EntityManager] Elemento ${datosUnidad.id} (${datosUnidad.clase || 'unknown'}) DESTRUIDO - eliminando del frontend`);
                    this.eliminarUnidad(datosUnidad.id);
                }
                return; // No crear ni actualizar elementos destruidos
            }

            if (!this.unidades.has(datosUnidad.id)) {
                this.crearUnidad(datosUnidad);
            } else {
                const unidad = this.unidades.get(datosUnidad.id);
                unidad.actualizarDesdeServidor(datosUnidad);
            }
        });
    }

    crearUnidad(data) {
        let nuevaUnidad;
        
        // Distinguir entre Dron, Portadron, y Proyectiles según clase del Backend
        if (data.clase === 'PORTADRON') {
            // Portadron creado
            nuevaUnidad = new Portadrones(this.scene, data.x, data.y, data);
        } else if (data.clase === 'DRON') {
            // Dron creado
            nuevaUnidad = new Drone(this.scene, data);
        } else if (data.clase === 'MISIL' || data.clase === 'BOMBA') {
            // No loguear proyectiles en (0,0) - son municiones inactivas
            if (data.x !== 0 || data.y !== 0) {
                // Projectile creado
            }
            nuevaUnidad = new Projectile(this.scene, data);
        } else {
            console.warn(`Clase desconocida: ${data.clase} para unidad ${data.id}`);
            return;
        }
        
        this.unidades.set(data.id, nuevaUnidad);
    }

    eliminarUnidad(id) {
        const unidad = this.unidades.get(id);
        if (unidad) {
            // Unidad eliminada
            // Llamar al método de destrucción apropiado según el tipo de unidad
            if (unidad.destruir) {
                unidad.destruir(); // Portadrones y Proyectiles
            } else if (unidad.morir) {
                unidad.morir(); // Drones
            } else {
                unidad.destroy(); // Fallback
            }
            this.unidades.delete(id);
        } else {
            console.warn(`Intento de eliminar unidad ${id} que no existe`);
        }
    }

    // Si necesitamos devolver algún dron o portadrones específico
    getUnidad(id) {
        return this.unidades.get(id);
    }

    aplicarDano(data) {
        // Expected backend structure:
        // { tipo: 'APLICAR_DANO', idObjetivo: number, dano: number, vidaRestante: number, estaDestruido: boolean, claseProyectil: string }
        const { idObjetivo, dano, vidaRestante, estaDestruido, claseProyectil } = data;
        
        console.log(`[EntityManager] APLICAR_DANO recibido:`, {
            idObjetivo, dano, vidaRestante, estaDestruido, claseProyectil
        });
        
        const unidad = this.unidades.get(idObjetivo);
        if (!unidad) {
            console.warn(`[EntityManager] APLICAR_DANO: Unidad ${idObjetivo} no encontrada en frontend`);
            return;
        }
        
        let sufijo;
        if (estaDestruido) {
            sufijo = ' (DESTRUIDO)';
        } else {
            sufijo = '';
        }
        // Dano aplicado
        
        // Siempre mostrar ImpactoView para:
        // - ANY drone hit (drones always die from one hit)
        // - ANY portadron hit
        const esDron = unidad.clase === 'DRON';
        const esPortadron = unidad.clase === 'PORTADRON';
        
        console.log(`Verificando ImpactView: clase=${unidad.clase}, esDron=${esDron}, esPortadron=${esPortadron}`);
        
        if (esDron || esPortadron) {
            // Determinar angulo basado en proyectil
            let proyectilAngulo;
            let proyectilPosicion = null;
            
            if (claseProyectil === 'BOMBA') {
                // Bombas siempre caen verticalmente desde arriba
                proyectilAngulo = 270; // 270° = cayendo desde arriba (en Phaser Y+ es abajo)
            } else if (claseProyectil === 'MISIL') {
                // Misiles viajan horizontalmente - buscar el misil para obtener su direccion
                let misilEncontrado = null;
                let encontradoFlag = false;
                
                for (let [id, entidad] of this.unidades.entries()) {
                    if (encontradoFlag) {
                        continue;
                    }
                    
                    if (entidad.clase === 'MISIL') {
                        const distancia = Phaser.Math.Distance.Between(
                            entidad.x, entidad.y, 
                            unidad.x, unidad.y
                        );
                        
                        if (distancia < 50) {
                            misilEncontrado = entidad;
                            entidad.causedImpact = true;
                            encontradoFlag = true;
                        }
                    }
                }
                
                if (misilEncontrado && misilEncontrado.rotation !== undefined) {
                    proyectilAngulo = Phaser.Math.RadToDeg(misilEncontrado.rotation);
                } else {
                    proyectilAngulo = 0; // Horizontal por defecto
                }
            } else {
                // Tipo desconocido - usar horizontal por defecto
                proyectilAngulo = 0;
            }
            
            // Mostrar escena de impacto en vista lateral
            let proyectilTipo;
            if (claseProyectil) {
                proyectilTipo = claseProyectil;
            } else if (dano >= 100) {
                proyectilTipo = 'BOMBA';
            } else {
                proyectilTipo = 'MISIL';
            }
            
            let equipoObjetivo = 'AEREO';
            if (unidad.tipoEquipo) {
                equipoObjetivo = unidad.tipoEquipo;
            }
            
            const datosImpacto = {
                proyectilTipo: proyectilTipo,
                objetivoTipo: unidad.clase,
                objetivoEquipo: equipoObjetivo,
                dañoInfligido: dano,
                angulo: proyectilAngulo,
                targetPosicion: { x: unidad.x, y: unidad.y },
                proyectilPosicion: proyectilPosicion
            };
            
            // Mostrando ImpactView
            console.log('[EntityManager] Mostrando ImpactView con datos:', datosImpacto);
            if (this.scene.mostrarVistaImpacto) {
                this.scene.mostrarVistaImpacto(datosImpacto);
            } else {
                console.error('[EntityManager] ERROR: scene.mostrarVistaImpacto no existe!');
            }
        }
        
        // Show damage visual effect (red flash and damage text)
        if (unidad.mostrarDano) {
            unidad.mostrarDano(dano);
        }
        
        // Update vida immediately (ACTUALIZAR_PARTIDA will sync it anyway)
        if (unidad.vida !== undefined) {
            unidad.vida = vidaRestante;
        }
        
        // Importante: No eliminar ni marcar como destruido aquí - el backend se encarga de eso en ACTUALIZAR_PARTIDA para evitar inconsistencias visuales
        // La destrucción de entidades se manejará automáticamente a través de ACTUALIZAR_PARTIDA
        // cuando el backend marque estado='DESTRUIDO' o las elimine de elementos[]
        // APLICAR_DANO procesado
    }
}