export const generateWhatsAppLink = (phone: string, cartItems: any[]) => {
    // 1. Limpiar el teléfono (quitar espacios, guiones, +, paréntesis)
    const cleanPhone = phone.replace(/[^\w]/g, '');

    // 2. Calcular total
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 3. Construir el mensaje
    let message = `Hola! 👋 Quiero hacer un pedido:\n\n`;

    cartItems.forEach(item => {
        // Ejemplo: 2x Hamburguesa Doble - Q100
        message += `▪️ *${item.quantity}x ${item.title}* - Q${item.price * item.quantity}\n`;
    });

    message += `\n💰 *TOTAL A PAGAR: Q${total}*\n`;
    message += `\n📍 *Mis Datos de Envío:*`;
    message += `\nNombre: `;
    message += `\nDirección: `;
    message += `\nNota Adicional: `;

    // 4. Codificar URL para que funcione en navegadores
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};