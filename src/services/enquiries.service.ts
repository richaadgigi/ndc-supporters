import api from './api';

export interface Enquiry {
  unique_id: string;
  candidate_unique_id: string | null;
  name: string;
  email: string;
  phone_number: string | null;
  title: string;
  details: string;
  enquiry_status: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Candidate?: { unique_id: string; name: string; stripped: string } | null;
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

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const enquiriesService = {
  add: async (data: Record<string, any>): Promise<EnquiryResponse> => {
    const response = await api.post(`/add/enquiry`, data);
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

  search: async (params: SearchParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/user/search/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<EnquiriesResponse> => {
    const response = await api.get(`/user/filter/enquiries?${buildQueryParams(params)}`);
    return response.data;
  },

  complete: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EnquiryResponse> => {
    const response = await api.put(`/user/complete/enquiry?${buildQueryParams(params)}`, { unique_id });
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/enquiry?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default enquiriesService;
