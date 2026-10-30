import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EsteticaService } from '../../core/services/estetica.service';
import { Servicio } from '../../core/models/servicio.model';
import { ServicioDetalle } from '../../core/models/servicio-detalle.model';

// Días que se ofrecen para reservar (solo de lunes a viernes)
const DIAS_HABILES_A_MOSTRAR = 15;

// Paso de reserva dentro del modal del servicio: día, hora y datos de la clienta.
// La reserva se guarda en la BD y el backend crea el evento en Google Calendar.
@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva-form.component.html',
  styleUrls: ['./reserva-form.component.scss']
})
export class ReservaFormComponent implements OnInit {
  @Input() servicio!: Servicio;
  @Input() paquete!: ServicioDetalle;
  @Output() volver = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  dias: { fecha: string, diaSemana: string, dia: number, mes: string }[] = [];
  fechaSeleccionada: string | null = null;

  horas: string[] = [];
  horaSeleccionada: string | null = null;
  cargandoHoras = false;
  errorHoras = '';

  cliente = { nombre: '', correo: '', telefono: '' };
  enviando = false;
  errorEnvio = '';
  reservaConfirmada = false;

  constructor(
    private esteticaService: EsteticaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.dias = this.proximosDiasHabiles();
  }

  get duracionMinutos(): number {
    return this.servicio.duracionMinutos || 60;
  }

  get precioPaquete(): number {
    return this.paquete.enOferta && this.paquete.precioOferta > 0 ? this.paquete.precioOferta : this.paquete.precio;
  }

  get fechaLegible(): string {
    if (!this.fechaSeleccionada) {
      return '';
    }
    const texto = new Date(this.fechaSeleccionada + 'T12:00:00')
      .toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  seleccionarDia(fecha: string) {
    this.fechaSeleccionada = fecha;
    this.horaSeleccionada = null;
    this.cargarHoras();
  }

  cargarHoras() {
    if (!this.fechaSeleccionada) {
      return;
    }
    this.cargandoHoras = true;
    this.errorHoras = '';
    this.horas = [];

    this.esteticaService.obtenerDisponibilidad(this.fechaSeleccionada, this.paquete.id).subscribe({
      next: (data) => {
        this.horas = data.horas || [];
        this.cargandoHoras = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la disponibilidad:', err);
        this.errorHoras = 'No pudimos cargar las horas disponibles. Intenta de nuevo en unos minutos.';
        this.cargandoHoras = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmarReserva() {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      return;
    }
    this.enviando = true;
    this.errorEnvio = '';

    this.esteticaService.guardarReserva({
      nombreCliente: this.cliente.nombre.trim(),
      correoCliente: this.cliente.correo.trim(),
      telefono: this.cliente.telefono.replace(/\D/g, ''),
      fechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00`,
      idServicioDetalle: this.paquete.id
    }).subscribe({
      next: () => {
        this.enviando = false;
        this.reservaConfirmada = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al guardar la reserva:', err);
        this.enviando = false;
        if (err.status === 409) {
          // Otra persona tomó la hora mientras completaba el formulario
          this.errorEnvio = 'Esa hora acaba de ser reservada. Elige otra, por favor.';
          this.horaSeleccionada = null;
          this.cargarHoras();
        } else if (err.status === 400) {
          this.errorEnvio = 'Revisa tus datos: faltan campos o la hora no es válida.';
        } else {
          this.errorEnvio = 'No pudimos guardar tu reserva. Intenta de nuevo en unos minutos.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  private proximosDiasHabiles() {
    const dias = [];
    const fecha = new Date();
    while (dias.length < DIAS_HABILES_A_MOSTRAR) {
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        const p = (n: number) => String(n).padStart(2, '0');
        dias.push({
          fecha: `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`,
          diaSemana: fecha.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', ''),
          dia: fecha.getDate(),
          mes: fecha.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
        });
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
  }
}
