import { Typography, Alert } from 'antd';

const { Title } = Typography;

// URL nhung PowerBI: lay tu app.powerbi.com -> File -> Embed report -> Publish to web
// Dan vao VITE_PBI_INVENTORY_URL trong frontend/.env.local hoac sua truc tiep o day
const PBI_URL = import.meta.env.VITE_PBI_INVENTORY_URL || '';

export default function InventoryReportPage() {
  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>Báo cáo Tồn kho</Title>

      {PBI_URL ? (
        <iframe
          title="BC Tồn kho"
          src={PBI_URL}
          width="100%"
          height="800"
          style={{ border: 'none', borderRadius: 8 }}
          allowFullScreen
        />
      ) : (
        <Alert
          type="info"
          showIcon
          message="Chưa có URL nhúng Power BI"
          description={
            <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Mở BC_TONKHO.pbix trong Power BI Desktop</li>
              <li>Đăng nhập app.powerbi.com bằng tài khoản school → Upload file</li>
              <li>Mở report → <b>File → Embed report → Publish to web</b></li>
              <li>Copy URL iframe, thêm vào <code>frontend/.env.local</code>:<br/>
                <code>VITE_PBI_INVENTORY_URL=https://app.powerbi.com/view?r=...</code>
              </li>
              <li>Restart dev server (Ctrl+C rồi <code>npm run dev</code>)</li>
            </ol>
          }
          style={{ marginBottom: 16 }}
        />
      )}
    </div>
  );
}
