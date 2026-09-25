import { Typography, Table, Card, Alert, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

const SITUATIONS = [
  { key: 1, situation: 'Khách trả hàng', detail: 'Công ty ghi có cho khách đúng giá trị hàng trả, trừ vào công nợ.' },
  { key: 2, situation: 'Giảm giá / chiết khấu sau khi đã xuất hóa đơn', detail: 'Hàng lỗi, giao thiếu... công ty giảm bớt số tiền khách phải trả.' },
  { key: 3, situation: 'Xuất hóa đơn nhầm số tiền', detail: 'Cần điều chỉnh giảm lại cho đúng.' },
];

const COMPARE = [
  { key: 1, doc: 'Hóa đơn (Invoice)', effect: 'Khách nợ THÊM' },
  { key: 2, doc: 'Phiếu ghi có (Credit Memo)', effect: 'Khách nợ BỚT (chiều ngược của hóa đơn)' },
];

// Trang ghi chu (khong phai chuc nang that): Phieu ghi co chua lam vi he thong chua co khai niem cong no
// khach hang, tai lieu DMS cua do an ghi "khong lam" Invoices/Credit Memos - xem dalam.md.
export default function CreditMemoInfoPage() {
  return (
    <div>
      <Title level={3}>Phiếu ghi có (Credit Memo)</Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Trang ghi chú kiến thức — chưa phải chức năng thật của hệ thống."
      />

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="Là gì?">
          <Paragraph style={{ marginBottom: 0 }}>
            Chứng từ kế toán mà công ty phát hành cho <Text strong>khách hàng</Text> để{' '}
            <Text strong>giảm số tiền khách đang nợ</Text> mình.
          </Paragraph>
        </Card>

        <Card title="Khi nào có phiếu ghi có?">
          <Table
            size="small"
            pagination={false}
            dataSource={SITUATIONS}
            columns={[
              { title: 'Tình huống', dataIndex: 'situation', width: 320 },
              { title: 'Ý nghĩa', dataIndex: 'detail' },
            ]}
          />
        </Card>

        <Card title="Ví dụ">
          <Paragraph style={{ marginBottom: 0 }}>
            Khách nợ <Text strong>10 triệu</Text>, trả hàng trị giá <Text strong>2 triệu</Text> → công ty lập phiếu ghi
            có 2 triệu → khách chỉ còn nợ <Text strong>8 triệu</Text>.
          </Paragraph>
        </Card>

        <Card title="So với Hóa đơn">
          <Table
            size="small"
            pagination={false}
            dataSource={COMPARE}
            columns={[
              { title: 'Chứng từ', dataIndex: 'doc', width: 320 },
              { title: 'Ảnh hưởng công nợ khách', dataIndex: 'effect' },
            ]}
          />
        </Card>

        <Card title="Trong hệ thống của mình">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Hệ thống <Text strong>chưa có khái niệm công nợ khách hàng</Text> (không theo dõi khách đang nợ bao nhiêu).</li>
            <li>
              Vì vậy <Text strong>Trả hàng</Text> chỉ cộng lại tồn kho, không có bước giảm nợ, nên chưa cần phiếu ghi có riêng.
            </li>
            <li>Muốn có phiếu ghi có thật thì phải làm thêm module công nợ khách hàng — tài liệu DMS của đồ án ghi là "không làm".</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
}
