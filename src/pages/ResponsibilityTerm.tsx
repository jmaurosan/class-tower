import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResponsibilityTerm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header Fixo */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-xl">assignment_turned_in</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Termo de Responsabilidade</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Título Principal */}
        <div className="mb-16 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Termo de <span className="text-orange-500 italic">Responsabilidade</span>
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 dark:text-slate-400">
            <span className="text-sm">Vigência: Março de 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-sm font-medium text-orange-500 uppercase tracking-tighter">Documento de Compliance Predial</span>
          </div>
        </div>

        {/* Card de Aviso Rápido */}
        <div className="mb-16 p-6 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-3xl flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-3xl">policy</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Informação Importante</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Este termo visa garantir a transparência e a segurança jurídica de todos os usuários que operam ou utilizam as dependências do condomínio através da plataforma Class Tower.
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-16 text-slate-600 dark:text-slate-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-baseline gap-4">
              <span className="text-4xl text-slate-200 dark:text-slate-800 font-black">01</span>
              Agendamentos e Áreas Comuns
            </h2>
            <div className="space-y-4 text-lg">
              <p>
                Ao agendar espaços comuns (como Salão de Festas, Espaço Gourmet ou Salas de Reunião) pela plataforma, o usuário declara-se ciente de que:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 shrink-0">check_circle</span>
                  <span>É integralmente responsável por quaisquer danos materiais causados ao espaço ou aos móveis durante o período reservado.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 shrink-0">check_circle</span>
                  <span>Deve respeitar rigorosamente as normas de silêncio, horários e capacidade máxima definidas no Regimento Interno.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 shrink-0">check_circle</span>
                  <span>O cancelamento fora do prazo estabelecido poderá acarretar taxas administrativas conforme as Regras de Calendário.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-baseline gap-4">
              <span className="text-4xl text-slate-200 dark:text-slate-800 font-black">02</span>
              Gestão de Encomendas
            </h2>
            <div className="space-y-4 text-lg">
              <p>
                O sistema de controle de encomendas do Class Tower serve como protocolo digital. O usuário responsabiliza-se por:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 shrink-0">package_2</span>
                  <span>Retirar encomendas registradas em seu nome ou unidade em tempo hábil.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 shrink-0">history_edu</span>
                  <span>Verificar a integridade do pacote no ato da retirada junto à portaria.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-orange-500 shrink-0">report_problem</span>
                  <span>O condomínio não se responsabiliza por encomendas não reclamadas após o prazo definido nas políticas internas.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-baseline gap-4">
              <span className="text-4xl text-slate-200 dark:text-slate-800 font-black">03</span>
              Vistorias e Laudos Técnicos
            </h2>
            <p className="text-lg mb-6">
              Técnicos e Administradores que realizam vistorias via sistema são legalmente responsáveis pela veracidade das informações e fotos anexadas aos laudos, garantindo que reflitam o estado real da unidade ou área vistoriada no momento do registro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-baseline gap-4">
              <span className="text-4xl text-slate-200 dark:text-slate-800 font-black">04</span>
              Ciência de Auditoria (Logs)
            </h2>
            <div className="p-8 rounded-3xl bg-slate-900 text-slate-300 border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-8xl">troubleshoot</span>
              </div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">lock</span>
                Rastreabilidade e Compliance
              </h3>
              <p className="text-sm leading-relaxed">
                O usuário declara estar ciente de que a plataforma utiliza sistemas de <strong>Logs de Auditoria Imutáveis</strong>. Toda e qualquer ação de criação, edição ou exclusão de dados é registrada com timestamp, IP e identificação do autor. Em caso de exclusões, a justificativa inserida é armazenada para fins de auditoria e pode ser apresentada judicialmente se necessário.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-baseline gap-4">
              <span className="text-4xl text-slate-200 dark:text-slate-800 font-black">05</span>
              Conduta e Ética
            </h2>
            <p className="text-lg">
              A utilização da plataforma deve ser pautada pelo respeito mútuo entre moradores, funcionários e prestadores de serviço. O uso do sistema para assédio, reclamações infundadas ou disseminação de informações falsas será tratado como falta gravíssima.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-primary font-bold hover:underline mb-8"
          >
            <span className="material-symbols-outlined">print</span>
            Imprimir Termo de Responsabilidade
          </button>
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              * Este Termo de Responsabilidade é complementar ao Regimento Interno do Condomínio e aos Termos de Uso da plataforma Class Tower. A concordância com este termo ocorre de forma tácita ao utilizar as funcionalidades de agendamento e vistorias do sistema.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 dark:text-slate-600 text-sm">
        &copy; 2026 Class Tower CRM - Módulo de Compliance e Segurança.
      </footer>
    </div>
  );
};

export default ResponsibilityTerm;
