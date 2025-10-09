import axiosInstance from './axiosInstance';

// Corresponds to GET /api/info/rooms (we can reuse this)
export const getAllClassrooms = async () => {
    try {
        const response = await axiosInstance.get('/info/rooms');
        return response.data;
    } catch (error) {
        console.error("Error fetching all classrooms:", error);
        throw error;
    }
};

// Corresponds to POST /api/insert/classroom
export const addClassroom = async (data) => {
    try {
        const response = await axiosInstance.post('/insert/classroom', data);
        return response.data;
    } catch (error) {
        console.error("Error adding classroom:", error.response?.data?.error || error.message);
        throw new Error(error.response?.data?.error || 'An unexpected error occurred.');
    }
};

// Corresponds to PUT /api/management/classroom/:id
export const updateClassroom = async (roomId, data) => {
    try {
        const response = await axiosInstance.put(`/management/classroom/${roomId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating classroom:", error.response?.data?.error || error.message);
        throw new Error(error.response?.data?.error || 'An unexpected error occurred.');
    }
};

// Corresponds to DELETE /api/management/classroom/:id
export const deleteClassroom = async (roomId) => {
    try {
        const response = await axiosInstance.delete(`/management/classroom/${roomId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting classroom:", error.response?.data?.error || error.message);
        throw new Error(error.response?.data?.error || 'An unexpected error occurred.');
    }
};