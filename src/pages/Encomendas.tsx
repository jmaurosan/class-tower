import React, { useState } from 'react';
import { useEncomendas } from '../hooks/useEncomendas';
import { supabase } from '../services/supabase';
import { Encomenda, User } from '../types';

interface EncomendasProps {
  user: User;
}

const Encomendas: React.FC<EncomendasProps> = ({ user }) => {
  const isResident = user.role === 'sala';
  // If resident, filter by their own room (sala_numero)
  const { encomendas, loading: loadingItems, addEncomenda, updateStatus } = useEncomendas(isResident ? user.sala_numero : undefined);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Todos' | 'Pendente' | 'Retirado'>('Todos');
  const [newPackage, setNewPackage] = useState<Partial<Encomenda & { destinatarioOriginal: string }>>({
    categoria: 'Caixa',
    status: 'Pendente',
    destinatarioOriginal: ''
  });

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraActive(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/png');
        setCapturedPhoto(photoData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let foto_url = `https://picsum.photos/seed/${Math.random()}/200/200`;

      if (capturedPhoto) {
        const fileName = `pkg-${Date.now()}.png`;
        const base64Data = capturedPhoto.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documentos') // Usando o bucket documentos por segurança (já existe)
          .upload(`encomendas/${fileName}`, blob);

        if (!uploadError && uploadData) {
          const { data: publicUrl } = supabase.storage
            .from('documentos')
            .getPublicUrl(`encomendas/${uploadData.path}`);
          foto_url = publicUrl.publicUrl;
        }
      }

      await addEncomenda({
        destinatario: newPackage.destinatario || '',
        remetente: newPackage.remetente || '',
        categoria: newPackage.categoria || 'Caixa',
        caracteristicas: `${newPackage.caracteristicas || ''} [Recebido em: ${newPackage.destinatarioOriginal || 'N/A'}]`,
        status: 'Pendente',
        fotoUrl: foto_url,
        sala_id: newPackage.destinatario?.replace('Unidade ', '') || '0000'
      });

      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar encomenda:', err);
      alert('Erro ao salvar no banco de dados.');
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsFormOpen(false);
    setCapturedPhoto(null);
    setNewPackage({ categoria: 'Caixa', status: 'Pendente', destinatarioOriginal: '' });
  };

  const markAsDelivered = async (id: string) => {
    const nome = prompt('Quem está retirando a encomenda?');
    if (!nome) return;

    try {
      await updateStatus(id, {
        status: 'Retirado',
        dataRetirada: new Date().toISOString(),
        quemRetirou: nome
      });
    } catch (err) {
      console.error('Erro ao dar baixa:', err);
      alert('Erro ao atualizar no banco de dados.');
    }
  };

  const isAdmin = user.role === 'admin';
  const isAtendente = user.role === 'atendente';
  const canManage = isAdmin || isAtendente;

  const filtered = encomendas.filter(enc => filter === 'Todos' || enc.status === filter);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Encomendas</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Controle de recebimento e entrega para moradores</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_box</span>
            Registrar Entrada
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Aguardando Retirada</p>
          <h4 className="text-3xl font-black text-amber-500">{encomendas.filter(e => e.status === 'Pendente').length}</h4>
        </div>
        <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Entregues Hoje</p>
          <h4 className="text-3xl font-black text-emerald-500">{encomendas.filter(e => e.status === 'Retirado' && e.dataRetirada?.includes(new Date().toLocaleDateString('pt-BR'))).length}</h4>
        </div>
        <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex gap-2 h-full items-center">
            {(['Todos', 'Pendente', 'Retirado'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${filter === f ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'text-slate-400 border-slate-200 dark:border-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filtered.map(enc => (
          <div key={enc.id} className={`bg-white dark:bg-[#1d222a] rounded-3xl border p-6 flex gap-6 transition-all group ${enc.status === 'Retirado' ? 'border-slate-100 dark:border-slate-900 opacity-75' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-xl'}`}>
            <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <img src={enc.fotoUrl} alt="Pacote" className="size-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold uppercase backdrop-blur-sm">
                {enc.categoria}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-xl font-black text-slate-900 dark:text-white">{enc.destinatario}</h5>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enviado por: {enc.remetente}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${enc.status === 'Pendente' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  {enc.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Características</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{enc.caracteristicas}</p>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div className="text-[9px] font-bold text-slate-400 space-y-0.5">
                  <p>ENTRADA: {enc.dataEntrada}</p>
                  {enc.dataRetirada && <p className="text-emerald-500">RETIRADA: {enc.dataRetirada} por {enc.quemRetirou}</p>}
                </div>
                {enc.status === 'Pendente' && canManage && (
                  <button
                    onClick={() => markAsDelivered(enc.id)}
                    className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Dar Baixa
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1d222a] w-full max-w-2xl rounded-3xl shadow-2xl border dark:border-slate-800 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Registro de Encomenda</h4>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>

            <form onSubmit={handleAdd} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unidade de Destino</label>
                  <input required placeholder="Ex: Unidade 1402" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm transition-all" onChange={e => setNewPackage({ ...newPackage, destinatario: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Remetente</label>
                  <input required placeholder="Ex: Amazon, Mercado Livre, João da Silva" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm transition-all" onChange={e => setNewPackage({ ...newPackage, remetente: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destinatário</label>
                  <input
                    required
                    placeholder="Ex: Portaria A, Recepção Social, Zeladoria..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm transition-all"
                    onChange={e => setNewPackage({ ...newPackage, destinatarioOriginal: e.target.value })}
                    value={newPackage.destinatarioOriginal}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Foto da Encomenda</label>
                <div className="flex flex-col items-center gap-4">
                  {capturedPhoto ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <img src={capturedPhoto} className="w-full h-full object-contain" alt="Capturada" />
                      <button
                        type="button"
                        onClick={() => setCapturedPhoto(null)}
                        className="absolute top-4 right-4 size-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ) : isCameraActive ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={takePhoto}
                          className="size-14 bg-white text-primary rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-3xl">photo_camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="size-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-all group"
                    >
                      <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">photo_camera</span>
                      <span className="text-xs font-bold uppercase tracking-widest">Tirar Foto da Encomenda</span>
                    </button>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Volume</label>
                <div className="flex gap-2">
                  {(['Caixa', 'Envelope', 'Pacote', 'Outros'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewPackage({ ...newPackage, categoria: cat })}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${newPackage.categoria === cat ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Características / Observações</label>
                <textarea rows={3} placeholder="Ex: Grande, frágil, envelope pardo, caixa lacrada com fita amarela..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm resize-none transition-all" onChange={e => setNewPackage({ ...newPackage, caracteristicas: e.target.value })} />
              </div>

              <div className="pt-4 flex gap-4 sticky bottom-0 bg-white dark:bg-[#1d222a] py-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">Finalizar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Encomendas;
