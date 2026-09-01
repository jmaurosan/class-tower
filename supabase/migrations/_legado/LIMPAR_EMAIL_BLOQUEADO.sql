-- 🧹 LIMPEZA COMPLETA DO EMAIL BLOQUEADO
-- Execução necessária para liberar o email 'teste.t@gmail.com'

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Busca o ID do usuário (pode estar em qualquer estado: ativo, banido, soft-deleted)
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'teste.t@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Remove session tokens (para não deixar sesões penduradas)
    DELETE FROM auth.sessions WHERE user_id = v_user_id;
    DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id;
    
    -- Remove identidades (provedor de login)
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    
    -- Remove perfil
    DELETE FROM public.profiles WHERE id = v_user_id;
    
    -- Remove o usuário de auth (por último, pois outros têm FK para ele)
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Usuário % removido completamente do sistema.', v_user_id;
  ELSE
    RAISE NOTICE '⚠️ Usuário com email teste.t@gmail.com não encontrado em auth.users.';
  END IF;
END $$;

-- Recarregar configurações
NOTIFY pgrst, 'reload config';

SELECT '✅ Limpeza concluída. Tente criar a conta novamente.' as status;
