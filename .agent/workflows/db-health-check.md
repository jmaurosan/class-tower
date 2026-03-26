---
description: Como realizar testes de integridade e saúde no Banco de Dados (Supabase)
---

# Fluxo de Verificação de Banco de Dados (DB Health Check)

Este guia descreve como validar a integridade dos dados e a conectividade com o Supabase utilizando ferramentas locais e o TestSprite.

## 1. Verificação Rápida via Script Node.js
O projeto possui scripts de diagnóstico que validam a conectividade e a presença de dados em tabelas críticas.

// turbo
**Executar diagnóstico básico:**
```bash
node check_db.mjs
```

**Executar diagnóstico avançado (Verificação de Tabelas Adicionais):**
```bash
node check_db_v2.mjs
```

## 2. Testes de Backend via TestSprite (Automático)
O TestSprite pode ser configurado para testar endpoints de backend e integridade de dados.

**Passos para ativar:**
1. Solicite ao assistente: "ativar testes de backend no TestSprite".
2. O assistente executará o `bootstrap` com o tipo `backend`.
3. Será gerado um `backend_test_plan.json`.
4. A execução validará se as tabelas e RPCs estão respondendo corretamente.

## 3. Auditoria Estrutural via SQL
Para verificar RLS (Row Level Security) e permissões:
- Use o script [VERIFICAR_ESTRUTURA_COMPLETA.sql](file:///c:/Users/Mauro/PROJETOS/ClassTower/VERIFICAR_ESTRUTURA_COMPLETA.sql) no Editor SQL do Supabase.

---
> [!TIP]
> Use o Modo Engenheiro ("modo engenheiro") para gerar um relatório detalhado de arquitetura e saúde do BD caso suspeite de corrupção de dados ou falhas de permissão.
