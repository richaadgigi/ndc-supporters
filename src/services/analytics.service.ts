import api from './api';

export interface AdministrationStats {
  total_users: number;
  total_users_via_role: { Role: { name: string; stripped: string }; total_count: number }[];
}

export interface AdministrationStatsResponse {
  success: boolean;
  message: string;
  data: AdministrationStats | null;
}

export interface ApprovalStats {
  total_approvals: number;
  total_approval_via_approval_status: { approval_status: string; total_count: number }[];
  total_approvals_via_module: { Module: { name: string; stripped: string }; total_count: number }[];
  total_approvals_via_sub_module: { SubModule: { name: string; stripped: string }; total_count: number }[];
}

export interface ApprovalStatsResponse {
  success: boolean;
  message: string;
  data: ApprovalStats | null;
}

export interface LogStats {
  total_logs: number;
  total_log_via_type: { type: string; total_count: number }[];
}

export interface LogStatsResponse {
  success: boolean;
  message: string;
  data: LogStats | null;
}

export interface AclStats {
  total_acls: number;
  total_acls_via_role: { Role: { name: string; stripped: string }; total_count: number }[];
  total_acls_via_module: { Module: { name: string; stripped: string }; total_count: number }[];
  total_acls_via_sub_module: { SubModule: { name: string; stripped: string }; total_count: number }[];
}

export interface AclStatsResponse {
  success: boolean;
  message: string;
  data: AclStats | null;
}

export interface RoleStats {
  total_roles: number;
  total_role_acls: number;
  total_role_acls_via_role: { Role: { name: string; stripped: string }; total_count: number }[];
  total_role_acls_via_module: { Module: { name: string; stripped: string }; total_count: number }[];
  total_role_acls_via_sub_module: { SubModule: { name: string; stripped: string }; total_count: number }[];
}

export interface RoleStatsResponse {
  success: boolean;
  message: string;
  data: RoleStats | null;
}

export interface SupporterStats {
  total_support_group_types: number;
  total_support_groups: number;
  total_members: number;
  total_member_roles: number;
  total_member_role_acls: number;
  total_member_role_acls_via_member_role: { MemberRole: { name: string; stripped: string } | null; total_count: number }[];
  total_member_role_acls_via_module: { Module: { name: string; stripped: string } | null; total_count: number }[];
  total_member_role_acls_via_sub_module: { SubModule: { name: string; stripped: string } | null; total_count: number }[];
  total_support_group_via_zone: { zone: string | null; total_count: number }[];
  total_support_group_via_state: { state: string | null; total_count: number }[];
  total_support_group_via_lga: { lga: string | null; total_count: number }[];
  total_support_group_via_ward: { ward: string | null; total_count: number }[];
  total_support_group_via_constituency: { constituency: string | null; total_count: number }[];
  total_support_groups_via_support_group_types: { SupportGroupType: { title?: string; name?: string; stripped?: string } | null; total_count: number }[];
  total_members_via_support_group: { SupportGroup: { name: string; stripped: string } | null; total_count: number }[];
  total_members_via_member_role: { MemberRole: { name: string; stripped: string } | null; total_count: number }[];
}

export interface SupporterStatsResponse {
  success: boolean;
  message: string;
  data: SupporterStats | null;
}

export interface SupportGroupPortalStats {
  total_announcements: number;
  total_categories: number;
  total_enquiries: number;
  total_events: number;
  total_faqs: number;
  total_file_storage: number;
  total_galleries: number;
  total_members: number;
  total_newsletters: number;
  total_posts: number;
  announcement_views_sum: number;
  post_views_sum: number;
  post_minutes_read_sum: number;
  event_views_sum: number;
  total_file_storage_via_file_type: { file_type: string; total_count: number }[];
  total_enquiries_via_enquiry_status: { enquiry_status: string; total_count: number }[];
  total_newsletters_via_subscription: { subscription: boolean; total_count: number }[];
  total_posts_via_category: { Category: { name: string; stripped: string } | null; total_count: number }[];
  total_members_via_member_role: { MemberRole: { name: string; stripped: string } | null; total_count: number }[];
}

export interface SupportGroupPortalStatsResponse {
  success: boolean;
  message: string;
  data: SupportGroupPortalStats | null;
}

interface ModuleParams {
  module_unique_id: string;
  sub_module_unique_id?: string;
}

const buildQueryParams = (params: ModuleParams): string => {
  const queryParams = new URLSearchParams();
  if (params.module_unique_id) queryParams.append('module_unique_id', params.module_unique_id);
  if (params.sub_module_unique_id) queryParams.append('sub_module_unique_id', params.sub_module_unique_id);
  return queryParams.toString();
};

export const analyticsService = {
  getAdministrationStats: async (params: ModuleParams): Promise<AdministrationStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/administration/stats?${query}`);
    return response.data;
  },

  getApprovalStats: async (params: ModuleParams): Promise<ApprovalStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/approval/stats?${query}`);
    return response.data;
  },

  getLogStats: async (params: ModuleParams): Promise<LogStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/log/stats?${query}`);
    return response.data;
  },

  getAclStats: async (params: ModuleParams): Promise<AclStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/acl/stats?${query}`);
    return response.data;
  },

  getRoleStats: async (params: ModuleParams): Promise<RoleStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/role/stats?${query}`);
    return response.data;
  },

  getSupporterStats: async (params: ModuleParams): Promise<SupporterStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/supporter/stats?${query}`);
    return response.data;
  },

  getSupportGroupPortalStats: async (params: ModuleParams): Promise<SupportGroupPortalStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/user/support/group/portal/stats?${query}`);
    return response.data;
  },

  getPortalSupportGroupPortalStats: async (params: ModuleParams): Promise<SupportGroupPortalStatsResponse> => {
    const query = buildQueryParams(params);
    const response = await api.get(`/portal/support/group/portal/stats?${query}`);
    return response.data;
  },
};

export default analyticsService;
