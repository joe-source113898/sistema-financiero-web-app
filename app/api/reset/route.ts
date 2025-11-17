import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getCookieStore } from '@/lib/getCookieStore'

export async function POST() {
  const cookieStore = await getCookieStore()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { error: transError } = await supabase
    .from('transacciones')
    .delete()
    .or(`usuario_id.eq.${user.id},usuario_id.is.null`)

  if (transError) {
    return NextResponse.json({ error: transError.message }, { status: 500 })
  }

  const { error: objetivosError } = await supabase
    .from('objetivos_ahorro')
    .delete()
    .eq('usuario_id', user.id)

  if (objetivosError) {
    return NextResponse.json({ error: objetivosError.message }, { status: 500 })
  }

  const { error: recurrentesError } = await supabase
    .from('gastos_mensuales')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (recurrentesError) {
    return NextResponse.json({ error: recurrentesError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
