-- =============================================
-- 🔔 ATIVAR REALTIME PARA NOTIFICAÇÕES
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Ativa o Realtime para a tabela de Avisos
ALTER publication supabase_realtime ADD TABLE public.avisos;

-- 2. Ativa o Realtime para a tabela de Encomendas
ALTER publication supabase_realtime ADD TABLE public.encomendas;

-- 3. Garante que as tabelas tenham a estrutura necessária para as notificações
-- (sala_numero é essencial para filtrar quem recebe o quê)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='avisos' AND column_name='sala_numero') THEN
        ALTER TABLE public.avisos ADD COLUMN sala_numero TEXT;
    END IF;
END $$;

-- 4. Inserir uma notificação de teste para o admin ver se o Realtime está ok
-- Esta notificação aparecerá para todos (sala_numero NULL)
-- INSERT INTO public.avisos (titulo, conteudo, tipo, status) 
-- VALUES ('Sistema de Notificações Ativado', 'Agora você receberá avisos e encomendas em tempo real!', 'Geral', 'Ativo');

SELECT '✅ Realtime ativado para avisos e encomendas!' as status;
