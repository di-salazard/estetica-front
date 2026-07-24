export interface CrearReserva {
	correo_cliente: string;
	fecha_hora: string;
	id_servicio_detalle: number;
	telefono?: string;
	correo?: string | null;
	estado?: string;
}
