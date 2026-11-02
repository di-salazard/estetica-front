import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/login`; // Endpoint de tu Spring Boot

  constructor(private http: HttpClient) {}

  login(credentials: { correo: string, password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials);
  }
}