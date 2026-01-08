import { vi } from 'vitest'

// Mock completo del cliente de Supabase
export const mockSupabaseClient = {
    auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
    },
    from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
    })),
    storage: {
        from: vi.fn((bucket: string) => ({
            upload: vi.fn(),
            download: vi.fn(),
            remove: vi.fn(),
            list: vi.fn(),
            getPublicUrl: vi.fn((path: string) => ({
                data: { publicUrl: `https://example.com/storage/${bucket}/${path}` },
            })),
        })),
    },
    rpc: vi.fn(),
}

// Mock del createServerClient
export const mockCreateServerClient = vi.fn(() => mockSupabaseClient)

// Mock del createBrowserClient
export const mockCreateBrowserClient = vi.fn(() => mockSupabaseClient)

// Helper para resetear todos los mocks
export const resetSupabaseMocks = () => {
    vi.clearAllMocks()
}

// Helper para simular respuesta exitosa de query
export const mockSuccessResponse = (data: any) => ({
    data,
    error: null,
})

// Helper para simular error de query
export const mockErrorResponse = (message: string) => ({
    data: null,
    error: { message },
})

// Helper para simular usuario autenticado
export const mockAuthenticatedUser = (userId: string = 'test-user-id') => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
            user: {
                id: userId,
                email: 'test@example.com',
                created_at: new Date().toISOString(),
            },
        },
        error: null,
    })

    mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
            session: {
                user: {
                    id: userId,
                    email: 'test@example.com',
                },
                access_token: 'mock-token',
            },
        },
        error: null,
    })
}

// Helper para simular usuario no autenticado
export const mockUnauthenticatedUser = () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
    })

    mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
    })
}
