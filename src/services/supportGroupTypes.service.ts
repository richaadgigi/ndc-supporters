import api from './api';

export interface SupportGroupType {
  unique_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportGroupTypesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: SupportGroupType[]; pages: number } | SupportGroupType[] | null;
}

export interface SupportGroupTypeResponse {
  success: boolean;
  message: string;
  data: SupportGroupType | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const supportGroupTypesService = {
  publicGetAll: async (params?: Record<string, any>): Promise<SupportGroupTypesResponse> => {
    const response = await api.get(`/support/group/types?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicGetOne: async (unique_id: string, params?: Record<string, any>): Promise<SupportGroupTypeResponse> => {
    const response = await api.get(`/support/group/type?${buildQueryParams({ unique_id, ...(params || {}) })}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<SupportGroupTypesResponse> => {
    const response = await api.get(`/user/support/group/types?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupTypeResponse> => {
    const response = await api.get(`/user/support/group/type?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<SupportGroupTypesResponse> => {
    const response = await api.get(`/user/search/support/group/types?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<SupportGroupTypesResponse> => {
    const response = await api.get(`/user/filter/support/group/types?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupTypeResponse> => {
    const response = await api.post(`/user/support/group/type/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupTypeResponse> => {
    const response = await api.put(`/user/support/group/type/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/support/group/type?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default supportGroupTypesService;
