import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Servicio } from '../../core/models/servicio.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
// ¡Aquí recibimos la data!
  @Input() servicio!: Servicio;

  // Función para sacar el precio del primer paquete y mostrarlo como "Desde $..."
  get precioDesde(): number {
    if (this.servicio && this.servicio.detalles && this.servicio.detalles.length > 0) {
      return this.servicio.detalles[0].precio;
    }
    return 0;
  }
}