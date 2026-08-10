import altApi from './altApi';

export interface Ward {
  unique_id: string;
  name: string;
  stripped: string;
  lga_unique_id: string | null;
}

export interface WardsResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Ward[]; pages: number } | Ward[] | null;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const wardsService = {
  publicGetAll: async (params?: { page?: number; size?: number; lga_unique_id?: string }): Promise<WardsResponse> => {
    const response = await altApi.get(`/wards?${buildQueryParams(params || {})}`);
    return response.data;
  },
};

export default wardsService;
