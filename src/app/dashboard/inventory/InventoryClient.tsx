'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Search, Save, Loader2, Package, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { InventoryItem, updateVariantStock } from '@/actions/inventory'

interface InventoryClientProps {
    inventory: InventoryItem[]
}

type FilterType = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

export default function InventoryClient({ inventory }: InventoryClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState<FilterType>('all')
    const [stockEdits, setStockEdits] = useState<Record<string, number>>({})
    const [savingId, setSavingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Filtrar inventario
    const filteredInventory = inventory.filter(item => {
        // Filtro de búsqueda
        const matchesSearch = searchTerm === '' ||
            item.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.variant_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.variant_value.toLowerCase().includes(searchTerm.toLowerCase())

        // Filtro de stock
        let matchesFilter = true
        switch (filter) {
            case 'in-stock':
                matchesFilter = item.stock > 0
                break
            case 'low-stock':
                matchesFilter = item.stock > 0 && item.stock <= 5
                break
            case 'out-of-stock':
                matchesFilter = item.stock <= 0
                break
        }

        return matchesSearch && matchesFilter
    })

    // Manejar cambio de stock
    const handleStockChange = (variantId: string, newStock: string) => {
        const stock = parseInt(newStock) || 0
        setStockEdits(prev => ({
            ...prev,
            [variantId]: stock
        }))
    }

    // Guardar stock individual
    const handleSaveStock = async (variantId: string) => {
        const newStock = stockEdits[variantId]
        if (newStock === undefined) return

        setSavingId(variantId)
        startTransition(async () => {
            try {
                await updateVariantStock(variantId, newStock)
                // Limpiar el edit después de guardar
                setStockEdits(prev => {
                    const updated = { ...prev }
                    delete updated[variantId]
                    return updated
                })
            } catch (error) {
                console.error('Error guardando stock:', error)
                alert('Error al guardar el stock')
            } finally {
                setSavingId(null)
            }
        })
    }

    // Obtener el stock a mostrar (editado o original)
    const getDisplayStock = (item: InventoryItem) => {
        return stockEdits[item.id] !== undefined ? stockEdits[item.id] : item.stock
    }

    // Verificar si hay cambios pendientes
    const hasChanges = (variantId: string, originalStock: number) => {
        return stockEdits[variantId] !== undefined && stockEdits[variantId] !== originalStock
    }

    // Obtener badge de stock
    const getStockBadge = (stock: number) => {
        if (stock <= 0) {
            return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Sin stock</Badge>
        }
        if (stock <= 5) {
            return <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle className="h-3 w-3" /> Bajo</Badge>
        }
        return <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700"><CheckCircle2 className="h-3 w-3" /> OK</Badge>
    }

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Búsqueda */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por producto o variante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Filtros */}
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                    <TabsList>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        <TabsTrigger value="in-stock">Con stock</TabsTrigger>
                        <TabsTrigger value="low-stock">Stock bajo</TabsTrigger>
                        <TabsTrigger value="out-of-stock">Sin stock</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Tabla de inventario */}
            {filteredInventory.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium text-muted-foreground">No se encontraron variantes</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        {searchTerm ? 'Intenta con otro término de búsqueda' : 'Agrega variantes a tus productos para gestionar el inventario'}
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-[300px]">Producto</TableHead>
                                <TableHead>Variante</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-center w-[120px]">Stock</TableHead>
                                <TableHead className="text-center w-[100px]">Estado</TableHead>
                                <TableHead className="text-center w-[80px]">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInventory.map((item) => {
                                const displayStock = getDisplayStock(item)
                                const changed = hasChanges(item.id, item.stock)
                                const finalPrice = item.product_price + item.price_adjustment

                                return (
                                    <TableRow key={item.id} className={changed ? 'bg-amber-50/50' : ''}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                                    {item.product_image ? (
                                                        <img
                                                            src={item.product_image}
                                                            alt={item.product_title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium truncate max-w-[200px]">
                                                    {item.product_title}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.is_product ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground">Tipo</span>
                                                    <span className="font-medium text-blue-600">Producto base</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground">{item.variant_type}</span>
                                                    <span className="font-medium">{item.variant_value}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-semibold">Q{finalPrice.toFixed(2)}</span>
                                            {item.price_adjustment !== 0 && (
                                                <span className="text-xs text-muted-foreground block">
                                                    {item.price_adjustment > 0 ? '+' : ''}Q{item.price_adjustment.toFixed(2)}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={displayStock}
                                                onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                className={`w-20 text-center mx-auto ${changed ? 'border-amber-400 ring-1 ring-amber-200' : ''}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStockBadge(displayStock)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                variant={changed ? 'default' : 'ghost'}
                                                disabled={!changed || savingId === item.id}
                                                onClick={() => handleSaveStock(item.id)}
                                                className="h-8 w-8 p-0"
                                            >
                                                {savingId === item.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Contador de resultados */}
            <p className="text-sm text-muted-foreground">
                Mostrando {filteredInventory.length} de {inventory.length} variantes
            </p>
        </div>
    )
}
