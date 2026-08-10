import api from './api';

export interface Faq {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  question: string;
  answer: string;
  updated_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Updater?: { unique_id: string; firstname: string; lastname: string } | null;
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
  publicGetAll: async (params?: Record<string, any>): Promise<FaqsResponse> => {
    const response = await api.get(`/faqs?${buildQueryParams(params || {})}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<FaqsResponse> => {
    const response = await api.get(`/user/faqs?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FaqResponse> => {
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

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FaqResponse> => {
    const response = await api.post(`/user/faq/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FaqResponse> => {
    const response = await api.put(`/user/faq/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/faq?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<FaqsResponse> => {
    const response = await api.get(`/portal/faqs?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FaqResponse> => {
    const response = await api.get(`/portal/faq?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<FaqsResponse> => {
    const response = await api.get(`/portal/search/faqs?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<FaqsResponse> => {
    const response = await api.get(`/portal/filter/faqs?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FaqResponse> => {
    const response = await api.post(`/portal/faq/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FaqResponse> => {
    const response = await api.put(`/portal/faq/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/faq?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default faqsService;
