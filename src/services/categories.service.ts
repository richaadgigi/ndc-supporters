import api from './api';

export interface Category {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  name: string;
  stripped: string;
  created_by: string | null;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Creator?: { unique_id: string; firstname: string; lastname: string; Role?: { name: string } } | null;
  Approver?: { unique_id: string; firstname: string; lastname: string } | null;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Category[]; pages: number } | Category[] | null;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const categoriesService = {
  publicGetAll: async (params?: Record<string, any>): Promise<CategoriesResponse> => {
    const response = await api.get(`/categories?${buildQueryParams(params || {})}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<CategoriesResponse> => {
    const response = await api.get(`/user/categories?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CategoryResponse> => {
    const response = await api.get(`/user/category?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<CategoriesResponse> => {
    const response = await api.get(`/user/search/categories?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<CategoriesResponse> => {
    const response = await api.get(`/user/filter/categories?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CategoryResponse> => {
    const response = await api.post(`/user/category/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CategoryResponse> => {
    const response = await api.put(`/user/category/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  approve: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/approve/category?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/category?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<CategoriesResponse> => {
    const response = await api.get(`/portal/categories?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CategoryResponse> => {
    const response = await api.get(`/portal/category?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<CategoriesResponse> => {
    const response = await api.get(`/portal/search/categories?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<CategoriesResponse> => {
    const response = await api.get(`/portal/filter/categories?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CategoryResponse> => {
    const response = await api.post(`/portal/category/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CategoryResponse> => {
    const response = await api.put(`/portal/category/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalApprove: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/approve/category?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/category?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default categoriesService;
