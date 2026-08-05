import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../models/servicio.model';
import { environment } from '../../../environments/environment.prod';

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

  guardarReserva(reservaData: any): Observable<any> {
    return this.http.post<any>(this.apiUrlReserva, reservaData);
  }
}