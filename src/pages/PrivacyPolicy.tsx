import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#15191e] py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#1d222a] rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em]">
            Segurança & Privacidade
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Política de Privacidade
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Última atualização: Março de 2026
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>

        {/* Content Sections */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
              Introdução
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              O **Class Tower** valoriza a privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (**LGPD - Lei nº 13.709/2018**).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
              Dados Coletados
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Podemos coletar os seguintes tipos de dados:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
              {[
                { label: 'Identificação', desc: 'Nome, e-mail, telefone, CPF' },
                { label: 'Condomínio', desc: 'Nome, unidade, bloco' },
                { label: 'Uso', desc: 'Interações com a plataforma' },
                { label: 'Dispositivo', desc: 'Tipo, SO, endereço IP' }
              ].map((item, i) => (
                <li key={i} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <span className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1">{item.label}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
              Finalidade do Tratamento
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Fornecer e melhorar os serviços da Plataforma',
                'Gerenciar sua conta e autenticação',
                'Enviar comunicações relevantes sobre o condomínio',
                'Cumprir obrigações legais e regulatórias',
                'Análise de uso para melhorias contínuas'
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
              Compartilhamento de Dados
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Seus dados pessoais não serão vendidos a terceiros. Poderemos compartilhar informações com prestadores de serviços essenciais (hospedagem), administração do condomínio e autoridades governamentais quando exigido por lei.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
              Segurança e Retenção
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado. Seus dados serão armazenados pelo tempo necessário ou exigido por lei, sendo eliminados em até 90 dias após o encerramento da conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">6</span>
              Seus Direitos (LGPD)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'Confirmação de Tratamento',
                'Acesso aos Dados',
                'Correção de Dados',
                'Anonimização/Bloqueio',
                'Portabilidade',
                'Revogação de Consentimento'
              ].map((right, i) => (
                <div key={i} className="p-3 bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{right}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">7</span>
              Cookies e Contato
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Utilizamos cookies para melhorar a experiência. Para exercer seus direitos ou esclarecer dúvidas, entre em contato com nosso DPO pelo WhatsApp:
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a 
                href="https://wa.me/5571996332932" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all text-sm uppercase tracking-widest"
              >
                <span className="material-symbols-outlined">chat</span>
                Falar com o DPO
              </a>
              <Link 
                to="/" 
                className="text-slate-400 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest"
              >
                ← Voltar ao Início
              </Link>
            </div>
          </section>

        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
          Class Tower © 2026 • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
