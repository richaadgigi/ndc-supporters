import api from './api';

export interface NewsletterSubscriber {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  email: string;
  subscription: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
}

export type Newsletter = NewsletterSubscriber;

export interface NewsletterResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: NewsletterSubscriber[]; pages: number } | NewsletterSubscriber[] | null;
}

export interface NewsletterStats {
  total_newsletters: number;
}

export interface NewsletterStatsResponse {
  success: boolean;
  message: string;
  data: NewsletterStats | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const newsletterService = {
  publicSubscribe: async (data: { email: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/add/newsletter', data);
    return response.data;
  },

  publicUpdateSubscription: async (data: { email: string; subscribed: boolean }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/update/subscription', data);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<NewsletterResponse> => {
    const response = await api.get(`/user/newsletter?${buildQueryParams(params)}`);
    return response.data;
  },

  getStats: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<NewsletterStatsResponse> => {
    const response = await api.get(`/user/newsletter/stats?${buildQueryParams(params)}`);
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

  portalGetAll: async (params: PaginationParams): Promise<NewsletterResponse> => {
    const response = await api.get(`/portal/newsletter?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetStats: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<NewsletterStatsResponse> => {
    const response = await api.get(`/portal/newsletter/stats?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<NewsletterResponse> => {
    const response = await api.get(`/portal/filter/newsletter?${buildQueryParams(params)}`);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/newsletter?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default newsletterService;
