import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EsteticaService } from '../../core/services/estetica.service';
import { Servicio } from '../../core/models/servicio.model';
import { ServicioDetalle } from '../../core/models/servicio-detalle.model';
import { FormatoMilesDirective } from '../../shared/format/formato-miles.directive';
import { urlImagen, prepararImagen, TAMANO_MAXIMO } from '../../core/utils/imagen';

// Importaciones PURAS de FullCalendar (Sin el wrapper de Angular)
// Bypass para ignorar el falso error de módulo de FullCalendar
// @ts-ignore
import { Calendar } from '@fullcalendar/core';
// @ts-ignore
import dayGridPlugin from '@fullcalendar/daygrid';
// @ts-ignore
import timeGridPlugin from '@fullcalendar/timegrid';
// @ts-ignore
import esLocale from '@fullcalendar/core/locales/es';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatoMilesDirective],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  @ViewChild('calendarContainer', { static: false }) calendarContainer!: ElementRef;
  private calendar: any;
  servicios: Servicio[] = [];
  reservasHoy: number = 0;
  ingresosHoy: number = 0;
  // Ingresos de lo que se está viendo en el calendario (día, semana o mes)
  ingresosRango: number = 0;
  nombreRango = 'de la semana';
  private eventosCargados: any[] = [];
  citaSeleccionada: any = null;
  // Imagen elegida en el formulario (ya comprimida); se sube después de guardar el servicio
  imagenNueva: Blob | null = null;
  vistaPreviaImagen = '';
  errorImagen = '';
  procesandoImagen = false;
  mostrarModal: boolean = false;
  creandoServicio: boolean = false;
  modoEdicion: boolean = false;

  servicioActual: any = {
    titulo: '',
    descripcionBase: '',
    enOferta: false,
    detalles: [] as ServicioDetalle[]
  };

  constructor(
    private router: Router, 
    private servicioService: EsteticaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarServicios();
    this.cargarCitasHoy();
  }

  ngAfterViewInit() {
    this.iniciarCalendario();
  }

  iniciarCalendario() {
    // Instanciamos el calendario directamente sobre el elemento HTML
    // (as any: los tipos de los plugins no se cargan por el @ts-ignore de los imports)
    const celular = this.esCelular();
    this.calendar = new Calendar(this.calendarContainer.nativeElement, <any>{
      // En celular la semana no cabe: se parte en la vista de un día
      initialView: celular ? 'timeGridDay' : 'timeGridWeek',
      plugins: [dayGridPlugin, timeGridPlugin],
      locale: esLocale,
      headerToolbar: this.barraCalendario(celular),
      // Al girar el celular o cambiar el tamaño de la ventana se ajusta la vista
      windowResize: () => {
        const ahoraCelular = this.esCelular();
        this.calendar.setOption('headerToolbar', this.barraCalendario(ahoraCelular));
        if (ahoraCelular && this.calendar.view.type === 'timeGridWeek') {
          this.calendar.changeView('timeGridDay');
        }
      },
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      nowIndicator: true,
      height: 'auto',
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      // Citas a la misma hora van lado a lado en vez de encimarse
      slotEventOverlap: false,
      // Al pasar el mouse se ve el título completo aunque esté cortado
      eventDidMount: (info: any) => {
        info.el.title = `${info.timeText} ${info.event.title}`.trim();
      },
      // FullCalendar pide los eventos de la semana/mes visible cada vez que se navega
      events: (info: any, success: any, failure: any) => this.cargarEventosCalendario(info, success, failure),
      // Al cambiar de vista o de fecha se recalculan los ingresos de lo visible
      datesSet: () => this.actualizarIngresosRango(),
      eventClick: (info: any) => this.abrirDetalleCita(info.event)
    });

    // Le damos la orden de dibujarse
    this.calendar.render();
  }

  private esCelular(): boolean {
    return window.innerWidth < 768;
  }

  // En celular no se ofrece la vista de semana (el título pasa a su propia línea por CSS)
  private barraCalendario(celular: boolean) {
    return celular
      ? { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridDay' }
      : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' };
  }

  // Reservas de la BD + eventos de Google Calendar, unificados por el backend
  private cargarEventosCalendario(info: any, success: any, failure: any) {
    const desde = info.startStr.substring(0, 10);
    const hasta = info.endStr.substring(0, 10);

    this.servicioService.obtenerCalendario(desde, hasta).subscribe({
      next: (data) => {
        this.eventosCargados = data || [];
        this.actualizarIngresosRango();
        success(this.eventosCargados.map((evento) => {
          const diaCompleto = evento.diaCompleto === true;
          return {
            id: evento.id,
            // Se antepone el nombre de la clienta solo si el título de Google no lo trae ya
            title: evento.nombreCliente && !evento.titulo.startsWith(evento.nombreCliente)
              ? `${evento.nombreCliente} - ${evento.titulo}`
              : evento.titulo,
            start: diaCompleto ? evento.inicio.substring(0, 10) : evento.inicio,
            end: diaCompleto ? evento.fin.substring(0, 10) : evento.fin,
            allDay: diaCompleto,
            classNames: evento.origen === 'google' ? ['evento-google'] : [],
            extendedProps: evento
          };
        }));
      },
      error: (err) => {
        console.error('Error al cargar el calendario desde la API:', err);
        this.manejarErrorSesion(err);
        failure(err);
      }
    });
  }

  abrirDetalleCita(evento: any) {
    const e = evento.extendedProps;
    const hora = (fecha: Date) => fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const fecha = evento.start.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    this.citaSeleccionada = {
      titulo: evento.title,
      fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1),
      horario: evento.allDay ? 'Todo el día' : `${hora(evento.start)} - ${evento.end ? hora(evento.end) : ''}`,
      origen: e.origen,
      nombreCliente: e.nombreCliente,
      correoCliente: e.correoCliente,
      telefono: e.telefono,
      whatsapp: this.linkWhatsapp(e.telefono),
      estado: e.estado
    };
    this.bloquearScroll(true);
    this.cdr.detectChanges();
  }

  cerrarDetalleCita() {
    this.citaSeleccionada = null;
    this.bloquearScroll(false);
  }

  // Teléfonos chilenos de 9 dígitos (9XXXXXXXX) se completan con el código de país 56
  private linkWhatsapp(telefono: string | null): string | null {
    const numero = (telefono || '').replace(/\D/g, '');
    if (!numero || /^0+$/.test(numero)) {
      return null;
    }
    return `https://wa.me/${numero.length === 9 ? '56' + numero : numero}`;
  }

  // Si el token venció o no es válido, el backend responde 401: volvemos al login
  private manejarErrorSesion(err: any) {
    if (err?.status === 401) {
      sessionStorage.removeItem('authToken');
      this.router.navigate(['/login']);
    }
  }

  // Métricas de hoy con una sola petición al calendario (Google es la fuente de verdad):
  // citas = eventos con hora (sin día completo, como feriados) que no estén cancelados;
  // ingresos = precio de las reservas web (los eventos creados a mano en Google no tienen precio)
  cargarCitasHoy() {
    const fecha = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hoy = new Date();
    const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

    this.servicioService.obtenerCalendario(fecha(hoy), fecha(manana)).subscribe({
      next: (data) => {
        const citas = (data || []).filter((evento) => !evento.diaCompleto && evento.estado !== 'Cancelada');
        this.reservasHoy = citas.length;
        this.ingresosHoy = this.sumarIngresos(citas);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar las citas de hoy desde la API:', err);
        this.manejarErrorSesion(err);
      }
    });
  }

  private sumarIngresos(eventos: any[]): number {
    return eventos
      .filter((evento) => evento.estado !== 'Cancelada')
      .reduce((total, evento) => total + (Number(evento.precio) || 0), 0);
  }

  // Ingresos de las citas dentro de lo que muestra el calendario (sin los días de relleno de la vista de mes)
  private actualizarIngresosRango() {
    if (!this.calendar) {
      return;
    }
    const vista = this.calendar.view;
    const nombres: any = { timeGridDay: 'del día', timeGridWeek: 'de la semana', dayGridMonth: 'del mes' };
    this.nombreRango = nombres[vista.type] || 'del período';

    const visibles = this.eventosCargados.filter((evento) => {
      const inicio = new Date(evento.inicio);
      return inicio >= vista.currentStart && inicio < vista.currentEnd;
    });
    this.ingresosRango = this.sumarIngresos(visibles);
    this.cdr.detectChanges();
  }

  agregarDetalle() {
    if (!this.servicioActual.detalles) {
      this.servicioActual.detalles = [];
    }

    const nuevoDetalle: ServicioDetalle = {
      id: 0,
      servicioId: this.servicioActual.id || 0,
      nombrePaquete: '',
      cantidadSesiones: 1,
      precio: 0,
      precioOferta: 0,
      enOferta: false
    };

    this.servicioActual.detalles.push(nuevoDetalle);
  }

  ngOnDestroy() {
    this.bloquearScroll(false);
    this.calendar?.destroy();
  }

  private bloquearScroll(bloquear: boolean) {
    if (bloquear) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  eliminarDetalle(index: number) {
    this.servicioActual.detalles.splice(index, 1);
  }

  abrirFormularioNuevo() {
    this.creandoServicio = true;
    this.modoEdicion = false;
    this.mostrarModal = true;
    this.bloquearScroll(true);
    this.reiniciarImagen('');
    
    this.servicioActual = { 
      titulo: '', 
      descripcionBase: '', 
      enOferta: false, 
      activo: true,
      duracionMinutos: 60,
      detalles: []
    };
  }
  
  eliminarServicio(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este servicio y todos sus paquetes? Esta acción no se puede deshacer.')) {
      this.servicioService.eliminarServicio(id).subscribe({
        next: () => {
          alert('Servicio eliminado exitosamente de la base de datos.');
          this.cargarServicios(); // Recargamos la tabla automáticamente
        },
        error: (err) => {
          console.error('Error al eliminar el servicio:', err);
          if (err.status === 401) {
            this.manejarErrorSesion(err);
          } else if (err.status === 409) {
            alert('Este servicio tiene reservas pendientes, así que todavía no se puede eliminar. Desactívalo para que no aparezca en la página y elimínalo cuando pase la última reserva.');
          } else if (err.status === 404) {
            alert('Este servicio ya no existe.');
            this.cargarServicios();
          } else {
            alert('No se pudo eliminar el servicio. Intenta de nuevo en unos minutos.');
          }
        }
      });
    }
  }

  // Switch Activo/Inactivo de la tabla: se refleja al instante (onchange) y se guarda el servicio completo.
  // Si el backend falla, el switch vuelve a su estado anterior.
  cambiarActivo(servicio: any, evento: Event) {
    const activo = (evento.target as HTMLInputElement).checked;
    const anterior = servicio.activo;
    servicio.activo = activo;
    this.cdr.detectChanges();

    const payload = this.armarPayload(servicio, true);

    this.servicioService.actualizarServicio(servicio.id, payload).subscribe({
      next: (respuesta: any) => {
        // Si el backend no devuelve el estado pedido, no lo guardó (p. ej. una versión sin el campo "activo")
        if (respuesta?.activo !== activo) {
          alert('El servidor respondió, pero no guardó el estado Activo/Inactivo. Revisa que el backend esté actualizado y reiniciado.');
        }
        // Recargamos desde la BD para que la tabla y las métricas queden al día
        this.cargarServicios();
      },
      error: (err) => {
        console.error('Error al cambiar el estado del servicio:', err);
        servicio.activo = anterior;
        (evento.target as HTMLInputElement).checked = anterior !== false;
        this.cdr.detectChanges();
        if (err.status === 401) {
          this.manejarErrorSesion(err);
        } else {
          alert('No se pudo cambiar el estado del servicio. Intenta de nuevo.');
        }
      }
    });
  }

  get serviciosActivos(): number {
    return this.servicios.filter((s: any) => s.activo !== false).length;
  }

  cargarServicios() {
    this.servicioService.obtenerServicios().subscribe({
      next: (data) => {
        this.servicios = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar los servicios desde la API:', err);
      }
    });
  }

  abrirFormularioEditar(servicio: any) {
    this.modoEdicion = true;
    this.creandoServicio = false;
    this.mostrarModal = true;
    this.bloquearScroll(true);
    
    this.servicioActual = JSON.parse(JSON.stringify(servicio));
    if (!this.servicioActual.detalles) {
      this.servicioActual.detalles = [];
    }
    this.reiniciarImagen(urlImagen(servicio.imagenUrl));
  }

  cerrarFormulario() {
    this.mostrarModal = false;
    this.creandoServicio = false;
    this.modoEdicion = false;
    this.bloquearScroll(false);
  }

  // Servicio completo como lo espera el backend (el PUT reemplaza todos los campos)
  private armarPayload(s: any, conIdsDePaquetes: boolean): any {
    return {
      titulo: (s.titulo || '').trim(),
      descripcionBase: (s.descripcionBase || '').trim(),
      imagenUrl: s.imagenUrl || null,
      enOferta: !!s.enOferta,
      // null cuenta como activo (servicios antiguos sin el campo)
      activo: s.activo !== false,
      // Duración de cada sesión: la usa el backend para calcular las horas disponibles
      duracionMinutos: Number(s.duracionMinutos) || 60,
      detalles: (s.detalles || []).map((detalle: any) => {
        const paquete: any = {
          nombrePaquete: (detalle.nombrePaquete || '').trim(),
          cantidadSesiones: Number(detalle.cantidadSesiones),
          precio: Number(detalle.precio),
          enOferta: !!detalle.enOferta,
          precioOferta: detalle.enOferta ? Number(detalle.precioOferta) : 0
        };
        // Paquetes existentes llevan su id (se actualizan); los nuevos van sin id (se crean)
        if (conIdsDePaquetes && detalle.id) {
          paquete.id = detalle.id;
        }
        return paquete;
      })
    };
  }

  guardarServicio() {
    const s = this.servicioActual;
    const payload = this.armarPayload(s, !this.creandoServicio);

    const peticion = this.creandoServicio
      ? this.servicioService.crearServicio(payload)
      : this.servicioService.actualizarServicio(s.id, payload);

    peticion.subscribe({
      next: (guardado: any) => {
        if (!this.imagenNueva) {
          this.terminarGuardado('¡Servicio guardado exitosamente en la base de datos!');
          return;
        }
        // Con el servicio ya guardado (y su id, si es nuevo) subimos la imagen
        this.servicioService.subirImagenServicio(guardado?.id ?? s.id, this.imagenNueva).subscribe({
          next: () => this.terminarGuardado('¡Servicio e imagen guardados exitosamente!'),
          error: (err) => {
            console.error('Error al subir la imagen:', err);
            this.terminarGuardado(err.status === 400 || err.status === 413
              ? 'El servicio se guardó, pero la imagen no es válida o pesa más de 10 MB. Prueba con otra foto.'
              : 'El servicio se guardó, pero no se pudo subir la imagen. Intenta de nuevo editándolo.');
          }
        });
      },
      error: (err) => {
        console.error('Error al guardar el servicio:', err);
        if (err.status === 401) {
          this.manejarErrorSesion(err);
        } else if (err.status === 409) {
          alert('Uno de los paquetes que quitaste tiene reservas pendientes, así que todavía no se puede eliminar. No se guardó ningún cambio.');
        } else if (err.status === 400) {
          alert('Revisa los datos: nombre y descripción son obligatorios, la duración debe ser múltiplo de 30 minutos y cada paquete necesita nombre, al menos 1 sesión y precios válidos.');
        } else if (err.status === 404) {
          alert('Este servicio ya no existe. Recarga la página.');
        } else {
          alert('No se pudo guardar el servicio. Intenta de nuevo en unos minutos.');
        }
      }
    });
  }

  private terminarGuardado(mensaje: string) {
    alert(mensaje);
    this.cargarServicios();
    this.cerrarFormulario();
  }

  async elegirImagen(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) {
      return;
    }
    this.errorImagen = '';
    try {
      this.procesandoImagen = true;
      this.cdr.detectChanges();
      this.imagenNueva = await prepararImagen(archivo);
      if (this.imagenNueva.size > TAMANO_MAXIMO) {
        throw new Error('La imagen pesa más de 10 MB. Prueba con otra foto.');
      }
      if (this.vistaPreviaImagen.startsWith('blob:')) {
        URL.revokeObjectURL(this.vistaPreviaImagen);
      }
      this.vistaPreviaImagen = URL.createObjectURL(this.imagenNueva);
    } catch (e: any) {
      this.imagenNueva = null;
      this.errorImagen = e?.message || 'No se pudo leer la imagen.';
    }
    this.procesandoImagen = false;
    this.cdr.detectChanges();
  }

  private reiniciarImagen(vistaPrevia: string) {
    if (this.vistaPreviaImagen.startsWith('blob:')) {
      URL.revokeObjectURL(this.vistaPreviaImagen);
    }
    this.imagenNueva = null;
    this.vistaPreviaImagen = vistaPrevia;
    this.errorImagen = '';
  }

  cerrarSesion() {
    sessionStorage.removeItem('authToken'); 
    this.router.navigate(['/login']);
  }
}