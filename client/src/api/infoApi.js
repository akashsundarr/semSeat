import axiosInstance from './axiosInstance';

/**
 * Fetches the list of all exam series.
 * Corresponds to: GET /api/info/exam-series
 */
export const getExamSeries = async () => {
  try {
    const response = await axiosInstance.get('/info/exam-series');
    return response.data; // The backend returns an array of series
  } catch (error) {
    console.error("Error fetching exam series:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

/**
 * Fetches the timetable for a specific series_id.
 * Corresponds to: GET /api/info/timetable/:series_id
 */
export const getTimetable = async (seriesId) => {
  try {
    const response = await axiosInstance.get(`/info/timetable/${seriesId}`);
    return response.data; // The backend returns an array of scheduled exams
  } catch (error) {
    console.error(`Error fetching timetable for series ${seriesId}:`, error);
    throw error;
  }
};

export const getRooms = async () => {
  try {
    const response = await axiosInstance.get('/info/rooms');
    return response.data; // The backend returns an array of room IDs
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

// Add this function to your existing infoApi.js file

export const getDepartments = async () => {
  try {
    const response = await axiosInstance.get('/info/departments');
    return response.data; // Returns array of { dept_id, dept_name, dept_code }
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

// Add this to your infoApi.js file
export const getSubjects = async () => {
  try {
    const response = await axiosInstance.get('/info/subjects');
    return response.data;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }
};