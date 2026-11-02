import { ServicioDetalle } from "./servicio-detalle.model";

export interface Servicio {
	id: number;
	titulo: string;
	descripcionBase?: string;
	enOferta: boolean;
	imagenUrl: string;
	duracionMinutos?: number | null;
	activo?: boolean | null; // null = activo (servicios antiguos)
	detalles?: ServicioDetalle[];
}

