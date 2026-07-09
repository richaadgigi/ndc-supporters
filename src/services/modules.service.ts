import api from './api';

export interface SubModule {
  unique_id: string;
  module_unique_id: string;
  name: string;
  stripped: string;
  status: number;
}

export interface Module {
  unique_id: string;
  name: string;
  stripped: string;
  status: number;
  SubModules?: SubModule[];
}

export interface ModulesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Module[]; pages: number } | Module[] | null;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const modulesService = {
  getAll: async (params: { module_unique_id: string; sub_module_unique_id?: string; size?: number }): Promise<ModulesResponse> => {
    const response = await api.get(`/user/modules?${buildQueryParams({ ...params, size: params.size ?? 100 })}`);
    return response.data;
  },
};

export default modulesService;
