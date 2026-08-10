import altApi from './altApi';

export interface Lga {
  unique_id: string;
  name: string;
  stripped: string;
  state_unique_id: string | null;
}

export interface LgasResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Lga[]; pages: number } | Lga[] | null;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const lgasService = {
  publicGetAll: async (params?: { page?: number; size?: number; state_unique_id?: string }): Promise<LgasResponse> => {
    const response = await altApi.get(`/lgas?${buildQueryParams(params || {})}`);
    return response.data;
  },
};

export default lgasService;
