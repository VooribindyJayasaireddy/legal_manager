import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DataExtractionPageProps {
    onBackToDashboard: () => void;
    onLogout: () => void;
}

const DataExtractionPage: React.FC<DataExtractionPageProps> = ({ onBackToDashboard, onLogout }) => {
    const [textToAnalyze, setTextToAnalyze] = useState<string>('');
    const [extractionSchemaString, setExtractionSchemaString] = useState<string>('');
    const [extractedData, setExtractedData] = useState<any>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmitExtraction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setExtractedData(null);

        if (!textToAnalyze.trim()) {
            setError('Please provide text to analyze.');
            return;
        }
        if (!extractionSchemaString.trim()) {
            setError('Please provide a JSON schema for extraction.');
            return;
        }

        let parsedSchema: any;
        try {
            parsedSchema = JSON.parse(extractionSchemaString);
        } catch (jsonError) {
            setError('Invalid JSON schema format. Please ensure it is valid JSON.');
            console.error('JSON parse error:', jsonError);
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication required. Please log in.');
                onLogout();
                return;
            }

            const apiUrl = 'http://localhost:5000/api/ai/extract'; // Your backend endpoint for extraction
            const requestBody = {
                textToAnalyze,
                extractionSchema: parsedSchema,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                setExtractedData(data.extractedData);
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                setError(data.message || 'Failed to extract data. Please check your text and schema.');
                console.error('Data extraction failed:', response.status, data);
            }
        } catch (err) {
            console.error('Network or unexpected error during data extraction:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-800">AI Data Extraction</h1>
                    <button
                        onClick={onBackToDashboard}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-150"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <form onSubmit={handleSubmitExtraction} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Text to Analyze Input */}
                    <div>
                        <label htmlFor="textToAnalyze" className="block text-gray-700 text-sm font-bold mb-2">Text to Analyze<span className="text-red-500">*</span></label>
                        <textarea
                            id="textToAnalyze" name="textToAnalyze" value={textToAnalyze} onChange={(e) => setTextToAnalyze(e.target.value)}
                            placeholder="Paste the text from which you want to extract information (e.g., a contract clause, meeting notes)."
                            rows={8}
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        ></textarea>
                    </div>

                    {/* Extraction Schema Input */}
                    <div>
                        <label htmlFor="extractionSchema" className="block text-gray-700 text-sm font-bold mb-2">Extraction Schema (JSON)<span className="text-red-500">*</span></label>
                        <textarea
                            id="extractionSchema" name="extractionSchema" value={extractionSchemaString} onChange={(e) => setExtractionSchemaString(e.target.value)}
                            placeholder={`Define the JSON structure for extraction. Example:
{
  "contract_date": { "type": "string", "format": "date" },
  "parties_involved": { "type": "array", "items": { "type": "string" } },
  "monetary_amount": { "type": "number" }
}`}
                            rows={10}
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">Provide a valid JSON schema for the AI to follow during extraction.</p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Extracting Data...' : 'Extract Data'}
                        </button>
                    </div>
                </form>

                {/* Extracted Data Display */}
                {extractedData && (
                    <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Extracted Data:</h3>
                        <pre className="whitespace-pre-wrap font-mono text-gray-700 text-sm bg-white p-4 rounded-lg border border-gray-300 overflow-x-auto">
                            {JSON.stringify(extractedData, null, 2)}
                        </pre>
                        <button
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2))}
                            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                        >
                            Copy JSON
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataExtractionPage;
