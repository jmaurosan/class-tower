-- 🔍 VERIFICAR EXISTÊNCIA DE TODAS AS TABELAS DO SISTEMA

SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ AUSENTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 
    'documentos', 
    'encomendas', 
    'avisos', 
    'agendamentos', 
    'vistorias', 
    'diario', 
    'empresas', 
    'condo_calendar_rules',
    'vencimentos',
    'audit_logs'
  );
