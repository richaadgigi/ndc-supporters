import api from './api';

export interface FileStorage {
  unique_id: string;
  title: string | null;
  file: string;
  file_type: string;
  file_public_id: string;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Creator?: { unique_id: string; firstname: string; middlename: string | null; lastname: string; username: string; email: string; profile_image: string | null; Role?: { unique_id: string; name: string; stripped: string } };
}

export interface FileStorageListResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: FileStorage[]; pages: number } | FileStorage[] | null;
}

export interface FileStorageResponse {
  success: boolean;
  message: string;
  data: FileStorage | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const fileStorageService = {
  getAll: async (params: PaginationParams): Promise<FileStorageListResponse> => {
    const response = await api.get(`/user/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },
  get: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<FileStorageResponse> => {
    const response = await api.get(`/user/file/storage?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },
  search: async (params: SearchParams): Promise<FileStorageListResponse> => {
    const response = await api.get(`/user/search/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },
  filter: async (params: FilterParams): Promise<FileStorageListResponse> => {
    const response = await api.get(`/user/filter/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },
  add: async (data: { title?: string; file: string; file_type: string; file_public_id: string; candidate_unique_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/file/storage/add?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editDetails: async (data: { unique_id: string; title?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/file/storage/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editFile: async (data: { unique_id: string; file: string; file_type: string; file_public_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/file/storage/edit/file?${buildQueryParams(params)}`, data);
    return response.data;
  },
  delete: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/file/storage?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default fileStorageService;
