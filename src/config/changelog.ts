export interface ChangeLogItem {
  version: string;
  date: string;
  title: string;
  description: string;
  icon: string;
}

export const changelog: ChangeLogItem[] = [
  {
    version: '2.0.0',
    date: '31/01/2026',
    title: 'Sincronização Offline Completa',
    description: 'Agora você pode trabalhar sem internet! Seus dados (encomendas, avisos, etc.) são salvos localmente e enviados automaticamente quando a conexão retornar. Inclui indicadores de status de rede.',
    icon: 'wifi_off'
  },
  {
    version: '1.9.5',
    date: '31/01/2026',
    title: 'Auditoria e Logs',
    description: 'Sistema completo de logs de auditoria para rastrear todas as ações importantes realizadas no sistema.',
    icon: 'history_edu'
  },
  {
    version: '1.9.0',
    date: '30/01/2026',
    title: 'Módulo de Vistorias & Storage',
    description: 'Novo módulo para realizar vistorias com upload de fotos e documentos integrado ao sistema de armazenamento em nuvem.',
    icon: 'photo_camera'
  },
  {
    version: '1.8.0',
    date: '28/01/2026',
    title: 'Performance & Real-time',
    description: 'Melhorias significativas na velocidade de carregamento e atualizações em tempo real para avisos e encomendas.',
    icon: 'speed'
  }
];

export const currentVersion = changelog[0].version;
