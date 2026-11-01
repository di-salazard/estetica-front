import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EsteticaService } from '../../core/services/estetica.service';
import { Servicio } from '../../core/models/servicio.model';
import { ServicioDetalle } from '../../core/models/servicio-detalle.model';

// Meses hacia adelante que se pueden navegar en el calendario (además del actual)
const MESES_ADELANTE = 2;

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

  // Calendario mensual: celdas de lunes a domingo; null = hueco antes del día 1
  readonly diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  mesVisible = new Date();
  celdas: ({ fecha: string, dia: number, habilitado: boolean } | null)[] = [];
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
    const hoy = new Date();
    this.mesVisible = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.armarCalendario();
  }

  get nombreMes(): string {
    const texto = this.mesVisible.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  get puedeRetroceder(): boolean {
    const hoy = new Date();
    return this.mesVisible > new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  get puedeAvanzar(): boolean {
    const hoy = new Date();
    return this.mesVisible < new Date(hoy.getFullYear(), hoy.getMonth() + MESES_ADELANTE, 1);
  }

  cambiarMes(delta: number) {
    this.mesVisible = new Date(this.mesVisible.getFullYear(), this.mesVisible.getMonth() + delta, 1);
    this.armarCalendario();
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

  // Solo se pueden elegir días de lunes a viernes, desde hoy en adelante
  private armarCalendario() {
    const p = (n: number) => String(n).padStart(2, '0');
    const anio = this.mesVisible.getFullYear();
    const mes = this.mesVisible.getMonth();
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const diasDelMes = new Date(anio, mes + 1, 0).getDate();
    // getDay(): domingo = 0; lo pasamos a lunes = 0
    const huecos = (new Date(anio, mes, 1).getDay() + 6) % 7;

    this.celdas = Array(huecos).fill(null);
    for (let dia = 1; dia <= diasDelMes; dia++) {
      const fecha = new Date(anio, mes, dia);
      const finDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
      this.celdas.push({
        fecha: `${anio}-${p(mes + 1)}-${p(dia)}`,
        dia,
        habilitado: !finDeSemana && fecha >= inicioHoy
      });
    }
  }
}
