import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth/login'; // Endpoint de tu Spring Boot

  constructor(private http: HttpClient) {}

  login(credentials: { correo: string, password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials);
  }
}