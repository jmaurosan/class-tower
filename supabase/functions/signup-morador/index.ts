import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, corsHeaders, json } from '../_shared/auth.ts'

/**
 * Auto-cadastro de morador.
 *
 * Esta função existe porque as três validações do fluxo de "Primeiro Acesso"
 * (a sala existe / o nome bate com o responsável / ainda não há usuário para
 * a sala) estavam em SignUp.tsx, ou seja, rodando no navegador do próprio
 * candidato. Nada disso viajava junto com a chamada a auth.signUp() — bastava
 * chamar /auth/v1/signup direto para pular todas.
 *
 * Aqui a validação roda no servidor, com service_role, e o `role` é fixado em
 * 'sala' no código. O cliente não tem como influenciá-lo.
 *
 * IMPORTANTE: desligue "Allow new users to sign up" em
 * Authentication > Providers > Email. Enquanto o cadastro público estiver
 * ligado, o endpoint /auth/v1/signup continua acessível e contorna esta função.
 */

const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .split('')
    // remove marcas de acentuacao (faixa combining diacritical marks)
    .filter((c) => c.charCodeAt(0) < 0x0300 || c.charCodeAt(0) > 0x036f)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function tokensSignificativos(nome: string): string[] {
  return normalizar(nome)
    .split(' ')
    .filter((t) => t.length >= 3 && !PARTICULAS.has(t))
}

/**
 * O código anterior aceitava qualquer substring: `responsavel1.includes(nome)`
 * fazia com que o nome "a" casasse com "Ana Silva". Aqui exigimos ou igualdade
 * exata, ou que todos os tokens significativos do nome informado (no mínimo
 * dois) apareçam no nome cadastrado — o que ainda tolera "João Silva" para um
 * cadastro "João da Silva".
 */
function nomesCompativeis(informado: string, cadastrado: string): boolean {
  if (!cadastrado) return false

  const a = normalizar(informado)
  const b = normalizar(cadastrado)
  if (!a || !b) return false
  if (a === b) return true

  const tokensInformados = tokensSignificativos(informado)
  const tokensCadastrados = new Set(tokensSignificativos(cadastrado))

  if (tokensInformados.length < 2) return false

  return tokensInformados.every((t) => tokensCadastrados.has(t))
}

function senhaValida(senha: string): boolean {
  return (
    typeof senha === 'string' &&
    senha.length >= 6 &&
    /[A-Z]/.test(senha) &&
    /\d/.test(senha) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { salaNumero, nomeCompleto, email, senha } = await req.json()

    if (!salaNumero || !nomeCompleto || !email || !senha) {
      return json({ error: 'Todos os campos são obrigatórios.' }, 400)
    }

    if (!senhaValida(senha)) {
      return json({ error: 'A senha não atende aos requisitos de segurança.' }, 400)
    }

    const supabaseAdmin = adminClient()
    const sala = String(salaNumero).trim()
    const emailLimpo = String(email).trim().toLowerCase()

    // 1. A sala existe?
    const { data: salaRow, error: salaError } = await supabaseAdmin
      .from('salas')
      .select('numero, nome, responsavel1, responsavel2')
      .eq('numero', sala)
      .maybeSingle()

    if (salaError) {
      console.error('Erro ao consultar sala:', salaError)
      return json({ error: 'Erro ao verificar a sala. Tente novamente em instantes.' }, 500)
    }

    if (!salaRow) {
      return json({ error: 'Sala não encontrada. Verifique o número informado.' }, 400)
    }

    // 2. O nome corresponde a um dos responsáveis cadastrados pela administração?
    const responsavel1 = salaRow.responsavel1 || salaRow.nome || ''
    const responsavel2 = salaRow.responsavel2 || ''

    const nomeConfere =
      nomesCompativeis(nomeCompleto, responsavel1) ||
      nomesCompativeis(nomeCompleto, responsavel2)

    if (!nomeConfere) {
      return json({
        error:
          `Nome não corresponde aos responsáveis cadastrados para a sala ${sala}. ` +
          `Verifique com a administração se seus dados estão corretos.`,
      }, 403)
    }

    // 3. Já existe usuário para esta sala?
    const { data: perfilExistente } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('sala_numero', sala)
      .maybeSingle()

    if (perfilExistente) {
      return json({
        error:
          `Já existe um usuário cadastrado para a sala ${sala}. ` +
          `Se você esqueceu sua senha, use a opção "Esqueceu sua senha?" na tela de login.`,
      }, 409)
    }

    // 4. Cria a conta. O role é fixo — não vem do cliente.
    const { data: novoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLimpo,
      password: senha,
      email_confirm: true,
      user_metadata: {
        full_name: nomeCompleto,
        name: `${nomeCompleto} (Sala ${sala})`,
        sala_numero: sala,
      },
    })

    if (createError) {
      const msg = createError.message?.includes('already registered')
        ? 'Este e-mail já está cadastrado. Use a opção "Esqueceu sua senha?" na tela de login.'
        : createError.message
      return json({ error: msg }, 400)
    }

    if (!novoUsuario?.user?.id) {
      return json({ error: 'Não foi possível criar a conta.' }, 500)
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: novoUsuario.user.id,
      full_name: nomeCompleto,
      email: emailLimpo,
      role: 'sala',
      sala_numero: sala,
      permissions: {},
      status: 'Ativo',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(novoUsuario.user.id)
      return json({ error: 'Falha ao criar o perfil. Tente novamente.' }, 500)
    }

    return json({ success: true, userId: novoUsuario.user.id })

  } catch (error) {
    console.error('signup-morador error:', error)
    return json({ error: 'Erro ao realizar cadastro. Tente novamente.' }, 500)
  }
})
