import api from './api';

export interface Announcement {
  unique_id: string;
  support_group_unique_id: string;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  title: string;
  stripped: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  views: number;
  created_by: string | null;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroup?: { unique_id: string; name: string; stripped: string } | null;
  Creator?: { unique_id: string; firstname: string; lastname: string; profile_image?: string | null; Role?: { name: string } } | null;
  Approver?: { unique_id: string; firstname: string; lastname: string } | null;
}

export interface AnnouncementsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Announcement[]; pages: number } | Announcement[] | null;
}

export interface AnnouncementResponse {
  success: boolean;
  message: string;
  data: Announcement | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const announcementsService = {
  publicGetAll: async (params?: Record<string, any>): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/announcements?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicGetOne: async (unique_id: string, params?: Record<string, any>): Promise<AnnouncementResponse> => {
    const response = await api.get(`/announcement?${buildQueryParams({ unique_id, ...(params || {}) })}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/user/announcements?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.get(`/user/announcement?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/user/search/announcements?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/user/filter/announcements?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.post(`/user/announcement/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.put(`/user/announcement/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDescription: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.put(`/user/announcement/edit/description?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editTimeline: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.put(`/user/announcement/edit/timeline?${buildQueryParams(params)}`, data);
    return response.data;
  },

  approve: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/approve/announcement?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/announcement?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/portal/announcements?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.get(`/portal/announcement?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/portal/search/announcements?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<AnnouncementsResponse> => {
    const response = await api.get(`/portal/filter/announcements?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.post(`/portal/announcement/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.put(`/portal/announcement/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDescription: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.put(`/portal/announcement/edit/description?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditTimeline: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<AnnouncementResponse> => {
    const response = await api.put(`/portal/announcement/edit/timeline?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalApprove: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/approve/announcement?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/announcement?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default announcementsService;
