# Keep-Alive System - Class Tower

## 📋 Visão Geral

Sistema robusto de keep-alive para manter o banco de dados Supabase ativo, executando automaticamente a cada 5 dias.

## 🏗️ Arquitetura

O sistema possui **3 camadas de redundância**:

### 1. **GitHub Actions** (Principal)
- **Arquivo**: `.github/workflows/keep-alive.yml`
- **Frequência**: A cada 5 dias às 3:00 AM UTC
- **Método**: Executa queries diretas no Supabase via REST API
- **Vantagem**: Gratuito, confiável, execução garantida

### 2. **Vercel Cron Jobs** (Backup)
- **Arquivo**: `vercel.json` + `api/keep-alive.ts`
- **Frequência**: A cada 5 dias às 3:00 AM UTC
- **Método**: Serverless function que faz queries no Supabase
- **Vantagem**: Integrado com o deploy, baixa latência

### 3. **Supabase Edge Function** (Opcional)
- **Arquivo**: `supabase/functions/keep-alive/index.ts`
- **Método**: Pode ser chamada manualmente ou via webhook
- **Vantagem**: Execução direta no ambiente Supabase

## 🚀 Como Funciona

### GitHub Actions
1. Executa automaticamente a cada 5 dias
2. Faz queries simples nas tabelas principais:
   - `profiles`
   - `avisos`
   - `encomendas`
3. Registra logs de sucesso/falha
4. Pode ser executado manualmente via GitHub UI

### Vercel Cron
1. Configurado no `vercel.json`
2. Chama a API `/api/keep-alive` automaticamente
3. Executa queries via REST API do Supabase
4. Protegido contra chamadas não autorizadas

## 📝 Configuração

### Secrets Necessários (GitHub)
No repositório GitHub, configure em **Settings > Secrets and variables > Actions**:

- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

### Variáveis de Ambiente (Vercel)
No painel da Vercel, configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🧪 Testando

### Teste Manual (GitHub Actions)
1. Acesse: `https://github.com/SEU_USUARIO/class-tower/actions`
2. Clique em "Keep Alive - Supabase"
3. Clique em "Run workflow"
4. Selecione a branch `main`
5. Clique em "Run workflow"

### Teste Manual (Vercel)
```bash
curl -X POST https://SEU_PROJETO.vercel.app/api/keep-alive
```

### Teste Manual (Supabase Edge Function)
Primeiro, faça o deploy:
```bash
supabase functions deploy keep-alive
```

Depois teste:
```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/keep-alive \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

## 📊 Monitoramento

### GitHub Actions
- Acesse: `https://github.com/SEU_USUARIO/class-tower/actions`
- Veja o histórico de execuções
- Logs detalhados de cada execução

### Vercel
- Acesse: Dashboard da Vercel > Seu Projeto > Logs
- Filtre por `/api/keep-alive`

## ⚙️ Personalização

### Alterar Frequência
Edite o cron expression nos arquivos:

**A cada 3 dias:**
```yaml
cron: '0 3 */3 * *'
```

**A cada 7 dias:**
```yaml
cron: '0 3 */7 * *'
```

**Semanalmente (toda segunda-feira):**
```yaml
cron: '0 3 * * 1'
```

### Adicionar Mais Tabelas
Edite os arquivos e adicione queries para outras tabelas:

```typescript
const { data: salas } = await supabase
  .from('salas')
  .select('id')
  .limit(1)
```

## 🔒 Segurança

- ✅ GitHub Actions usa secrets criptografados
- ✅ Vercel Cron protegido por headers de autorização
- ✅ Edge Function requer autenticação
- ✅ Apenas queries de leitura (SELECT)
- ✅ Limite de 1 registro por query (performance)

## 📈 Benefícios

1. **Evita Pausas**: Mantém o banco Supabase sempre ativo
2. **Redundância**: 3 métodos independentes
3. **Gratuito**: GitHub Actions e Vercel Cron são gratuitos
4. **Automático**: Zero manutenção manual
5. **Monitorável**: Logs completos de todas as execuções

## 🛠️ Troubleshooting

### GitHub Actions não está executando
- Verifique se os secrets estão configurados
- Confirme que o workflow está habilitado
- Verifique a sintaxe do cron expression

### Vercel Cron não funciona
- Certifique-se de que está no plano Pro (crons são pagos na Vercel)
- Verifique as variáveis de ambiente
- Confira os logs da função

### Queries falhando
- Verifique se as tabelas existem
- Confirme as permissões RLS (Row Level Security)
- Teste as credenciais do Supabase

## 📚 Referências

- [GitHub Actions - Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
