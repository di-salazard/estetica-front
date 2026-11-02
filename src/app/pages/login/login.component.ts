import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  correo: string = '';
  password: string = '';
  errorMessage: string = '';
  segundosBloqueo = 0; // tras muchos intentos el backend pide esperar un minuto
  private temporizador: any;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  onLogin() {
    if (this.segundosBloqueo > 0) {
      return;
    }
    const credentials = { correo: this.correo, password: this.password };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        sessionStorage.setItem('authToken', response.token);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        if (err?.status === 429) {
          this.errorMessage = err.error?.error || 'Demasiados intentos de inicio de sesión. Espera un minuto e intenta de nuevo.';
          this.bloquear(60);
        } else {
          this.errorMessage = 'Correo o contraseña incorrectos.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Desactiva el botón y muestra la cuenta regresiva
  private bloquear(segundos: number) {
    clearInterval(this.temporizador);
    this.segundosBloqueo = segundos;
    this.temporizador = setInterval(() => {
      this.segundosBloqueo--;
      if (this.segundosBloqueo <= 0) {
        clearInterval(this.temporizador);
        this.errorMessage = '';
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.temporizador);
  }
}
