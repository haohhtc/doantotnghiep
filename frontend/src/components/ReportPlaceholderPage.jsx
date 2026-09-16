import { Typography } from 'antd';

const { Title } = Typography;

// Khung rong cho module Bao cao (PowerBI) - chi co tieu de + 1 vung noi dung trong hoan toan, de
// Nhi (Thanh vien 2 - ETL/DW/AI/BI, branch feature/data-ai) gan PowerBI vao sau. Khong co
// API/du lieu gi o day - xem tonghop.md muc "Nhi dat hang lon" Nhom 7.
export default function ReportPlaceholderPage({ title }) {
  return (
    <div>
      <Title level={3}>{title}</Title>
      <div
        style={{
          minHeight: 480,
          border: '1px dashed #d9d9d9',
          borderRadius: 8,
          background: '#fafafa',
        }}
      />
    </div>
  );
}
