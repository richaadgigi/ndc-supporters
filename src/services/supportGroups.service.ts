import api from './api';

export const SCOPE_OPTIONS = ['Constituency', 'Ward', 'LGA', 'State', 'National', 'Diaspora'] as const;
export const SUPPORT_GROUP_STATUSES = ['Active', 'Inactive', 'Pending', 'Suspended', 'Revoked'] as const;

export interface SupportGroup {
  unique_id: string;
  support_group_type_unique_id: string | null;
  user_unique_id: string;
  member_unique_id: string | null;
  zone: string | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  name: string;
  stripped: string;
  scope_option: string;
  states_covered: any[] | null;
  contact_name: string | null;
  contact_office_address: string | null;
  contact_phone_number: string | null;
  contact_alt_phone_number: string | null;
  contact_email: string | null;
  account_number: string | null;
  account_name: string | null;
  account_bank: string | null;
  account_other: string | null;
  views: number;
  image: string | null;
  image_public_id: string | null;
  support_group_status: string | null;
  approved_by: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  SupportGroupType?: { unique_id: string; title: string; description?: string | null } | null;
  User?: { unique_id: string; firstname: string; middlename?: string | null; lastname: string; email?: string; phone_number?: string | null; gender?: string | null; date_of_birth?: string | null; profile_image?: string | null; Role?: { unique_id: string; name: string; stripped: string } | null } | null;
  Member?: { unique_id: string; code?: string | null; nin?: string | null } | null;
  Approver?: { unique_id: string; firstname: string; lastname: string } | null;
}

export interface SupportGroupsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: SupportGroup[]; pages: number } | SupportGroup[] | null;
}

export interface SupportGroupResponse {
  success: boolean;
  message: string;
  data: SupportGroup | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const supportGroupsService = {
  publicGetAll: async (params?: Record<string, any>): Promise<SupportGroupsResponse> => {
    const response = await api.get(`/support/groups?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicGetOne: async (unique_id: string, params?: Record<string, any>): Promise<SupportGroupResponse> => {
    const response = await api.get(`/support/group?${buildQueryParams({ unique_id, ...(params || {}) })}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<SupportGroupsResponse> => {
    const response = await api.get(`/user/support/groups?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.get(`/user/support/group?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<SupportGroupsResponse> => {
    const response = await api.get(`/user/search/support/groups?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<SupportGroupsResponse> => {
    const response = await api.get(`/user/filter/support/groups?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.post(`/user/support/group/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  approve: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/approve?${buildQueryParams(params)}`, data);
    return response.data;
  },

  autoApprove: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/groups/auto_approve?${buildQueryParams(params)}`, {});
    return response.data;
  },

  approveMultiple: async (data: { unique_ids: string[] }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/groups/approve/multiple?${buildQueryParams(params)}`, data);
    return response.data;
  },

  activate: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/activate?${buildQueryParams(params)}`, data);
    return response.data;
  },

  suspend: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/suspend?${buildQueryParams(params)}`, data);
    return response.data;
  },

  revoke: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/revoke?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditType: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/profile/edit/type?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/profile/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditProfileDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/profile/edit/profile/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditContactInfo: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/profile/edit/contact_information?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditAccountInfo: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/profile/edit/account_information?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditDemography: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/profile/edit/demography?${buildQueryParams(params)}`, data);
    return response.data;
  },

  adminEditImage: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/user/support/group/edit/image?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/support/group?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetProfile: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.get(`/portal/support/group/profile?${buildQueryParams(params)}`);
    return response.data;
  },

  portalEditType: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/type?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditProfileDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/profile/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditContactInfo: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/contact_information?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditAccountInfo: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/account_information?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditDemography: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/demography?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalEditImage: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupResponse> => {
    const response = await api.put(`/portal/support/group/profile/edit/image?${buildQueryParams(params)}`, data);
    return response.data;
  },
};

export default supportGroupsService;
