import altApi from './altApi';

export interface Zone {
  unique_id: string;
  name: string;
  stripped: string;
}

export interface ZonesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Zone[]; pages: number } | Zone[] | null;
}

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const zonesService = {
  publicGetAll: async (params?: { page?: number; size?: number }): Promise<ZonesResponse> => {
    const response = await altApi.get(`/zones?${buildQueryParams(params || {})}`);
    return response.data;
  },
};

export default zonesService;
