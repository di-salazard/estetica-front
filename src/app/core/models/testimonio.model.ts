// Foto de una clienta que ya vino (casos reales), subida por el admin
export interface Testimonio {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string; // "/api/testimonios/{id}/imagen?v=..."
  creadoEn: string;
}
