import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

  constructor(private router: Router) {}

    // Función que se ejecuta al hacer clic en el ícono del sol/luna
  toggleTheme() {
    // Busca la etiqueta <body> y le agrega/quita la clase 'light-theme'
    document.body.classList.toggle('light-theme');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
  
}
