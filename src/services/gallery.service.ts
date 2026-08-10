import api from './api';

export interface GalleryItem {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  title: string | null;
  tags: string[] | null;
  image: string;
  image_public_id: string;
  created_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Creator?: { unique_id: string; firstname: string; lastname: string; profile_image?: string | null; Role?: { name: string } } | null;
}

export type Gallery = GalleryItem;

export interface GalleryResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: GalleryItem[]; pages: number } | GalleryItem[] | null;
}

export interface GalleryItemResponse {
  success: boolean;
  message: string;
  data: GalleryItem | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const galleryService = {
  publicGetAll: async (params?: Record<string, any>): Promise<GalleryResponse> => {
    const response = await api.get(`/all/gallery?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicGetOne: async (unique_id: string, params?: Record<string, any>): Promise<GalleryItemResponse> => {
    const response = await api.get(`/gallery?${buildQueryParams({ unique_id, ...(params || {}) })}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<GalleryResponse> => {
    const response = await api.get(`/user/all/gallery?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.get(`/user/gallery?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<GalleryResponse> => {
    const response = await api.get(`/user/search/all/gallery?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<GalleryResponse> => {
    const response = await api.get(`/user/filter/all/gallery?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.post(`/user/gallery/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.put(`/user/gallery/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editTags: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.put(`/user/gallery/edit/tags?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editFile: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.put(`/user/gallery/edit/file?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/gallery?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<GalleryResponse> => {
    const response = await api.get(`/portal/all/gallery?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.get(`/portal/gallery?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<GalleryResponse> => {
    const response = await api.get(`/portal/search/all/gallery?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<GalleryResponse> => {
    const response = await api.get(`/portal/filter/all/gallery?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.post(`/portal/gallery/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.put(`/portal/gallery/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditTags: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.put(`/portal/gallery/edit/tags?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditFile: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<GalleryItemResponse> => {
    const response = await api.put(`/portal/gallery/edit/file?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/gallery?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default galleryService;
