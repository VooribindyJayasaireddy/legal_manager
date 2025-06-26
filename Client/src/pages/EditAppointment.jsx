import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { 
  Container, 
  Button, 
  Card, 
  Form,
  Row, 
  Col, 
  Alert,
  Spinner,
  Modal
} from 'react-bootstrap';
import { 
  FiSave, 
  FiX, 
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiType,
  FiInfo
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Schema for appointment form
const appointmentFormSchema = {
  title: { value: '', required: true },
  clientId: { value: '', required: true },
  clientName: { value: '', required: true },
  date: { value: new Date(), required: true },
  duration: { value: 60, required: true },
  type: { value: 'meeting', required: true },
  status: { value: 'scheduled', required: true },
  description: { value: '', required: false },
  location: { value: '', required: false },
  notes: { value: '', required: false }
};

const appointmentTypes = [
  { value: 'meeting', label: 'In-Person Meeting' },
  { value: 'call', label: 'Phone Call' },
  { value: 'video', label: 'Video Conference' },
  { value: 'court', label: 'Court Appearance' },
  { value: 'other', label: 'Other' }
];

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' }
];

const EditAppointment = ({ isNew = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...appointmentFormSchema });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [clients, setClients] = useState([]);

  // Mock client data - replace with API call
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API calls
        setTimeout(() => {
          // Mock clients data
          const mockClients = [
            { id: '101', name: 'John Doe', email: 'john.doe@example.com' },
            { id: '102', name: 'Jane Smith', email: 'jane.smith@example.com' },
            { id: '103', name: 'Robert Johnson', email: 'robert.j@example.com' },
          ];
          setClients(mockClients);

          if (!isNew) {
            // Mock appointment data
            const mockAppointment = {
              id: id,
              title: 'Initial Consultation',
              clientId: '101',
              clientName: 'John Doe',
              date: '2025-06-25T10:00:00',
              duration: 60,
              type: 'meeting',
              status: 'scheduled',
              description: 'Initial consultation for property dispute',
              location: 'Office - Conference Room A',
              notes: 'Client prefers morning appointments. Has relevant documents ready.'
            };
            
            // Populate form with existing data
            const updatedForm = { ...appointmentFormSchema };
            Object.keys(mockAppointment).forEach(key => {
              if (updatedForm[key] !== undefined) {
                updatedForm[key].value = mockAppointment[key];
              }
            });
            setFormData(updatedForm);
          }
          
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isNew]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], value }
    }));
  };

  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: { ...prev.clientId, value: selectedClient.id },
        clientName: { ...prev.clientName, value: selectedClient.name }
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const updatedForm = { ...formData };

    Object.keys(updatedForm).forEach(key => {
      const field = updatedForm[key];
      if (field.required && !field.value) {
        field.error = 'This field is required';
        isValid = false;
      } else {
        field.error = '';
      }
    });

    setFormData(updatedForm);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setSaving(false);
      // Navigate to details page after successful save
      navigate(`/appointments/${id || 'new'}`);
    }, 1000);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <Button 
            variant="link" 
            onClick={() => navigate(-1)} 
            className="p-0 me-2"
          >
            <FiArrowLeft size={24} />
          </Button>
          {isNew ? 'New Appointment' : 'Edit Appointment'}
        </h2>
        <div>
          <Button 
            variant="outline-secondary" 
            className="me-2"
            onClick={handleCancel}
            disabled={saving}
          >
            <FiX className="me-2" /> Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="me-2" />
                {isNew ? 'Create Appointment' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-4">Appointment Details</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title.value}
                    onChange={(e) => handleChange('title', e.target.value)}
                    isInvalid={!!formData.title.error}
                    placeholder="E.g., Initial Consultation, Court Hearing"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formData.title.error}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Client <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.clientId.value}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    isInvalid={!!formData.clientId.error}
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formData.clientId.error}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                      <div className="d-flex align-items-center">
                        <FiCalendar className="position-absolute ms-3" />
                        <DatePicker
                          selected={formData.date.value}
                          onChange={(date) => handleChange('date', date)}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="form-control ps-5"
                          wrapperClassName="w-100"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={formData.duration.value}
                        onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                      >
                        {durationOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={formData.type.value}
                        onChange={(e) => handleChange('type', e.target.value)}
                      >
                        {appointmentTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={formData.status.value}
                        onChange={(e) => handleChange('status', e.target.value)}
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FiMapPin />
                    </span>
                    <Form.Control
                      type="text"
                      value={formData.location.value}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="E.g., Office, Courtroom 5, Zoom Meeting"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description.value}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the appointment"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes.value}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Any additional notes or reminders"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Appointment Summary</h5>
                <div className="border rounded p-3 mb-3">
                  <h6 className="mb-2">{formData.title.value || 'New Appointment'}</h6>
                  <div className="small text-muted">
                    <div className="d-flex align-items-center mb-1">
                      <FiCalendar className="me-2" />
                      {formData.date.value ? format(new Date(formData.date.value), 'EEEE, MMMM d, yyyy') : 'No date selected'}
                    </div>
                    <div className="d-flex align-items-center mb-1">
                      <FiClock className="me-2" />
                      {formData.date.value ? (
                        <>
                          {format(new Date(formData.date.value), 'h:mm a')} -{' '}
                          {format(
                            new Date(new Date(formData.date.value).getTime() + (formData.duration.value * 60000)),
                            'h:mm a'
                          )}
                          {' '}({formData.duration.value} min)
                        </>
                      ) : 'No time selected'}
                    </div>
                    {formData.location.value && (
                      <div className="d-flex align-items-center mb-1">
                        <FiMapPin className="me-2" />
                        {formData.location.value}
                      </div>
                    )}
                    {formData.clientName.value && (
                      <div className="d-flex align-items-center">
                        <FiUser className="me-2" />
                        {formData.clientName.value}
                      </div>
                    )}
                  </div>
                </div>
                <div className="alert alert-info small">
                  <FiInfo className="me-2" />
                  {isNew 
                    ? 'This appointment will be created when you click "Create Appointment".'
                    : 'Your changes will be saved when you click "Save Changes".'}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Discard Changes?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Keep Editing
          </Button>
          <Button variant="danger" onClick={confirmCancel}>
            Discard Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditAppointment;
