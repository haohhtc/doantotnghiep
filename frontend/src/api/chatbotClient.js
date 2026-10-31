import axios from 'axios';

// AI-04 Chatbot (ai-services/chatbot, port 8004) - service Python rieng, goi TRUC TIEP tu
// Frontend (khong qua Backend Spring Boot) theo dung api-contract da chot:
// docs/05-api-contract/api-endpoints.md muc "AI Services [BE2]".
const chatbotClient = axios.create({
  baseURL: import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8004',
  timeout: 15000,
});

export async function askChatbot(question) {
  const { data } = await chatbotClient.post('/chat', { question });
  return data;
}

export async function fetchSuggestedQuestions() {
  const { data } = await chatbotClient.get('/suggestions');
  return data.questions || [];
}

export default chatbotClient;
