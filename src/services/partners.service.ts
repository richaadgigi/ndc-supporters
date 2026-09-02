import api from './api';

export interface Partner {
  unique_id: string;
  partner_type: string;
  organisation_name: string | null;
  year_established: number;
  cac_number: string | null;
  website: string | null;
  social_links: string[] | null;
  contact_name: string;
  role: string;
  phone_number: string;
  email: string;
  country: string;
  state: string | null;
  lga: string | null;
  where_do_you_operate: string;
  what_does_organisation_do: string;
  charter_areas: string[] | null;
  what_would_you_want_to_do_together: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartnersResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Partner[]; pages: number } | Partner[] | null;
}

export interface PartnerResponse {
  success: boolean;
  message: string;
  data: Partner | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const partnersService = {
  publicGetAll: async (params?: Record<string, any>): Promise<PartnersResponse> => {
    const response = await api.get(`/partners?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicAdd: async (data: Record<string, any>): Promise<PartnerResponse> => {
    const response = await api.post('/partner/add', data);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<PartnersResponse> => {
    const response = await api.get(`/user/partners?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<PartnerResponse> => {
    const response = await api.get(`/user/partner?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<PartnersResponse> => {
    const response = await api.get(`/user/search/partners?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<PartnersResponse> => {
    const response = await api.get(`/user/filter/partners?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<PartnerResponse> => {
    const response = await api.post(`/user/partner/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<PartnerResponse> => {
    const response = await api.put(`/user/partner/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/partner?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default partnersService;
