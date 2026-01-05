'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, ExternalLink, Check } from 'lucide-react'

interface ShareStoreCardProps {
    slug: string
}

export default function ShareStoreCard({ slug }: ShareStoreCardProps) {
    const [copied, setCopied] = useState(false)
    const [storeUrl, setStoreUrl] = useState('')

    useEffect(() => {
        // Construir URL en el cliente para tener acceso a window
        setStoreUrl(`${window.location.origin}/${slug}`)
    }, [slug])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(storeUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Error al copiar:', error)
        }
    }

    const handleOpenStore = () => {
        window.open(storeUrl, '_blank')
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Comparte tu Tienda</CardTitle>
                <CardDescription>
                    Escanea el código QR o comparte el enlace
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Código QR */}
                <div className="flex justify-center p-4 bg-white rounded-xl border shadow-sm max-w-[180px] mx-auto">
                    {storeUrl && (
                        <QRCode
                            value={storeUrl}
                            size={140}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    )}
                </div>

                {/* URL con botón de copiar */}
                <div className="flex gap-2">
                    <Input
                        value={storeUrl}
                        readOnly
                        className="font-mono text-sm bg-muted"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className="shrink-0"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Mensaje de copiado */}
                {copied && (
                    <p className="text-sm text-green-600 text-center">
                        ¡URL copiada al portapapeles!
                    </p>
                )}

                {/* Botón para abrir tienda */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenStore}
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ir a mi tienda
                </Button>
            </CardContent>
        </Card>
    )
}
