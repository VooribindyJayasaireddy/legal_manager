const mongoose = require('mongoose');

const DraftSchema = mongoose.Schema(
    {
        user: { // Reference to the advocate who owns/created this draft
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: { // Title or subject of the draft document
            type: String,
            required: [true, 'Draft title is required'],
            trim: true,
        },
        content: { // The actual text content of the draft, supports large text blocks
            type: String,
            required: [true, 'Draft content is required'],
        },
        draftType: { // Categorization of the draft (e.g., "contract", "letter", "memo", "pleading")
            type: String,
            trim: true,
        },
        case: { // Optional: Link to a case
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Case',
        },
        client: { // Optional: Link to a client
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
        },
        status: { // Current status of the draft (e.g., "in_progress", "under_review", "finalized", "archived")
            type: String,
            enum: ["in_progress", "under_review", "finalized", "archived"],
            default: "in_progress",
        },
        tags: [ // For easier searching/categorization
            {
                type: String,
                trim: true,
            }
        ],
        // You might add a version history or attachment fields here if needed in the future
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

module.exports = mongoose.model('Draft', DraftSchema);
