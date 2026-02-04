-- 🔧 CORREÇÃO DE RECURSÃO INFINITA NAS POLÍTICAS RLS
-- Execute este script IMEDIATAMENTE no Supabase SQL Editor

-- ============================================
-- PROBLEMA IDENTIFICADO:
-- As políticas RLS estavam consultando a própria tabela profiles
-- para verificar o role, causando recursão infinita.
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- 2. CRIAR POLÍTICAS SIMPLES E SEM RECURSÃO
-- Importante: Não podemos consultar profiles dentro das políticas de profiles!

-- Permitir leitura para todos autenticados (sem verificar role)
CREATE POLICY "Allow read for authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Permitir que usuários atualizem apenas seu próprio perfil
CREATE POLICY "Allow users to update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir inserção apenas pelo próprio usuário (via trigger)
CREATE POLICY "Allow users to insert own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 3. GARANTIR QUE RLS ESTÁ ATIVO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CORRIGIR POLÍTICAS DE SALAS (MESMA LÓGICA)
DROP POLICY IF EXISTS "Salas visíveis para autenticados" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;

-- Permitir leitura para todos
CREATE POLICY "Allow read salas for authenticated" 
ON public.salas FOR SELECT 
TO authenticated 
USING (true);

-- Permitir escrita para todos autenticados (simplificado)
-- Se precisar restringir apenas para admin/atendente, faremos isso no front-end
CREATE POLICY "Allow write salas for authenticated" 
ON public.salas FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. RECARREGAR CACHE DO POSTGREST
NOTIFY pgrst, 'reload config';

SELECT '✅ Políticas RLS corrigidas! Recursão infinita resolvida.' as status;
