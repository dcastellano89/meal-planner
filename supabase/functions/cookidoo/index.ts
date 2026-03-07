import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Client credential de la app Thermomix (hardcoded en la app móvil)
const COOKIDOO_BASIC = 'a3VwZmVyd2Vyay1jbGllbnQtbndvdDpMczUwT04xd295U3FzMWRDZEpnZQ=='

const COUNTRY_LANG: Record<string, string> = {
  es: 'es-ES',
  de: 'de-DE',
  at: 'de-AT',
  ch: 'de-CH',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  gb: 'en-GB',
  au: 'en-AU',
  mx: 'es-MX',
  ar: 'es-AR',
}

function apiBase(country: string) {
  return `https://${country}.tmmobile.vorwerk-digital.com`
}

async function cookidooLogin(email: string, password: string, country: string) {
  const res = await fetch(`${apiBase(country)}/ciam/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${COOKIDOO_BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
      'Accept': 'application/json',
    },
    body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&grant_type=password`,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Login failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: data.expires_in as number,
  }
}

async function cookidooRefresh(refreshToken: string, country: string) {
  const res = await fetch(`${apiBase(country)}/ciam/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${COOKIDOO_BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
      'Accept': 'application/json',
    },
    body: `refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`,
  })

  if (!res.ok) throw new Error(`Refresh failed (${res.status})`)

  const data = await res.json()
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: data.expires_in as number,
  }
}

// Obtiene un token válido para el hogar, haciendo refresh/login si es necesario
async function getValidToken(supabase: ReturnType<typeof createClient>, connection: Record<string, string>) {
  const now = new Date()
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= now

  if (!isExpired && connection.access_token) {
    return connection.access_token
  }

  // Intentar refresh
  if (connection.refresh_token) {
    try {
      const tokens = await cookidooRefresh(connection.refresh_token, connection.country)
      const newExpires = new Date(Date.now() + tokens.expires_in * 1000)
      await supabase
        .from('cookidoo_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: newExpires.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('household_id', connection.household_id)
      return tokens.access_token
    } catch {
      // Refresh falló, hacer login completo
    }
  }

  // Login completo
  const tokens = await cookidooLogin(connection.email, connection.password, connection.country)
  const newExpires = new Date(Date.now() + tokens.expires_in * 1000)
  await supabase
    .from('cookidoo_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpires.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('household_id', connection.household_id)
  return tokens.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verificar JWT del usuario
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    // Obtener household del usuario
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .single()

    if (!member) return new Response(JSON.stringify({ error: 'No household found' }), { status: 400, headers: corsHeaders })

    const { action, ...payload } = await req.json()

    // --- CONNECT ---
    if (action === 'connect') {
      if (member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Solo el administrador puede conectar Cookidoo' }), { status: 403, headers: corsHeaders })
      }

      const { email, password, country } = payload
      if (!email || !password || !country) {
        return new Response(JSON.stringify({ error: 'email, password y country son requeridos' }), { status: 400, headers: corsHeaders })
      }

      // Probar credenciales
      const tokens = await cookidooLogin(email, password, country)
      const expires = new Date(Date.now() + tokens.expires_in * 1000)
      const lang = COUNTRY_LANG[country] || 'es-ES'

      // Upsert la conexión
      const { error } = await supabase
        .from('cookidoo_connections')
        .upsert({
          household_id: member.household_id,
          email,
          password,
          country,
          language: lang,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expires.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'household_id' })

      if (error) throw error

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- DISCONNECT ---
    if (action === 'disconnect') {
      if (member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Solo el administrador puede desconectar Cookidoo' }), { status: 403, headers: corsHeaders })
      }

      await supabase
        .from('cookidoo_connections')
        .delete()
        .eq('household_id', member.household_id)

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- STATUS ---
    if (action === 'status') {
      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('email, country, created_at')
        .eq('household_id', member.household_id)
        .single()

      return new Response(JSON.stringify({ connected: !!connection, connection }), { headers: corsHeaders })
    }

    // --- SYNC SHOPPING ---
    if (action === 'sync-shopping') {
      const { items } = payload as { items: string[] }
      if (!items?.length) {
        return new Response(JSON.stringify({ error: 'No hay items para sincronizar' }), { status: 400, headers: corsHeaders })
      }

      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('*')
        .eq('household_id', member.household_id)
        .single()

      if (!connection) {
        return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      }

      const token = await getValidToken(supabase, connection)
      const lang = connection.language

      const res = await fetch(`${apiBase(connection.country)}/shopping/${lang}/additional-items/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ itemsValue: items }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Cookidoo sync failed (${res.status}): ${text}`)
      }

      const data = await res.json()
      return new Response(JSON.stringify({ ok: true, synced: data.data?.length ?? 0 }), { headers: corsHeaders })
    }

    // --- GET COLLECTIONS ---
    if (action === 'get-collections') {
      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('*')
        .eq('household_id', member.household_id)
        .single()

      if (!connection) {
        return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      }

      const token = await getValidToken(supabase, connection)
      const lang = connection.language

      const [managedRes, customRes] = await Promise.all([
        fetch(`${apiBase(connection.country)}/organize/${lang}/api/managed-list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.vorwerk.organize.managed-list.mobile+json',
            'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          },
        }),
        fetch(`${apiBase(connection.country)}/organize/${lang}/api/custom-list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.vorwerk.organize.custom-list.mobile+json',
            'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          },
        }),
      ])

      const countRecipes = (chapters: { recipes: unknown[] }[]) =>
        chapters.reduce((sum, ch) => sum + (ch.recipes?.length ?? 0), 0)

      const collections: { id: string; name: string; type: string; recipeCount: number }[] = []

      if (managedRes.ok) {
        const data = await managedRes.json()
        for (const col of data.managedlists ?? []) {
          collections.push({ id: col.id, name: col.title, type: 'managed', recipeCount: countRecipes(col.chapters ?? []) })
        }
      }
      if (customRes.ok) {
        const data = await customRes.json()
        for (const col of data.customlists ?? []) {
          collections.push({ id: col.id, name: col.title, type: 'custom', recipeCount: countRecipes(col.chapters ?? []) })
        }
      }

      // Incluir cuáles están seleccionadas actualmente
      const selectedIds: string[] = (connection.selected_collections ?? []).map((c: { id: string }) => c.id)

      return new Response(JSON.stringify({ collections, selectedIds }), { headers: corsHeaders })
    }

    // --- SAVE COLLECTIONS ---
    if (action === 'save-collections') {
      if (member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Solo el administrador puede cambiar las colecciones' }), { status: 403, headers: corsHeaders })
      }

      const { selected } = payload as { selected: { id: string; name: string; type: string }[] }

      await supabase
        .from('cookidoo_connections')
        .update({ selected_collections: selected, updated_at: new Date().toISOString() })
        .eq('household_id', member.household_id)

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: `Acción desconocida: ${action}` }), { status: 400, headers: corsHeaders })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
