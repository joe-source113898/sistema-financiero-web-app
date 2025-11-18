import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getCookieStore } from '@/lib/getCookieStore'

export async function GET() {
  const cookieStore = getCookieStore()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const [transacciones, objetivos, recurrentes] = await Promise.all([
    supabase
      .from('transacciones')
      .select('*')
      .eq('usuario_id', user.id)
      .order('fecha', { ascending: true }),
    supabase
      .from('objetivos_ahorro')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('gastos_mensuales')
      .select('*')
      .order('created_at', { ascending: true }),
  ])

  if (transacciones.error) return NextResponse.json({ error: transacciones.error.message }, { status: 500 })
  if (objetivos.error) return NextResponse.json({ error: objetivos.error.message }, { status: 500 })
  if (recurrentes.error) return NextResponse.json({ error: recurrentes.error.message }, { status: 500 })

  const payload = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    data: {
      transacciones: transacciones.data || [],
      objetivos: objetivos.data || [],
      gastos_recurrentes: recurrentes.data || [],
    },
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-${new Date().toISOString()}.json"`,
    },
  })
}
