import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title, Text } = Typography;

const REASON_OPTIONS = [
  { value: 'REBALANCE', label: 'Cân đối tồn kho giữa các kho' },
  { value: 'REQUEST', label: 'Theo yêu cầu chi nhánh' },
  { value: 'CONSIGNMENT', label: 'Chuyển hàng ký gửi' },
];

function reasonLabel(code) {
  return REASON_OPTIONS.find((o) => o.value === code)?.label || code;
}

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã nhận hàng</Tag>;
  if (status === 'IN_TRANSIT') return <Tag color="blue">Đang vận chuyển</Tag>;
  return <Tag color="gold">Nháp</Tag>;
}

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/xac nhan.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Buoc 1/2 cua Dieu chuyen kho (giong DMS that - man hinh rieng voi buoc Xac nhan di chuyen).
// Trang nay chi lam viec "kho nguon xac nhan xuat" (DRAFT -> IN_TRANSIT). Buoc "kho dich xac
// nhan nhan" (IN_TRANSIT -> CLOSED) nam o trang rieng /inventory/transfer-confirmation.
// Xem backend/.../inventory/controller/InventoryTransferController.java.
export default function TransferPage() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const employeeOptions = employees.map((u) => ({ value: u.id, label: u.fullName || u.username }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    // GET /api/users chi ADMIN + WAREHOUSE_MANAGER duoc doc (xem SecurityConfig) - chi goi khi
    // can, tranh 403 lam fail ca Promise.all doi voi SALES_STAFF (chi xem).
    const requests = [
      axiosClient.get('/inventory-transfers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ];
    if (canWrite) requests.push(axiosClient.get('/users'));

    Promise.all(requests)
      .then(([transfersRes, warehousesRes, productsRes, usersRes]) => {
        setTransfers(transfersRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
        if (usersRes) setEmployees(usersRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu điều chuyển kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransfers = transfers.filter((t) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return t.docNumber.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingTransfer(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingTransfer(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      postingDate: record.postingDate,
      fromWarehouseId: record.fromWarehouse?.id,
      toWarehouseId: record.toWarehouse?.id,
      salesEmployeeId: record.salesEmployee?.id,
      reason: record.reason,
      remarks: record.remarks,
    });
    setDetailRows(record.items.map((d) => ({ id: d.id, productId: d.product.id, quantity: d.quantity, batch: d.batch, note: d.note })));
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/inventory-transfers/${record.id}`)
      .then(() => {
        message.success('Đã xóa phiếu điều chuyển');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmSend(record) {
    axiosClient
      .post(`/inventory-transfers/${record.id}/confirm-send`)
      .then(() => {
        message.success('Đã xác nhận xuất kho nguồn - hàng đang vận chuyển');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setDetailModalOpen(true);
  }

  function handleSubmitDetailRow() {
    detailForm.validateFields().then((values) => {
      setDetailRows((prev) => [...prev, { id: Date.now(), ...values }]);
      setDetailModalOpen(false);
    });
  }

  function handleRemoveDetailRow(id) {
    setDetailRows((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (values.fromWarehouseId === values.toWarehouseId) {
        message.error('Kho đi và kho đến không được trùng nhau');
        return;
      }
      if (detailRows.length === 0) {
        message.error('Phiếu điều chuyển phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, quantity: d.quantity, batch: d.batch, note: d.note })),
      };
      const request = editingTransfer
        ? axiosClient.put(`/inventory-transfers/${editingTransfer.id}`, payload)
        : axiosClient.post('/inventory-transfers', payload);
      request
        .then(() => {
          message.success(editingTransfer ? 'Cập nhật thành công' : 'Tạo phiếu điều chuyển thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Kho đi', key: 'from', render: (_, r) => r.fromWarehouse?.name },
    { title: 'Kho đến', key: 'to', render: (_, r) => r.toWarehouse?.name },
    { title: 'Nhân viên phụ trách', key: 'employee', render: (_, r) => r.salesEmployee?.fullName || r.salesEmployee?.username || '-' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => {
              const isDraft = record.status === 'DRAFT';
              return (
                <Space>
                  <Button icon={<EditOutlined />} disabled={!isDraft} onClick={() => openEditModal(record)} />
                  {isDraft && (
                    <Popconfirm
                      title="Xác nhận xuất kho nguồn?"
                      description="Sau khi xác nhận sẽ trừ tồn kho nguồn, hàng chuyển sang trạng thái đang vận chuyển."
                      onConfirm={() => handleConfirmSend(record)}
                    >
                      <Button icon={<CheckOutlined />} type="primary" ghost />
                    </Popconfirm>
                  )}
                  <Popconfirm title="Xóa phiếu này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
                    <Button icon={<DeleteOutlined />} danger disabled={!isDraft} />
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]
      : []),
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Số lô', dataIndex: 'batch', key: 'batch' },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleRemoveDetailRow(record.id)} />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Chuyển hàng tồn kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm phiếu điều chuyển"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredTransfers} loading={loading} />

      <Modal
        title={editingTransfer ? `Sửa phiếu điều chuyển ${editingTransfer.docNumber}` : 'Thêm phiếu điều chuyển'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Số phiếu" name="docNumber" extra={editingTransfer ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingTransfer} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày chứng từ" name="docDate" rules={[{ required: true, message: 'Ngày chứng từ không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày ghi sổ" name="postingDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho đi" name="fromWarehouseId" rules={[{ required: true, message: 'Kho đi không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho đi" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho đến" name="toWarehouseId" rules={[{ required: true, message: 'Kho đến không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho đến" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nhân viên phụ trách" name="salesEmployeeId">
                <Select options={employeeOptions} placeholder="Chọn nhân viên" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do" name="reason" rules={[{ required: true, message: 'Lý do không được để trống' }]}>
                <Select options={REASON_OPTIONS} placeholder="Chọn lý do" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Danh sách hàng điều chuyển</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddDetailRow}>
            Thêm dòng
          </Button>
        </div>
        <Table
          rowKey="id"
          size="small"
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          locale={{ emptyText: 'Không có dữ liệu' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Text>
            Tổng số lượng: <Text strong>{totalQty.toLocaleString('vi-VN')}</Text>
          </Text>
        </div>
      </Modal>

      <Modal
        title="Thêm dòng hàng điều chuyển"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số lô" name="batch">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Ghi chú" name="note">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
