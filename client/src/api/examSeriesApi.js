import axiosInstance from './axiosInstance';

export const getExamSeries = async () => {
    try {
        const response = await axiosInstance.get('/info/exam-series');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch exam series.');
    }
};

export const addExamSeries = async (data) => {
    try {
        const response = await axiosInstance.post('/management/exam-series', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to add exam series.');
    }
};

export const updateExamSeries = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/management/exam-series/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to update exam series.');
    }
};

export const deleteExamSeries = async (id) => {
    try {
        const response = await axiosInstance.delete(`/management/exam-series/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to delete exam series.');
    }
};
