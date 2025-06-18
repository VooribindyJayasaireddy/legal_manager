import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'react-feather';
import api from '../utils/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    clients: [],
    cases: [],
    documents: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch search results
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults({ clients: [], cases: [], documents: [] });
        return;
      }

      setIsLoading(true);
      try {
        // Search clients
        const clientsRes = await api.get(`/clients/search?query=${encodeURIComponent(query)}`);
        
        // TODO: Uncomment and implement when search endpoints are available
        // const casesRes = await api.get(`/cases/search?query=${encodeURIComponent(query)}`);
        // const documentsRes = await api.get(`/documents/search?query=${encodeURIComponent(query)}`);

        setResults({
          clients: clientsRes.data || [],
          cases: [], // casesRes.data || [],
          documents: [] // documentsRes.data || []
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setQuery('');
    
    switch(type) {
      case 'client':
        navigate(`/clients/${id}`);
        break;
      case 'case':
        navigate(`/cases/${id}`);
        break;
      case 'document':
        navigate(`/documents/${id}`);
        break;
      default:
        break;
    }
  };

  const hasResults = results.clients.length > 0 || results.cases.length > 0 || results.documents.length > 0;

  return (
    <div className="relative w-full max-w-xl" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search cases, documents, clients..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 hover:border-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showResults && (isLoading || hasResults || query) && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-96 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : hasResults ? (
            <>
              {results.clients.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Clients
                </div>
              )}
              {results.clients.map((client) => (
                <div
                  key={`client-${client._id}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => handleResultClick('client', client._id)}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {client.firstName?.charAt(0) || 'C'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                </div>
              ))}

              {/* Cases Section - Will be implemented when API is ready */}
              {results.cases.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cases
                </div>
              )}
              {results.cases.map((caseItem) => (
                <div
                  key={`case-${caseItem._id}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleResultClick('case', caseItem._id)}
                >
                  <p className="text-sm font-medium text-gray-900">{caseItem.title}</p>
                  <p className="text-xs text-gray-500">{caseItem.caseNumber}</p>
                </div>
              ))}

              {/* Documents Section - Will be implemented when API is ready */}
              {results.documents.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Documents
                </div>
              )}
              {results.documents.map((doc) => (
                <div
                  key={`doc-${doc._id}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleResultClick('document', doc._id)}
                >
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.type}</p>
                </div>
              ))}
            </>
          ) : query ? (
            <div className="px-4 py-2 text-gray-500">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
