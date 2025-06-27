const { GoogleGenerativeAI } = require('@google/generative-ai');
const asyncHandler = require('express-async-handler');
const Case = require('../models/Case');     // Import Case model for context
const Client = require('../models/Client'); // Import Client model for context

// Access your API key as an environment variable (CRITICAL)
const API_KEY = process.env.GOOGLE_API_KEY; 
if (!API_KEY) {
    console.error('GOOGLE_API_KEY is not set in environment variables');
    throw new Error('AI service configuration error');
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper to call Gemini for text generation
async function callGemini(prompt, chatHistory = [], generationConfig = {}) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Add instructions for formal response
    const systemInstruction = {
        role: "model",
        parts: [{
            text: "You are a professional legal assistant. Provide clear, formal responses without using markdown formatting (no **, *, _, etc.). Use proper grammar and complete sentences. Structure your response in a professional manner with appropriate paragraphs."
        }]
    };

    try {
        const contents = [
            systemInstruction,
            ...chatHistory,
            { role: "user", parts: [{ text: `Please provide a formal response to: ${prompt}` }] }
        ];
        
        const generationConfig = {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
        };
        
        const result = await model.generateContent({ contents, generationConfig });
        const response = await result.response;
        
        // Check if response is empty or malformed before returning
        if (!response || !response.text) {
            throw new Error("Empty or invalid response from AI model.");
        }
        
        // Clean up any remaining markdown
        let cleanText = response.text()
            .replace(/\*\*|\*|_|`|#/g, '') // Remove markdown
            .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
            .trim();
            
        return cleanText;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Provide more detailed error logging from Gemini if available
        if (error.response) {
            console.error('Gemini API Error Response:', error.response.status, error.response.statusText, error.response.text);
        }
        throw new Error('Failed to get response from AI. Please check server logs for more details.');
    }
}

// @desc    Handle general chat queries
// @route   POST /api/ai/chat
// @access  Private
exports.handleChatQuery = asyncHandler(async (req, res) => {
    try {
        console.log('Received AI chat request:', JSON.stringify({
            body: req.body,
            user: req.user?.id
        }, null, 2));

        const { message, chatHistory = [], contextData = {} } = req.body;

        if (!message || typeof message !== 'string') {
            console.error('Invalid message format:', message);
            return res.status(400).json({ 
                success: false,
                message: 'Message is required and must be a string' 
            });
        }

        let fullPrompt = message;
        
        try {
            // Add context to prompt based on provided data
            if (contextData.fileContent) {
                // Truncate file content if too long to avoid hitting token limits
                const maxFileLength = 10000; // Adjust based on your needs
                const truncatedContent = contextData.fileContent.length > maxFileLength 
                    ? contextData.fileContent.substring(0, maxFileLength) + '... [content truncated]'
                    : contextData.fileContent;
                
                fullPrompt = `Document Name: ${contextData.fileName || 'Untitled Document'}\n` +
                            `Document Content:\n${truncatedContent}\n\n` +
                            `Based on the above document, ${fullPrompt}`;
            } else if (contextData.relevantText) {
                fullPrompt = `Consider the following document content for context: "${contextData.relevantText}".\n\n${fullPrompt}`;
            }
            
            if (contextData.caseId) {
                const caseDetails = await Case.findById(contextData.caseId);
                if (caseDetails) {
                    fullPrompt = `Regarding Case "${caseDetails.caseName}" (Number: ${caseDetails.caseNumber}, Description: ${caseDetails.description || 'N/A'}): \n\n${fullPrompt}`;
                }
            }
            
            if (contextData.clientId) {
                const clientDetails = await Client.findById(contextData.clientId);
                if (clientDetails) {
                    fullPrompt = `Regarding Client "${clientDetails.firstName} ${clientDetails.lastName}" (Email: ${clientDetails.email || 'N/A'}, Phone: ${clientDetails.phone || 'N/A'}): \n\n${fullPrompt}`;
                }
            }
            
            console.log('Sending to Gemini:', { 
                promptLength: fullPrompt.length,
                hasChatHistory: chatHistory?.length > 0,
                contextKeys: Object.keys(contextData),
                hasFileContent: !!contextData.fileContent,
                fileContentLength: contextData.fileContent?.length || 0
            });
            
            const aiResponse = await callGemini(fullPrompt, chatHistory);
            
            console.log('Received AI response:', {
                responseLength: aiResponse?.length || 0
            });
            
            res.status(200).json({ 
                success: true,
                response: aiResponse 
            });
            
        } catch (error) {
            console.error('Error in AI processing:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
        
    } catch (error) {
        console.error('AI Chat Error:', {
            error: error.message,
            stack: error.stack,
            requestBody: req.body
        });
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to process AI request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Generate and save a legal draft via AI
// @route   POST /api/ai/draft
// @access  Private
exports.generateDraft = asyncHandler(async (req, res) => {
    const { title, draftType, prompt, caseId, clientId, documentContent } = req.body;

    if (!title || !prompt) {
        res.status(400);
        throw new Error('Draft title and prompt are required for AI generation.');
    }

    // Construct a detailed prompt for draft generation for the LLM
    let llmPrompt = `Generate a legal document draft. Type of draft: "${draftType || 'General Document'}". Instructions: "${prompt}".`;

    if (caseId) {
        const caseDetails = await Case.findById(caseId);
        if (caseDetails) {
            llmPrompt += `\n\nContextual Case Details: Case Name: ${caseDetails.caseName}, Case Number: ${caseDetails.caseNumber}, Description: ${caseDetails.description || 'N/A'}.`;
        }
    }
    if (clientId) {
        const clientDetails = await Client.findById(clientId);
        if (clientDetails) {
            llmPrompt += `\n\nContextual Client Details: Name: ${clientDetails.firstName} ${clientDetails.lastName}, Email: ${clientDetails.email || 'N/A'}, Phone: ${clientDetails.phone || 'N/A'}.`;
        }
    }
    if (documentContent) {
        llmPrompt += `\n\nRelevant Document Snippet for Context: "${documentContent}".`;
    }
    llmPrompt += `\n\nProvide ONLY the draft content, without any conversational preamble or markdown code blocks (e.g., not like \`\`\`json\`\`\`).`; // Clear instruction for LLM output

    const generatedContent = await callGemini(llmPrompt);

    // Save the generated draft to the database
    const newDraft = await Draft.create({
        user: req.user._id, // Authenticated user ID from auth middleware
        title: title,
        content: generatedContent, // The actual generated text from LLM
        draftType: draftType || undefined,
        prompt: prompt, // Store the original prompt provided by the user
        case: caseId || undefined,
        client: clientId || undefined,
        status: 'in_progress', // Default status for a newly generated draft
    });

    res.status(201).json({
        message: 'Draft generated and saved successfully.',
        draft: newDraft, // Return the saved draft object
    });
});

// @desc    Extract structured information via AI
// @route   POST /api/ai/extract
// @access  Private
exports.extractInformation = asyncHandler(async (req, res) => {
    const { textToAnalyze, extractionSchema } = req.body;

    if (!textToAnalyze || !extractionSchema) {
        res.status(400);
        throw new Error('Text to analyze and extraction schema are required for AI extraction.');
    }

    const extractionPrompt = `From the following text, extract information according to the provided JSON schema. Ensure the output is ONLY the JSON object, do not add any conversational text or markdown formatting outside the JSON.\n\nText: "${textToAnalyze}"\n\nSchema: ${JSON.stringify(extractionSchema)}\n\nOutput:`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json", // Instruct Gemini to respond with JSON
                responseSchema: extractionSchema       // Provide the schema for structured output
            }
        });

        const response = await result.response;
        // Gemini's response.text() for JSON responseMimeType will be a stringified JSON
        const extractedJson = JSON.parse(response.text());
        res.status(200).json({ extractedData: extractedJson, message: 'Information extracted successfully.' });

    } catch (error) {
        console.error('Error extracting information with Gemini:', error);
        let llmResponseText = "AI did not return a valid JSON format or an unexpected error occurred on the AI side.";
        if (error.response && error.response.text) {
             llmResponseText = error.response.text;
        }
        res.status(500).json({ message: `Failed to extract information. AI response fragment: ${llmResponseText.substring(0, Math.min(llmResponseText.length, 200))}...` });
    }
});
