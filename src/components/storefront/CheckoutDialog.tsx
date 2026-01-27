'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useCart, CartItem } from '@/hooks/use-cart'
import { formatPhoneForWhatsApp } from '@/lib/phone'
import { listaDepartamentos, getMunicipios, getNombreDepartamento } from '@/lib/guatemala'
import { Loader2, CheckCircle, Truck } from 'lucide-react'

import { createOrder } from '@/actions/orders'

interface CheckoutDialogProps {
    storeId: string
    storePhone: string
    total: number
    children?: React.ReactNode
    // Props para modo controlado (opcional)
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

type LugarEntrega = 'casa' | 'trabajo' | 'otro'

export default function CheckoutDialog({
    storeId,
    storePhone,
    total,
    children,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: CheckoutDialogProps) {
    // Estado interno para modo no controlado
    const [internalOpen, setInternalOpen] = useState(false)

    // Determinar si estamos en modo controlado
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? (controlledOnOpenChange || (() => { })) : setInternalOpen

    const [loading, setLoading] = useState(false)
    const [showErrors, setShowErrors] = useState(false)
    const cart = useCart()

    // Estados del formulario
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [departamento, setDepartamento] = useState('')
    const [municipio, setMunicipio] = useState('')
    const [zona, setZona] = useState('')
    const [referencia, setReferencia] = useState('')
    const [lugarEntrega, setLugarEntrega] = useState<LugarEntrega>('casa')

    // Lista de municipios según departamento seleccionado
    const municipios = departamento ? getMunicipios(departamento) : []

    // Reset municipio cuando cambia el departamento
    const handleDepartamentoChange = (value: string) => {
        setDepartamento(value)
        setMunicipio('') // Reset municipio
    }

    const generateWhatsAppMessage = (items: CartItem[]) => {
        const nombreDepartamento = getNombreDepartamento(departamento)
        const lugarTexto = lugarEntrega === 'casa' ? 'Casa' : lugarEntrega === 'trabajo' ? 'Trabajo' : 'Otro lugar'

        let message = `*NUEVO PEDIDO*\n\n`
        message += `*Cliente:* ${nombre} ${apellido}\n`
        message += `*Teléfono:* ${telefono}\n\n`
        message += `*DIRECCIÓN DE ENTREGA:*\n`
        message += `Departamento: ${nombreDepartamento}\n`
        message += `Municipio: ${municipio}\n`
        message += `Zona: ${zona}\n`
        message += `Lugar: ${lugarTexto}\n`
        if (referencia) message += `Referencia: ${referencia}\n`
        message += `\n-------------------\n\n`
        message += `*PRODUCTOS:*\n`

        items.forEach((item, index) => {
            message += `${index + 1}. ${item.title}\n`
            message += `   Cantidad: ${item.quantity}\n`
            message += `   Precio: Q${Number(item.price).toFixed(2)}\n`
            if (item.selectedVariant) {
                message += `   Variante: ${item.selectedVariant}\n`
            }
            message += `   Subtotal: Q${(Number(item.price) * item.quantity).toFixed(2)}\n\n`
        })

        message += `-------------------\n`
        message += `*TOTAL: Q${total.toFixed(2)}*\n\n`
        message += `*Pago contra entrega*\n`
        message += `Gracias por tu compra!`

        return encodeURIComponent(message)
    }

    // Validación del formulario
    const isFormValid =
        nombre.trim() &&
        apellido.trim() &&
        telefono.trim() &&
        departamento &&
        municipio &&
        zona.trim()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Validaciones
        if (!isFormValid) {
            setShowErrors(true)
            return
        }

        setLoading(true)

        try {
            // 1. Guardar pedido en base de datos
            await createOrder({
                storeId,
                customerName: nombre,
                customerLastName: apellido,
                customerPhone: telefono,
                customerDepartment: getNombreDepartamento(departamento),
                customerMunicipality: municipio,
                customerZone: zona,
                customerReference: referencia || undefined,
                deliveryPlace: lugarEntrega,
                total
            }, cart.items)

            // 2. Generar URL de WhatsApp
            const message = generateWhatsAppMessage(cart.items)
            const formattedPhone = formatPhoneForWhatsApp(storePhone)
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`

            // 3. Limpiar carrito
            cart.clearCart()

            // 4. Cerrar dialog y resetear form
            setOpen(false)
            resetForm()

            // 5. Abrir WhatsApp (usar location.href para compatibilidad con Safari iOS)
            window.location.href = whatsappUrl

        } catch (error) {
            console.error('Error:', error)
            alert('Hubo un problema al procesar el pedido. Por favor intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setNombre('')
        setApellido('')
        setTelefono('')
        setDepartamento('')
        setMunicipio('')
        setZona('')
        setReferencia('')
        setLugarEntrega('casa')
    }

    // Contenido del dialog (reutilizable)
    const dialogContent = (
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Finalizar Pedido</DialogTitle>
                <DialogDescription>
                    Ingresa tus datos para completar el pedido.
                </DialogDescription>
            </DialogHeader>

            {/* Mensaje de pago contra entrega */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Truck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-amber-800">Pago contra entrega + Envío Gratis</p>
                    <p className="text-amber-700">Tiempo de entrega: 48-72 horas</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                    {/* Nombre y Apellido en una fila */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">
                                Nombre <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nombre"
                                placeholder="Tu nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                disabled={loading}
                                className={cn(
                                    showErrors && !nombre.trim() && "border-red-500"
                                )}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido">
                                Apellido <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="apellido"
                                placeholder="Tu apellido"
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                disabled={loading}
                                className={cn(
                                    showErrors && !apellido.trim() && "border-red-500"
                                )}
                                required
                            />
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                        <Label htmlFor="telefono">
                            Teléfono <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="telefono"
                            type="tel"
                            placeholder="1234 5678"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            disabled={loading}
                            className={cn(
                                showErrors && !telefono.trim() && "border-red-500"
                            )}
                            required
                        />
                    </div>

                    {/* Departamento y Municipio */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>
                                Departamento <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={departamento}
                                onValueChange={handleDepartamentoChange}
                                disabled={loading}
                            >
                                <SelectTrigger className={cn(showErrors && !departamento && "border-red-500")}>
                                    <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                    {listaDepartamentos.map((dep) => (
                                        <SelectItem key={dep.value} value={dep.value}>
                                            {dep.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Municipio <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={municipio}
                                onValueChange={setMunicipio}
                                disabled={loading || !departamento}
                            >
                                <SelectTrigger className={cn(showErrors && !municipio && "border-red-500")}>
                                    <SelectValue placeholder={departamento ? "Selecciona" : "Primero el depto."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {municipios.map((mun) => (
                                        <SelectItem key={mun} value={mun}>
                                            {mun}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Zona */}
                    <div className="space-y-2">
                        <Label htmlFor="zona">
                            Zona <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="zona"
                            placeholder="Ej: Zona 10"
                            value={zona}
                            onChange={(e) => setZona(e.target.value)}
                            disabled={loading}
                            className={cn(
                                showErrors && !zona.trim() && "border-red-500"
                            )}
                            required
                        />
                    </div>

                    {/* Lugar de entrega */}
                    <div className="space-y-2">
                        <Label>
                            Lugar de entrega <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            {[
                                { value: 'casa', label: 'Casa' },
                                { value: 'trabajo', label: 'Trabajo' },
                                { value: 'otro', label: 'Otro lugar' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setLugarEntrega(option.value as LugarEntrega)}
                                    className={`flex-1 py-2 px-3 text-sm rounded-md border transition-all ${lugarEntrega === option.value
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Punto de referencia */}
                    <div className="space-y-2">
                        <Label htmlFor="referencia">Punto de referencia (opcional)</Label>
                        <Textarea
                            id="referencia"
                            placeholder="Ej: Frente al parque central, casa color azul..."
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            disabled={loading}
                            rows={2}
                            className="resize-none"
                        />
                    </div>

                    {/* Resumen */}
                    <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                {cart.items.reduce((acc, item) => acc + item.quantity, 0)} {cart.items.length === 1 ? 'producto' : 'productos'}
                            </span>
                            <span className="font-bold text-lg">Q{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-black hover:bg-gray-800"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar Pedido
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </form >
        </DialogContent >
    )

    // Modo controlado: sin DialogTrigger
    if (isControlled) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                {dialogContent}
            </Dialog>
        )
    }

    // Modo no controlado: con DialogTrigger
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            {dialogContent}
        </Dialog>
    )
}
