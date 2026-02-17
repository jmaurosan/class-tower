# Ler variáveis do .env
$envContent = Get-Content .env -Raw
if ($envContent -match "VITE_SUPABASE_URL=(.*)") { $url = $matches[1].Trim() }
if ($envContent -match "VITE_SUPABASE_ANON_KEY=(.*)") { $key = $matches[1].Trim() }

if (-not $url -or -not $key) {
    Write-Host "Erro: Credenciais não encontradas no .env"
    exit
}

Write-Host "URL: $url"
# Write-Host "Key: $key" # Não mostrar chave por segurança

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# 1. Buscar usuário Fulano
Write-Host "Buscando usuário Fulano..."
$searchUrl = "$url/rest/v1/profiles?full_name=ilike.*Fulano*&select=*"
$users = Invoke-RestMethod -Uri $searchUrl -Headers $headers -Method Get

if ($users.Count -eq 0) {
    Write-Host "Nenhum usuário encontrado."
    exit
}

$user = $users[0]
if ($users -is [array]) { $user = $users[0] } else { $user = $users }

Write-Host "Usuário encontrado: $($user.full_name) (ID: $($user.id))"
Write-Host "Role Atual: '$($user.role)'"
Write-Host "Sala Atual: '$($user.sala_numero)'"

$needFix = $false
$updates = @{}

# Verificação de Role
if ($user.role -match "Morador" -or $user.role -match "MORADOR") {
    Write-Host "DETECTADO ROLE INCORRETA!"
    $updates["role"] = "sala"
    $needFix = $true
}

# Verificação de Sala
if ($user.sala_numero -eq $null -or $user.sala_numero -match "Morador" -or $user.sala_numero -eq "") {
    Write-Host "DETECTADO SALA INCORRETA OU VAZIA!"
    $updates["sala_numero"] = "0101" # Forçando valor solicitado
    $needFix = $true
}

if ($needFix) {
    Write-Host "Aplicando correções..."
    $body = $updates | ConvertTo-Json
    $patchUrl = "$url/rest/v1/profiles?id=eq.$($user.id)"
    
    try {
        $result = Invoke-RestMethod -Uri $patchUrl -Headers $headers -Method Patch -Body $body
        Write-Host "✅ SUCESSO! Dados corrigidos:"
        Write-Host "Role: $($result.role)"
        Write-Host "Sala: $($result.sala_numero)"
    } catch {
        Write-Host "ERRO AO ATUALIZAR: $_"
        Write-Host $_.Exception.Response
    }
} else {
    Write-Host "Os dados parecem corretos. Nenhuma alteração necessária."
    # Se os dados estão corretos ("sala" e "0101"), então o problema é puramente CACHE FRONTEND.
}
