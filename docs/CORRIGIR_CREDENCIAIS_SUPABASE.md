# 🔧 COMO PEGAR AS CREDENCIAIS CORRETAS DO SUPABASE

## ⚠️ PROBLEMA IDENTIFICADO:

A URL e a ANON KEY no seu `.env` são de **projetos diferentes**!

- URL: `yktthhpupvegkwsqhwtv`
- Key: `xddmtbuuqairndciiepn` ← DIFERENTE!

Isso causa o erro: **"Invalid API key"**

---

## ✅ SOLUÇÃO (PASSO A PASSO):

### **1. Acesse o Supabase Dashboard:**

Abra este link no navegador:
```
https://supabase.com/dashboard
```

### **2. Identifique o projeto correto:**

Você tem 2 projetos:
- **CRMClassTower** (ID: `yktthhpupvegkwsqhwtv`)
- **Outro projeto** (ID: `xddmtbuuqairndciiepn`)

**Qual projeto você está usando para o Class Tower?**

### **3. Abra as configurações do projeto correto:**

Clique no projeto **CRMClassTower** e depois em:
```
Settings (⚙️) → API
```

Ou acesse direto:
```
https://supabase.com/dashboard/project/yktthhpupvegkwsqhwtv/settings/api
```

### **4. Copie as credenciais:**

Na página de API, você verá:

**Project URL:**
```
https://yktthhpupvegkwsqhwtv.supabase.co
```

**anon public (API Key):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

### **5. Cole no arquivo .env:**

Abra o arquivo `.env` e substitua:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://yktthhpupvegkwsqhwtv.supabase.co
VITE_SUPABASE_ANON_KEY=COLE_AQUI_A_CHAVE_ANON_DO_PROJETO_yktthhpupvegkwsqhwtv
```

### **6. Salve e reinicie o servidor:**

1. Salve o arquivo `.env`
2. Pare o servidor (Ctrl + C)
3. Execute novamente:
```bash
npm run dev
```

---

## 🔍 COMO SABER SE ESTÁ CORRETO:

A chave ANON deve começar com:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlr...
```

Note que no meio da chave deve ter: **"ref":"ykt..."** (começo do ID do projeto)

---

## 📋 VERIFICAÇÃO RÁPIDA:

Execute este comando no terminal para decodificar a chave:

```bash
echo "SUA_CHAVE_ANON_AQUI" | cut -d'.' -f2 | base64 -d
```

Deve aparecer algo como:
```json
{"iss":"supabase","ref":"yktthhpupvegkwsqhwtv",...}
```

Se aparecer **"ref":"xddmtbuuqairndciiepn"**, a chave está ERRADA!

---

## 🎯 RESUMO:

1. ✅ Acesse: https://supabase.com/dashboard/project/yktthhpupvegkwsqhwtv/settings/api
2. ✅ Copie a **Project URL**
3. ✅ Copie a **anon public key**
4. ✅ Cole no `.env`
5. ✅ Salve e reinicie o servidor

---

**Depois de fazer isso, teste novamente o login!**
