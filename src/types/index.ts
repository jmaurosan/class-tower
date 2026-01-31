
export type Page = 'dashboard' | 'vistorias' | 'agendamentos' | 'diario' | 'empresas' | 'settings' | 'support' | 'encomendas' | 'vencimentos' | 'salas' | 'documentos' | 'audit-logs' | 'avisos' | 'usuarios';

export type UserRole = 'admin' | 'atendente' | 'sala';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  sala_numero?: string;
}

export interface DocumentoAnexo {
  id: string;
  nome: string;
  categoria: 'Atas' | 'Regimento Interno' | 'Plantas' | 'Seguros' | 'Certidões' | 'Outros';
  dataUpload: string;
  tamanho: string;
  tipo: string;
  url: string;
  storagePath?: string;
}

export interface Sala {
  id: string;
  numero: string;
  andar: number;
  nome: string;
  responsavel1: string;
  telefone1: string;
  responsavel2: string;
  telefone2: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  data: Date;
  lida: boolean;
  prioridade: 'Baixa' | 'Media' | 'Alta';
  tipo: 'Vencimento' | 'Sistema' | 'Vistoria';
}

export interface DocumentoVencimento {
  id: string;
  titulo: string;
  dataVencimento: string;
  status: 'Feito' | 'Em Andamento';
  visto?: boolean;
}

export interface Encomenda {
  id: string;
  dataEntrada: string;
  dataRetirada?: string;
  destinatario: string;
  remetente: string;
  categoria: 'Caixa' | 'Envelope' | 'Pacote' | 'Outros';
  caracteristicas: string;
  fotoUrl?: string;
  status: 'Pendente' | 'Retirado';
  quemRetirou?: string;
  sala_id: string;
}

export interface Vistoria {
  id: string;
  data: string;
  hora: string;
  unidade: string;
  local?: string;
  area: string;
  tecnico: string;
  urgencia: 'Alta' | 'Média' | 'Baixa';
  status: 'Concluído' | 'Pendente' | 'Em Andamento';
  descricao?: string;
}

export interface DiarioEntry {
  id: string;
  data: string;
  hora: string;
  titulo: string;
  descricao: string;
  categoria: 'Segurança' | 'Manutenção' | 'Reclamação' | 'Aviso' | 'Limpeza' | 'Outros';
  usuario: string;
  sala_id?: string;
}

export interface Aviso {
  id: string;
  data: string;
  hora: string;
  titulo: string;
  conteudo: string;
  prioridade: 'Baixa' | 'Media' | 'Alta' | 'Critica';
  criado_por: string;
}

export interface Agendamento {
  id: string;
  data: string;
  hora: string;
  titulo: string;
  local: string;
  tipo: 'Mudança' | 'Manutenção' | 'Reserva' | 'Reunião';
  status: 'Confirmado' | 'Pendente' | 'Cancelado';
  sala_id: string;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  setor: 'Elétrica' | 'Hidráulica' | 'Limpeza' | 'Segurança' | 'Elevadores' | 'Outros';
  contato: string;
  telefone: string;
  email: string;
  status: 'Homologada' | 'Em Revisão' | 'Inativa';
  rating: number;
  sala_id?: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  executed_by?: string;
  executed_by_name?: string;
  old_data?: any;
  new_data?: any;
}
