import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
  support_group_unique_id?: string;
}

export interface ACL {
  unique_id: string;
  user_unique_id: string;
  role_unique_id: string;
  module_unique_id: string;
  sub_module_unique_id: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  acl_expiring: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Role: { unique_id: string; name: string; stripped: string };
  Module: { unique_id: string; name: string; stripped: string };
  SubModule: { unique_id: string; name: string; stripped: string };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    fullname: string;
    email?: string;
    profile_image?: string | null;
    acls: ACL[];
    support_group_unique_id?: string | null;
  } | null;
}

export interface PasswordRecoveryPayload {
  login_id: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post('/auth/signin/via/email', payload);
    return response.data;
  },

  portalLogin: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post('/auth/support/group/signin/via/email', payload);
    return response.data;
  },

  memberLogin: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post('/auth/support/group/member/signin/via/email', payload);
    return response.data;
  },

  verifyOtp: async (payload: { email: string; otp: string; remember_me?: boolean }): Promise<LoginResponse> => {
    const response = await api.post('/auth/otp/verify', payload);
    return response.data;
  },

  verifySupportGroupOtp: async (payload: { email: string; otp: string; remember_me?: boolean }): Promise<LoginResponse> => {
    const response = await api.post('/auth/support/group/otp/verify', payload);
    return response.data;
  },

  verifySupportGroupMemberOtp: async (payload: { email: string; otp: string; remember_me?: boolean; support_group_unique_id?: string }): Promise<LoginResponse> => {
    const response = await api.post('/auth/support/group/member/otp/verify', payload);
    return response.data;
  },

  passwordRecovery: async (payload: PasswordRecoveryPayload) => {
    const response = await api.post('/password/recover', payload);
    return response.data;
  },

  changePassword: async (payload: { oldPassword: string; password: string; confirmPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/user/update/profile/password', payload);
    return response.data;
  },
};

export default authService;
