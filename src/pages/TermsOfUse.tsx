import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfUse: React.FC = () => {
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
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">gavel</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Termos de Uso</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Título Principal */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Termos de <span className="text-primary italic">Uso</span>
          </h1>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span className="text-sm">Última atualização: Março de 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-sm italic font-medium text-primary">Class Tower v2.0</span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
          <section className="relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-primary/20 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black text-primary">01</span>
              Aceitação dos Termos
            </h2>
            <p>
              Ao acessar e utilizar a plataforma <span className="font-bold text-slate-900 dark:text-white">Class Tower</span>, você concorda em cumprir e estar vinculado a estes Termos de Uso. Este sistema foi desenvolvido exclusivamente para a otimização da gestão operacional de condomínios comerciais. Se você não concorda com qualquer parte destes termos, não deverá utilizar a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black text-primary">02</span>
              Cadastro e Segurança da Conta
            </h2>
            <div className="space-y-4">
              <p>
                Para utilizar o Class Tower, o acesso é concedido mediante cadastro administrativo. O usuário compromete-se a:
              </p>
              <ul className="grid md:grid-rows-2 md:grid-flow-col gap-x-8 gap-y-4 list-none p-0">
                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <span>Fornecer informações exatas e atualizadas (Nome, E-mail, Unidade).</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary">lock_open</span>
                  <span>Manter o sigilo de sua senha de acesso, sendo o único responsável por ela.</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary">security_update_warning</span>
                  <span>Notificar imediatamente a administração sobre qualquer uso não autorizado.</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary">person_off</span>
                  <span>Não compartilhar credenciais com terceiros, outros condôminos ou locatários.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black text-primary">03</span>
              Uso Adequado da Plataforma
            </h2>
            <p className="mb-4">
              A plataforma deve ser utilizada estritamente para fins de gestão predial. É proibido:
            </p>
            <div className="bg-slate-900 dark:bg-primary/5 p-6 rounded-2xl border border-slate-800 dark:border-primary/20">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  <span>Uso para fins comerciais externos ou propaganda não autorizada;</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  <span>Inserção de conteúdos ofensivos, discriminatórios ou ilegais;</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  <span>Qualquer prática que vise sobrecarregar ou danificar os servidores da plataforma;</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  <span>Tentativa de burlar as permissões de acesso (perfis de Administrador/Atendente).</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black text-primary">04</span>
              Propriedade Intelectual
            </h2>
            <p>
              Todo o código-fonte, design, interfaces, marcas e conteúdos exclusivos são de propriedade intelectual da <span className="font-bold text-slate-900 dark:text-white">Class Tower</span>. A utilização do sistema não transfere ao usuário qualquer direito de propriedade sobre a estrutura da tecnologia, sendo vedada qualquer tentativa de engenharia reversa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black text-primary">05</span>
              Suspensão e Encerramento de Contas
            </h2>
            <p>
              O Class Tower reserva-se o direito de, a seu exclusivo critério, suspender ou encerrar o acesso de qualquer usuário que viole as regras estabelecidas nestes Termos, no regimento interno do condomínio ou na legislação vigente, sem prejuízo de outras sanções legais cabíveis.
            </p>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Dúvidas sobre os Termos?</h3>
            <p className="text-sm mb-6">Se você tiver qualquer dúvida sobre estes Termos de Uso, entre em contato com a administração do seu condomínio ou nosso suporte técnico.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/support')}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Suporte Técnico
              </button>
              <button
                onClick={() => navigate('/privacy')}
                className="px-8 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Ver Política de Privacidade
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="py-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 text-sm">
        &copy; 2026 Class Tower CRM. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default TermsOfUse;
