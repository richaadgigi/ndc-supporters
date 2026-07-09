import api from './api';

export interface Event {
  unique_id: string;
  title: string;
  stripped: string;
  alt_text: string;
  type: string;
  description: string;
  location: string | null;
  link: string | null;
  start_date: string;
  start_time: string;
  end_date: string | null;
  end_time: string | null;
  repeats: string[] | null;
  tags: string[] | null;
  image: string | null;
  image_public_id: string | null;
  views: number;
  created_by: string;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Creator?: { unique_id: string; firstname: string; middlename: string | null; lastname: string; username: string; email: string; profile_image: string | null; Role?: { unique_id: string; name: string; stripped: string } };
  Approver?: { unique_id: string; firstname: string; middlename: string | null; lastname: string } | null;
}

export interface EventsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Event[]; pages: number } | Event[] | null;
}

export interface EventResponse {
  success: boolean;
  message: string;
  data: Event | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const eventsService = {
  getAll: async (params: PaginationParams): Promise<EventsResponse> => {
    const response = await api.get(`/user/events?${buildQueryParams(params)}`);
    return response.data;
  },
  get: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<EventResponse> => {
    const response = await api.get(`/user/event?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },
  search: async (params: SearchParams): Promise<EventsResponse> => {
    const response = await api.get(`/user/search/events?${buildQueryParams(params)}`);
    return response.data;
  },
  filter: async (params: FilterParams): Promise<EventsResponse> => {
    const response = await api.get(`/user/filter/events?${buildQueryParams(params)}`);
    return response.data;
  },
  add: async (data: { candidate_unique_id: string; title: string; alt_text: string; type: string; description: string; start_date: string; start_time: string; end_date?: string; end_time?: string; location?: string; link?: string; repeats?: string[]; tags?: string[]; image?: string; image_public_id?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/event/add?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editDetails: async (data: { unique_id: string; title: string; alt_text: string; type: string; location?: string; link?: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/event/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editDescription: async (data: { unique_id: string; description: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/event/edit/description?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editTimeline: async (data: { unique_id: string; start_date: string; start_time: string; end_date?: string; end_time?: string; repeats?: string[] }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/event/edit/timeline?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editImage: async (data: { unique_id: string; image: string; image_public_id: string }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/event/edit/image?${buildQueryParams(params)}`, data);
    return response.data;
  },
  editTags: async (data: { unique_id: string; tags: string[] }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/event/edit/tags?${buildQueryParams(params)}`, data);
    return response.data;
  },
  approve: async (data: { unique_id: string; approved: boolean }, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/approve/event?${buildQueryParams(params)}`, data);
    return response.data;
  },
  delete: async (unique_id: string, params: { module_unique_id: string; sub_module_unique_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/event?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default eventsService;
