# 🔒 SEGURANÇA DAS VARIÁVEIS DE AMBIENTE

## ✅ **É SEGURO usar a ANON KEY no frontend?**

**SIM!** A `VITE_SUPABASE_ANON_KEY` é **projetada** para ser usada no frontend.

---

## 🔑 **TIPOS DE CHAVES DO SUPABASE:**

### **1. ANON KEY (Pública) - ✅ SEGURA**

```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Características:**
- ✅ **Pode** ser exposta no frontend
- ✅ **Pode** ser enviada para o GitHub (mas não recomendamos)
- ✅ Tem **permissões limitadas** (Row Level Security - RLS)
- ✅ Só pode fazer o que você **configurou** nas políticas RLS
- ✅ **NÃO** dá acesso administrativo ao Supabase

**Exemplo de uso:**
- Login de usuários
- Buscar dados públicos
- Inserir dados (se permitido pelo RLS)

---

### **2. SERVICE ROLE KEY (Privada) - ❌ NUNCA EXPOR**

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Características:**
- ❌ **NUNCA** deve ser exposta no frontend
- ❌ **NUNCA** deve ser enviada para o GitHub
- ❌ Dá **acesso total** ao banco de dados
- ❌ **Ignora** todas as políticas RLS
- ✅ Só deve ser usada no **backend/servidor**

---

## 🛡️ **PROTEÇÃO IMPLEMENTADA:**

### **1. .gitignore**

O arquivo `.env` está no `.gitignore`, então:
- ✅ **NÃO** será enviado para o GitHub
- ✅ Fica apenas no seu computador local
- ✅ Cada desenvolvedor tem seu próprio `.env`

### **2. .env.example**

Criamos um arquivo `.env.example` que:
- ✅ **Pode** ser enviado para o GitHub
- ✅ Serve como **modelo** para outros desenvolvedores
- ✅ **NÃO** contém chaves reais

### **3. Row Level Security (RLS)**

No Supabase, você deve configurar políticas RLS que:
- ✅ Limitam o que a ANON KEY pode fazer
- ✅ Protegem dados sensíveis
- ✅ Garantem que usuários só vejam seus próprios dados

---

## 📋 **EXEMPLO DE POLÍTICAS RLS:**

### **Política: Usuários só veem suas próprias encomendas**

```sql
CREATE POLICY "Users can only see their own packages"
ON public.encomendas
FOR SELECT
USING (
  sala_numero = (
    SELECT sala_numero 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);
```

### **Política: Apenas admins podem criar usuários**

```sql
CREATE POLICY "Only admins can create users"
ON public.profiles
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

---

## 🚀 **BOAS PRÁTICAS:**

### **✅ FAÇA:**

1. ✅ Use `.env` para variáveis de ambiente
2. ✅ Adicione `.env` ao `.gitignore`
3. ✅ Crie `.env.example` como modelo
4. ✅ Configure políticas RLS no Supabase
5. ✅ Use ANON KEY no frontend
6. ✅ Use SERVICE ROLE KEY apenas no backend

### **❌ NÃO FAÇA:**

1. ❌ Enviar `.env` para o GitHub
2. ❌ Expor SERVICE ROLE KEY no frontend
3. ❌ Confiar apenas na ANON KEY para segurança
4. ❌ Ignorar políticas RLS
5. ❌ Hardcodar chaves no código

---

## 🔍 **COMO VERIFICAR SE ESTÁ SEGURO:**

### **1. Verificar .gitignore:**

```bash
git status
```

Se aparecer `.env` na lista, **PARE** e adicione ao `.gitignore`!

### **2. Verificar políticas RLS:**

No Supabase Dashboard:
1. Vá em **Database > Tables**
2. Clique em cada tabela
3. Vá em **RLS Policies**
4. Verifique se há políticas configuradas

### **3. Testar permissões:**

Tente acessar dados de outro usuário:
- Se conseguir → ❌ RLS não está configurado corretamente
- Se NÃO conseguir → ✅ RLS está funcionando!

---

## 📚 **REFERÊNCIAS:**

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Environment Variables Best Practices](https://supabase.com/docs/guides/getting-started/tutorials/with-react#project-setup)

---

## 🎯 **RESUMO:**

| Chave | Onde usar | Seguro expor? | Acesso |
|-------|-----------|---------------|--------|
| **ANON KEY** | Frontend | ✅ Sim (mas proteja com .gitignore) | Limitado pelo RLS |
| **SERVICE ROLE KEY** | Backend | ❌ NUNCA | Total (ignora RLS) |

---

**Seu projeto está seguro!** 🔒

O `.env` está protegido pelo `.gitignore` e a ANON KEY tem permissões limitadas pelo RLS.
