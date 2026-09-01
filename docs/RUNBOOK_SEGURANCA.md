# Runbook — aplicação do hardening de segurança

Ordem de execução e como validar. **A ordem importa**: a migration remove o
acesso anônimo à tabela `salas`, e o Primeiro Acesso passa a depender da Edge
Function `signup-morador`. Aplicar a migration antes do deploy deixa o cadastro
de morador quebrado no intervalo.

Projeto: `xddmtbuuqairndciiepn` (ClassTower)

---

## 1. Deploy das Edge Functions

```bash
pwsh ./scripts/deploy-funcoes.ps1
```

O script confere o CLI, valida os secrets do OneSignal e publica as quatro
funções na ordem certa. Se alguma falhar, **pare aqui** — não aplique a
migration.

---

## 2. Aplicar a migration

Abra o SQL Editor do Supabase e execute, na íntegra:

`supabase/migrations/20260831120000_hardening_seguranca.sql`

Se algo der errado, o rollback devolve o banco a um estado funcional (porém
inseguro) enquanto você investiga:

`supabase/migrations/20260831120001_hardening_rollback.sql`

### Verificação

```sql
-- Nenhuma linha deve retornar: anon não deve ter acesso a tabela nenhuma.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public';

-- Nenhuma policy deve permitir leitura para os roles public/anon.
select tablename, policyname, roles::text, qual
from pg_policies
where schemaname = 'public' and roles::text ~ '(anon|public)';

-- O trigger não pode mais aceitar `role` vindo do cliente.
select pg_get_functiondef(oid) from pg_proc
where proname = 'handle_new_user' and pronamespace = 'public'::regnamespace;
```

---

## 3. Desligar o cadastro público

**Authentication → Providers → Email → "Allow new users to sign up" → OFF**

Enquanto isso estiver ligado, o endpoint `/auth/v1/signup` continua aceitando
chamadas diretas e contorna a `signup-morador`. O trigger blindado impede a
escalação para admin, mas o cadastro sem validação de sala continua possível.

Na mesma tela, ligue **"Leaked password protection"** (o advisor do Supabase
aponta que está desabilitada).

---

## 4. Trocar as senhas versionadas

As senhas estavam em texto puro no `docs/TESTES.md` e continuam no histórico do
Git. Troque todas, começando pela conta de administrador:

- `mauromonit@gmail.com` (admin)
- `atendente@classtower.com.br`
- `condomino1@classtower.com.br`
- `condomino2@classtower.com.br`

---

## 5. Deploy do frontend

```bash
npm run build
```

O Vercel publica automaticamente no push. Confirme que o build local passa antes.

---

## 6. Validação funcional

Depois de tudo no ar, confirme cada item:

### Cadastro de morador
- [ ] Primeiro Acesso com sala e nome corretos → cria a conta
- [ ] Primeiro Acesso com nome que não bate → recusa com mensagem clara
- [ ] Primeiro Acesso com sala inexistente → recusa
- [ ] Sala que já tem usuário → recusa

### Escalação de privilégio (deve FALHAR)
- [ ] `POST /auth/v1/signup` direto com `data: {"role":"admin"}` → conta não é criada (cadastro público desligado); se criada por outro caminho, o perfil nasce como `sala`
- [ ] Logado como morador, `PATCH /rest/v1/profiles?id=eq.<meu-id>` com `{"role":"admin"}` → o papel **não** muda
- [ ] Logado como morador, chamar `create-user` → 403

### Isolamento por unidade
- [ ] Morador da sala 101 vê apenas as encomendas da 101
- [ ] Morador vê avisos gerais e os da própria sala, não os de outra
- [ ] Morador não consegue alterar nem apagar salas
- [ ] Sem login, `GET /rest/v1/salas` e `GET /rest/v1/avisos` retornam vazio

### Funcionamento normal
- [ ] Admin vê todos os módulos e todos os usuários
- [ ] Admin cria e exclui usuário pela tela de Usuários
- [ ] Atendente registra encomenda e o push chega ao morador
- [ ] Botão de pânico publica o aviso crítico (estava quebrado: gravava o nome
      do usuário numa coluna `uuid`)
- [ ] Logs de auditoria abrem para admin e não para os demais

---

## Rollback

Se precisar reverter tudo:

1. Execute `supabase/migrations/20260831120001_hardening_rollback.sql`
2. Religue "Allow new users to sign up"
3. `git revert` do commit do frontend

O rollback devolve o banco ao estado **funcional e inseguro** anterior. É uma
medida temporária para ganhar tempo de investigação, não um destino.

---

# Fila de notificações (outbox)

Substitui o disparo fire-and-forget que saía do navegador do porteiro. A
notificação passa a nascer junto com a encomenda, e um worker entrega com
retentativa.

**A ordem também importa aqui**: a migration cria um agendamento que chama a
Edge Function. Suba a função antes.

## 1. Deploy da função

```bash
pwsh ./scripts/deploy-funcoes.ps1
```

Já inclui a `processar-notificacoes`.

## 2. Guardar a service_role key no Vault

O cron precisa dela para chamar a função. Uma vez só, no SQL Editor:

```sql
select vault.create_secret(
  '<SUA_SERVICE_ROLE_KEY>',
  'service_role_key',
  'Usada pelo cron para chamar a Edge Function de notificações'
);
```

A chave fica criptografada — nunca em texto puro na definição do job.

## 3. Aplicar a migration

`supabase/migrations/20260901100000_fila_notificacoes.sql`

Habilita `pg_cron` e `pg_net`, cria a fila, o trigger e o agendamento de um
minuto.

## 4. Configurar o OneSignal

Sem `ONESIGNAL_APP_ID` e `ONESIGNAL_REST_API_KEY` a função devolve 500 e
**preserva a fila** — de propósito, para não gastar as tentativas de cada
notificação até todas irem para `falha`. Assim que as chaves forem
configuradas, o acúmulo é entregue sozinho.

## 5. Verificação

```sql
-- O agendamento existe e está ativo?
select jobname, schedule, active from cron.job where jobname = 'processar-notificacoes';

-- Estado da fila
select status, count(*), max(created_at) from public.notificacoes_fila group by status;

-- As últimas execuções do cron deram certo?
select status, return_message, start_time
from cron.job_run_details
where jobname = 'processar-notificacoes'
order by start_time desc limit 10;
```

Teste de ponta a ponta: registre uma encomenda para uma sala que tenha morador
cadastrado e acompanhe a linha correspondente sair de `pendente` para
`enviado` em até um minuto.

## Diagnóstico

| Sintoma | Onde olhar |
|---|---|
| Fila cresce, nada sai | `cron.job_run_details`; a chave está no Vault? |
| Tudo em `falha` | coluna `ultimo_erro`; normalmente chave do OneSignal |
| `enviado` com `destinatarios = 0` | a unidade não tem morador cadastrado — não é erro |
| Morador não recebeu, mas consta `enviado` | limitação do web push: no iPhone exige o PWA instalado na tela de início |

Essa última linha é o motivo de considerar WhatsApp como canal principal. A
troca mexe apenas na função `entregar` da Edge Function — fila, trigger e
agendamento continuam iguais.

## O botão de pânico não passa pela fila

Continua chamando `onesignal-push` diretamente. A fila roda a cada minuto, e
um minuto de atraso num alerta de emergência é inaceitável. Para o SOS, a
entrega imediata vale mais que a garantia de retentativa.
