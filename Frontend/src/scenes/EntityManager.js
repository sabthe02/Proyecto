import { Dron } from './Dron.js';
import { PortaDron } from './PortaDron.js';
import { Municion } from './Municion.js';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
    
        this.unidades = new Map(); 
l
        this.scene.events.on('PARTIDA_INICIADA', (packet) => this.inicializarTodo(packet.datos));

        this.scene.events.on('ACTUALIZAR_PARTIDA', (packet) => this.sincronizar(packet.datos));
    }

  
    inicializarTodo(datos) {
        console.log("Inicializando");
        
        datos.listaPortaDronesAereos?.forEach(p => this.crearUnidad(p, 'PORTADRON', 'AEREO'));

        datos.listaPortaDronesNavales?.forEach(p => this.crearUnidad(p, 'PORTADRON', 'NAVAL'));
    }


    sincronizar(datos) {
        const idsRecibidos = new Set();
        
       
        datos.elementos.forEach(datosServidor => {
            idsRecibidos.add(datosServidor.id);

            if (!this.unidades.has(datosServidor.id)) {
                // Si no existe detectamos qué es para crearlo
                this.detectarYCrear(datosServidor);
            } else {
                // Si existe, actualizamos sus atributos
                const unidad = this.unidades.get(datosServidor.id);
                unidad.actualizarDesdeServidor(datosServidor);
            }
        });

        //Eliminamos lo que ya no está en el mensaje del servidor
        this.unidades.forEach((unidad, id) => {
            if (!idsRecibidos.has(id)) {
                this.eliminarUnidad(id);
            }
        });
    }

    
      // Decide qué clase instanciar según los datos del Backend
    detectarYCrear(data) {
        // Si tiene listaDrones es PortaDron, si tiene bateria es Dron, si no, es Municion
        if (data.listaDrones) {
            this.crearUnidad(data, 'PORTADRON', data.tipo);
        } else if (data.bateria !== undefined) {
            this.crearUnidad(data, 'DRON', data.tipo);
        } else {
            this.crearUnidad(data, 'MUNICION', data.tipo);
        }
    }

    crearUnidad(data, categoria, tipoEquipo) {
        console.log(` Creando ${categoria} ${tipoEquipo} - ID: ${data.id}`);
        
        let nuevaUnidad;
        
       
        const config = {
            id: data.id,
            posicionX: data.x || data.posicionX,
            posicionY: data.y || data.posicionY,
            angulo: data.angulo,
            vida: data.vida,
            tipo: tipoEquipo, 
            bateria: data.bateria,
            estado: data.estado
        };

        switch(categoria) {
            case 'PORTADRON':
                nuevaUnidad = new PortaDron(this.scene, config);
                break;
            case 'DRON':
                nuevaUnidad = new Dron(this.scene, config);
                break;
            case 'MUNICION':
                nuevaUnidad = new Municion(this.scene, config);
                break;
        }

        this.unidades.set(data.id, nuevaUnidad);
    }

    eliminarUnidad(id) {
        const unidad = this.unidades.get(id);
        if (unidad) {
            console.log(` Eliminando unidad ${id}`);
            unidad.morir(); 
            this.unidades.delete(id);
        }
    }
}