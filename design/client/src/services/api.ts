import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export interface Component {
  id: string;
  type: string;
  parentId: string | null;
  level: number;
  brand: string;
  model: string;
  name: string;
  specs: Record<string, any>;
  price: number;
  unit: string;
  quantity?: number;
  children?: Component[];
}

export interface Design {
  id: string;
  name: string;
  description: string;
  requirements: {
    power?: number;
    capacity?: number;
    scenario?: string;
    voltage?: string;
  };
  components: any[];
  bom: any[];
  totalCost: number;
  aiSuggestion: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentType {
  type: string;
  label: string;
  count: number;
}

export const componentsApi = {
  list: (params?: { type?: string; brand?: string; search?: string }) =>
    api.get('/components', { params }),

  get: (id: string) =>
    api.get(`/components/${id}`),

  types: () =>
    api.get('/components/types'),

  hierarchical: (type?: string) =>
    api.get('/components/hierarchical', { params: { type } }),

  brands: (type?: string) =>
    api.get('/components/brands', { params: { type } }),
};

export const designsApi = {
  list: () =>
    api.get('/designs'),

  get: (id: string) =>
    api.get(`/designs/${id}`),

  create: (data: Partial<Design>) =>
    api.post('/designs', data),

  update: (id: string, data: Partial<Design>) =>
    api.put(`/designs/${id}`, data),

  delete: (id: string) =>
    api.delete(`/designs/${id}`),
};

export const aiApi = {
  suggest: (requirements: { power?: number; capacity?: number; scenario?: string; voltage?: string }) =>
    api.post('/ai/suggest', requirements),

  chat: (message: string, designId?: string) =>
    api.post('/ai/chat', { message, designId }),
};

export default api;
