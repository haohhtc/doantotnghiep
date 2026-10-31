import { useEffect, useRef, useState } from 'react';
import { Card, Input, Button, Avatar, Spin, Tag, Space, Typography, Alert } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { askChatbot, fetchSuggestedQuestions } from '../api/chatbotClient';

const { Text, Paragraph } = Typography;

const FALLBACK_SUGGESTIONS = [
  'Doanh thu tháng này là bao nhiêu?',
  'Sản phẩm nào bán chạy nhất?',
  'Sản phẩm nào sắp hết hàng?',
  'Tồn kho hiện tại theo từng kho?',
];

const WELCOME_MESSAGE = {
  role: 'bot',
  text: 'Chào bạn, tôi là trợ lý AI của ERPQLKHO. Bạn có thể hỏi tôi về doanh thu, sản phẩm bán chạy/bán chậm, tồn kho, cảnh báo sắp hết hàng, tình hình nhập hàng hoặc nhà cung cấp.',
};

// Widget AI hoi-dap tren trang chu - goi thang ai-services/chatbot (:8004), tach biet Backend
// Spring Boot. Chi render cho role ADMIN/WAREHOUSE_MANAGER (xem pages/Home) - NVBH khong thay.
export default function AiChatWidget() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [serviceDown, setServiceDown] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchSuggestedQuestions()
      .then((qs) => qs.length && setSuggestions(qs))
      .catch(() => {}); // giu fallback neu service AI chua chay, khong chan UI
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(question) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await askChatbot(q);
      setServiceDown(false);
      setMessages((prev) => [...prev, { role: 'bot', text: res.answer, intent: res.intent }]);
    } catch {
      setServiceDown(true);
      setMessages((prev) => [...prev, {
        role: 'bot',
        text: 'Không kết nối được tới dịch vụ AI Chatbot (ai-services/chatbot, cổng 8004). Vui lòng kiểm tra service đã chạy chưa.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title={<Space><RobotOutlined /> Hỏi đáp AI</Space>}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12, height: 420 } }}
    >
      {serviceDown && (
        <Alert type="warning" showIcon message="Dịch vụ AI Chatbot hiện không phản hồi." />
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <Avatar size="small" icon={m.role === 'user' ? <UserOutlined /> : <RobotOutlined />} />
            <div
              style={{
                maxWidth: '78%',
                background: m.role === 'user' ? '#1677ff' : '#f5f5f5',
                color: m.role === 'user' ? '#fff' : 'rgba(0,0,0,0.88)',
                borderRadius: 10,
                padding: '8px 12px',
                whiteSpace: 'pre-line',
              }}
            >
              <Paragraph style={{ margin: 0, color: 'inherit' }}>{m.text}</Paragraph>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Avatar size="small" icon={<RobotOutlined />} />
            <Spin size="small" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <Space wrap size={[8, 8]}>
          {suggestions.map((s) => (
            <Tag key={s} style={{ cursor: 'pointer' }} color="blue" onClick={() => handleSend(s)}>
              {s}
            </Tag>
          ))}
        </Space>
      )}

      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Nhập câu hỏi, vd: Sản phẩm nào sắp hết hàng?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => handleSend()}
          disabled={loading}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={() => handleSend()} loading={loading}>
          Gửi
        </Button>
      </Space.Compact>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Câu trả lời được tính trực tiếp từ dữ liệu thật trong Data Warehouse.
      </Text>
    </Card>
  );
}
