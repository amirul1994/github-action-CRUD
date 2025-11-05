import axios from 'axios';

const API_URL = '/api'; // This will be proxied by Nginx

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const itemsApi = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const skip = (page - 1) * limit;
    let url = `/items/?skip=${skip}&limit=${limit}`;
    
    if (search) {
      url += `&title_search=${encodeURIComponent(search)}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },
  
  create: async (itemData) => {
    const response = await apiClient.post('/items/', itemData);
    return response.data;
  },
  
  update: async (id, itemData) => {
    const response = await apiClient.put(`/items/${id}`, itemData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  }
};

export default apiClient;