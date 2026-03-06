import { Drone } from './Drone.js';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        
        //Aca van a vivir nuestras unidades
        this.unidades = new Map(); 

        // Escuchamos al NetworkManager
        this.scene.events.on('net-ACTUALIZAR_PARTIDA', (data) => this.sincronizar(data));
    }

    sincronizar(data) {
      
        const idsRecibidos = new Set();

        data.elementos.forEach(datosUnidad => {
            idsRecibidos.add(datosUnidad.id);

            if (!this.unidades.has(datosUnidad.id)) {
              
                this.crearUnidad(datosUnidad);
            } else {
                
                const unidad = this.unidades.get(datosUnidad.id);
                unidad.actualizarDesdeServidor(datosUnidad);
            }
        });

 
        this.unidades.forEach((unidad, id) => {
            if (!idsRecibidos.has(id)) {
                this.eliminarUnidad(id);
            }
        });
    }

    crearUnidad(data) {
        console.log(`Añadiendo unidad ${data.id} al campo de batalla`);
        const nuevaUnidad = new Drone(this.scene, data);
        this.unidades.set(data.id, nuevaUnidad);
    }

    eliminarUnidad(id) {
        const unidad = this.unidades.get(id);
        if (unidad) {
            unidad.morir(); 
            this.unidades.delete(id);
        }
    }

    //Si necesitamos seguir algun drone
    getUnidad(id) {
        return this.unidades.get(id);
    }
}