<#
.SYNOPSIS
    Faz o deploy das Edge Functions do Class Tower na ordem correta.

.DESCRIPTION
    A ordem importa. A migration de hardening remove o acesso anônimo da tabela
    `salas`, e a tela de Primeiro Acesso passa a depender da função
    `signup-morador`. Se a migration for aplicada antes do deploy, o cadastro
    de morador fica quebrado no intervalo.

    Sequência recomendada:
      1. Este script (deploy das funções)
      2. Migration 20260831120000_hardening_seguranca.sql
      3. Desligar "Allow new users to sign up" no painel do Supabase

.EXAMPLE
    ./scripts/deploy-funcoes.ps1
    ./scripts/deploy-funcoes.ps1 -ProjectRef xddmtbuuqairndciiepn
#>

[CmdletBinding()]
param(
    [string]$ProjectRef = 'xddmtbuuqairndciiepn',
    [switch]$PularVerificacaoDeSecrets
)

$ErrorActionPreference = 'Stop'

$FUNCOES = @(
    @{ Nome = 'signup-morador'; Descricao = 'Auto-cadastro de morador (valida sala e responsável no servidor)' },
    @{ Nome = 'create-user';    Descricao = 'Criação de usuário (exige admin autenticado)' },
    @{ Nome = 'delete-user';    Descricao = 'Exclusão de usuário (exige admin autenticado)' },
    @{ Nome = 'onesignal-push'; Descricao = 'Envio de push (exige equipe autenticada)' }
)

$SECRETS_OBRIGATORIOS = @('ONESIGNAL_APP_ID', 'ONESIGNAL_REST_API_KEY')

function Escrever-Titulo($texto) {
    Write-Host ''
    Write-Host "== $texto" -ForegroundColor Cyan
}

# --- 1. Pré-requisitos ------------------------------------------------------

Escrever-Titulo 'Verificando pré-requisitos'

# O CLI pode estar instalado globalmente ou disponível apenas via npx.
# Nesta máquina não está no PATH, então o caminho normal é o npx.
$cliGlobal = Get-Command supabase -ErrorAction SilentlyContinue
if ($cliGlobal) {
    $script:SbExe = 'supabase'
    $script:SbArgsBase = @()
    Write-Host "Supabase CLI (global): $($cliGlobal.Source)" -ForegroundColor Green
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    $script:SbExe = 'npx'
    $script:SbArgsBase = @('--yes', 'supabase')
    Write-Host 'Supabase CLI: via npx (não está no PATH)' -ForegroundColor Green
} else {
    Write-Host 'Supabase CLI não encontrado, e npx também não.' -ForegroundColor Red
    Write-Host 'Instale com:  npm install -g supabase' -ForegroundColor Yellow
    exit 1
}

function Invoke-Supabase {
    & $script:SbExe @($script:SbArgsBase + $args)
}

$raiz = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $raiz 'supabase/functions/_shared/auth.ts'))) {
    Write-Host "Não encontrei supabase/functions/_shared/auth.ts a partir de $raiz." -ForegroundColor Red
    Write-Host 'Rode este script de dentro do repositório.' -ForegroundColor Yellow
    exit 1
}
Set-Location $raiz
Write-Host "Repositório: $raiz" -ForegroundColor Green

# --- 2. Secrets -------------------------------------------------------------

if (-not $PularVerificacaoDeSecrets) {
    Escrever-Titulo 'Verificando secrets das funções'

    $saidaSecrets = Invoke-Supabase secrets list --project-ref $ProjectRef 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Falha ao listar secrets. Você está autenticado?' -ForegroundColor Red
        Write-Host '  npx supabase login' -ForegroundColor Yellow
        Write-Host $saidaSecrets
        exit 1
    }

    $faltando = @()
    foreach ($secret in $SECRETS_OBRIGATORIOS) {
        if ($saidaSecrets -match [regex]::Escape($secret)) {
            Write-Host "  OK       $secret" -ForegroundColor Green
        } else {
            Write-Host "  FALTANDO $secret" -ForegroundColor Red
            $faltando += $secret
        }
    }

    if ($faltando.Count -gt 0) {
        Write-Host ''
        Write-Host 'Configure os secrets ausentes antes do deploy:' -ForegroundColor Yellow
        foreach ($s in $faltando) {
            Write-Host "  npx supabase secrets set $s=<valor> --project-ref $ProjectRef" -ForegroundColor Yellow
        }
        Write-Host ''
        Write-Host 'Sem eles, a função onesignal-push responde 500 e as notificações param.' -ForegroundColor Yellow
        exit 1
    }

    # FUNCTION_SECRET era a única proteção das funções create-user/delete-user,
    # e o frontend nunca enviava o header correspondente. A autorização agora é
    # feita pelo JWT do chamador, então o secret deixou de ter função.
    if ($saidaSecrets -match 'FUNCTION_SECRET') {
        Write-Host ''
        Write-Host '  AVISO  FUNCTION_SECRET ainda está configurado e não é mais usado.' -ForegroundColor DarkYellow
        Write-Host "         Remova com: npx supabase secrets unset FUNCTION_SECRET --project-ref $ProjectRef" -ForegroundColor DarkYellow
    }
}

# --- 3. Deploy --------------------------------------------------------------

Escrever-Titulo "Deploy das Edge Functions (projeto $ProjectRef)"

$falhas = @()
foreach ($f in $FUNCOES) {
    Write-Host ''
    Write-Host "-> $($f.Nome)" -ForegroundColor White
    Write-Host "   $($f.Descricao)" -ForegroundColor DarkGray

    # verify_jwt fica LIGADO em todas. signup-morador é chamada por visitante
    # não logado, mas o supabase-js envia a anon key como Bearer, o que satisfaz
    # a verificação. A autorização de verdade é feita dentro da função.
    Invoke-Supabase functions deploy $f.Nome --project-ref $ProjectRef

    if ($LASTEXITCODE -ne 0) {
        Write-Host "   FALHOU" -ForegroundColor Red
        $falhas += $f.Nome
    } else {
        Write-Host "   OK" -ForegroundColor Green
    }
}

# --- 4. Conferir verify_jwt -------------------------------------------------

Escrever-Titulo 'Conferindo verify_jwt'

# As funções estavam publicadas com verify_jwt = false, o que faz o gateway
# aceitar requisição sem nenhum header Authorization. O supabase/config.toml
# fixa o valor, mas vale confirmar que o deploy o aplicou.

$listaFn = Invoke-Supabase functions list --project-ref $ProjectRef 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host $listaFn
    Write-Host ''
    Write-Host 'Confirme que a coluna VERIFY JWT está como `true` nas quatro funções.' -ForegroundColor Yellow
    Write-Host 'Se alguma estiver `false`, o gateway aceita chamadas sem autenticação.' -ForegroundColor Yellow
} else {
    Write-Host 'Não consegui listar as funções para conferir verify_jwt.' -ForegroundColor DarkYellow
}

# --- 5. Resultado -----------------------------------------------------------

Escrever-Titulo 'Resultado'

if ($falhas.Count -gt 0) {
    Write-Host "Funções que falharam: $($falhas -join ', ')" -ForegroundColor Red
    Write-Host 'create-user continua exposta enquanto o deploy não concluir.' -ForegroundColor Red
    exit 1
}

Write-Host 'Todas as funções foram publicadas.' -ForegroundColor Green
Write-Host ''
Write-Host 'Próximos passos:' -ForegroundColor Cyan
Write-Host '  1. Aplique supabase/migrations/20260831120000_hardening_seguranca.sql no SQL Editor.'
Write-Host '  2. Desligue "Allow new users to sign up" em Authentication > Providers > Email.'
Write-Host '  3. Troque as senhas que estavam versionadas (a de admin inclusive).'
Write-Host '  4. Siga docs/RUNBOOK_SEGURANCA.md para validar.'
