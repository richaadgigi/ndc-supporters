import api from './api';

export const ENQUIRY_STATUSES = ['Pending', 'Processing', 'Completed'] as const;

export interface Enquiry {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  name: string;
  email: string;
  phone_number: string | null;
  title: string;
  details: string;
  enquiry_status: string;
  updated_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Updater?: { unique_id: string; firstname: string; lastname: string } | null;
}

export interface EnquiriesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Enquiry[]; pages: number } | Enquiry[] | null;
}

export interface EnquiryResponse {
  success: boolean;
  message: string;
  data: Enquiry | null;
}

export interface EnquiryStats {
  total_enquiries: number;
}

export interface EnquiryStatsResponse {
  success: boolean;
  message: string;
  data: EnquiryStats | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const enquiriesService = {
  publicAdd: async (data: Record<string, any>): Promise<EnquiryResponse> => {
    const response = await api.post('/add/enquiry', data);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/user/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EnquiryResponse> => {
    const response = await api.get(`/user/enquiry?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  getStats: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<EnquiryStatsResponse> => {
    const response = await api.get(`/user/enquiry/stats?${buildQueryParams(params)}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/user/search/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/user/filter/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  complete: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/complete/enquiry?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/enquiry?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/portal/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EnquiryResponse> => {
    const response = await api.get(`/portal/enquiry?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalGetStats: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<EnquiryStatsResponse> => {
    const response = await api.get(`/portal/enquiry/stats?${buildQueryParams(params)}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/portal/search/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/portal/filter/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  portalComplete: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/complete/enquiry?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/enquiry?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default enquiriesService;
