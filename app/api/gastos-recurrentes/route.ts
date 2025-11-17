import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getCookieStore } from '@/lib/getCookieStore'

// GET: Obtener todos los gastos recurrentes
export async function GET() {
  const cookieStore = await getCookieStore()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const { data, error } = await supabase
    .from('gastos_mensuales')
    .select('*')
    .order('dia_de_cobro', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mapear columnas de DB a formato esperado por frontend
  const mappedData = data?.map(gasto => ({
    id: gasto.id,
    nombre: gasto.nombre_app,
    dia_cobro: gasto.dia_de_cobro,
    monto: gasto.monto,
    activo: gasto.activo,
    categoria: 'Suscripciones', // Valor por defecto
    metodo_pago: 'Tarjeta', // Valor por defecto
    cuenta: gasto.cuenta || null,
    ultima_ejecucion: null,
    created_at: gasto.created_at,
    updated_at: gasto.updated_at
  }))

  return NextResponse.json({ data: mappedData })
}

// POST: Crear nuevo gasto recurrente
export async function POST(request: Request) {
  const cookieStore = await getCookieStore()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const body = await request.json()

  const { data, error } = await supabase
    .from('gastos_mensuales')
    .insert({
      nombre_app: body.nombre,
      dia_de_cobro: body.dia_cobro,
      monto: body.monto,
      activo: body.activo ?? true,
      cuenta: body.cuenta || null,
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mapear respuesta
  const mappedData = data?.map(gasto => ({
    id: gasto.id,
    nombre: gasto.nombre_app,
    dia_cobro: gasto.dia_de_cobro,
    monto: gasto.monto,
    activo: gasto.activo,
    categoria: 'Suscripciones',
    metodo_pago: 'Tarjeta',
    cuenta: gasto.cuenta || null,
    ultima_ejecucion: null,
    created_at: gasto.created_at,
    updated_at: gasto.updated_at
  }))

  return NextResponse.json({ data: mappedData }, { status: 201 })
}

// PUT: Actualizar gasto recurrente
export async function PUT(request: Request) {
  const cookieStore = await getCookieStore()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const body = await request.json()

  if (!body.id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('gastos_mensuales')
    .update({
      nombre_app: body.nombre,
      dia_de_cobro: body.dia_cobro,
      monto: body.monto,
      activo: body.activo,
      cuenta: body.cuenta || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mapear respuesta
  const mappedData = data?.map(gasto => ({
    id: gasto.id,
    nombre: gasto.nombre_app,
    dia_cobro: gasto.dia_de_cobro,
    monto: gasto.monto,
    activo: gasto.activo,
    categoria: 'Suscripciones',
    metodo_pago: 'Tarjeta',
    cuenta: null,
    ultima_ejecucion: null,
    created_at: gasto.created_at,
    updated_at: gasto.updated_at
  }))

  return NextResponse.json({ data: mappedData })
}

// DELETE: Eliminar gasto recurrente
export async function DELETE(request: Request) {
  const cookieStore = await getCookieStore()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('gastos_mensuales')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
