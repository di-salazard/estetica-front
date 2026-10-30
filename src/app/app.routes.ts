import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component'; 
import { AdminComponent } from './pages/admin/admin.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  // Esta línea le dice que si la URL está vacía, muestre el Home
  { path: '', component: HomeComponent }, 
  { path: 'login', component: LoginComponent },
  { path: 'admin', 
    component: AdminComponent, 
    canActivate: [AuthGuard] // Protegido estrictamente por el guardián
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },

];