import api from './api';

export const MEMBER_STATUSES = ['Active', 'Inactive', 'Pending', 'Suspended', 'Revoked'] as const;

export interface SupportGroupMember {
  unique_id: string;
  user_unique_id: string;
  member_unique_id: string;
  support_group_unique_id: string;
  admin: boolean;
  member_status: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: { unique_id: string; firstname: string; middlename?: string | null; lastname: string; email: string; phone_number?: string | null; gender?: string | null; date_of_birth?: string | null; profile_image?: string | null; Role?: { unique_id: string; name: string; stripped: string } } | null;
  Member?: { unique_id: string; code?: string | null; nin?: string | null } | null;
  SupportGroup?: { unique_id: string; name: string; stripped?: string; image?: string | null; zone?: string | null; state?: string | null; lga?: string | null; ward?: string | null; constituency?: string | null; scope_option?: string; views?: number; support_group_status?: string | null; SupportGroupType?: { unique_id: string; title: string; is_active?: boolean } | null } | null;
}

export interface SupportGroupMembersResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: SupportGroupMember[]; pages: number } | SupportGroupMember[] | null;
}

export interface SupportGroupMemberResponse {
  success: boolean;
  message: string;
  data: SupportGroupMember | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const supportGroupMembersService = {
  publicGetAll: async (params?: Record<string, any>): Promise<SupportGroupMembersResponse> => {
    const response = await api.get(`/support/group/members?${buildQueryParams(params || {})}`);
    return response.data;
  },

  publicJoin: async (data: Record<string, any>): Promise<SupportGroupMemberResponse> => {
    const response = await api.post('/support/group/member/join', data);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<SupportGroupMembersResponse> => {
    const response = await api.get(`/user/support/group/members?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupMemberResponse> => {
    const response = await api.get(`/user/support/group/member?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<SupportGroupMembersResponse> => {
    const response = await api.get(`/user/search/support/group/members?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<SupportGroupMembersResponse> => {
    const response = await api.get(`/user/filter/support/group/members?${buildQueryParams(params)}`);
    return response.data;
  },

  toggleAdmin: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/member/toggle/admin?${buildQueryParams(params)}`, data);
    return response.data;
  },

  approve: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/member/approve?${buildQueryParams(params)}`, data);
    return response.data;
  },

  autoApprove: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/members/auto_approve?${buildQueryParams(params)}`, {});
    return response.data;
  },

  approveMultiple: async (data: { unique_ids: string[] }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/members/approve/multiple?${buildQueryParams(params)}`, data);
    return response.data;
  },

  activate: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/member/activate?${buildQueryParams(params)}`, data);
    return response.data;
  },

  suspend: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/member/suspend?${buildQueryParams(params)}`, data);
    return response.data;
  },

  revoke: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/support/group/member/revoke?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/support/group/member?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  portalGetUserGroups: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupMembersResponse> => {
    const response = await api.get(`/portal/user/support/groups?${buildQueryParams(params)}`);
    return response.data;
  },

  portalJoinViaProfile: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<SupportGroupMemberResponse> => {
    const response = await api.post(`/portal/support/group/member/join/via/member_profile?${buildQueryParams({ ...params, support_group_unique_id: data.support_group_unique_id })}`, data);
    return response.data;
  },

  portalToggleAdmin: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/user/support/group/member/toggle/admin?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalApprove: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/user/support/group/member/approve?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalApproveMultiple: async (data: { unique_ids: string[] }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/user/support/group/members/approve/multiple?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalActivate: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/user/support/group/member/activate?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalSuspend: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/user/support/group/member/suspend?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRevoke: async (data: { unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/portal/user/support/group/member/revoke?${buildQueryParams(params)}`, data);
    return response.data;
  },
};

export default supportGroupMembersService;
