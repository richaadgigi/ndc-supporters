import api from './api';

export interface Gallery {
  unique_id: string;
  title?: string;
  tags?: string[];
  image: string;
  image_public_id: string;
  created_by: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  Creator?: { unique_id: string; firstname: string; middlename: string | null; lastname: string; username: string; email: string; profile_image: string | null; Role?: { unique_id: string; name: string; stripped: string } };
}

export interface GalleryListResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Gallery[]; pages: number } | Gallery[] | null;
}

export interface GalleryResponse {
  success: boolean;
  message: string;
  data: Gallery | null;
}

interface PaginationParams {
  page?: number;
  size?: number;
  orderBy?: string;
  sortBy?: 'ASC' | 'DESC';
  module_unique_id: string;
  sub_module_unique_id?: string;
  tags?: string;
}

interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') queryParams.append(key, String(value));
  });
  return queryParams.toString();
};

const galleryService = {
  getAll: async (params: PaginationParams): Promise<GalleryListResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/all/gallery?${query}`);
    return response.data;
  },

  get: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<GalleryResponse> => {
    const query = buildQueryParams({ unique_id, ...params });
    const response = await api.get(`/user/gallery?${query}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<GalleryListResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/search/all/gallery?${query}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<GalleryListResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/filter/all/gallery?${query}`);
    return response.data;
  },

  add: async (
    data: { title?: string; tags?: string[]; image: string; image_public_id: string; candidate_unique_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.post(`/user/gallery/add?${query}`, data);
    return response.data;
  },

  editDetails: async (
    data: { unique_id: string; title: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/gallery/edit/details?${query}`, data);
    return response.data;
  },

  editTags: async (
    data: { unique_id: string; tags: string[] },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/gallery/edit/tags?${query}`, data);
    return response.data;
  },

  editImage: async (
    data: { unique_id: string; image: string; image_public_id: string },
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.put(`/user/gallery/edit/image?${query}`, data);
    return response.data;
  },

  delete: async (
    unique_id: string,
    params: { module_unique_id: string; sub_module_unique_id?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const query = buildQueryParams(params);
    const response = await api.delete(`/user/gallery?${query}`, { data: { unique_id } });
    return response.data;
  },
};

export default galleryService;
