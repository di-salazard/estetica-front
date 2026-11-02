import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appFormatoMiles]',
  standalone: true
})
export class FormatoMilesDirective {

  constructor(private el: ElementRef, private control: NgControl) {}

  // 1. Escuchamos el evento completo en lugar de solo el valor
  @HostListener('input', ['$event'])
  onInput(event: Event) {
    // Le aseguramos a TypeScript que el objetivo es un Input HTML real
    const inputElement = event.target as HTMLInputElement;

    // Validación de seguridad por si es null
    if (!inputElement) return;

    const value = inputElement.value;

    // Quitamos cualquier letra o punto, dejamos solo los números puros
    const numeroLimpio = value.replace(/\D/g, '');
    
    // Le agregamos el punto de miles visualmente (Ej: 10000 -> 10.000)
    const valorFormateado = numeroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Mostramos el valor bonito en la pantalla
    this.el.nativeElement.value = valorFormateado;
    
    // Guardamos el valor matemáticamente puro
    const valorReal = numeroLimpio ? parseInt(numeroLimpio, 10) : 0;
    
    // Validamos que el control exista antes de intentar modificarlo
    if (this.control && this.control.control) {
      this.control.control.setValue(valorReal, { emitEvent: false });
    }
  }

  // 2. Cuando Angular CARGA un valor inicial (Ej: Al hacer clic en "Editar")
  @HostListener('ngModelChange', ['$event'])
  onModelChange(event: any) {
    if (event !== null && event !== undefined) {
      const numeroLimpio = String(event).replace(/\D/g, '');
      this.el.nativeElement.value = numeroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      this.el.nativeElement.value = '';
    }
  }
}