import api from './api';

export interface Faq {
  unique_id: string;
  question: string;
  answer: string;
  updated_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Faq[]; pages: number } | Faq[] | null;
}

export interface FaqResponse {
  success: boolean;
  message: string;
  data: Faq | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const faqsService = {
  getAll: async (params: PaginationParams): Promise<FaqsResponse> => {
    const response = await api.get(`/user/faqs?${buildQueryParams(params)}`);
    return response.data;
  },
  get: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<FaqResponse> => {
    const response = await api.get(`/user/faq?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },
  search: async (params: SearchParams): Promise<FaqsResponse> => {
    const response = await api.get(`/user/search/faqs?${buildQueryParams(params)}`);
    return response.data;
  },
  filter: async (params: FilterParams): Promise<FaqsResponse> => {
    const response = await api.get(`/user/filter/faqs?${buildQueryParams(params)}`);
    return response.data;
  },
  add: async (data: { question: string; answer: string; candidate_unique_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/faq/add?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editDetails: async (data: { unique_id: string; question: string; answer: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/faq/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },
  delete: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/faq?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default faqsService;
