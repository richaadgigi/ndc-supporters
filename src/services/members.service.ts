import api from './api';

export interface Member {
  unique_id: string;
  user_unique_id: string;
  candidate_unique_id: string;
  member_role_unique_id: string;
  creator_unique_id: string | null;
  code: string | null;
  nin: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: { unique_id: string; firstname: string; lastname: string; email: string };
  Candidate?: { unique_id: string; name: string; stripped: string };
  MemberRole?: { unique_id: string; name: string; stripped: string } | null;
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

  add: async (data: { firstname: string; lastname: string; email: string; member_role_unique_id: string; candidate_unique_id: string; code: string; middlename?: string; phone_number?: string; gender?: string; date_of_birth?: string; nin?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<MemberResponse> => {
    const response = await api.post(`/user/member/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/member?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default membersService;
