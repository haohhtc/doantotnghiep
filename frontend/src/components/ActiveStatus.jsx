import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

// Icon tich xanh/x do kieu OMS thay cho Tag mau - dung chung cho cot Active o cac trang danh muc.
export default function ActiveStatus({ active }) {
  return active ? (
    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
  ) : (
    <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
  );
}
