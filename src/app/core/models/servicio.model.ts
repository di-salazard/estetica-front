import { ServicioDetalle } from "./servicio-detalle.model";

export interface Servicio {
	id: number;
	titulo: string;
	descripcionBase?: string;
	enOferta: boolean;
	imagenUrl: string;
	detalles?: ServicioDetalle[];
}

