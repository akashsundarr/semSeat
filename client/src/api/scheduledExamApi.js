import axiosInstance from './axiosInstance';

export const getScheduledExams = async () => {
    try {
        const response = await axiosInstance.get('/info/scheduled-exams');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch scheduled exams.');
    }
};

// This function already exists in managementApi.js, but it's better to have it here for consistency
export const scheduleExam = async (data) => {
    try {
        const response = await axiosInstance.post('/management/scheduled-exam', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to schedule exam.');
    }
};

// We delete by session, not by individual exam ID
export const deleteScheduledExamSession = async (seriesId, date, time) => {
    try {
        const response = await axiosInstance.delete(`/management/scheduled-exam-session`, {
            params: { series_id: seriesId, exam_date: date, start_time: time }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to delete exam session.');
    }
};
