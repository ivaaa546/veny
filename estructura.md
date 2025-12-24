/linkstore-app
├── .env.local                  # Variables de entorno (Supabase Keys)
├── middleware.ts               # Guardián: Protege rutas /dashboard
├── next.config.mjs             # Configuración de Next.js (Dominios de imágenes)
├── tailwind.config.js          # Configuración de estilos
├── components.json             # Configuración de Shadcn UI
│
├── app/                        # RUTAS (App Router)
│   ├── layout.tsx              # Layout Global (Fuentes, Metadata)
│   ├── page.tsx                # Landing Page (Vende tu servicio)
│   │
│   ├── (auth)/                 # Grupo de rutas de Autenticación
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── dashboard/              # PANEL VENDEDOR (Protegido)
│   │   ├── layout.tsx          # Sidebar y Navbar del admin
│   │   ├── page.tsx            # Resumen/Stats
│   │   ├── products/           # CRUD Productos
│   │   │   ├── page.tsx        # Lista
│   │   │   └── new/page.tsx    # Crear
│   │   ├── categories/         # CRUD Categorías
│   │   └── settings/           # Configurar Tienda (Logo, Color)
│   │
│   └── [slug]/                 # TIENDA PÚBLICA (Ruta Dinámica)
│       ├── page.tsx            # La tienda visual
│       └── layout.tsx          # Layout específico para tiendas (sin sidebar)
│
├── components/                 # COMPONENTES DE UI
│   ├── ui/                     # Shadcn (Button, Card, Input...) - NO TOCAR MUCHO
│   │
│   ├── dashboard/              # Componentes del Admin
│   │   ├── Sidebar.tsx
│   │   ├── ProductForm.tsx
│   │   └── StatsCard.tsx
│   │
│   ├── storefront/             # Componentes de la Tienda Pública
│   │   ├── Header.tsx          # Buscador + Logo Tienda
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryTabs.tsx
│   │   └── CartSheet.tsx       # El carrito deslizable
│   │
│   └── shared/                 # Reutilizables
│       ├── ImageUploader.tsx   # Tu componente de subida
│       └── ThemeToggle.tsx
│
├── lib/                        # UTILIDADES Y CONFIG
│   ├── supabase.ts             # Cliente de conexión (Singleton)
│   ├── utils.ts                # Helper de Shadcn (clsx)
│   └── whatsapp.ts             # Lógica para generar el link de pedido
│
├── hooks/                      # CUSTOM HOOKS
│   ├── use-cart.ts             # Estado del carrito (Zustand o Context)
│   └── use-image-upload.ts     # Lógica de subida a Storage
│
├── actions/                    # SERVER ACTIONS (Tu "Backend")
│   ├── products.ts             # Funciones: createProduct, deleteProduct...
│   ├── stores.ts               # Funciones: updateStoreSettings...
│   └── auth.ts                 # Funciones: login, logout...
│
└── types/                      # DEFINICIONES DE TIPOS (TypeScript)
    └── index.ts                # Interfaces: Product, Category, Store