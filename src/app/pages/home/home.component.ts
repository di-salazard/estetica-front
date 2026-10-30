import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Necesario para el *ngFor y *ngIf
import { ProductCardComponent } from '../../shared/product-card/product-card.component'; // <-- Tu tarjeta
import { EsteticaService } from '../../core/services/estetica.service';
import { Servicio } from '../../core/models/servicio.model';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component'; // <-- 1. Import de la clase


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent,ConfirmModalComponent], 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'] // o .scss
})
export class HomeComponent implements OnInit{

  mostrarModal: boolean = false;
  tratamientoSeleccionado: any = null;
  listaTratamientos: Servicio[] = [];

  // 2. Inyéctalo en el constructor
  constructor(
    private esteticaService: EsteticaService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.esteticaService.obtenerServicios().subscribe({
      next: (data) => {
        // 3. Guardamos los datos y FORZAMOS el dibujado
        console.log('Tratamientos obtenidos:', data);
        // Solo servicios activos (null cuenta como activo: servicios antiguos sin el campo)
        this.listaTratamientos = (data || []).filter((s) => s.activo !== false);
        this.cdr.detectChanges(); // <--- ¡Esta es la línea mágica!
      },
      error: (error) => {
        console.error('Error al obtener los tratamientos:', error);
      }
    }); 
  }
  

  // === FUNCIONES DEL MODAL SIMPLIFICADAS ===
  abrirModal(tratamientoId: number) {
    if (tratamientoId !== null) {
      this.esteticaService.obtenerServicioPorId(tratamientoId).subscribe({
        next: (data) => {
          this.tratamientoSeleccionado = data;
          this.mostrarModal = true;
          document.body.style.overflow = 'hidden';
          
          // ¡ESTA LÍNEA ES LA CLAVE! Despierta al HTML para que dibuje el modal
          this.cdr.detectChanges(); 
        },
        error: (error) => {
          console.error('Error al obtener el tratamiento:', error);
        }
      });
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.tratamientoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }
}