import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // <-- Importa el archivo de arriba

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)] // <-- Enciende el enrutador
};