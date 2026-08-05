import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { EsteticaService } from '../../core/services/estetica.service';
import { Servicio } from '../../core/models/servicio.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  constructor(private router: Router, private servicioService: EsteticaService) {}
  servicios: Servicio[] = [];

  ngOnInit() {
    this.cargarServicios();
  }
  creandoServicio: boolean = false;
  modoEdicion: boolean = false;

  servicioActual: any = {
    nombre: '',
    descripcion: '',
    tieneOferta: false,
  };


  cargarServicios() {
    this.servicioService.obtenerServicios().subscribe({
      next: (data) => {
        this.servicios = data;
      },
      error: (err) => {
        console.error('Error al cargar los servicios', err);
      }
    });
  }


  abrirFormularioNuevo() {
    this.creandoServicio = true;
    this.modoEdicion = false;
    this.servicioActual = { nombre: '', descripcion: '', precioNormal: 0, tieneOferta: false, precioOferta: 0 };
  }

  cerrarFormulario() {
    this.creandoServicio = false;
    this.modoEdicion = false;
  }

  guardarServicio() {
  // Aseguramos que si no tiene oferta, el precio oferta sea 0 o nulo para evitar errores
  if (!this.servicioActual.tieneOferta) {
    this.servicioActual.precioOferta = 0;
  }

  this.servicioService.crearServicio(this.servicioActual).subscribe({
    next: (response) => {
      alert('¡Servicio guardado exitosamente en la base de datos!');
      this.cargarServicios(); // Recarga la tabla automáticamente para mostrar el nuevo servicio
      this.cerrarFormulario(); // Cierra y limpia el formulario
    },
    error: (err) => {
      console.error('Error al guardar el servicio:', err);
      alert('Hubo un error al guardar el servicio. Revisa la consola.');
    }
  });
}

  cerrarSesion() {
    sessionStorage.removeItem('authToken'); // Borra la sesión actual
    this.router.navigate(['/login']); // Redirige al login
  }
}