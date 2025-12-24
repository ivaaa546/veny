'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogout = async () => {
        setLoading(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loading}
            className="gap-2"
        >
            <LogOut className="h-4 w-4" />
            {loading ? 'Saliendo...' : 'Cerrar Sesión'}
        </Button>
    )
}
