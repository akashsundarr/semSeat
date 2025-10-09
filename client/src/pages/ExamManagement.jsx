import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getExamSeries, addExamSeries, updateExamSeries, deleteExamSeries } from '../api/examSeriesApi';
import { getScheduledExams, scheduleExam, deleteScheduledExamSession } from '../api/scheduledExamApi';
import { getSubjects } from '../api/infoApi';
import ManagementForm from '../components/ManagementForm';
import ConfirmationModal from '../components/ConfirmationModal';

// A small, reusable notification component with a self-closing timer
const Notification = ({ message, type, onClose }) => {
    // The useEffect Hook must be called at the top level, before any conditional returns.
    useEffect(() => {
        // The logic inside the Hook can be conditional.
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // The notification will disappear after 5 seconds
            
            // This cleanup function will run if the component unmounts or if the message changes.
            return () => clearTimeout(timer);
        }
    }, [message, onClose]); // Dependencies for the effect

    // Now, we can conditionally return null after all Hooks have been called.
    if (!message) {
        return null;
    }

    const baseClasses = "fixed top-20 right-5 p-4 rounded-lg shadow-lg text-sm z-50 transition-transform transform-gpu";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

function ExamManagementPage() {
    // State for data lists
    const [examSeries, setExamSeries] = useState([]);
    const [scheduledExams, setScheduledExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    
    // Generic state for loading and notifications
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Centralized state for managing all modals
    const [modal, setModal] = useState({ type: null, data: null }); // e.g., { type: 'editSeries', data: seriesObject }

    // Memoized options for forms to prevent re-calculation on every render
    const subjectOptions = useMemo(() => subjects.map(s => ({ value: s.subject_id, label: `${s.subject_name} (${s.subject_code})` })), [subjects]);
    const seriesOptions = useMemo(() => examSeries.map(s => ({ value: s.series_id, label: s.series_name })), [examSeries]);

    // useCallback to memoize the fetch function and prevent re-creation
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [seriesData, scheduledData, subjectsData] = await Promise.all([
                getExamSeries(),
                getScheduledExams(),
                getSubjects()
            ]);
            setExamSeries(seriesData);
            setScheduledExams(scheduledData);
            setSubjects(subjectsData);
        } catch (error) {
            setNotification({ message: error.message || 'Failed to fetch initial data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFormSubmit = async (formData) => {
        try {
            let result;
            switch (modal.type) {
                case 'addSeries':
                    result = await addExamSeries(formData);
                    break;
                case 'editSeries':
                    result = await updateExamSeries(modal.data.series_id, formData);
                    break;
                case 'scheduleExam':
                    result = await scheduleExam(formData);
                    break;
                default:
                    throw new Error("Invalid form submission type");
            }
            setNotification({ message: result.message, type: 'success' });
            fetchData(); // Refresh all data on success
        } catch (error) {
            setNotification({ message: error.message, type: 'error' });
        } finally {
            setModal({ type: null, data: null }); // Close the modal
        }
    };

    const handleDelete = async () => {
        try {
            let result;
            if (modal.type === 'deleteSeries') {
                result = await deleteExamSeries(modal.data.series_id);
            } else if (modal.type === 'deleteSession') {
                const { series_id, exam_date, start_time } = modal.data;
                result = await deleteScheduledExamSession(series_id, exam_date, start_time);
            } else {
                 throw new Error("Invalid delete operation type");
            }
            setNotification({ message: result.message, type: 'success' });
            fetchData(); // Refresh all data on success
        } catch (error) {
            setNotification({ message: error.message, type: 'error' });
        } finally {
            setModal({ type: null, data: null }); // Close the modal
        }
    };

    // Form field definitions
    const seriesFields = [
        { name: 'series_name', label: 'Series Name', type: 'text', placeholder: 'e.g., First Series Exam Oct 2025' },
        { name: 'start_date', label: 'Start Date', type: 'date' },
        { name: 'end_date', label: 'End Date', type: 'date' },
    ];
    
    const scheduleFields = [
        { name: 'series_id', label: 'Exam Series', type: 'select', options: seriesOptions },
        { name: 'subject_ids', label: 'Subjects (select one or more)', type: 'multi-select', options: subjectOptions },
        { name: 'exam_date', label: 'Exam Date', type: 'date' },
        { name: 'start_time', label: 'Start Time', type: 'time' },
        { name: 'end_time', label: 'End Time', type: 'time' },
    ];

    return (
        <>
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            
            {/* Unified Form Modal */}
            {['addSeries', 'editSeries', 'scheduleExam'].includes(modal.type) && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <button onClick={() => setModal({ type: null, data: null })} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                        <ManagementForm
                            key={modal.type + (modal.data?.series_id || '')} // Re-mounts form on type change to reset state
                            title={
                                modal.type === 'addSeries' ? "Add New Exam Series" :
                                modal.type === 'editSeries' ? "Edit Exam Series" : "Schedule New Exam"
                            }
                            fields={modal.type.includes('Series') ? seriesFields : scheduleFields}
                            onSubmit={handleFormSubmit}
                            initialData={modal.data}
                        />
                    </div>
                </div>
            )}

            {/* Unified Confirmation Modal */}
            {['deleteSeries', 'deleteSession'].includes(modal.type) && (
                 <ConfirmationModal
                    isOpen={!!modal.type}
                    onClose={() => setModal({ type: null, data: null })}
                    onConfirm={handleDelete}
                    title={modal.type === 'deleteSeries' ? "Delete Exam Series" : "Delete Exam Session"}
                >
                    <p>Are you sure? This action cannot be undone and may affect existing allocations.</p>
                </ConfirmationModal>
            )}

            <div className="container mx-auto p-4 md:p-8">
                {/* Exam Series Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Exam Series</h2>
                        <button onClick={() => setModal({ type: 'addSeries', data: null })} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                            Create New Series
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        {isLoading ? <p>Loading...</p> : (
                            <ul className="divide-y divide-gray-200">
                                {examSeries.map((series) => (
                                    <li key={series.series_id} className="py-3 flex justify-between items-center">
                                        <span>{series.series_name}</span>
                                        <div className="space-x-4">
                                            <button onClick={() => setModal({ type: 'editSeries', data: series })} className="text-sm text-yellow-600 hover:underline">Edit</button>
                                            <button onClick={() => setModal({ type: 'deleteSeries', data: series })} className="text-sm text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Scheduled Exams Section */}
                <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Scheduled Exams</h2>
                        <button onClick={() => setModal({ type: 'scheduleExam', data: null })} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                            Schedule New Exam
                        </button>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md border">
                        {isLoading ? <p>Loading...</p> : (
                            <ul className="divide-y divide-gray-200">
                               {scheduledExams.map((session) => (
                                    <li key={session.session_key} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{session.series_name}</p>
                                            <p className="text-sm text-gray-600">{new Date(session.exam_date + 'T12:00:00Z').toLocaleDateString()} at {session.start_time}</p>
                                            <p className="text-xs text-gray-500 mt-1">{session.subjects}</p>
                                        </div>
                                        <div className="space-x-2">
                                            {/* Edit for scheduled exams is complex, so we focus on delete for the best UX */}
                                            <button onClick={() => setModal({ type: 'deleteSession', data: session })} className="text-sm text-red-600 hover:underline">Delete Session</button>
                                        </div>
                                    </li>
                               ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default ExamManagementPage;