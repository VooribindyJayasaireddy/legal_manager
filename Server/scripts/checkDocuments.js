const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Document = require('../src/models/Document');

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

const checkDocuments = async () => {
  try {
    await connectDB();
    
    // Get document count
    const totalDocs = await Document.countDocuments();
    console.log(`\nTotal documents in collection: ${totalDocs}`);
    
    // Get count by documentType
    const docTypes = await Document.aggregate([
      { $group: { _id: "$documentType", count: { $sum: 1 } } }
    ]);
    
    console.log('\nDocuments by type:');
    console.table(docTypes);
    
    // Get a few sample documents
    console.log('\nSample documents:');
    const samples = await Document.aggregate([
      { $sample: { size: 3 } },
      {
        $project: {
          title: 1,
          documentType: 1,
          case: 1,
          fileType: 1,
          fileSize: 1,
          uploadDate: 1
        }
      }
    ]);
    
    console.table(samples);
    
    // Check for documents without documentType (should be 0 after migration)
    const docsWithoutType = await Document.countDocuments({ documentType: { $exists: false } });
    console.log(`\nDocuments without documentType: ${docsWithoutType}`);
    
    // Check case documents without case reference
    const caseDocsWithoutCase = await Document.countDocuments({ 
      documentType: 'case',
      $or: [{ case: { $exists: false } }, { case: null }]
    });
    console.log(`Case documents without case reference: ${caseDocsWithoutCase}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking documents:', error);
    process.exit(1);
  }
};

checkDocuments();
