# VentaFácil

## 📘 Descripción del Proyecto

**VentaFácil** es un sistema de punto de venta (POS) y gestión de ventas diseñado para pequeñas y medianas empresas que necesitan una solución simple pero potente para registrar sus ventas, controlar sus productos y visualizar el rendimiento de su negocio.

### Filosofía
> "Registrar una venta en 3 clicks, ver tus números al instante"

### Problema que Resuelve
- Pequeños negocios usan cuadernos o Excel para registrar ventas
- Sistemas existentes son complicados y costosos
- No tienen visibilidad de qué productos se venden más
- Pierden tiempo calculando totales manualmente

### Solución
Una aplicación web minimalista que permite:
1. Registrar ventas en segundos
2. Ver métricas del negocio en tiempo real
3. Gestionar productos y clientes
4. Generar reportes útiles

---

## 🎯 Público Objetivo

| Segmento | Ejemplos |
|----------|----------|
| Comercio minorista | Tiendas, abarroterías, ferreterías |
| Alimentos | Restaurantes pequeños, cafeterías, panaderías |
| Servicios | Salones de belleza, talleres, lavanderías |
| Vendedores independientes | Freelancers, vendedores ambulantes |

### Mercado
- Pequeñas empresas en Latinoamérica
- 1-10 empleados
- Facturación mensual: $1,000 - $50,000 USD
- Buscan simplicidad sobre funcionalidades complejas

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** (App Router con Server Components)
- **React 19** (Server & Client Components)
- **TypeScript** (Type-safe en todo el proyecto)
- **Tailwind CSS 4** (Estilos utility-first)
- **Shadcn UI** (Componentes reutilizables)

### Backend & Database
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL con Row Level Security (RLS)
  - Authentication (email/password)
  - Storage (logos de negocios)
  - Realtime (actualizaciones en vivo)

### Extras
- **Resend** (Emails transaccionales)
- **Zustand** (Estado global si necesario)
- **React Query** (Cache y sincronización)

---

## 🏗️ Arquitectura

### Modelo Multi-Tenant
Cada negocio tiene su cuenta aislada con sus propios datos.

```
Usuario se registra
    ↓
Crea su negocio (nombre, moneda, logo)
    ↓
Agrega productos
    ↓
Registra ventas
    ↓
Ve reportes
```

### Estructura de Base de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                         ESQUEMA                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  auth.users (Supabase Auth)                                  │
│  └── id, email, created_at                                   │
│                                                              │
│  profiles (extensión de usuarios)                            │
│  ├── id (FK auth.users)                                      │
│  ├── full_name                                               │
│  ├── avatar_url                                              │
│  └── created_at                                              │
│                                                              │
│  businesses (negocios/cuentas)                               │
│  ├── id (uuid, PK)                                           │
│  ├── owner_id (FK auth.users)                                │
│  ├── name                                                    │
│  ├── phone                                                   │
│  ├── email                                                   │
│  ├── address                                                 │
│  ├── logo_url                                                │
│  ├── currency (GTQ, USD, MXN, etc)                           │
│  ├── timezone                                                │
│  ├── is_active                                               │
│  ├── created_at                                              │
│  └── updated_at                                              │
│                                                              │
│  business_users (usuarios del negocio - futuro)              │
│  ├── id                                                      │
│  ├── business_id (FK)                                        │
│  ├── user_id (FK auth.users)                                 │
│  ├── role (owner, admin, seller)                             │
│  └── created_at                                              │
│                                                              │
│  categories (categorías de productos)                        │
│  ├── id (uuid, PK)                                           │
│  ├── business_id (FK)                                        │
│  ├── name                                                    │
│  ├── color (para UI)                                         │
│  ├── sort_order                                              │
│  └── created_at                                              │
│                                                              │
│  products (catálogo de productos/servicios)                  │
│  ├── id (uuid, PK)                                           │
│  ├── business_id (FK)                                        │
│  ├── category_id (FK, nullable)                              │
│  ├── name                                                    │
│  ├── description                                             │
│  ├── sku (código único, opcional)                            │
│  ├── price (precio de venta)                                 │
│  ├── cost (costo, opcional - para calcular ganancia)         │
│  ├── image_url                                               │
│  ├── track_stock (boolean)                                   │
│  ├── stock (cantidad actual)                                 │
│  ├── low_stock_threshold                                     │
│  ├── is_active                                               │
│  ├── created_at                                              │
│  └── updated_at                                              │
│                                                              │
│  customers (clientes)                                        │
│  ├── id (uuid, PK)                                           │
│  ├── business_id (FK)                                        │
│  ├── name                                                    │
│  ├── phone                                                   │
│  ├── email                                                   │
│  ├── address                                                 │
│  ├── notes                                                   │
│  ├── created_at                                              │
│  └── updated_at                                              │
│                                                              │
│  payment_methods (métodos de pago personalizados)            │
│  ├── id                                                      │
│  ├── business_id (FK)                                        │
│  ├── name (Efectivo, Tarjeta, Transferencia, etc)            │
│  ├── is_default                                              │
│  ├── is_active                                               │
│  └── sort_order                                              │
│                                                              │
│  sales (ventas/transacciones)                                │
│  ├── id (uuid, PK)                                           │
│  ├── business_id (FK)                                        │
│  ├── customer_id (FK, nullable)                              │
│  ├── sale_number (auto-generado: #0001, #0002)               │
│  ├── subtotal                                                │
│  ├── discount_type (percentage, fixed)                       │
│  ├── discount_value                                          │
│  ├── discount_amount (calculado)                             │
│  ├── tax_amount (opcional, futuro)                           │
│  ├── total                                                   │
│  ├── cost_total (suma de costos - para ganancia)             │
│  ├── profit (total - cost_total)                             │
│  ├── payment_method_id (FK)                                  │
│  ├── payment_reference (# de transacción, etc)               │
│  ├── status (completed, cancelled, pending)                  │
│  ├── notes                                                   │
│  ├── created_by (FK auth.users)                              │
│  ├── cancelled_at                                            │
│  ├── cancelled_by                                            │
│  ├── cancellation_reason                                     │
│  ├── created_at                                              │
│  └── updated_at                                              │
│                                                              │
│  sale_items (detalle de cada venta)                          │
│  ├── id (uuid, PK)                                           │
│  ├── sale_id (FK)                                            │
│  ├── product_id (FK)                                         │
│  ├── product_name (snapshot)                                 │
│  ├── quantity                                                │
│  ├── unit_price                                              │
│  ├── unit_cost                                               │
│  ├── discount_amount                                         │
│  ├── subtotal                                                │
│  └── created_at                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Índices Importantes

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_sales_business_date ON sales(business_id, created_at DESC);
CREATE INDEX idx_sales_status ON sales(business_id, status);
CREATE INDEX idx_products_business ON products(business_id, is_active);
CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
```

---

## 📱 Estructura de la Aplicación

```
/app
├── (auth)/
│   ├── login/page.tsx              # Iniciar sesión
│   ├── register/page.tsx           # Crear cuenta
│   └── forgot-password/page.tsx    # Recuperar contraseña
│
├── (onboarding)/
│   └── setup/page.tsx              # Configurar negocio (primera vez)
│
├── (dashboard)/
│   ├── layout.tsx                  # Layout con sidebar
│   │
│   ├── page.tsx                    # Dashboard principal
│   │   ├── Métricas del día/semana/mes
│   │   ├── Gráfica de ventas
│   │   ├── Productos más vendidos
│   │   ├── Últimas ventas
│   │   └── Alertas (stock bajo, etc)
│   │
│   ├── sales/
│   │   ├── page.tsx                # Historial de ventas
│   │   │   ├── Tabla con filtros
│   │   │   ├── Búsqueda
│   │   │   └── Exportar
│   │   ├── new/page.tsx            # ⭐ NUEVA VENTA (pantalla principal)
│   │   │   ├── Buscador de productos
│   │   │   ├── Carrito lateral
│   │   │   ├── Selector de cliente
│   │   │   ├── Descuentos
│   │   │   ├── Método de pago
│   │   │   └── Confirmar
│   │   └── [id]/page.tsx           # Detalle de venta
│   │       ├── Información completa
│   │       ├── Imprimir ticket
│   │       └── Anular venta
│   │
│   ├── products/
│   │   ├── page.tsx                # Lista de productos
│   │   ├── new/page.tsx            # Crear producto
│   │   └── [id]/page.tsx           # Editar producto
│   │
│   ├── categories/
│   │   └── page.tsx                # Gestión de categorías
│   │
│   ├── customers/
│   │   ├── page.tsx                # Lista de clientes
│   │   ├── new/page.tsx            # Crear cliente
│   │   └── [id]/page.tsx           # Detalle + historial
│   │
│   ├── reports/
│   │   ├── page.tsx                # Reportes generales
│   │   ├── sales/page.tsx          # Reporte de ventas
│   │   ├── products/page.tsx       # Reporte de productos
│   │   └── customers/page.tsx      # Reporte de clientes
│   │
│   └── settings/
│       ├── page.tsx                # Configuración general
│       ├── business/page.tsx       # Datos del negocio
│       ├── payment-methods/page.tsx # Métodos de pago
│       └── users/page.tsx          # Usuarios (futuro)
│
└── api/
    └── (si se necesitan endpoints específicos)
```

---

## ⭐ Pantalla Principal: Nueva Venta

Esta es la pantalla más importante. Debe ser **rápida e intuitiva**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VentaFácil          🔍 Buscar producto...                    [Ana ▼]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────┐  ┌───────────────────────────┐│
│  │         PRODUCTOS                   │  │     CARRITO          #0235││
│  │                                     │  │                           ││
│  │  [Todos] [Bebidas] [Comida] [+]     │  │  ┌───────────────────────┐││
│  │                                     │  │  │ Pizza Grande    x1    │││
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ │  │  │ Q 85.00              │││
│  │  │ 🍕      │ │ 🍔      │ │ 🥤     │ │  │  │            [−] [+] [🗑]│││
│  │  │ Pizza   │ │ Hambur- │ │ Coca   │ │  │  └───────────────────────┘││
│  │  │ Grande  │ │ guesa   │ │ Cola   │ │  │                           ││
│  │  │ Q 85.00 │ │ Q 45.00 │ │ Q 12.00│ │  │  ┌───────────────────────┐││
│  │  └─────────┘ └─────────┘ └────────┘ │  │  │ Coca-Cola       x2    │││
│  │                                     │  │  │ Q 24.00              │││
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ │  │  │            [−] [+] [🗑]│││
│  │  │ 🍟      │ │ 🌮      │ │ 🍺     │ │  │  └───────────────────────┘││
│  │  │ Papas   │ │ Tacos   │ │ Cerveza│ │  │                           ││
│  │  │ Q 25.00 │ │ Q 35.00 │ │ Q 18.00│ │  │  ─────────────────────────││
│  │  └─────────┘ └─────────┘ └────────┘ │  │                           ││
│  │                                     │  │  👤 Cliente: (Opcional ▼) ││
│  │                                     │  │                           ││
│  │                                     │  │  💳 Pago: [Efectivo ▼]    ││
│  │                                     │  │                           ││
│  │                                     │  │  🏷️ Descuento: [+ Agregar]││
│  │                                     │  │                           ││
│  │                                     │  │  ─────────────────────────││
│  │                                     │  │  Subtotal:      Q 109.00  ││
│  │                                     │  │  Descuento:     -  Q 0.00 ││
│  │                                     │  │  ─────────────────────────││
│  │                                     │  │  TOTAL:         Q 109.00  ││
│  │                                     │  │                           ││
│  │                                     │  │  [    COBRAR Q 109.00    ]││
│  │                                     │  │                           ││
│  └─────────────────────────────────────┘  └───────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Flujo de Venta Rápida

1. **Abrir /sales/new** (o atajo de teclado)
2. **Buscar/seleccionar productos** (click o teclado)
3. **Ajustar cantidades** si es necesario
4. **Seleccionar método de pago**
5. **Click en COBRAR**
6. **Venta registrada** → Modal de confirmación con opción de imprimir

### Atajos de Teclado (Power Users)

| Atajo | Acción |
|-------|--------|
| `F2` o `/` | Enfocar búsqueda |
| `Enter` | Agregar producto seleccionado |
| `F5` | Nueva venta (limpiar carrito) |
| `F12` | Cobrar |
| `Esc` | Cancelar/cerrar |

---

## 📊 Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard                              Hoy: 15 Enero 2026           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────┐│
│  │  💰 HOY        │ │  📅 ESTA SEMANA│ │  📆 ESTE MES   │ │ 📈 PROFIT ││
│  │                │ │                │ │                │ │           ││
│  │  Q 2,450.00    │ │  Q 12,380.00   │ │  Q 45,230.00   │ │ Q 12,500  ││
│  │  15 ventas     │ │  89 ventas     │ │  312 ventas    │ │ 27.6%     ││
│  │  ↑ 23% vs ayer │ │  ↑ 12%         │ │  ↑ 8%          │ │           ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └───────────┘│
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📈 Ventas - Últimos 7 días                                      │  │
│  │                                                                  │  │
│  │   Q3,000 ┤                                           ╭─╮         │  │
│  │          │                              ╭─╮         │ │         │  │
│  │   Q2,000 ┤              ╭─╮    ╭─╮     │ │    ╭─╮  │ │         │  │
│  │          │    ╭─╮      │ │    │ │     │ │    │ │  │ │         │  │
│  │   Q1,000 ┤    │ │      │ │    │ │     │ │    │ │  │ │         │  │
│  │          │    │ │      │ │    │ │     │ │    │ │  │ │         │  │
│  │       Q0 ┴────┴─┴──────┴─┴────┴─┴─────┴─┴────┴─┴──┴─┴─────────│  │
│  │           Lun   Mar    Mie    Jue    Vie    Sab   Dom         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ 🏆 Más Vendidos (Mes)       │  │ 🕐 Últimas Ventas               │  │
│  │                             │  │                                 │  │
│  │ 1. Pizza Grande       45    │  │ #0312  Q 125.00  Hace 5 min    │  │
│  │ 2. Hamburguesa        38    │  │ #0311  Q  45.00  Hace 23 min   │  │
│  │ 3. Coca-Cola          67    │  │ #0310  Q  89.00  Hace 1 hora   │  │
│  │ 4. Papas Fritas       52    │  │ #0309  Q 234.00  Hace 2 horas  │  │
│  │ 5. Cerveza            41    │  │ #0308  Q  67.00  Hace 3 horas  │  │
│  │                             │  │                                 │  │
│  │ [Ver todos →]               │  │ [Ver historial →]              │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Alertas                                                      │   │
│  │                                                                 │   │
│  │ 🔴 Stock bajo: Coca-Cola (3 unidades)                          │   │
│  │ 🔴 Stock bajo: Servilletas (10 unidades)                       │   │
│  │ 🟡 Sin ventas ayer: Pastel de Chocolate                        │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Funcionalidades por Fase

### Fase 1: MVP Core (1 semana)
- [ ] Autenticación (login, registro)
- [ ] Onboarding (crear negocio)
- [ ] CRUD Productos (nombre, precio, categoría)
- [ ] CRUD Categorías
- [ ] Nueva Venta (flujo completo)
- [ ] Historial de ventas
- [ ] Dashboard básico (ventas del día)

### Fase 2: Funcionalidades Esenciales (+1 semana)
- [ ] Clientes (CRUD + asignar a venta)
- [ ] Métodos de pago personalizables
- [ ] Descuentos (porcentaje y fijo)
- [ ] Anular ventas
- [ ] Detalle de venta con opción de imprimir
- [ ] Dashboard mejorado (gráficas, comparativos)
- [ ] Reportes básicos (por fecha, por producto)

### Fase 3: Inventario y Costos (+1 semana)
- [ ] Costo por producto
- [ ] Cálculo de ganancia
- [ ] Control de stock
- [ ] Alertas de stock bajo
- [ ] Ajustes manuales de inventario
- [ ] Historial de movimientos

### Fase 4: Reportes y Exportación (+3-4 días)
- [ ] Reporte de ventas (filtros avanzados)
- [ ] Reporte de productos (más/menos vendidos)
- [ ] Reporte de clientes (mejores clientes)
- [ ] Exportar a Excel
- [ ] Exportar a PDF

### Fase 5: Características Avanzadas (Futuro)
- [ ] Multi-usuario con roles
- [ ] Cotizaciones
- [ ] Múltiples sucursales
- [ ] Gastos/Egresos
- [ ] Cuentas por cobrar
- [ ] Integraciones (facturación electrónica)
- [ ] App móvil (PWA o React Native)

---

## 💰 Modelo de Negocio

### Planes de Suscripción

| Característica | GRATIS | PRO ($12/mes) | BUSINESS ($30/mes) |
|----------------|--------|---------------|-------------------|
| Productos | 50 | Ilimitados | Ilimitados |
| Ventas/mes | 100 | Ilimitadas | Ilimitadas |
| Usuarios | 1 | 3 | 10 |
| Clientes | 20 | Ilimitados | Ilimitados |
| Categorías | 5 | Ilimitadas | Ilimitadas |
| Control de stock | No | Sí | Sí |
| Costos y ganancias | No | Sí | Sí |
| Reportes | Básicos | Avanzados | Avanzados |
| Exportar Excel | No | Sí | Sí |
| Exportar PDF | No | Sí | Sí |
| Soporte | Comunidad | Email | Prioritario |
| Sucursales | 1 | 1 | 5 |

### Proyección de Ingresos

| Escenario | Usuarios | Ingresos/mes |
|-----------|----------|--------------|
| Inicial (3 meses) | 50 free, 10 pro | $120 |
| Crecimiento (6 meses) | 200 free, 50 pro, 10 business | $900 |
| Estable (12 meses) | 500 free, 150 pro, 30 business | $2,700 |
| Escalado (24 meses) | 2000 free, 500 pro, 100 business | $9,000 |

---

## 🎨 Diseño Visual

### Paleta de Colores

```css
:root {
  /* Primario - Verde (dinero, éxito, ventas) */
  --primary: #10b981;        /* Emerald 500 */
  --primary-dark: #059669;   /* Emerald 600 */
  
  /* Neutros */
  --background: #f8fafc;     /* Slate 50 */
  --foreground: #0f172a;     /* Slate 900 */
  --muted: #64748b;          /* Slate 500 */
  --border: #e2e8f0;         /* Slate 200 */
  
  /* Estados */
  --success: #22c55e;        /* Green 500 */
  --warning: #f59e0b;        /* Amber 500 */
  --error: #ef4444;          /* Red 500 */
  --info: #3b82f6;           /* Blue 500 */
}
```

### Tipografía
- **Títulos:** Inter (bold)
- **Cuerpo:** Inter (regular)
- **Números/Precios:** Inter (medium, tabular-nums)

### Principios de UI
1. **Claridad** - Información fácil de leer
2. **Velocidad** - Mínimos clicks para acciones comunes
3. **Feedback** - Confirmaciones visuales inmediatas
4. **Responsive** - Funciona en tablet y desktop

---

## 🔐 Seguridad

### Row Level Security (RLS)
Todas las tablas tienen RLS habilitado. Cada usuario solo ve los datos de su negocio.

```sql
-- Ejemplo: Política para productos
CREATE POLICY "Usuarios ven productos de su negocio"
  ON products FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
```

### Validaciones
- Precios no pueden ser negativos
- Stock no puede ser negativo
- Ventas no pueden modificarse después de 24 horas
- Solo el owner puede eliminar el negocio

---

## 📱 Responsive Design

| Dispositivo | Experiencia |
|-------------|-------------|
| **Desktop** (>1024px) | Experiencia completa, sidebar visible |
| **Tablet** (768-1024px) | Sidebar colapsable, grids adaptados |
| **Móvil** (<768px) | Navegación inferior, pantallas simplificadas |

### Pantalla de Nueva Venta en Móvil

```
┌─────────────────────────┐
│ 🔍 Buscar producto...   │
├─────────────────────────┤
│ [Todos][Bebidas][Comida]│
├─────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐│
│ │Pizza│ │Hamb.│ │Coca ││
│ │Q 85 │ │Q 45 │ │Q 12 ││
│ └─────┘ └─────┘ └─────┘│
│ ┌─────┐ ┌─────┐ ┌─────┐│
│ │Papas│ │Tacos│ │Cerv.││
│ │Q 25 │ │Q 35 │ │Q 18 ││
│ └─────┘ └─────┘ └─────┘│
├─────────────────────────┤
│ 🛒 Carrito (2)   Q 109  │
│ [    VER CARRITO →    ] │
└─────────────────────────┘
```

---

## 🚀 Deployment

### Infraestructura
- **Frontend:** Vercel (gratis para proyectos pequeños)
- **Backend:** Supabase (gratis hasta cierto límite)
- **Dominio:** ~$12/año
- **Emails:** Resend (gratis hasta 3,000 emails/mes)

### Costo Mensual Estimado

| Servicio | Gratis | Pro |
|----------|--------|-----|
| Vercel | $0 | $20 |
| Supabase | $0 | $25 |
| Resend | $0 | $20 |
| Dominio | ~$1 | ~$1 |
| **Total** | **~$1** | **~$66** |

---

## 📅 Cronograma de Desarrollo

| Semana | Fase | Entregables |
|--------|------|-------------|
| 1 | MVP Core | Auth, Productos, Ventas básicas |
| 2 | Esenciales | Clientes, Descuentos, Dashboard |
| 3 | Inventario | Stock, Costos, Alertas |
| 4 | Reportes | Reportes, Exportación, Pulido |
| 5 | Lanzamiento | Testing, Deploy, Documentación |

---

## ✅ Checklist Pre-Lanzamiento

- [ ] Testing completo de flujo de ventas
- [ ] Responsive en todos los dispositivos
- [ ] Performance optimizada (<3s carga inicial)
- [ ] SEO básico configurado
- [ ] Analytics (Google Analytics o Plausible)
- [ ] Términos y condiciones
- [ ] Política de privacidad
- [ ] Sistema de soporte (email o chat)
- [ ] Documentación de usuario
- [ ] Video demo

---

## 📚 Recursos

### Competencia (para inspiración)
- [Square POS](https://squareup.com)
- [Loyverse](https://loyverse.com)
- [Vend](https://vendhq.com)
- [Toast](https://pos.toasttab.com)

### Documentación Técnica
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📝 Notas Finales

### Filosofía del Producto
> "Si tu abuela no puede registrar una venta en menos de 30 segundos, está muy complicado."

### Métricas de Éxito
1. **Tiempo de registro de venta:** < 10 segundos
2. **Tasa de conversión free → pro:** > 5%
3. **Churn mensual:** < 5%
4. **NPS:** > 40

### Diferenciadores Clave
1. Simplicidad extrema
2. Enfocado en Latinoamérica
3. Precio accesible
4. Soporte en español

---

**Última actualización:** Enero 2026
**Versión del documento:** 1.0
**Estado:** Planificación
