import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Servicio } from '../../core/models/servicio.model';
import { ReservaFormComponent } from '../reserva-form/reserva-form.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ReservaFormComponent],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {

  @Input() servicio: Servicio | null = null;
  @Output() cerrarModal = new EventEmitter<void>();

  paqueteSeleccionado: any = null;
  // 'paquete': elegir paquete; 'reserva': elegir día, hora y datos para ese paquete
  paso: 'paquete' | 'reserva' = 'paquete';

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
      this.paso = 'reserva';
    }
  }
}