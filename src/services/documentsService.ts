
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
    try {
      if (!file) throw new Error('Arquivo não selecionado');

      const fileExt = file.name.split('.').pop() || 'tmp';
      // Sanitize file name to remove special chars
      const safeName = docInfo.nome.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
      const fileName = `${Date.now()}_${safeName}.${fileExt}`;
      const filePath = `condominio/${fileName}`;

      // 1. Upload for Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no Storage:', uploadError);
        throw new Error(`Erro ao enviar arquivo: ${uploadError.message}`);
      }

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
          tamanho: file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(2)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          tipo: fileExt,
          url: publicUrl,
          storage_path: filePath
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Erro no Banco:', dbError);
        await supabase.storage.from('documentos').remove([filePath]);
        throw new Error(`Erro ao salvar metadados: ${dbError.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Upload Service Error:', error);
      throw error;
    }
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
