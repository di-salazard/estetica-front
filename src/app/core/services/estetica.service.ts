import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Esto hace que el servicio esté disponible en toda la aplicación
})
export class EsteticaService {

  private apiUrl = 'http://localhost:8080/api/servicios'; // Cambia esto a la URL de tu API
  private apiUrlDetalle = 'http://localhost:8080/api/servicios-detalle'; // Cambia esto a la URL de tu API para obtener por ID

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
}