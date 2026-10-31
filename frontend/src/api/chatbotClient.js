import axios from 'axios';
import { getCurrentRole, getCurrentBranchCode } from '../utils/auth';

// AI-04 Chatbot (ai-services/chatbot, port 8004) - service Python rieng, goi TRUC TIEP tu
// Frontend (khong qua Backend Spring Boot) theo dung api-contract da chot:
// docs/05-api-contract/api-endpoints.md muc "AI Services [BE2]".
const chatbotClient = axios.create({
  baseURL: import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8004',
  timeout: 15000,
});

// Gui kem role + branchCode cua nguoi dang dang nhap - chatbot dung de CHAN khong cho user
// khong phai ADMIN (vd WAREHOUSE_MANAGER - "NPP") hoi du lieu cua chi nhanh/NPP khac. ADMIN
// (Admin HO) khong co branchCode gioi han nen khong bi chan.
export async function askChatbot(question) {
  const { data } = await chatbotClient.post('/chat', {
    question,
    role: getCurrentRole(),
    branchCode: getCurrentBranchCode(),
  });
  return data;
}

export async function fetchSuggestedQuestions() {
  const { data } = await chatbotClient.get('/suggestions');
  return data.questions || [];
}

export default chatbotClient;
