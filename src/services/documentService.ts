import { supabase } from './supabaseClient';
import { DocumentListResponse, DocumentQueryParams, Document } from '../types/document';

export const getDocuments = async (params: DocumentQueryParams): Promise<DocumentListResponse> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);

    if (error) throw error;

    // Обеспечиваем соответствие типу Document
    const mappedData: Document[] = data?.map(item => ({
      id: item.id,
      title: item.title,
      file_path: item.file_path,
      mime_type: item.mime_type,
      file_size: item.file_size,
      is_public: item.is_public ?? false,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.created_at || new Date().toISOString() // В MVP updated_at совпадает с created_at
    })) || [];

    return {
      data: mappedData,
      hasMore: mappedData.length === (params.limit || 20)
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};
