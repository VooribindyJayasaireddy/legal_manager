const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Document = require('../../src/models/Document');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Migration: Add documentType to existing documents
const migrateDocuments = async () => {
  try {
    await connectDB();
    
    // Update all documents that don't have documentType
    const result = await Document.updateMany(
      { documentType: { $exists: false } },
      { $set: { documentType: 'standalone' } }
    );
    
    // For documents with case reference, set documentType to 'case'
    const caseDocsResult = await Document.updateMany(
      { case: { $exists: true, $ne: null } },
      { $set: { documentType: 'case' } }
    );
    
    console.log('Migration completed successfully:');
    console.log(`- Set documentType to 'standalone' for ${result.nModified} documents`);
    console.log(`- Updated ${caseDocsResult.nModified} case documents to documentType 'case'`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateDocuments();
