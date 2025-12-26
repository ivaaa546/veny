/**
 * Formatea un número de teléfono para usar con WhatsApp.
 * Agrega el código de país +502 (Guatemala) si no lo tiene.
 * 
 * @param phone - Número de teléfono en cualquier formato
 * @returns Número formateado para wa.me (solo dígitos con código de país)
 */
export function formatPhoneForWhatsApp(phone: string | null | undefined): string {
    if (!phone) return ''

    // Quitar todos los caracteres no numéricos excepto el +
    let cleaned = phone.replace(/[^\d+]/g, '')

    // Si empieza con +, quitar el + y devolver solo números
    if (cleaned.startsWith('+')) {
        return cleaned.substring(1)
    }

    // Si tiene 8 dígitos (número guatemalteco sin código), agregar 502
    if (cleaned.length === 8) {
        return '502' + cleaned
    }

    // Si empieza con 502 y tiene 11 dígitos, está bien
    if (cleaned.startsWith('502') && cleaned.length === 11) {
        return cleaned
    }

    // Si no tiene código de país (menos de 10 dígitos), asumir Guatemala
    if (cleaned.length < 10) {
        return '502' + cleaned
    }

    return cleaned
}
