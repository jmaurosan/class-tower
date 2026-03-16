-- 🛠️ CORREÇÃO DEFINITIVA DE ID DO ADMIN - ClassTower (V4 com Cascata Manual)
-- Resolve o erro de Foreign Key na tabela avaliacoes_empresas.
-- IDs:
-- Perfil Atual (Antigo): 67dacfd7-2dc6-4812-8828-6eb1b23fedda
-- Autenticação (Novo): ba50ca7c-3f41-4c6e-8267-3362a74070a8

DO $$
BEGIN
    -- 1. Verificar se o ID antigo existe na tabela profiles
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = '67dacfd7-2dc6-4812-8828-6eb1b23fedda') THEN
        RAISE NOTICE 'Encontrado perfil com ID antigo. Sincronizando referências...';
        
        -- A. Atualizar referências em avaliacoes_empresas
        UPDATE public.avaliacoes_empresas 
        SET user_id = 'ba50ca7c-3f41-4c6e-8267-3362a74070a8'
        WHERE user_id = '67dacfd7-2dc6-4812-8828-6eb1b23fedda';
        
        -- B. Atualizar referências em outras possíveis tabelas (se houver dados)
        -- Avisos (criado_por aponta para auth.users, mas se houver dependência direta no profile...)
        -- Neste sistema agendamentos e diario apontam para auth.users, que já tem o novo ID.
        -- Mas para garantir a integridade do Profile:
        
        -- C. Atualizar o ID na tabela profiles
        UPDATE public.profiles 
        SET id = 'ba50ca7c-3f41-4c6e-8267-3362a74070a8', 
            updated_at = now() 
        WHERE id = '67dacfd7-2dc6-4812-8828-6eb1b23fedda';
        
        RAISE NOTICE '✅ ID do admin e suas avaliações atualizados com sucesso!';
    ELSE
        RAISE NOTICE 'Perfil com ID antigo não encontrado. Verificando novo ID...';
        
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = 'ba50ca7c-3f41-4c6e-8267-3362a74070a8') THEN
            RAISE NOTICE '✅ O perfil com o novo ID já existe.';
        ELSE
            INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
            VALUES ('ba50ca7c-3f41-4c6e-8267-3362a74070a8', 'admin@classtower.com.br', 'Admin', 'admin', 'Ativo', now(), now());
            RAISE NOTICE '✅ Novo perfil de admin criado.';
        END IF;
    END IF;
END $$;
