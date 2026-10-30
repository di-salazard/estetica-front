export interface CrearReserva {
	nombreCliente: string;
	correoCliente: string;
	telefono: string;
	fechaHora: string; // "2026-11-05T15:00:00", hora de Chile sin zona
	idServicioDetalle: number;
}

export interface Disponibilidad {
	fecha: string;
	duracionMinutos: number;
	horas: string[]; // horas de inicio libres, ej. ["10:00", "10:30"]
}
