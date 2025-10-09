import axiosInstance from './axiosInstance';

// A helper function to handle the post request and error logging
const postData = async (endpoint, data, successMessage) => {
  try {
    const response = await axiosInstance.post(endpoint, data);
    console.log(successMessage, response.data);
    return { success: true, message: response.data.message || 'Operation successful!' };
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error.response?.data?.error || error.message);
    throw new Error(error.response?.data?.error || 'An unexpected error occurred.');
  }
};

// --- Functions from insertData.js ---
export const addStudent = (data) => postData('/insert/student', data, 'Student added');
export const addClassroom = (data) => postData('/insert/classroom', data, 'Classroom added');

// --- Functions from management.js ---
export const addDepartment = (data) => postData('/management/department', data, 'Department added');
export const addSubject = (data) => postData('/management/subject', data, 'Subject added');
export const addExamSeries = (data) => postData('/management/exam-series', data, 'Exam Series added');
export const scheduleExam = (data) => postData('/management/scheduled-exam', data, 'Exam scheduled');