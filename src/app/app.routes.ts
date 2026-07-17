import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component'; 

export const routes: Routes = [
  // Esta línea le dice que si la URL está vacía, muestre el Home
  { path: '', component: HomeComponent }, 
  { path: '**', redirectTo: '', pathMatch: 'full' }
];