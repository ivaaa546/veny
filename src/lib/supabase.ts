import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase para el NAVEGADOR (componentes cliente)
// El signo "!" al final le dice a TypeScript: "Confía en mí, esta variable existe"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Mantener compatibilidad con código existente
export const supabase = supabaseBrowser

// ====================================================================
// FUNCIONES HELPER PARA STORAGE
// ====================================================================

/**
 * Extrae el path del storage desde una URL completa
 * Ejemplo: https://xxx.supabase.co/storage/v1/object/public/store-images/user-id/file.jpg
 * Retorna: user-id/file.jpg
 */
export function extractStoragePath(url: string | null): string | null {
    if (!url) return null

    // Extraer path después de /store-images/
    let path = url.replace(/^.*\/store-images\//, '')

    // Si no se encontró, intentar formato directo
    if (path === url) {
        path = url.replace(/^store-images\//, '')
    }

    // Si sigue siendo la URL completa, no se pudo extraer
    if (path === url) {
        return null
    }

    return path
}

/**
 * Elimina un archivo del bucket store-images
 */
export async function deleteFromStorage(
    supabase: SupabaseClient,
    filePath: string | null
): Promise<{ success: boolean; error?: string }> {
    if (!filePath) {
        return { success: true }
    }

    const { error } = await supabase.storage
        .from('store-images')
        .remove([filePath])

    if (error) {
        console.error('Error eliminando archivo del storage:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Elimina múltiples archivos del bucket store-images
 */
export async function deleteMultipleFromStorage(
    supabase: SupabaseClient,
    filePaths: (string | null)[]
): Promise<{ success: boolean; error?: string }> {
    // Filtrar paths nulos o vacíos
    const validPaths = filePaths.filter((path): path is string => !!path)

    if (validPaths.length === 0) {
        return { success: true }
    }

    const { error } = await supabase.storage
        .from('store-images')
        .remove(validPaths)

    if (error) {
        console.error('Error eliminando archivos del storage:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}