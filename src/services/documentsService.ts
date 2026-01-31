
import { DocumentoAnexo } from '../types';
import { supabase } from './supabase';

export const documentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(d => ({
      id: d.id,
      nome: d.nome,
      categoria: d.categoria,
      dataUpload: new Date(d.created_at).toLocaleDateString('pt-BR'),
      tamanho: d.tamanho,
      tipo: d.tipo,
      url: d.url,
      storagePath: d.storage_path
    })) as DocumentoAnexo[];
  },

  async upload(file: File, docInfo: { nome: string, categoria: string }) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${docInfo.nome.replace(/\s/g, '_')}.${fileExt}`;
    const filePath = `condominio/${fileName}`;

    // 1. Upload for Storage
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    // 3. Save Metadata in Database
    const { data, error: dbError } = await supabase
      .from('documentos')
      .insert([{
        nome: docInfo.nome,
        categoria: docInfo.categoria,
        tamanho: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        tipo: fileExt || 'pdf',
        url: publicUrl,
        storage_path: filePath
      }])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  async delete(doc: DocumentoAnexo) {
    // 1. Delete from Storage
    if (doc.storagePath) {
      await supabase.storage
        .from('documentos')
        .remove([doc.storagePath]);
    }

    // 2. Delete from Database
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', doc.id);

    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:documentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos' }, callback)
      .subscribe();
  }
};
