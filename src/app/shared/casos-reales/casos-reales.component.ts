import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsteticaService } from '../../core/services/estetica.service';
import { Testimonio } from '../../core/models/testimonio.model';
import { urlImagen } from '../../core/utils/imagen';

// Botón flotante "Casos reales": abre una galería con fotos de clientas.
// Si todavía no hay fotos, el botón no se muestra.
@Component({
  selector: 'app-casos-reales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './casos-reales.component.html',
  styleUrls: ['./casos-reales.component.scss']
})
export class CasosRealesComponent implements OnInit, OnDestroy {
  testimonios: Testimonio[] = [];
  abierto = false;
  actual = 0; // índice de la foto que se ve en grande
  private inicioToque = 0;

  constructor(private esteticaService: EsteticaService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.esteticaService.obtenerTestimonios().subscribe({
      next: (data) => {
        this.testimonios = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al obtener los casos reales:', err)
    });
  }

  ngOnDestroy() {
    if (this.abierto) {
      document.body.style.overflow = 'auto';
    }
  }

  get foto(): Testimonio {
    return this.testimonios[this.actual];
  }

  url(t: Testimonio): string {
    return urlImagen(t.imagenUrl);
  }

  abrir() {
    this.actual = 0;
    this.abierto = true;
    document.body.style.overflow = 'hidden';
  }

  cerrar() {
    this.abierto = false;
    document.body.style.overflow = 'auto';
  }

  ver(indice: number) {
    const total = this.testimonios.length;
    this.actual = (indice + total) % total;
  }

  // Flechas del teclado para pasar fotos y Escape para cerrar
  @HostListener('document:keydown', ['$event'])
  teclado(evento: KeyboardEvent) {
    if (!this.abierto) {
      return;
    }
    if (evento.key === 'Escape') {
      this.cerrar();
    } else if (evento.key === 'ArrowRight') {
      this.ver(this.actual + 1);
    } else if (evento.key === 'ArrowLeft') {
      this.ver(this.actual - 1);
    } else {
      return;
    }
    this.cdr.detectChanges();
  }

  // Deslizar con el dedo en el celular
  toqueInicio(evento: TouchEvent) {
    this.inicioToque = evento.changedTouches[0].clientX;
  }

  toqueFin(evento: TouchEvent) {
    const distancia = evento.changedTouches[0].clientX - this.inicioToque;
    if (Math.abs(distancia) > 50) {
      this.ver(this.actual + (distancia < 0 ? 1 : -1));
    }
  }
}
