import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../shared/product-card/product-card.component'; // Importamos la tarjeta

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent], 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  // Simulamos los datos de la base de datos
  listaTratamientos = [
    {
      nombre: 'Depilación láser',
      precioOriginal: '20.000',
      precioDescuento: '10.000',
      imagen: 'assets/rostro.jpg', // ¡Asegúrate de poner una foto real en la carpeta public!
      conDescuento: true
    },
    {
      nombre: 'Tratamientos faciales profesionales',
      precioOriginal: '20.000',
      precioDescuento: '10.000',
      imagen: 'assets/toxina.jpg',
      conDescuento: true
    },
    {
      nombre: 'Limpieza Facial Profunda',
      precioOriginal: null, // No tiene descuento
      precioDescuento: '25.000',
      imagen: 'assets/limpieza.jpg',
      conDescuento: false
    }
  ];
}