import React, { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentoAnexo, User } from '../types';

interface DocumentosProps {
  user: User;
}

const Documentos: React.FC<DocumentosProps> = ({ user }) => {
  const [filter, setFilter] = useState<string>('Todos');
  const { documentos, loading, uploadDoc, deleteDoc } = useDocuments();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    nome: '',
    categoria: 'Outros' as DocumentoAnexo['categoria']
  });

  const categorias: string[] = ['Todos', 'Atas', 'Regimento Interno', 'Plantas', 'Seguros', 'Certidões', 'Outros'];

  const filteredDocs = filter === 'Todos'
    ? documentos
    : documentos.filter(d => d.categoria === filter);

  const isAdmin = user.role === 'admin';
  const canUpload = isAdmin;
  const canDelete = isAdmin;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload || !selectedFile) return;

    setIsUploading(true);
    try {
      await uploadDoc(selectedFile, newDoc);
      setShowUploadModal(false);
      setNewDoc({ nome: '', categoria: 'Outros' });
      setSelectedFile(null);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Falha ao enviar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: DocumentoAnexo) => {
    if (!canDelete) return;
    if (!confirm('Deseja excluir este documento permanentemente?')) return;

    try {
      await deleteDoc(doc);
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Falha ao excluir arquivo.');
    }
  };

  const getFileIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'xls':
      case 'xlsx': return 'table_chart';
      default: return 'attachment';
    }
  };

  const getIconColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'pdf': return 'text-red-500';
      case 'doc':
      case 'docx': return 'text-blue-500';
      case 'xls':
      case 'xlsx': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Repositório de Documentos</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Acesso centralizado aos documentos oficiais do condomínio</p>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">cloud_upload</span>
            Anexar Documento
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${filter === cat
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="group bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`size-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${getIconColor(doc.tipo)}`}>
                <span className="material-symbols-outlined text-3xl">{getFileIcon(doc.tipo)}</span>
              </div>
              <div className="flex gap-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all flex items-center justify-center"
                  title="Baixar"
                >
                  <span className="material-symbols-outlined">download</span>
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2" title={doc.nome}>
                {doc.nome}
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">
                  {doc.categoria}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {doc.tamanho}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              <span>Postado em {doc.dataUpload}</span>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">Visualizar</a>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white dark:bg-[#1d222a] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">folder_off</span>
            <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum documento encontrado nesta categoria</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1d222a] w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">Anexar Documento</h4>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Arquivo</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Ata Outubro 2023.pdf"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                    value={newDoc.nome}
                    onChange={e => setNewDoc({ ...newDoc, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                    value={newDoc.categoria}
                    onChange={e => setNewDoc({ ...newDoc, categoria: e.target.value as any })}
                  >
                    {categorias.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <label className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer hover:border-primary transition-colors group">
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">upload_file</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4 truncate w-full">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo'}
                  </p>
                  <p className="text-[9px]">PDF, DOCX ou XLSX (Máx 20MB)</p>
                </label>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className={`flex-1 py-4 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all ${selectedFile && !isUploading ? 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}
                  >
                    {isUploading ? (
                      <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      'Confirmar Envio'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;
