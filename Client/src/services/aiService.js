import api from '../utils/api';

export const aiService = {
  // Send a chat message to the AI
  async sendChatMessage({ message, chatHistory = [], contextData = {} }) {
    try {
      // Prepare the request payload
      const payload = {
        message,
        chatHistory: chatHistory
          .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            parts: [{ text: msg.text }]
          })),
        contextData: {
          ...contextData,
          // Include file content if available
          ...(contextData.fileContent && { 
            fileContent: contextData.fileContent,
            fileName: contextData.fileName || 'uploaded_file'
          }),
          // Include other context data
          ...(contextData.caseId && { caseId: contextData.caseId }),
          ...(contextData.clientId && { clientId: contextData.clientId })
        }
      };

      console.log('Sending AI request:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/ai/chat', payload);
      
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response format from AI service');
      }
      
      return response.data;
    } catch (error) {
      console.error('AI Service Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      let errorMessage = 'Failed to get response from AI service';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Extract information using AI
  async extractInformation({ text, schema }) {
    try {
      const response = await api.post('/ai/extract', {
        textToAnalyze: text,
        extractionSchema: schema
      });
      return response.data;
    } catch (error) {
      console.error('AI Extraction Error:', error);
      throw error;
    }
  }
};
