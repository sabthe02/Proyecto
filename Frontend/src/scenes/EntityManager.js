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
        // Extract the actual game data from datos object
        const gameData = data.datos || data;
        
        // Check if elementos array exists
        if (!gameData.elementos) {
            console.warn('ACTUALIZAR_PARTIDA sin elementos:', data);
            return;
        }
      
        // Solo loguear el total de elementos, no cada uno
        // console.log('EntityManager.sincronizar - Recibidos', gameData.elementos.length, 'elementos');
        
        const idsRecibidos = new Set();

        gameData.elementos.forEach(datosUnidad => {
            idsRecibidos.add(datosUnidad.id);
            
            // Solo loguear elementos nuevos o con información crítica de debug
            // console.log('Elemento recibido:', datosUnidad.id, 'clase=', datosUnidad.clase, 'tipoEquipo=', datosUnidad.tipoEquipo, 'x=', datosUnidad.x, 'y=', datosUnidad.y, 'z=', datosUnidad.z);

            if (!this.unidades.has(datosUnidad.id)) {
              
                this.crearUnidad(datosUnidad);
            } else {
                // Si existe, actualizamos sus atributos
                const unidad = this.unidades.get(datosServidor.id);
                unidad.actualizarDesdeServidor(datosServidor);
            }
        });

        // Eliminar unidades que ya no existen
        this.unidades.forEach((unidad, id) => {
            if (!idsRecibidos.has(id)) {
                this.eliminarUnidad(id);
            }
        });
    }

    crearUnidad(data) {
        let nuevaUnidad;
        
        // Distinguir entre Dron, Portadron, y Proyectiles según clase del Backend
        if (data.clase === 'PORTADRON') {
            console.log(`[+] Portadron ${data.id} (${data.tipoEquipo}) idJugador=${data.idJugador || 'MISSING'}`);
            nuevaUnidad = new Portadrones(this.scene, data.x, data.y, data);
        } else if (data.clase === 'DRON') {
            console.log(`[+] Dron ${data.id} (${data.tipoEquipo}) estado=${data.estado} idJugador=${data.idJugador || 'MISSING'}`);
            nuevaUnidad = new Drone(this.scene, data);
        } else if (data.clase === 'MISIL' || data.clase === 'BOMBA') {
            // No loguear proyectiles en (0,0) - son municiones inactivas
            if (data.x !== 0 || data.y !== 0) {
                console.log(`[+] Projectile ${data.id} (${data.clase})`);
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
            // Llamar al método de destrucción apropiado según el tipo de unidad
            if (unidad.destruir) {
                unidad.destruir(); // Portadrones y Proyectiles
            } else if (unidad.morir) {
                unidad.morir(); // Drones
            } else {
                unidad.destroy(); // Fallback
            }
            this.unidades.delete(id);
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
        
        const unidad = this.unidades.get(idObjetivo);
        if (!unidad) {
            console.warn(`APLICAR_DANO: Unidad ${idObjetivo} no encontrada`);
            return;
        }
        
        console.log(`[DANO] Unidad ${idObjetivo} recibio ${dano} de daño. Vida restante: ${vidaRestante}${estaDestruido ? ' (DESTRUIDO)' : ''}`);
        
        // Always show ImpactView for:
        // - ANY drone hit (drones always die from one hit)
        // - ANY portadron hit
        const esDron = unidad.clase === 'DRON';
        const esPortadron = unidad.clase === 'PORTADRON';
        
        if (esDron || esPortadron) {
            // Show side-view impact scene
            const datosImpacto = {
                proyectilTipo: claseProyectil || (dano >= 100 ? 'BOMBA' : 'MISIL'),
                objetivoTipo: unidad.clase,
                objetivoEquipo: unidad.tipoEquipo || 'AEREO',
                dañoInfligido: dano
            };
            
            if (this.scene.mostrarVistaImpacto) {
                this.scene.mostrarVistaImpacto(datosImpacto);
            }
        }
        
        // Show damage visual effect
        if (unidad.mostrarDano) {
            unidad.mostrarDano(dano);
        }
        
        // Update vida immediately (ACTUALIZAR_PARTIDA will sync it anyway)
        if (unidad.vida !== undefined) {
            unidad.vida = vidaRestante;
        }
        
        // Note: Entity destruction will be handled automatically via ACTUALIZAR_PARTIDA
        // when backend marks estado='DESTRUIDO' or removes it from elementos[]
    }
}