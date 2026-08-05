import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Verificamos el token en sessionStorage (se borra al cerrar la pestaña)
  const token = sessionStorage.getItem('authToken');

  if (token) {
    return true;
  } else {
    router.navigate(['/login']); // Redirige al login si no hay sesión
    return false;
  }
};