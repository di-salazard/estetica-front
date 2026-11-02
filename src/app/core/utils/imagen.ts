import { environment } from '../../../environments/environment';

// Las imágenes subidas desde el admin se guardan en el backend ("/api/servicios/{id}/imagen?v=...");
// las de ejemplo son archivos de la carpeta public del frontend ("masaje.jpg").
export function urlImagen(imagenUrl: string | null | undefined): string {
  if (!imagenUrl) {
    return '';
  }
  if (imagenUrl.startsWith('/api/')) {
    return environment.apiUrl.replace(/\/api\/?$/, '') + imagenUrl;
  }
  return imagenUrl;
}

// Tipos que el backend acepta tal cual (hasta 10 MB) si no se pudo comprimir en el navegador
const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
export const TAMANO_MAXIMO = 10 * 1024 * 1024;

function esHeic(archivo: File): boolean {
  return /\.(heic|heif)$/i.test(archivo.name) || /image\/hei[cf]/i.test(archivo.type);
}

// Prepara la foto elegida para subirla:
// 1) HEIC/HEIF (fotos de iPhone) se convierte a JPEG, porque Chrome/Edge no los pueden leer
// 2) se respeta la orientación EXIF (las fotos de celular suelen venir giradas por metadato)
// 3) se redimensiona (máx. 1200 px por lado) y se comprime a JPEG; al pasar por canvas
//    también se eliminan los metadatos de la foto, como la ubicación GPS
// Si la compresión falla, se usa el archivo original cuando el backend lo acepta.
export async function prepararImagen(archivo: File, ladoMaximo = 1200, calidad = 0.85): Promise<Blob> {
  let fuente: Blob = archivo;
  if (esHeic(archivo)) {
    // Se carga solo cuando hace falta, para no agrandar la página
    try {
      const heic2any = (await import('heic2any')).default;
      const convertido = await heic2any({ blob: archivo, toType: 'image/jpeg', quality: 0.92 });
      fuente = Array.isArray(convertido) ? convertido[0] : convertido;
    } catch {
      throw new Error('No se pudo convertir la foto HEIC del iPhone. Prueba exportándola como JPG.');
    }
  }

  try {
    return await comprimir(fuente, ladoMaximo, calidad);
  } catch (e) {
    if (TIPOS_ACEPTADOS.includes(fuente.type) && fuente.size <= TAMANO_MAXIMO) {
      return fuente;
    }
    throw new Error('No se pudo leer la imagen. Prueba con una foto JPG o PNG.');
  }
}

async function comprimir(fuente: Blob, ladoMaximo: number, calidad: number): Promise<Blob> {
  // createImageBitmap con 'from-image' aplica la orientación EXIF; si no está disponible, <img> también la aplica
  let imagen: ImageBitmap | HTMLImageElement;
  try {
    imagen = await createImageBitmap(fuente, { imageOrientation: 'from-image' });
  } catch {
    imagen = await cargarImagen(fuente);
  }

  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagen.width * escala);
  canvas.height = Math.round(imagen.height * escala);
  const ctx = canvas.getContext('2d')!;
  // Fondo blanco por si la imagen original tiene transparencia (PNG)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  if ('close' in imagen) {
    imagen.close();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen')), 'image/jpeg', calidad);
  });
}

function cargarImagen(fuente: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fuente);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es una imagen válida'));
    };
    img.src = url;
  });
}
