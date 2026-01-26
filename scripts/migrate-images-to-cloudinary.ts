/**
 * Script de migración de imágenes de Supabase Storage a Cloudinary
 * 
 * Ejecutar con: npx tsx scripts/migrate-images-to-cloudinary.ts
 * 
 * Este script:
 * 1. Busca todas las URLs de imágenes que apuntan a Supabase Storage
 * 2. Descarga cada imagen
 * 3. La sube a Cloudinary
 * 4. Actualiza la URL en la base de datos
 */

import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! // Necesita service role para bypass RLS

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface MigrationResult {
  table: string
  id: string
  oldUrl: string
  newUrl: string | null
  success: boolean
  error?: string
}

async function uploadToCloudinary(url: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  })
  return result.secure_url
}

async function migrateProductImages(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []
  
  console.log('\n📦 Migrando imágenes de productos...')
  
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, image_url, product_id')
    .like('image_url', '%supabase.co%')
  
  if (error) {
    console.error('Error obteniendo product_images:', error)
    return results
  }
  
  for (const img of images || []) {
    console.log(`  → Migrando imagen ${img.id}...`)
    
    try {
      const newUrl = await uploadToCloudinary(img.image_url, 'veny/products')
      
      const { error: updateError } = await supabase
        .from('product_images')
        .update({ image_url: newUrl })
        .eq('id', img.id)
      
      if (updateError) throw updateError
      
      results.push({
        table: 'product_images',
        id: img.id,
        oldUrl: img.image_url,
        newUrl,
        success: true
      })
      console.log(`    ✅ Migrada exitosamente`)
    } catch (err) {
      results.push({
        table: 'product_images',
        id: img.id,
        oldUrl: img.image_url,
        newUrl: null,
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      })
      console.log(`    ❌ Error: ${err}`)
    }
  }
  
  return results
}

async function migrateStoreLogos(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []
  
  console.log('\n🏪 Migrando logos de tiendas...')
  
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, logo_url')
    .like('logo_url', '%supabase.co%')
  
  if (error) {
    console.error('Error obteniendo stores:', error)
    return results
  }
  
  for (const store of stores || []) {
    console.log(`  → Migrando logo de tienda ${store.id}...`)
    
    try {
      const newUrl = await uploadToCloudinary(store.logo_url, `veny/stores/${store.id}/logos`)
      
      const { error: updateError } = await supabase
        .from('stores')
        .update({ logo_url: newUrl })
        .eq('id', store.id)
      
      if (updateError) throw updateError
      
      results.push({
        table: 'stores (logo)',
        id: store.id,
        oldUrl: store.logo_url,
        newUrl,
        success: true
      })
      console.log(`    ✅ Migrada exitosamente`)
    } catch (err) {
      results.push({
        table: 'stores (logo)',
        id: store.id,
        oldUrl: store.logo_url,
        newUrl: null,
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      })
      console.log(`    ❌ Error: ${err}`)
    }
  }
  
  return results
}

async function migrateStoreBanners(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []
  
  console.log('\n🎨 Migrando banners de tiendas...')
  
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, banner_url')
    .like('banner_url', '%supabase.co%')
  
  if (error) {
    console.error('Error obteniendo stores:', error)
    return results
  }
  
  for (const store of stores || []) {
    console.log(`  → Migrando banner de tienda ${store.id}...`)
    
    try {
      const newUrl = await uploadToCloudinary(store.banner_url, `veny/stores/${store.id}/banners`)
      
      const { error: updateError } = await supabase
        .from('stores')
        .update({ banner_url: newUrl })
        .eq('id', store.id)
      
      if (updateError) throw updateError
      
      results.push({
        table: 'stores (banner)',
        id: store.id,
        oldUrl: store.banner_url,
        newUrl,
        success: true
      })
      console.log(`    ✅ Migrada exitosamente`)
    } catch (err) {
      results.push({
        table: 'stores (banner)',
        id: store.id,
        oldUrl: store.banner_url,
        newUrl: null,
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      })
      console.log(`    ❌ Error: ${err}`)
    }
  }
  
  return results
}

async function main() {
  console.log('🚀 Iniciando migración de imágenes de Supabase Storage a Cloudinary...\n')
  
  // Verificar configuración
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Falta configuración de Supabase')
    console.error('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Error: Falta configuración de Cloudinary')
    console.error('   Asegúrate de tener CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET')
    process.exit(1)
  }
  
  const allResults: MigrationResult[] = []
  
  // Migrar todas las imágenes
  allResults.push(...await migrateProductImages())
  allResults.push(...await migrateStoreLogos())
  allResults.push(...await migrateStoreBanners())
  
  // Resumen
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE MIGRACIÓN')
  console.log('='.repeat(60))
  
  const successful = allResults.filter(r => r.success)
  const failed = allResults.filter(r => !r.success)
  
  console.log(`\n✅ Exitosas: ${successful.length}`)
  console.log(`❌ Fallidas: ${failed.length}`)
  console.log(`📁 Total: ${allResults.length}`)
  
  if (failed.length > 0) {
    console.log('\n⚠️ Imágenes que fallaron:')
    failed.forEach(f => {
      console.log(`   - ${f.table} (${f.id}): ${f.error}`)
    })
  }
  
  if (successful.length > 0) {
    console.log('\n✨ Migración completada!')
    console.log('\nPróximos pasos:')
    console.log('1. Verificar que las imágenes se muestren correctamente en la aplicación')
    console.log('2. Eliminar los triggers de auto-limpieza de Supabase Storage')
    console.log('3. Opcionalmente, eliminar el bucket store-images de Supabase')
  }
}

main().catch(console.error)
