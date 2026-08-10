import api from './api';

export interface FileStorageItem {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  title: string | null;
  file: string;
  file_type: string;
  file_public_id: string;
  created_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Creator?: { unique_id: string; firstname: string; lastname: string; profile_image?: string | null; Role?: { name: string } } | null;
}

export type FileStorage = FileStorageItem;

export interface FileStorageResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: FileStorageItem[]; pages: number } | FileStorageItem[] | null;
}

export interface FileStorageItemResponse {
  success: boolean;
  message: string;
  data: FileStorageItem | null;
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
  publicGetAll: async (params?: Record<string, any>): Promise<FileStorageResponse> => {
    const response = await api.get(`/all/file/storage?${buildQueryParams(params || {})}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<FileStorageResponse> => {
    const response = await api.get(`/user/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.get(`/user/file/storage?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<FileStorageResponse> => {
    const response = await api.get(`/user/search/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<FileStorageResponse> => {
    const response = await api.get(`/user/filter/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.post(`/user/file/storage/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.put(`/user/file/storage/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editFile: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.put(`/user/file/storage/edit/file?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/file/storage?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<FileStorageResponse> => {
    const response = await api.get(`/portal/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.get(`/portal/file/storage?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<FileStorageResponse> => {
    const response = await api.get(`/portal/search/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<FileStorageResponse> => {
    const response = await api.get(`/portal/filter/all/file/storage?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.post(`/portal/file/storage/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.put(`/portal/file/storage/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditFile: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<FileStorageItemResponse> => {
    const response = await api.put(`/portal/file/storage/edit/file?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/file/storage?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default fileStorageService;
