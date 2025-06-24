import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, FileText, Phone, Calendar, Briefcase, Mail, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import countries from '../utils/countries';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/clients/${id}`);
        console.log('Client data:', response.data); // Debug log
        // Add test email for debugging
        const clientData = response.data;
        if (!clientData.email) {
          clientData.email = 'test@example.com'; // Test email
        }
        setClient(clientData);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Failed to load client details');
        toast.error('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleEmailClick = () => {
    setShowEmailDialog(true);
  };

  const handleEmailClientSelect = (clientType) => {
    const subject = `Regarding your case with ${fullName}`;
    const body = `\n\n---\n${fullName}\n${client.phone ? `Phone: ${client.phone}\n` : ''}${client.address ? `Address: ${Object.values(client.address).filter(Boolean).join(', ')}` : ''}`;
    
    let mailtoLink = '';
    
    switch(clientType) {
      case 'gmail':
        mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        break;
      case 'outlook':
        mailtoLink = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        break;
      default: // Default mail client
        // Use window.location for default mail client to ensure it opens in the system's default mail app
        mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }
    
    setShowEmailDialog(false);
  };

  const handleUpdateNotes = async (newNotes) => {
    try {
      await api.put(`/clients/${id}`, { notes: newNotes });
      // Update the local state to reflect the changes
      setClient(prev => ({
        ...prev,
        notes: newNotes,
        updatedAt: new Date().toISOString()
      }));
      toast.success('Notes updated successfully');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Client not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format client data with null checks
  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
  // Always show address section, fields will show 'null' if empty
  const hasAddress = !!client.address;
    
  // Format date of birth if available
  const formattedDob = client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : 'N/A';

  return (
    <div className="bg-white min-h-screen">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} /> Back to Clients
          </button>
          <div className="flex gap-2">
            {client.phone && (
              <a 
                href={`tel:${client.phone}`}
                className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Phone size={16} /> Call
              </a>
            )}
            {client.email && (
              <a 
                href={`mailto:${client.email}`}
                className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Mail size={16} /> Email
              </a>
            )}
            <button 
              onClick={() => navigate(`/clients/${id}/edit`, { state: { from: 'clientDetails' } })}
              className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              Edit Client
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{fullName || 'Unnamed Client'}</h1>
          {client.occupation && (
            <p className="text-gray-500">{client.occupation}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <h2 className="font-semibold text-lg">Client Information</h2>
                </div>
                
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="rounded-full w-16 h-16 bg-gray-100 flex items-center justify-center text-2xl text-gray-600 border-2 border-gray-200">
                    {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-gray-900">{fullName || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-gray-900">{client.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                    <p className="text-gray-900">{client.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Occupation</h3>
                    <p className="text-gray-900">{client.occupation || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                    <p className="text-gray-900">
                      {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                      {client.dateOfBirth && ` (${calculateAge(client.dateOfBirth)} years old)`}
                    </p>
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {client.notes.split('\n').map((paragraph, index) => (
                      <p key={index} className="text-gray-700 mb-2 last:mb-0">
                        {paragraph || <br />}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={20} />
                <h2 className="font-semibold text-lg">Address Information</h2>
              </div>
              
              {client.address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Street Address</h3>
                      <p className="text-gray-900">{client.address.street || 'null'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">City</h3>
                      <p className="text-gray-900">{client.address.city || 'null'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">State/Province</h3>
                      <p className="text-gray-900">{client.address.state || 'null'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Postal/ZIP Code</h3>
                      <p className="text-gray-900">{client.address.zipCode || 'null'}</p>
                    </div>
                    
                    {client.address?.country && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Country</h3>
                        <p className="text-gray-900">
                          {countries.find(c => c.code === client.address.country)?.name || client.address.country}
                        </p>
                      </div>
                    )}
                    

                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MapPin size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No address information available</p>
                </div>
              )}
            </div>


          </div>

          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-6">Record Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                  <p className="text-sm text-gray-900">{formatDate(client.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-sm text-gray-900">{formatDate(client.updatedAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {client.phone && (
                    <a 
                      href={`tel:${client.phone}`}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span>Call Client</span>
                      <Phone size={16} className="text-gray-400" />
                    </a>
                  )}
                  
                  {client.email && (
                    <button 
                      onClick={handleEmailClick}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span>Send Email</span>
                      <Mail size={16} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Client Selection Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Choose Email Client</h3>
              <button 
                onClick={() => setShowEmailDialog(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleEmailClientSelect('gmail')}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png" alt="Gmail" className="h-6 w-6 mr-3" />
                  <span>Gmail</span>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => handleEmailClientSelect('outlook')}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <img src="https://static2.sharepointonline.com/files/fabric/assets/brand-icons/product/svg/outlook_48x1.svg" alt="Outlook" className="h-6 w-6 mr-3" />
                  <span>Outlook</span>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => handleEmailClientSelect('default')}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="h-6 w-6 mr-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Default Email App</span>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowEmailDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;
