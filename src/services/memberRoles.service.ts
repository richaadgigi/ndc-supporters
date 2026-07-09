import api from './api';

export interface MemberRole {
  unique_id: string;
  name: string;
  stripped: string;
  updated_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberRolesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: MemberRole[]; pages: number } | MemberRole[] | null;
}

export interface MemberRoleResponse {
  success: boolean;
  message: string;
  data: MemberRole | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const memberRolesService = {
  publicGetAll: async (params?: { page?: number; size?: number }): Promise<MemberRolesResponse> => {
    const response = await api.get(`/member/roles?${buildQueryParams(params || {})}`);
    return response.data;
  },
  getAll: async (params: PaginationParams): Promise<MemberRolesResponse> => {
    const response = await api.get(`/user/member/roles?${buildQueryParams(params)}`);
    return response.data;
  },
  get: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<MemberRoleResponse> => {
    const response = await api.get(`/user/member/role?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },
  search: async (params: SearchParams): Promise<MemberRolesResponse> => {
    const response = await api.get(`/user/search/member/roles?${buildQueryParams(params)}`);
    return response.data;
  },
  filter: async (params: FilterParams): Promise<MemberRolesResponse> => {
    const response = await api.get(`/user/filter/member/roles?${buildQueryParams(params)}`);
    return response.data;
  },
  add: async (data: { name: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/member/role/add?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editDetails: async (data: { unique_id: string; name: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/member/role/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },
  delete: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/member/role?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default memberRolesService;
