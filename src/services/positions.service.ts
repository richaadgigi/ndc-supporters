import api from './api';

export interface Position {
  unique_id: string;
  name: string;
  stripped: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface PositionsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Position[]; pages: number } | Position[] | null;
}

export interface PositionResponse {
  success: boolean;
  message: string;
  data: Position | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const positionsService = {
  publicGetAll: async (params?: Record<string, any>): Promise<PositionsResponse> => {
    const response = await api.get(`/positions?${buildQueryParams(params || {})}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<PositionsResponse> => {
    const response = await api.get(`/user/positions?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<PositionResponse> => {
    const response = await api.get(`/user/position?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<PositionsResponse> => {
    const response = await api.get(`/user/search/positions?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<PositionsResponse> => {
    const response = await api.get(`/user/filter/positions?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: { name: string; description?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<PositionResponse> => {
    const response = await api.post(`/user/position/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: { unique_id: string; name?: string; description?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<PositionResponse> => {
    const response = await api.put(`/user/position/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/position?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },
};

export default positionsService;
