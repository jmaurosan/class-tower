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
