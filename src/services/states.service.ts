import altApi from './altApi';

export interface State {
  unique_id: string;
  zone_unique_id: string | null;
  name: string;
  stripped: string;
  Zone?: { unique_id: string; name: string; stripped: string } | null;
}

export interface StatesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: State[]; pages: number } | State[] | null;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const statesService = {
  publicGetAll: async (params?: { page?: number; size?: number; zone_unique_id?: string }): Promise<StatesResponse> => {
    const response = await altApi.get(`/states?${buildQueryParams(params || {})}`);
    return response.data;
  },
};

export default statesService;
