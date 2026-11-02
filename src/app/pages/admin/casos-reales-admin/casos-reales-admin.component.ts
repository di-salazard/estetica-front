import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { EsteticaService } from '../../../core/services/estetica.service';
import { Testimonio } from '../../../core/models/testimonio.model';
import { urlImagen, prepararImagen, TAMANO_MAXIMO } from '../../../core/utils/imagen';

// Sección del admin para subir, editar y eliminar las fotos de "Casos reales"
@Component({
  selector: 'app-casos-reales-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './casos-reales-admin.component.html',
  styleUrls: ['./casos-reales-admin.component.scss']
})
export class CasosRealesAdminComponent implements OnInit, OnDestroy {
  testimonios: Testimonio[] = [];

  // Formulario (sirve para crear y para editar)
  mostrarFormulario = false;
  editando: Testimonio | null = null;
  titulo = '';
  descripcion = '';
  imagenNueva: Blob | null = null;
  vistaPrevia = '';
  procesandoImagen = false;
  guardando = false;
  error = '';

  constructor(private esteticaService: EsteticaService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
  }

  ngOnDestroy() {
    this.liberarVistaPrevia();
  }

  url(t: Testimonio): string {
    return urlImagen(t.imagenUrl);
  }

  cargar() {
    this.esteticaService.obtenerTestimonios().subscribe({
      next: (data) => {
        this.testimonios = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al obtener los casos reales:', err)
    });
  }

  abrirNuevo() {
    this.abrirFormulario(null);
  }

  abrirEditar(t: Testimonio) {
    this.abrirFormulario(t);
  }

  private abrirFormulario(t: Testimonio | null) {
    this.liberarVistaPrevia();
    this.editando = t;
    this.titulo = t?.titulo || '';
    this.descripcion = t?.descripcion || '';
    this.imagenNueva = null;
    this.vistaPrevia = t ? this.url(t) : '';
    this.error = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.liberarVistaPrevia();
    this.mostrarFormulario = false;
    this.editando = null;
  }

  async elegirImagen(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) {
      return;
    }
    this.error = '';
    try {
      this.procesandoImagen = true;
      this.cdr.detectChanges();
      const imagen = await prepararImagen(archivo);
      if (imagen.size > TAMANO_MAXIMO) {
        throw new Error('La imagen pesa más de 10 MB. Prueba con otra foto.');
      }
      this.liberarVistaPrevia();
      this.imagenNueva = imagen;
      this.vistaPrevia = URL.createObjectURL(imagen);
    } catch (e: any) {
      this.error = e?.message || 'No se pudo leer la imagen.';
    }
    this.procesandoImagen = false;
    this.cdr.detectChanges();
  }

  guardar() {
    if (!this.editando && !this.imagenNueva) {
      this.error = 'Elige una foto para el caso real.';
      return;
    }
    this.guardando = true;
    this.error = '';

    let peticion: Observable<Testimonio>;
    if (!this.editando) {
      peticion = this.esteticaService.crearTestimonio(this.imagenNueva!, this.titulo, this.descripcion);
    } else {
      // Primero los textos y después, si se eligió otra, la foto
      const id = this.editando.id;
      const imagen = this.imagenNueva;
      peticion = this.esteticaService.actualizarTestimonio(id, this.titulo, this.descripcion).pipe(
        switchMap((t) => imagen ? this.esteticaService.cambiarImagenTestimonio(id, imagen) : of(t))
      );
    }

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarFormulario();
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.error = this.mensajeError(err);
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(t: Testimonio) {
    if (!confirm(`¿Eliminar ${t.titulo ? '"' + t.titulo + '"' : 'esta foto'} de los casos reales?`)) {
      return;
    }
    this.esteticaService.eliminarTestimonio(t.id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        if (err?.status === 404) {
          this.cargar(); // ya no existía
          return;
        }
        alert(this.mensajeError(err));
      }
    });
  }

  private mensajeError(err: any): string {
    if (err?.status === 401) {
      sessionStorage.removeItem('authToken');
      this.router.navigate(['/login']);
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }
    if (err?.status === 400) {
      return err?.error?.mensaje || err?.error?.message
        || 'Revisa los datos: la foto debe ser válida, el título hasta 150 caracteres y la descripción hasta 500.';
    }
    if (err?.status === 404) {
      return 'Este caso real ya no existe. Recarga la página.';
    }
    if (err?.status === 413) {
      return 'La foto es demasiado pesada. Prueba con otra.';
    }
    return 'No se pudo guardar. Revisa que el servidor esté encendido.';
  }

  private liberarVistaPrevia() {
    if (this.vistaPrevia.startsWith('blob:')) {
      URL.revokeObjectURL(this.vistaPrevia);
    }
    this.vistaPrevia = '';
  }
}
