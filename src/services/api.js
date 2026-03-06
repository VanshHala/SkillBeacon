import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export const dataApi = {
    getJobs: async (params) => {
        const response = await api.get('/data/jobs', { params });
        return response.data;
    },
    getCourses: async (params) => {
        const response = await api.get('/data/courses', { params });
        return response.data;
    }
};

export const dashboardApi = {
    getMetrics: async () => {
        const response = await api.get('/dashboard/metrics');
        return response.data;
    }
};

export const workerApi = {
    analyzeProfile: async (data) => {
        const response = await api.post('/worker/analyze', data);
        return response.data;
    },
    chat: async (message) => {
        const response = await api.post('/worker/chat', { message });
        return response.data;
    }
};

export const userApi = {
    syncProfile: async (userData) => {
        const response = await api.post('/user/sync', userData);
        return response.data;
    }
};

export default api;
