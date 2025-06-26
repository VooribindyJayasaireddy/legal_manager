// backend/src/controllers/clientController.js

const Client = require('../models/Client');

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private (requires authentication)
exports.createClient = async (req, res) => {
  try {
    // Destructure client data from the request body
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      dateOfBirth, 
      occupation, 
      notes,
      status = 'Active' // Default status
    } = req.body;

    // Check for required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and Last name are required.' });
    }

    // Create a new client instance, linking it to the authenticated user
    const newClient = new Client({
      user: req.user._id, // Assuming req.user is populated by your authentication middleware
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      occupation,
      notes,
      status,
    });

    // Save the new client to the database
    const savedClient = await newClient.save();

    res.status(201).json({
      message: 'Client created successfully',
      client: savedClient
    });

  } catch (error) {
    console.error('Error creating client:', error);
    // Handle duplicate email case if you decide to make email unique per user
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ message: 'Client with this email already exists for your account.' });
    }
    res.status(500).json({ message: 'Server error during client creation.' });
  }
};

// @desc    Get all clients for the authenticated user
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    // Find all clients associated with the authenticated user's ID
    const clients = await Client.find({ user: req.user._id }).sort({ lastName: 1, firstName: 1 }); // Sort alphabetically

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error while fetching clients.' });
  }
};

// @desc    Get a single client by ID
// @route   GET /api/clients/:id
// @access  Private
exports.getClientById = async (req, res) => {
  try {
    // Find a client by ID and ensure it belongs to the authenticated user
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    res.status(200).json(client);
  } catch (error) {
    console.error('Error fetching client by ID:', error);
    res.status(500).json({ message: 'Server error while fetching client.' });
  }
};

// @desc    Update a client's information
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    // Find the client by ID and ensure it belongs to the authenticated user
    let client = await Client.findOne({ _id: req.params.id, user: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Validate required fields
    if (req.body.firstName === '') {
      return res.status(400).json({ message: 'First name is required' });
    }
    if (req.body.lastName === '') {
      return res.status(400).json({ message: 'Last name is required' });
    }
    if (req.body.phone === '') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Update client fields based on the request body
    const { firstName, lastName, email, phone, address, dateOfBirth, occupation, notes, status } = req.body;

    // Update client fields if they exist in the request
    if (firstName) client.firstName = firstName;
    if (lastName) client.lastName = lastName;
    if (email) client.email = email;
    if (phone) client.phone = phone;
    if (address) client.address = address;
    if (dateOfBirth) client.dateOfBirth = dateOfBirth;
    if (occupation) client.occupation = occupation;
    if (notes !== undefined) client.notes = notes;
    if (status) client.status = status;

    // Save the updated client
    const updatedClient = await client.save();

    res.status(200).json({
      message: 'Client updated successfully',
      client: updatedClient
    });

  } catch (error) {
    console.error('Error updating client:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A client with this email already exists.' });
    }
    
    res.status(500).json({ message: 'Server error during client update.' });
  }
};

// @desc    Search clients by name or email
// @route   GET /api/clients/search
// @access  Private
exports.searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a case-insensitive regex pattern for the search query
    const searchRegex = new RegExp(q, 'i');
    
    // Search in firstName, lastName, or email fields
    const clients = await Client.find({
      user: req.user._id,
      $or: [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ]
    }).select('_id firstName lastName email').limit(10);
    
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Server error while searching clients.' });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
  try {
    // Find and delete the client by ID, ensuring it belongs to the authenticated user
    const deletedClient = await Client.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // In a real application, you might also want to delete or re-associate
    // any cases, documents, appointments, or tasks linked to this client.
    // For simplicity, we are just deleting the client record itself here.
    // Example: await Case.updateMany({ clients: deletedClient._id }, { $pull: { clients: deletedClient._id } });

    res.status(200).json({ message: 'Client deleted successfully.' });

  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error during client deletion.' });
  }
};
