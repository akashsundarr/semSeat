import axiosInstance from './axiosInstance';
import { addStudent as addNewStudent } from './managementApi'; // Import and rename

// Re-export the addStudent function so all student operations are in one file
export const addStudent = addNewStudent;

/**
 * Fetches the list of all students with their department names.
 * Corresponds to: GET /api/info/students
 */
export const getStudents = async () => {
    try {
        const response = await axiosInstance.get('/info/students');
        return response.data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const bulkAddStudents = async (students) => {
    try {
        const response = await axiosInstance.post('/management/students/bulk', students);
        return response.data;
    } catch (error) {
        console.error("Error bulk adding students:", error.response?.data?.error || error.message);
        throw new Error(error.response?.data?.error || 'An unexpected error occurred during bulk import.');
    }
};


/**
 * Updates an existing student's details.
 * Corresponds to: PUT /api/management/student/:id
 */
export const updateStudent = async (studentId, data) => {
    try {
        const response = await axiosInstance.put(`/management/student/${studentId}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating student ${studentId}:`, error);
        throw new Error(error.response?.data?.error || 'Failed to update student.');
    }
};

/**
 * Deletes a student from the database.
 * Corresponds to: DELETE /api/management/student/:id
 */
export const deleteStudent = async (studentId) => {
    try {
        const response = await axiosInstance.delete(`/management/student/${studentId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting student ${studentId}:`, error);
        throw new Error(error.response?.data?.error || 'Failed to delete student.');
    }
};