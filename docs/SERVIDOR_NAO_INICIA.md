# 🚨 Solução Rápida - Servidor Não Inicia

## Problema
O servidor `npm run dev` não está iniciando ou está travado.

## ✅ Solução Rápida

### **1. Parar TODOS os processos Node**

Abra o **Gerenciador de Tarefas** (Ctrl + Shift + Esc):

1. Vá na aba **"Detalhes"** ou **"Processos"**
2. Procure por **"node.exe"** ou **"Node.js"**
3. Clique com botão direito > **"Finalizar tarefa"** em TODOS
4. Procure também por **"npm"** e finalize

### **2. Limpar Cache do NPM**

```bash
npm cache clean --force
```

### **3. Deletar node_modules e reinstalar**

```bash
# Deletar node_modules
Remove-Item -Recurse -Force node_modules

# Deletar package-lock.json
Remove-Item package-lock.json

# Reinstalar dependências
npm install
```

### **4. Iniciar o servidor novamente**

```bash
npm run dev
```

---

## 🔍 Alternativa Mais Rápida

Se o problema persistir, tente:

### **Opção 1: Usar outra porta**

Edite `vite.config.ts` e mude a porta:

```typescript
export default defineConfig({
  server: {
    port: 5174, // Mudou de 5173 para 5174
  },
  // ... resto da config
})
```

Depois:
```bash
npm run dev
```

Acesse: `http://localhost:5174`

### **Opção 2: Matar processo na porta 5173**

```bash
# Ver o que está usando a porta 5173
netstat -ano | findstr :5173

# Você verá algo como:
# TCP    0.0.0.0:5173    0.0.0.0:0    LISTENING    12345

# Matar o processo (substitua 12345 pelo PID que apareceu)
taskkill /PID 12345 /F
```

Depois:
```bash
npm run dev
```

---

## 📋 Checklist de Troubleshooting

- [ ] Parei todos os processos Node no Gerenciador de Tarefas
- [ ] Limpei o cache do NPM
- [ ] Deletei node_modules e reinstalei
- [ ] Tentei usar outra porta
- [ ] Matei o processo na porta 5173
- [ ] Reiniciei o computador (última opção)

---

## 🆘 Se Nada Funcionar

1. **Reinicie o computador**
2. **Verifique se há antivírus bloqueando**
3. **Teste em outro terminal** (CMD em vez de PowerShell)

---

## ✅ Quando Funcionar

Você verá algo como:

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Aí é só acessar `http://localhost:5173` no navegador!

---

**Tente os passos acima e me avise o resultado!** 🚀
