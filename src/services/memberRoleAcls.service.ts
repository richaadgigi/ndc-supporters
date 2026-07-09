import api from './api';

export interface MemberRoleAcl {
  unique_id: string;
  member_role_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id: string | null;
  filters: any[] | null;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
  MemberRole?: { unique_id: string; name: string; stripped: string };
  Module?: { unique_id: string; name: string; stripped: string };
  SubModule?: { unique_id: string; name: string; stripped: string } | null;
}

export interface MemberRoleAclsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: MemberRoleAcl[]; pages: number } | MemberRoleAcl[] | null;
}

export interface MemberRoleAclResponse {
  success: boolean;
  message: string;
  data: MemberRoleAcl | null;
}

export interface AclPermissions {
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  filters?: any[];
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const memberRoleAclsService = {
  getAll: async (params: PaginationParams): Promise<MemberRoleAclsResponse> => {
    const response = await api.get(`/user/member/role/acls?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<MemberRoleAclResponse> => {
    const response = await api.get(`/user/member/role/acl?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<MemberRoleAclsResponse> => {
    const response = await api.get(`/user/filter/member/role/acls?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (
    data: { member_role_unique_id: string; module_unique_id: string; sub_module_unique_id?: string } & AclPermissions,
    params: Omit<PaginationParams, 'page' | 'size'>
  ): Promise<MemberRoleAclResponse> => {
    const response = await api.post(`/user/member/role/acl/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  addMultiple: async (
    data: { member_role_unique_id: string; member_role_acls: ({ module_unique_id: string; sub_module_unique_id?: string } & AclPermissions)[] },
    params: Omit<PaginationParams, 'page' | 'size'>
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/user/member/role/acl/add/multiple?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (
    data: { unique_id: string } & AclPermissions,
    params: Omit<PaginationParams, 'page' | 'size'>
  ): Promise<MemberRoleAclResponse> => {
    const response = await api.put(`/user/member/role/acl/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/member/role/acl?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default memberRoleAclsService;
