import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, Edit, Loader2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/cases/${id}`);
        if (response.data.success) {
          setCaseData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load case details');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load case details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCaseDetails();
    } else {
      setError('No case ID provided');
      setLoading(false);
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffInMs = end - start;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffInDays / 365);
      const remainingMonths = Math.floor((diffInDays % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Case not found</h2>
          <p className="mt-1 text-sm text-gray-500">The requested case could not be found.</p>
          <button
            onClick={() => navigate('/cases')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back to Cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/cases')} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back to Cases
        </button>
        <button 
          onClick={() => navigate(`/cases/${id}/edit`)}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
        >
          <Edit size={16} /> Edit Case
        </button>
      </div>

      <div className="flex items-center mb-2">
        <h1 className="text-3xl font-bold">{caseData.caseName || 'Unnamed Case'}</h1>
        <span className="ml-3 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full capitalize">
          {caseData.status?.replace('_', ' ')}
        </span>
      </div>
      <p className="text-gray-500 mb-6">
        {caseData.caseNumber || 'No case number'}
        {caseData.caseType && ` · ${caseData.caseType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
      </p>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">

          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} />
              <h2 className="font-semibold text-lg">Case Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>Case Name: {caseData.caseName || 'N/A'}</div>
                <div>Case Number: {caseData.caseNumber || 'N/A'}</div>
                <div>Case Type: {caseData.caseType ? caseData.caseType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</div>
                <div>Status: <span className="capitalize">{caseData.status?.replace('_', ' ') || 'N/A'}</span></div>
              </div>
              <div className="space-y-2">
                <div>Start Date: {formatDate(caseData.startDate)}</div>
                <div>Duration: {calculateDuration(caseData.startDate, caseData.endDate)}</div>
                <div>End Date: {caseData.endDate ? formatDate(caseData.endDate) : 'Ongoing'}</div>
                {caseData.externalId && <div>External ID: {caseData.externalId}</div>}
              </div>
            </div>
            {caseData.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                <div className="text-gray-600 whitespace-pre-line">{caseData.description}</div>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} />
              <h2 className="font-semibold text-lg">Court Information</h2>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <div>Court: {caseData.court || 'N/A'}</div>
              <div>Jurisdiction: {caseData.jurisdiction || 'N/A'}</div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} />
              <h2 className="font-semibold text-lg">Case Notes</h2>
            </div>
            <div className="text-gray-700 whitespace-pre-line">
              {caseData.notes || 'No case notes available'}
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-4">Assigned Advocate</h2>
            <div className="flex items-center gap-4">
              <div className="rounded-full w-12 h-12 bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
                {caseData.user?.name?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <div>
                <div className="font-semibold">{caseData.user?.name || 'N/A'}</div>
                <div className="text-sm text-gray-500">{caseData.user?.role || 'User'}</div>
                <div className="text-sm text-gray-500">{caseData.user?.email || ''}</div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-4">Record Information</h2>
            <div className="text-sm text-gray-500 space-y-2">
              {caseData.createdAt && (
                <div>Created: {formatDateTime(caseData.createdAt)}</div>
              )}
              {caseData.updatedAt && (
                <div>Last Updated: {formatDateTime(caseData.updatedAt)}</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
