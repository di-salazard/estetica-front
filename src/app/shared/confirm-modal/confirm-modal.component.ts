import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Servicio } from '../../core/models/servicio.model';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {

  @Input() servicio: Servicio | null = null;
  @Output() cerrarModal = new EventEmitter<void>();

  paqueteSeleccionado: any = null;

  constructor(private router: Router) {}

  ngOnChanges() {
    console.log('servicio recibido en el Modal:', this.servicio);
    
    if (this.servicio && this.servicio.detalles && this.servicio.detalles.length > 0) {
      this.paqueteSeleccionado = this.servicio.detalles[0];
    } else {
      this.paqueteSeleccionado = null;
    }
  }

  seleccionarPaquete(paquete: any) {
    this.paqueteSeleccionado = paquete;
  }

  cerrar() {
    this.cerrarModal.emit();
  }

  continuarAReserva() {
    if (this.paqueteSeleccionado) {
      console.log('Continuando reserva para:', this.servicio?.titulo, 'Paquete:', this.paqueteSeleccionado);
      this.cerrarModal.emit(); // Cierra el modal
      this.router.navigate(['/reserva']); // Redirige al calendario
    }
  }
}