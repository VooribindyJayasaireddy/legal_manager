import axios from 'axios';

const API_URL = 'http://localhost:5000/api/cases';

export const getCases = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
};

export const getCaseStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching case stats:', error);
    throw error;
  }
};
