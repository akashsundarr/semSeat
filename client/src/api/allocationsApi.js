import axiosInstance from './axiosInstance';

/**
 * Runs the allocation algorithm for a given series, date, and time.
 * Corresponds to: POST /api/allocations/run-allocation
 */
export const runAllocation = async (seriesId, allocationDate, startTime) => {
  try {
    const response = await axiosInstance.post('/allocations/run-allocation', {
      series_id: seriesId,
      allocation_date: allocationDate,
      start_time: startTime,
    });
    return response.data;
  } catch (error) {
    console.error("Error running allocation:", error);
    throw error;
  }
};

/**
 * --- NEW FUNCTION ---
 * Fetches all allocations for a specific exam session (timeslot).
 * Corresponds to: GET /api/allocations/timeslot
 */
export const getAllocationsForTimeSlot = async (seriesId, date, time) => {
    try {
        const response = await axiosInstance.get(`/allocations/timeslot?seriesId=${seriesId}&date=${date}&time=${time}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching allocations by time slot:", error);
        throw error;
    }
};
export const checkAllocationStatus = async (seriesId, date, time) => {
  try {
    const response = await axiosInstance.get(`/allocations/status`, {
      params: { seriesId, date, time }
    });
    return response.data; // Returns { allocated: boolean }
  } catch (error) {
    console.error("Error checking allocation status:", error);
    throw error;
  }
};

/**
 * Resets all allocations and student statuses.
 * Corresponds to: DELETE /api/allocations/reset
 */
export const resetAllAllocations = async () => {
    try {
        const response = await axiosInstance.delete('/allocations/reset');
        return response.data;
    } catch (error) {
        console.error("Error resetting allocations:", error);
        throw error;
    }
};