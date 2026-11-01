import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../models/servicio.model';
import { CrearReserva, Disponibilidad } from '../models/reserva.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EsteticaService {

private apiUrl = `${environment.apiUrl}/servicios`;
private apiUrlDetalle = `${environment.apiUrl}/servicios-detalle`;
private apiUrlReserva = `${environment.apiUrl}/reservas`;


  constructor(private http: HttpClient) { }

  obtenerServicios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerServicioPorId(servicioId: number): Observable<any> {
    const url = `${this.apiUrl}/${servicioId}`;
    return this.http.get<any>(url);
  }

  obtenerServicioDetallePorId(servicioId: number): Observable<any> {
    const url = `${this.apiUrlDetalle}/servicio/${servicioId}`;
    return this.http.get<any>(url);
  }
  crearServicio(servicio: Servicio): Observable<Servicio> {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Servicio>(this.apiUrl, servicio, { headers });
  }

  // Reemplaza el servicio completo y sincroniza sus paquetes (con id: actualiza, sin id: crea, ausentes: elimina)
  actualizarServicio(id: number, servicio: Servicio): Observable<Servicio> {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<Servicio>(`${this.apiUrl}/${id}`, servicio, { headers });
  }

  // Sube la imagen del servicio (se guarda en la BD); devuelve el servicio con su nueva imagenUrl
  subirImagenServicio(id: number, imagen: Blob): Observable<Servicio> {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const datos = new FormData();
    datos.append('archivo', imagen, 'imagen.jpg');

    return this.http.post<Servicio>(`${this.apiUrl}/${id}/imagen`, datos, { headers });
  }

  guardarReserva(reservaData: CrearReserva): Observable<any> {
    return this.http.post<any>(this.apiUrlReserva, reservaData);
  }

  // Público: horas de inicio libres de un día para un paquete (fecha YYYY-MM-DD)
  obtenerDisponibilidad(fecha: string, idServicioDetalle: number): Observable<Disponibilidad> {
    return this.http.get<Disponibilidad>(`${this.apiUrlReserva}/disponibilidad`, {
      params: { fecha, idServicioDetalle }
    });
  }

  obtenerReservas(): Observable<any[]> {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(this.apiUrlReserva, { headers });
  }

  // desde incluido, hasta excluido (formato YYYY-MM-DD)
  obtenerCalendario(desde: string, hasta: string): Observable<any[]> {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(`${this.apiUrlReserva}/calendario`, { headers, params: { desde, hasta } });
  }

  eliminarServicio(id: number): Observable<void> {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}