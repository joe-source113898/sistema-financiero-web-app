import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getCookieStore } from '@/lib/getCookieStore'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = getCookieStore()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await request.json()
    const data = payload?.data
    if (!data) {
      return NextResponse.json({ error: 'Archivo inválido: falta la propiedad data' }, { status: 400 })
    }

    const summary = {
      objetivos: 0,
      transacciones: 0,
      gastos_recurrentes: 0,
    }

    let objetivosValidos = new Set<string>()

    if (Array.isArray(data.objetivos) && data.objetivos.length > 0) {
      const objetivosSanitizados = data.objetivos.map((obj: any) => {
        const idVal = typeof obj.id === 'string' ? obj.id : undefined
        if (idVal) objetivosValidos.add(idVal)
        return {
          id: idVal,
          nombre: obj.nombre,
          meta: obj.meta ?? null,
          descripcion: obj.descripcion ?? null,
          color: obj.color ?? '#0ea5e9',
          icono: obj.icono ?? null,
          usuario_id: user.id,
        }
      })
      if (objetivosSanitizados.length > 0) {
        const { error } = await supabase.from('objetivos_ahorro').upsert(objetivosSanitizados, { onConflict: 'id' })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        summary.objetivos = objetivosSanitizados.length
      }
    }

    if (objetivosValidos.size === 0) {
      const { data: existentes } = await supabase.from('objetivos_ahorro').select('id').eq('usuario_id', user.id)
      existentes?.forEach((obj) => objetivosValidos.add(obj.id as string))
    }

    if (Array.isArray(data.transacciones) && data.transacciones.length > 0) {
      const transSanitizadas = data.transacciones.map((t: any) => ({
        fecha: t.fecha ?? t.fecha_hora ?? new Date().toISOString(),
        tipo: t.tipo,
        monto: t.monto,
        categoria: t.categoria ?? 'Otros',
        concepto: t.concepto ?? null,
        descripcion: t.descripcion ?? null,
        metodo_pago: t.metodo_pago ?? 'Efectivo',
        registrado_por: t.registrado_por ?? user.email,
        foto_url: t.foto_url ?? null,
        objetivo_id:
          typeof t.objetivo_id === 'string' && objetivosValidos.has(t.objetivo_id)
            ? t.objetivo_id
            : null,
        usuario_id: user.id,
      }))
      const { error } = await supabase.from('transacciones').insert(transSanitizadas)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      summary.transacciones = transSanitizadas.length
    }

    if (Array.isArray(data.gastos_recurrentes) && data.gastos_recurrentes.length > 0) {
      const recurrentesSanitizados = data.gastos_recurrentes.map((g: any) => ({
        nombre_app: g.nombre_app ?? g.nombre ?? 'Recurrente',
        dia_de_cobro: g.dia_de_cobro ?? 1,
        monto: g.monto ?? 0,
        activo: g.activo ?? true,
        cuenta: g.cuenta ?? null,
      }))
      const { error } = await supabase.from('gastos_mensuales').insert(recurrentesSanitizados)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      summary.gastos_recurrentes = recurrentesSanitizados.length
    }

    return NextResponse.json({ success: true, summary })
  } catch (error: any) {
    console.error('Import error', error)
    return NextResponse.json({ error: error.message || 'Error al importar' }, { status: 500 })
  }
}
