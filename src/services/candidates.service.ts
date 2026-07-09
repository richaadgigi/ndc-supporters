import api from './api';

export interface Candidate {
  unique_id: string;
  position_unique_id: string | null;
  running_mate_unique_id: string | null;
  name: string;
  stripped: string;
  gender: string;
  date_of_birth: string | null;
  slogan: string | null;
  bio: string | null;
  key_facts: any[] | null;
  education: any[] | null;
  career_history: any[] | null;
  previous_public_offices: any[] | null;
  manifesto: any[] | null;
  social_media: any[] | null;
  state: string;
  lga: string | null;
  ward: string | null;
  constituency: string | null;
  views: number;
  image: string | null;
  image_public_id: string | null;
  image_base64: string | null;
  contact_office_address: string | null;
  contact_phone_number: string | null;
  contact_alt_phone_number: string | null;
  contact_email: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  Position?: { unique_id: string; name: string; stripped: string };
  RunningMate?: { unique_id: string; name: string; stripped: string } | null;
}

export interface CandidatesResponse {
  success: boolean;
  message: string;
  data: { count: number; rows: Candidate[]; pages: number } | Candidate[] | null;
}

export interface CandidateResponse {
  success: boolean;
  message: string;
  data: Candidate | null;
}

interface PaginationParams { page?: number; size?: number; orderBy?: string; sortBy?: 'ASC' | 'DESC'; module_unique_id: string; sub_module_unique_id?: string; }
interface SearchParams extends PaginationParams { search: string; }
interface FilterParams extends PaginationParams { start_date: string; end_date: string; }

const buildQueryParams = (params: Record<string, any>): string => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qp.append(k, String(v)); });
  return qp.toString();
};

const candidatesService = {
  publicGetAll: async (params?: Record<string, any>): Promise<CandidatesResponse> => {
    const response = await api.get(`/candidates?${buildQueryParams(params || {})}`);
    return response.data;
  },

  getAll: async (params: PaginationParams): Promise<CandidatesResponse> => {
    const response = await api.get(`/user/candidates?${buildQueryParams(params)}`);
    return response.data;
  },

  getOne: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.get(`/user/candidate?${buildQueryParams({ unique_id, ...params })}`);
    return response.data;
  },

  search: async (params: SearchParams): Promise<CandidatesResponse> => {
    const response = await api.get(`/user/search/candidates?${buildQueryParams(params)}`);
    return response.data;
  },

  filter: async (params: FilterParams): Promise<CandidatesResponse> => {
    const response = await api.get(`/user/filter/candidates?${buildQueryParams(params)}`);
    return response.data;
  },

  add: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.post(`/user/candidate/add?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editBio: async (data: { unique_id: string; bio?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/bio?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editContents: async (data: { unique_id: string; key_facts?: any[]; education?: any[]; career_history?: any[]; previous_public_offices?: any[]; manifesto?: any[]; social_media?: any[] }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/contents?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editRunningMate: async (data: { unique_id: string; running_mate_unique_id?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/running_mate?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editLocation: async (data: { unique_id: string; state: string; lga?: string; ward?: string; constituency?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/location?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editContactInformation: async (data: { unique_id: string; contact_office_address?: string; contact_phone_number?: string; contact_alt_phone_number?: string; contact_email?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/contact_information?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editImage: async (data: { unique_id: string; image: string; image_public_id?: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/image?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editPosition: async (data: { unique_id: string; position_unique_id: string }, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/user/candidate/edit/position?${buildQueryParams(params)}`, data);
    return response.data;
  },

  remove: async (unique_id: string, params: Omit<PaginationParams, 'page' | 'size'>): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/user/candidate?${buildQueryParams(params)}`, { data: { unique_id } });
    return response.data;
  },

  getProfile: async (params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.get(`/portal/candidate/profile?${buildQueryParams(params)}`);
    return response.data;
  },

  editProfileDetails: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/portal/candidate/profile/edit/details?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editProfileBio: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/portal/candidate/profile/edit/bio?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editProfileLocation: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/portal/candidate/profile/edit/location?${buildQueryParams(params)}`, data);
    return response.data;
  },

  editProfileContactInformation: async (data: Record<string, any>, params: Omit<PaginationParams, 'page' | 'size'>): Promise<CandidateResponse> => {
    const response = await api.put(`/portal/candidate/profile/edit/contact_information?${buildQueryParams(params)}`, data);
    return response.data;
  },
};

export default candidatesService;
