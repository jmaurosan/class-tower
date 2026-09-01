import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export interface Caller {
  id: string
  email: string | null
  role: string
  status: string | null
  sala_numero: string | null
}

/**
 * Identifica quem está chamando a função a partir do JWT do header
 * Authorization. Devolve null se não houver token válido.
 *
 * O `role` vem SEMPRE da tabela profiles, nunca do JWT ou do corpo da
 * requisição — user_metadata é controlado pelo cliente e não serve para
 * decisão de autorização.
 */
export async function getCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')
  const admin = adminClient()

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) return null

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, email, role, status, sala_numero')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError || !profile) return null

  return {
    id: profile.id,
    email: profile.email ?? userData.user.email ?? null,
    role: String(profile.role ?? 'sala').toLowerCase(),
    status: profile.status ?? null,
    sala_numero: profile.sala_numero ?? null,
  }
}

export function isAdmin(caller: Caller | null): boolean {
  return !!caller && caller.status !== 'Bloqueado' && caller.role.includes('admin')
}

export function isStaff(caller: Caller | null): boolean {
  return (
    !!caller &&
    caller.status !== 'Bloqueado' &&
    (caller.role.includes('admin') ||
      caller.role.includes('atendente') ||
      caller.role.includes('colaborador'))
  )
}

/**
 * Guarda de rota: devolve o caller se for admin, ou uma Response de erro
 * pronta para ser retornada pela função.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ caller: Caller } | { error: Response }> {
  const caller = await getCaller(req)
  if (!caller) {
    return { error: json({ error: 'Não autenticado' }, 401) }
  }
  if (!isAdmin(caller)) {
    return { error: json({ error: 'Acesso restrito a administradores' }, 403) }
  }
  return { caller }
}

export async function requireStaff(
  req: Request,
): Promise<{ caller: Caller } | { error: Response }> {
  const caller = await getCaller(req)
  if (!caller) {
    return { error: json({ error: 'Não autenticado' }, 401) }
  }
  if (!isStaff(caller)) {
    return { error: json({ error: 'Acesso restrito à equipe' }, 403) }
  }
  return { caller }
}
