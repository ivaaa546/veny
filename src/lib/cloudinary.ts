// src/lib/cloudinary.ts
// Utilidades para manejo de imágenes con Cloudinary

import { v2 as cloudinary } from 'cloudinary'

// Configuración del servidor (solo se ejecuta en el servidor)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  url: string
  publicId: string
}

/**
 * Sube una imagen a Cloudinary desde un File
 * @param file - Archivo a subir
 * @param folder - Carpeta en Cloudinary (ej: 'veny/products')
 * @returns URL segura y public_id de la imagen
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'veny'
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Optimización automática: formato y calidad
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error)
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          })
        } else {
          reject(new Error('No result from Cloudinary'))
        }
      }
    ).end(buffer)
  })
}

/**
 * Sube múltiples imágenes a Cloudinary
 * @param files - Array de archivos a subir
 * @param folder - Carpeta en Cloudinary
 * @returns Array de URLs y public_ids
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string = 'veny'
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file, folder)
      results.push(result)
    } catch (error) {
      console.error('Error uploading file:', file.name, error)
      // Continuar con los demás archivos
    }
  }
  
  return results
}

/**
 * Elimina una imagen de Cloudinary por su public_id
 * @param publicId - ID público de la imagen
 * @returns true si se eliminó correctamente
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}

/**
 * Elimina múltiples imágenes de Cloudinary
 * @param publicIds - Array de IDs públicos
 * @returns Número de imágenes eliminadas
 */
export async function deleteMultipleFromCloudinary(publicIds: string[]): Promise<number> {
  let deleted = 0
  
  for (const publicId of publicIds) {
    if (publicId) {
      const success = await deleteFromCloudinary(publicId)
      if (success) deleted++
    }
  }
  
  return deleted
}

/**
 * Extrae el public_id desde una URL de Cloudinary
 * URL format: https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
 * @param url - URL completa de Cloudinary
 * @returns public_id o null si no es una URL de Cloudinary
 */
export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url) return null
  if (!url.includes('cloudinary.com')) return null
  
  try {
    // Remover la extensión del archivo
    const urlWithoutExtension = url.replace(/\.[^/.]+$/, '')
    // Buscar el patrón después de /upload/ (con o sin versión)
    const match = urlWithoutExtension.match(/\/upload\/(?:v\d+\/)?(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Genera una URL optimizada con transformaciones de Cloudinary
 * @param publicId - ID público de la imagen
 * @param options - Opciones de transformación
 * @returns URL transformada
 */
export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'thumb' | 'scale'
  }
): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
    ...options
  })
}

/**
 * Genera URL para thumbnail (200x200, crop fill)
 * @param publicId - ID público de la imagen
 * @returns URL del thumbnail
 */
export function getThumbnailUrl(publicId: string): string {
  return getOptimizedUrl(publicId, {
    width: 200,
    height: 200,
    crop: 'fill'
  })
}

/**
 * Verifica si una URL es de Cloudinary
 * @param url - URL a verificar
 * @returns true si es una URL de Cloudinary
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes('cloudinary.com')
}

/**
 * Verifica si una URL es de Supabase Storage
 * @param url - URL a verificar
 * @returns true si es una URL de Supabase Storage
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes('supabase.co/storage')
}
