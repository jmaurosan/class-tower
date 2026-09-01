--SCRIPT DE DIAGNÓSTICO E CORREÇÃO
--Execute este script no console do navegador(F12 -> Console)

--1. Verificar dados do usuário atual
console.log('👤 Usuário atual:', JSON.parse(sessionStorage.getItem('supabase.auth.token') || '{}'));

--2. Limpar sessão completamente
sessionStorage.clear();
localStorage.clear();

--3. Recarregar a página
window.location.reload();
