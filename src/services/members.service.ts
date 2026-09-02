import api from './api';

export interface Member {
  unique_id: string;
  user_unique_id: string;
  support_group_unique_id: string;
  member_role_unique_id: string;
  creator_unique_id: string | null;
  zone: string;
  state: string | null;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  code: string;
  nin: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: { unique_id: string; firstname: string; middlename?: string | null; lastname: string; email: string; phone_number?: string | null; gender?: string | null; date_of_birth?: string | null; profile_image?: string | null; Role?: { unique_id: string; name: string; stripped: string } } | null;
  SupportGroup?: { unique_id: string; name: string; stripped: string; image?: string | null; state?: string | null } | null;
  MemberRole?: { unique_id: string; name: string; stripped: string } | null;
  Creator?: { unique_id: string; code?: string | null; nin?: string | null } | null;
}

export interface MembersResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Member[]; pages: number } | Member[] | null;
}

export interface MemberResponse {
  success: boolean;
  message: string;
  data: Member | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const membersService = {
  publicGetAll: async (params?: Record<string, any>): Promise<MembersResponse> => {
    const response = await api.get(`/members?${buildQueryParams(params || {})}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<MembersResponse> => {
    const response = await api.get(`/user/members?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<MemberResponse> => {
    const response = await api.get(`/user/member?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<MembersResponse> => {
    const response = await api.get(`/user/search/members?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<MembersResponse> => {
    const response = await api.get(`/user/filter/members?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<MemberResponse> => {
    const response = await api.post(`/user/member/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/member?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  editRole: async (data: { unique_id: string; member_role_unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/member/role?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalGetAll: async (params: PaginationParams): Promise<MembersResponse> => {
    const response = await api.get(`/portal/team/members?${buildQueryParams(params)}`);
    return response.data;
  },

  portalGetOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<MemberResponse> => {
    const response = await api.get(`/portal/team/member?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  portalGetProfile: async (params?: Partial<Omit<PaginationParams, 'page' | 'size'>>): Promise<MemberResponse> => {
    const response = await api.get(`/portal/member/profile?${buildQueryParams(params || {})}`);
    return response.data;
  },

  portalSearch: async (params: SearchParams): Promise<MembersResponse> => {
    const response = await api.get(`/portal/team/search/members?${buildQueryParams(params)}`);
    return response.data;
  },

  portalFilter: async (params: FilterParams): Promise<MembersResponse> => {
    const response = await api.get(`/portal/team/filter/members?${buildQueryParams(params)}`);
    return response.data;
  },

  portalAdd: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<MemberResponse> => {
    const response = await api.post(`/portal/team/member/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  portalRemove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/portal/team/member?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default membersService;
