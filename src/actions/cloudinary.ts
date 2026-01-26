'use server'

// Server Action para subir imágenes a Cloudinary
// Las credenciales de Cloudinary solo están disponibles en el servidor

import { uploadToCloudinary, deleteFromCloudinary, extractCloudinaryPublicId } from '@/lib/cloudinary'

export interface UploadImageResult {
  success: boolean
  url?: string
  publicId?: string
  error?: string
}

/**
 * Sube una imagen a Cloudinary desde el cliente
 * @param formData - FormData con el archivo en el campo 'file'
 * @param folder - Carpeta destino en Cloudinary
 */
export async function uploadImage(
  formData: FormData,
  folder: string = 'veny'
): Promise<UploadImageResult> {
  try {
    const file = formData.get('file') as File
    
    if (!file || file.size === 0) {
      return { success: false, error: 'No se proporcionó ningún archivo' }
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'El archivo debe ser una imagen' }
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'La imagen no debe superar los 10MB' }
    }

    const result = await uploadToCloudinary(file, folder)
    
    return {
      success: true,
      url: result.url,
      publicId: result.publicId
    }
  } catch (error) {
    console.error('Error en uploadImage:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al subir la imagen' 
    }
  }
}

/**
 * Sube múltiples imágenes a Cloudinary
 * @param formData - FormData con archivos en el campo 'files'
 * @param folder - Carpeta destino en Cloudinary
 */
export async function uploadMultipleImages(
  formData: FormData,
  folder: string = 'veny'
): Promise<{ success: boolean; results: UploadImageResult[]; error?: string }> {
  try {
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return { success: false, results: [], error: 'No se proporcionaron archivos' }
    }

    const results: UploadImageResult[] = []

    for (const file of files) {
      // Validar cada archivo
      if (!file.type.startsWith('image/')) {
        results.push({ success: false, error: `${file.name} no es una imagen válida` })
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        results.push({ success: false, error: `${file.name} supera los 10MB` })
        continue
      }

      try {
        const result = await uploadToCloudinary(file, folder)
        results.push({
          success: true,
          url: result.url,
          publicId: result.publicId
        })
      } catch (error) {
        results.push({
          success: false,
          error: `Error subiendo ${file.name}`
        })
      }
    }

    const allSuccess = results.every(r => r.success)
    
    return {
      success: allSuccess,
      results
    }
  } catch (error) {
    console.error('Error en uploadMultipleImages:', error)
    return { 
      success: false, 
      results: [],
      error: error instanceof Error ? error.message : 'Error al subir las imágenes' 
    }
  }
}

/**
 * Elimina una imagen de Cloudinary
 * @param url - URL de la imagen a eliminar
 */
export async function deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const publicId = extractCloudinaryPublicId(url)
    
    if (!publicId) {
      // Si no es una URL de Cloudinary, no hacemos nada (podría ser de Supabase)
      return { success: true }
    }

    const deleted = await deleteFromCloudinary(publicId)
    
    return { success: deleted }
  } catch (error) {
    console.error('Error en deleteImage:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar la imagen' 
    }
  }
}

/**
 * Elimina múltiples imágenes de Cloudinary
 * @param urls - Array de URLs a eliminar
 */
export async function deleteMultipleImages(urls: string[]): Promise<{ success: boolean; deleted: number }> {
  let deleted = 0

  for (const url of urls) {
    if (url) {
      const result = await deleteImage(url)
      if (result.success) deleted++
    }
  }

  return { success: true, deleted }
}
