import axiosInstance from './axiosInstance';

// GET all departments (re-using the existing infoApi function logic)
export const getDepartments = async () => {
    try {
        const response = await axiosInstance.get('/info/departments');
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};

// POST a new department
export const addDepartment = async (data) => {
    try {
        const response = await axiosInstance.post('/management/department', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to add department.');
    }
};

// PUT (update) an existing department
export const updateDepartment = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/management/department/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to update department.');
    }
};

// DELETE a department
export const deleteDepartment = async (id) => {
    try {
        const response = await axiosInstance.delete(`/management/department/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to delete department.');
    }
};
