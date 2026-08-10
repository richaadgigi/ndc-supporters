import api from './api';

export const EVENT_TYPES = ['Live', 'Physical'] as const;

export interface Event {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
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
  repeats: Record<string, any> | null;
  tags: string[] | null;
  views: number;
  image: string | null;
  image_public_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Creator?: { unique_id: string; firstname: string; lastname: string; profile_image?: string | null; Role?: { name: string } } | null;
  Approver?: { unique_id: string; firstname: string; lastname: string } | null;
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
  publicGetAll: async (params?: Record<string, any>): Promise<EventsResponse> => {
    const response = await api.get(`/events?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicGetOne: async (unique_id: string, params?: Record<string, any>): Promise<EventResponse> => {
    const response = await api.get(`/event?${buildQueryParams({ unique_id, ...(params || {}) })}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<EventsResponse> => {
    const response = await api.get(`/user/events?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
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

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.post(`/user/event/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/user/event/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDescription: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/user/event/edit/description?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editTimeline: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/user/event/edit/timeline?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editTags: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/user/event/edit/tags?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editImage: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/user/event/edit/image?${buildQueryParams(params)}`, data);
    return response.data;
  },

  approve: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/approve/event?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/event?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<EventsResponse> => {
    const response = await api.get(`/portal/events?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.get(`/portal/event?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<EventsResponse> => {
    const response = await api.get(`/portal/search/events?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<EventsResponse> => {
    const response = await api.get(`/portal/filter/events?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.post(`/portal/event/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/portal/event/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDescription: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/portal/event/edit/description?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditTimeline: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/portal/event/edit/timeline?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditTags: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/portal/event/edit/tags?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditImage: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<EventResponse> => {
    const response = await api.put(`/portal/event/edit/image?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalApprove: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/approve/event?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/event?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default eventsService;
