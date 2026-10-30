import { Component } from '@angular/core';
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
export class LoginComponent {
  correo: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    const credentials = { correo: this.correo, password: this.password };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        sessionStorage.setItem('authToken', response.token);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.errorMessage = 'Correo o contraseña incorrectos.';
      }
    });
  }
}