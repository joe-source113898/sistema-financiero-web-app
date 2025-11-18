import { Suspense } from 'react'
import { LoginClient } from '@/components/login/LoginClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070a0f] to-[#0d1424] text-gray-200">
          Cargando formulario...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
