import api from './api';

export interface Newsletter {
  unique_id: string;
  email: string;
  active_subscription: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Newsletter[]; pages: number } | Newsletter[] | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const newsletterService = {
  getAll: async (params: PaginationParams): Promise<NewsletterResponse> => {
    const response = await api.get(`/user/newsletter?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<NewsletterResponse> => {
    const response = await api.get(`/user/filter/newsletter?${buildQueryParams(params)}`);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/newsletter?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default newsletterService;
