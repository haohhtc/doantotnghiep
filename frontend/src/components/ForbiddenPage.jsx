import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

// Hien khi user da dang nhap nhung role khong du quyen truy cap route nay
// (vd: SALES_STAFF go thang URL /users hoac /roles).
export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Bạn không có quyền truy cập trang này."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  );
}
