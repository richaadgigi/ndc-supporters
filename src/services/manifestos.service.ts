import api from './api';

export interface Manifesto {
  unique_id: string;
  title: string;
  short_description: string;
  year_published: string;
  pages: number;
  file: string;
  file_type: string;
  file_public_id: string;
  updated_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: { unique_id: string; firstname: string; middlename: string | null; lastname: string; username: string; email: string; profile_image: string | null; Role?: { unique_id: string; name: string; stripped: string } };
}

export interface ManifestosResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Manifesto[]; pages: number } | Manifesto[] | null;
}

export interface ManifestoResponse {
  success: boolean;
  message: string;
  data: Manifesto | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const manifestosService = {
  getAll: async (params: PaginationParams): Promise<ManifestosResponse> => {
    const response = await api.get(`/user/manifestos?${buildQueryParams(params)}`);
    return response.data;
  },
  get: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<ManifestoResponse> => {
    const response = await api.get(`/user/manifesto?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },
  search: async (params: SearchParams): Promise<ManifestosResponse> => {
    const response = await api.get(`/user/search/manifestos?${buildQueryParams(params)}`);
    return response.data;
  },
  filter: async (params: FilterParams): Promise<ManifestosResponse> => {
    const response = await api.get(`/user/filter/manifestos?${buildQueryParams(params)}`);
    return response.data;
  },
  add: async (data: { title: string; short_description: string; year_published: string; pages: number; file: string; file_type: string; file_public_id: string; candidate_unique_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/manifesto/add?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editDetails: async (data: { unique_id: string; title: string; short_description: string; year_published: string; pages: number }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/manifesto/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editFile: async (data: { unique_id: string; file: string; file_type: string; file_public_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/manifesto/edit/file?${buildQueryParams(params)}`, data);
    return response.data;
  },
  delete: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/manifesto?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default manifestosService;
