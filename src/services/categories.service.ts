import api from './api';

export interface Category {
  unique_id: string;
  candidate_unique_id: string;
  name: string;
  stripped: string;
  created_by: string;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Candidate?: { unique_id: string; name: string; stripped: string; state?: string; image?: string | null };
  Creator?: { unique_id: string; firstname: string; middlename?: string; lastname: string; username: string; Role?: { name: string } };
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

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
  candidate_unique_id?: string;
}

interface SearchParams extends PaginationParams {
  search: string;
}

interface FilterParams extends PaginationParams {
  start_date: string;
  end_date: string;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

const categoriesService = {
  publicGetAll: async (params?: { page?: number; size?: number }): Promise<CategoriesResponse> => {
    const response = await api.get(`/categories?${buildQueryParams(params || {})}`);
    return response.data;
  },
  getCategories: async (params: PaginationParams): Promise<CategoriesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/categories?${query}`);
    return response.data;
  },

  getCategory: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<CategoryResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/category?${query}`);
    return response.data;
  },

  searchCategories: async (params: SearchParams): Promise<CategoriesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/categories?${query}`);
    return response.data;
  },

  filterCategories: async (params: FilterParams): Promise<CategoriesResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/categories?${query}`);
    return response.data;
  },

  addCategory: async (
    data: { name: string; candidate_unique_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/category/add?${query}`, data);
    return response.data;
  },

  editDetails: async (
    data: { unique_id: string; name: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/category/edit/details?${query}`, data);
    return response.data;
  },

  approveCategory: async (
    data: { unique_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/approve/category?${query}`, data);
    return response.data;
  },

  deleteCategory: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/category?${query}`, { data: { unique_id } });
    return response.data;
  },
};

export default categoriesService;
