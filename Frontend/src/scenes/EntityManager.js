import { Projectile } from './Projectile.js';
import { Drone } from './Drone.js';
import { Portadrones } from './Portadrones.js';


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
        const gameData = data.datos || data;
        if (!gameData.elementos) {
            console.warn('ACTUALIZAR_PARTIDA sin elementos:', data);
            return;
        }
        this.jugadores = gameData.jugadores || [];
        this.mapa = gameData.mapa || null;
        gameData.elementos.forEach(datosUnidad => {
            // La destrucción la maneja el backend
            if (datosUnidad.estado === 'DESTRUIDO') {
                if (this.unidades.has(datosUnidad.id)) {
                    const unidad = this.unidades.get(datosUnidad.id);
                    if (unidad.clase === 'DRON' && unidad.morir) {
                        // Determinar causa: batería agotada o combate
                        let razon;
                        if (datosUnidad.bateria !== undefined && datosUnidad.bateria <= 0) {
                            razon = 'bateria';
                        } else {
                            razon = 'combate';
                        }
                        unidad.morir(razon);
                        this.unidades.delete(datosUnidad.id);
                    } else {
                        this.eliminarUnidad(datosUnidad.id);
                    }
                }
                return;
            }
            if (!this.unidades.has(datosUnidad.id)) {
                this.crearUnidad(datosUnidad);
            } else {
                const unidad = this.unidades.get(datosUnidad.id);
                if (unidad.actualizarDesdeServidor) {
                    unidad.actualizarDesdeServidor(datosUnidad);
                }
            }
        });
    }

    crearUnidad(data) {
        let nuevaUnidad;
        
        // Distinguir entre Dron, Portadron, y Proyectiles según clase del Backend
        if (data.clase === 'PORTADRON') {
            // Portadron creado
            nuevaUnidad = new Portadrones(this.scene, data);
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
        const { idObjetivo, dano, vidaRestante, estaDestruido, claseProyectil } = data;
        
        const unidad = this.unidades.get(idObjetivo);
        if (!unidad) {
            console.warn(`[EntityManager] APLICAR_DANO: Unidad ${idObjetivo} no encontrada`);
            return;
        }
        
        // Actualizar vida (ACTUALIZAR_PARTIDA lo sincroniza de todas formas)
        if (unidad.vida !== undefined) {
            unidad.vida = vidaRestante;
        }
        
        // Refrescar barra de vida del portadron de inmediato (sin esperar el próximo movimiento)
        if (unidad.clase === 'PORTADRON' && unidad.dibujarBarras) {
            unidad.dibujarBarras(vidaRestante);
        }
        
        if (unidad.clase === 'DRON' || unidad.clase === 'PORTADRON') {
            // Mostrar número de daño sobre la unidad
            if (unidad.mostrarDano) {
                unidad.mostrarDano(dano);
            }
            
            // La animación se determina por el equipo del objetivo:
            // Objetivo NAVAL → impactado por BOMBA aérea (cae desde arriba, 270°)
            // Objetivo AEREO → impactado por MISIL naval (viene horizontal, 0°)
            let proyectilTipo;
            let angulo;
            const equipoObjetivoTipo = (unidad.tipoEquipo || '').toUpperCase();
            if (equipoObjetivoTipo === 'NAVAL') {
                proyectilTipo = 'BOMBA';
                angulo = 270;
            } else {
                proyectilTipo = 'MISIL';
                angulo = 0;
            }
            
            let equipoObjetivo;
            if (unidad.tipoEquipo) {
                equipoObjetivo = unidad.tipoEquipo;
            } else {
                equipoObjetivo = equipoObjetivoTipo;
            }
            
            const datosImpacto = {
                proyectilTipo: proyectilTipo,
                objetivoTipo: unidad.clase,
                objetivoEquipo: equipoObjetivo,
                dañoInfligido: dano,
                angulo: angulo,
                targetPosicion: { x: unidad.x, y: unidad.y },
                proyectilPosicion: null
            };
            
            // Esperar 500ms para que la explosión del proyectil se vea antes de pausar la escena
            if (this.scene.mostrarVistaImpacto) {
                this.scene.time.delayedCall(500, () => {
                    this.scene.mostrarVistaImpacto(datosImpacto);
                });
            }
        }
    }
}