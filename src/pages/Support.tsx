
import React, { useState } from 'react';

const Support: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const faqs = [
    { q: "Como exportar um relatório mensal de vistorias?", a: "Vá na aba 'Vistorias', selecione os filtros desejados e clique no botão 'Exportar PDF' no painel de detalhes à direita." },
    { q: "Posso cadastrar prestadores como Pessoa Física?", a: "Sim. No menu 'Prestadores de Serviço', clique em 'Novo Prestador' e alterne o seletor no topo do formulário para 'Pessoa Física'." },
    { q: "Como alterar o tema do sistema?", a: "O ícone de sol/lua no cabeçalho superior permite alternar instantaneamente entre os modos Claro e Escuro." },
    { q: "Esqueci minha senha de acesso, o que fazer?", a: "Na tela de login, utilize a opção 'Esqueci minha senha' ou solicite o reset ao administrador master do seu condomínio." }
  ];

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketStatus('sending');
    setTimeout(() => setTicketStatus('success'), 1500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Como podemos ajudar?</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Suporte técnico especializado para a plataforma Class Tower</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: 'forum', label: 'Chat Online', desc: 'Fale agora com um consultor', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: 'mail', label: 'E-mail', desc: 'suporte@classtower.com.br', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: 'phone_in_talk', label: 'Central 24h', desc: '0800 7070 1010', color: 'text-primary', bg: 'bg-primary/10' },
        ].map((item, i) => (
          <button key={i} className="flex flex-col items-center p-8 bg-white dark:bg-[#1d222a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group">
            <div className={`size-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{item.icon}</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">{item.label}</h4>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">quiz</span>
            Perguntas Frequentes
          </h4>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{faq.q}</span>
                  <span className={`material-symbols-outlined transition-transform ${activeFaq === i ? 'rotate-180 text-primary' : 'text-slate-400'}`}>expand_more</span>
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">confirmation_number</span>
            Abrir Ticket de Suporte
          </h4>
          <div className="bg-white dark:bg-[#1d222a] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {ticketStatus === 'success' ? (
              <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
                <div className="size-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h5 className="text-lg font-bold text-slate-900 dark:text-white">Ticket Enviado!</h5>
                <p className="text-sm text-slate-500">Nossa equipe entrará em contato em até 4 horas úteis.</p>
                <button onClick={() => setTicketStatus('idle')} className="text-primary font-bold text-sm hover:underline">Abrir outro ticket</button>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assunto do Chamado</label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm">
                    <option>Dúvida Técnica</option>
                    <option>Reportar Bug / Falha</option>
                    <option>Sugestão de Melhoria</option>
                    <option>Problemas de Acesso</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição Detalhada</label>
                  <textarea 
                    required 
                    rows={4} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm resize-none"
                    placeholder="Como podemos ajudar?"
                  ></textarea>
                </div>
                <button 
                  disabled={ticketStatus === 'sending'}
                  type="submit" 
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {ticketStatus === 'sending' ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
