import React, { useState } from 'react';
import Papa from 'papaparse';

function BulkImport({ onImport, onComplete }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleImport = () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }

        setIsLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const requiredHeaders = ['student_id', 'name', 'batch', 'semester', 'dept_id'];
                const fileHeaders = results.meta.fields;

                // Validate headers
                const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
                if (missingHeaders.length > 0) {
                    setError(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
                    setIsLoading(false);
                    return;
                }

                // Call the parent component's import function
                try {
                    await onImport(results.data);
                    onComplete(); // Close modal on success
                } catch (err) {
                    setError(err.message || 'An error occurred during import.');
                } finally {
                    setIsLoading(false);
                }
            },
            error: (err) => {
                setError(`CSV parsing error: ${err.message}`);
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="p-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Bulk Import from CSV</h3>
            <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-50 rounded-md">
                <p className="font-bold">Instructions:</p>
                <p>Ensure your CSV file has the following headers:</p>
                <p className="font-mono text-blue-600">student_id, name, batch, semester, dept_id</p>
            </div>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
                onClick={handleImport}
                disabled={isLoading || !file}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
                {isLoading ? 'Importing...' : 'Import Students'}
            </button>
        </div>
    );
}

export default BulkImport;