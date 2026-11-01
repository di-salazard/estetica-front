import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Servicio } from '../../core/models/servicio.model';
import { urlImagen } from '../../core/utils/imagen';

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

  get imagen(): string {
    return urlImagen(this.servicio?.imagenUrl);
  }

  // Función para sacar el precio del primer paquete y mostrarlo como "Desde $..."
  get precioDesde(): number {
    if (this.servicio && this.servicio.detalles && this.servicio.detalles.length > 0) {
      return this.servicio.detalles[0].precio;
    }
    return 0;
  }
}