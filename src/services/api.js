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
    },
    getSimilarJobs: async (params) => {
        const response = await api.get('/data/jobs/similar', { params });
        return response.data;
    },
    suggestCities: async (q) => {
        const response = await api.get('/data/suggestions/cities', { params: { q } });
        return response.data;
    },
    suggestTitles: async (q) => {
        const response = await api.get('/data/suggestions/titles', { params: { q } });
        return response.data;
    }
};

export const dashboardApi = {
    getMetrics: async () => {
        const response = await api.get('/dashboard/metrics');
        return response.data;
    }
};

export const analyticsApi = {
    getHiringTrends: async (days = 30, category = '', city = '', sector = '') => {
        const params = { days };
        if (category) params.category = category;
        if (city) params.city = city;
        if (sector) params.sector = sector;
        const response = await api.get('/analytics/hiring-trends', { params });
        return response.data;
    },
    getSkillsIntelligence: async () => {
        const response = await api.get('/analytics/skills-intelligence');
        return response.data;
    },
    getAIVulnerability: async (city = '') => {
        const params = {};
        if (city) params.city = city;
        const response = await api.get('/analytics/ai-vulnerability', { params });
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
    },
    getDynamicRiskScore: async (payload) => {
        const response = await api.post('/worker/risk-score', payload);
        return response.data;
    }
};

export const marketApi = {
    syncLive: async (payload) => {
        const response = await api.post('/v1/market/sync-live', payload);
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
