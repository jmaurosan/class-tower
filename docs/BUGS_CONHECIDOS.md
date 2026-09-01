# 🔍 Bugs Conhecidos e Verificações - Class Tower

## 🐛 Bugs Conhecidos (Antes dos Testes)

### 1. **Possíveis Problemas de RLS (Row Level Security)**

**Descrição:** Condôminos podem estar vendo encomendas de outras salas.

**Como Verificar:**
1. Login como `condomino1@classtower.com.br` (Sala 101)
2. Acessar "Encomendas"
3. Verificar se aparecem apenas encomendas da sala 101

**Solução (se necessário):**
```sql
-- Verificar políticas RLS na tabela encomendas
SELECT * FROM pg_policies WHERE tablename = 'encomendas';
```

---

### 2. **Sincronização Offline Pode Não Estar Funcionando**

**Descrição:** Sistema pode não estar salvando ações offline na fila.

**Como Verificar:**
1. Ativar modo offline (DevTools > Network > Offline)
2. Tentar criar um aviso
3. Verificar se aparece indicador de "pendente de sincronização"
4. Voltar online
5. Verificar se sincronizou automaticamente

**Arquivos Relacionados:**
- `src/components/SyncProvider.tsx`
- `src/services/offlineService.ts`

---

### 3. **Validação de Senha Pode Estar Fraca**

**Descrição:** Checklist de senha pode não estar validando corretamente.

**Como Verificar:**
1. Criar novo usuário
2. Tentar senha fraca: `123456`
3. Verificar se o sistema bloqueia

**Arquivo:** `src/utils/validators.ts`

---

### 4. **Formatação de Datas Pode Estar Incorreta**

**Descrição:** Datas podem aparecer em formato americano (MM/DD/YYYY) em vez de brasileiro (DD/MM/YYYY).

**Como Verificar:**
1. Verificar avisos e encomendas
2. Confirmar formato das datas

**Solução (se necessário):**
```typescript
// Usar formatação brasileira
new Date().toLocaleDateString('pt-BR')
```

---

### 5. **Tema Escuro Pode Ter Problemas de Contraste**

**Descrição:** Alguns textos podem ficar ilegíveis no modo escuro.

**Como Verificar:**
1. Ativar modo escuro
2. Navegar por todas as páginas
3. Verificar legibilidade de todos os textos

---

### 6. **Menu Mobile Pode Não Fechar Automaticamente**

**Descrição:** No mobile, ao clicar em um item do menu, o menu pode não fechar.

**Como Verificar:**
1. DevTools > Modo responsivo (iPhone)
2. Abrir menu hamburger
3. Clicar em uma página
4. Verificar se o menu fecha

---

### 7. **Encomendas Retiradas Podem Não Mostrar Data/Hora**

**Descrição:** Encomendas com status "retirada" podem não exibir quando foram retiradas.

**Como Verificar:**
1. Acessar "Encomendas"
2. Filtrar por "Retiradas"
3. Verificar se mostra data/hora e quem retirou

---

### 8. **Dashboard Pode Estar Vazio**

**Descrição:** Estatísticas do dashboard podem não estar calculando corretamente.

**Como Verificar:**
1. Acessar Dashboard
2. Verificar se os números fazem sentido:
   - Total de usuários: deve ser 4+
   - Encomendas pendentes: deve ser 3
   - Avisos ativos: deve ser 5

---

### 9. **Logout Pode Não Limpar Sessão Completamente**

**Descrição:** Após logout, dados podem permanecer em cache.

**Como Verificar:**
1. Fazer login
2. Navegar pelo sistema
3. Fazer logout
4. Verificar se volta para tela de login
5. Tentar voltar (botão back do navegador)
6. Verificar se redireciona para login

---

### 10. **Notificações de Sucesso/Erro Podem Não Aparecer**

**Descrição:** Ao criar/editar/excluir, mensagens de feedback podem não aparecer.

**Como Verificar:**
1. Criar um novo aviso
2. Verificar se aparece mensagem verde de sucesso
3. Tentar criar com erro (campo vazio)
4. Verificar se aparece mensagem vermelha de erro

---

## 🔧 Verificações Técnicas

### Verificar Console do Navegador
```
F12 > Console
```
**Não deve ter:**
- ❌ Erros em vermelho
- ❌ Warnings críticos
- ❌ Failed to fetch

**Pode ter:**
- ⚠️ Warnings de desenvolvimento (normal)

---

### Verificar Network (Requisições)
```
F12 > Network
```
**Verificar:**
- ✅ Requisições ao Supabase retornam 200 OK
- ✅ Não há requisições falhando (4xx, 5xx)
- ✅ Tempo de resposta < 1s

---

### Verificar Application Storage
```
F12 > Application > Local Storage
```
**Verificar:**
- ✅ `supabase.auth.token` existe (quando logado)
- ✅ Preferência de tema salva
- ✅ Fila de sincronização offline (se houver)

---

## 📋 Checklist de Verificação Rápida

Antes de iniciar os testes completos, faça esta verificação rápida:

### Backend (Supabase)
- [ ] Banco de dados está online
- [ ] Tabelas principais existem (profiles, avisos, encomendas)
- [ ] Dados de teste foram criados
- [ ] RLS (Row Level Security) está configurado
- [ ] Keep-Alive está funcionando

### Frontend (Aplicação)
- [ ] `npm run dev` está rodando sem erros
- [ ] Aplicação abre em `http://localhost:5173`
- [ ] Tela de login aparece
- [ ] Não há erros no console
- [ ] Variáveis de ambiente estão configuradas

### Autenticação
- [ ] Login com admin funciona
- [ ] Login com atendente funciona
- [ ] Login com condômino funciona
- [ ] Logout funciona
- [ ] Sessão persiste ao recarregar

### Dados
- [ ] 4+ usuários aparecem em "Usuários"
- [ ] 5 avisos aparecem em "Avisos"
- [ ] 5 encomendas aparecem em "Encomendas"
- [ ] Dashboard mostra estatísticas

---

## 🚨 Problemas Críticos (Bloqueia Testes)

Se encontrar algum desses problemas, **PARE** e corrija antes de continuar:

1. ❌ **Não consegue fazer login**
2. ❌ **Página em branco após login**
3. ❌ **Erros 500 ao acessar qualquer página**
4. ❌ **Banco de dados inacessível**
5. ❌ **Aplicação não inicia (`npm run dev` falha)**

---

## 📝 Template de Relatório de Bug

Ao encontrar um bug, use este template:

```markdown
## Bug #X: [Título Descritivo]

**Severidade:** 🔴 Crítico / 🟡 Alto / 🟢 Médio / 🔵 Baixo

**Página/Componente:** [Nome da página]

**Descrição:**
[Descreva o que aconteceu]

**Passos para Reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Atual:**
[O que está acontecendo]

**Screenshots:**
[Se aplicável]

**Console Errors:**
```
[Cole erros do console aqui]
```

**Ambiente:**
- Navegador: [Chrome/Firefox/Safari]
- Versão: [XX.X]
- SO: [Windows/Mac/Linux]
- Modo: [Desktop/Mobile]
```

---

## ✅ Após Corrigir Bugs

1. [ ] Atualizar este documento
2. [ ] Marcar bug como resolvido
3. [ ] Re-testar o fluxo afetado
4. [ ] Commit e push das correções
5. [ ] Atualizar changelog se necessário
