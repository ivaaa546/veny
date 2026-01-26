import { createBrowserClient } from '@supabase/ssr'

// Cliente de Supabase para el NAVEGADOR (componentes cliente)
// El signo "!" al final le dice a TypeScript: "Confía en mí, esta variable existe"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Mantener compatibilidad con código existente
export const supabase = supabaseBrowser

// ====================================================================
// NOTA: Las funciones de Storage fueron migradas a Cloudinary
// Ver: src/lib/cloudinary.ts y src/actions/cloudinary.ts
// ====================================================================