import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes'; // <-- Importa el archivo de arriba

export const appConfig: ApplicationConfig = {
  providers: [
  provideRouter(routes, withHashLocation()) 
] // <-- Enciende el enrutador
  
};