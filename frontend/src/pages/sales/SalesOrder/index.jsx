import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

function statusTag(status) {
  if (status === 'CONFIRMED') return <Tag color="green">Đã xuất kho</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="gold">Chờ xác nhận</Tag>;
}

// Trang nay da noi API that (khong con mock) - xem backend/.../sales/controller/SalesOrderController.java.
// SALE-05: xac nhan se tu dong xuat kho, backend tu chan neu khong du ton kho (HTTP 409).
export default function SalesOrderPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const customerOptions = customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}`, price: p.price }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/sales-orders'),
      axiosClient.get('/customers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([ordersRes, customersRes, warehousesRes, productsRes]) => {
        setOrders(ordersRes.data.data);
        setCustomers(customersRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu đơn hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return o.docNumber.toLowerCase().includes(keyword) || (o.customer?.name || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingOrder(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      customerId: record.customer?.id,
      warehouseId: record.warehouse?.id,
    });
    setDetailRows(record.details.map((d) => ({ id: d.id, productId: d.product.id, quantity: d.quantity, unitPrice: d.unitPrice })));
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/sales-orders/${record.id}`)
      .then(() => {
        message.success('Đã xóa đơn hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmOrder(record) {
    axiosClient
      .post(`/sales-orders/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận đơn hàng - xuất kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
  }

  function handleCancelOrder(record) {
    axiosClient
      .post(`/sales-orders/${record.id}/cancel`)
      .then(() => {
        message.success('Đã hủy đơn hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Hủy thất bại'));
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setDetailModalOpen(true);
  }

  // Tra gia tu dong theo Bang gia: customer.price_list_id -> branch.price_list_id (qua kho xuat)
  // -> product.price. Xem backend/.../category/pricelist/service/PriceListService.lookupPrice.
  // Van cho sua tay unitPrice sau khi dien tu dong (khong disable field), khop hanh vi truoc day.
  function handleProductSelect(productId) {
    const fallbackPrice = productOptions.find((p) => p.value === productId)?.price;
    detailForm.setFieldsValue({ unitPrice: fallbackPrice });

    const customerId = form.getFieldValue('customerId');
    const warehouseId = form.getFieldValue('warehouseId');
    axiosClient
      .get('/price-lists/lookup', { params: { productId, customerId, warehouseId } })
      .then(({ data }) => {
        if (data.data != null) {
          detailForm.setFieldsValue({ unitPrice: data.data });
        }
      })
      .catch(() => {
        // Giu gia fallback tu product.price neu tra gia loi - khong chan luong nhap don hang.
      });
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
      if (detailRows.length === 0) {
        message.error('Đơn hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        details: detailRows.map((d) => ({ productId: d.productId, quantity: d.quantity, unitPrice: d.unitPrice })),
      };
      const request = editingOrder
        ? axiosClient.put(`/sales-orders/${editingOrder.id}`, payload)
        : axiosClient.post('/sales-orders', payload);
      request
        .then(() => {
          message.success(editingOrder ? 'Cập nhật thành công' : 'Tạo đơn hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const totalAmount = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0);

  const columns = [
    { title: 'Số đơn', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày đặt hàng', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Khách hàng', key: 'customer', render: (_, o) => o.customer?.name },
    { title: 'Kho xuất', key: 'warehouse', render: (_, o) => o.warehouse?.name },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => Number(v)?.toLocaleString('vi-VN') + ' đ',
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        return (
          <Space>
            <Button icon={<EditOutlined />} disabled={!isPending} onClick={() => openEditModal(record)} />
            {isPending && (
              <>
                <Popconfirm
                  title="Xác nhận đơn hàng này?"
                  description="Sau khi xác nhận sẽ xuất kho và không thể sửa/hủy."
                  onConfirm={() => handleConfirmOrder(record)}
                >
                  <Button icon={<CheckOutlined />} type="primary" ghost />
                </Popconfirm>
                <Popconfirm title="Hủy đơn hàng này?" onConfirm={() => handleCancelOrder(record)}>
                  <Button icon={<StopOutlined />} />
                </Popconfirm>
              </>
            )}
            <Popconfirm title="Xóa đơn hàng này?" disabled={!isPending} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isPending} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
    {
      title: 'Thành tiền',
      key: 'amount',
      render: (_, d) => (d.quantity * d.unitPrice).toLocaleString('vi-VN') + ' đ',
    },
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
      <Title level={3}>Quản lý bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn hoặc khách hàng..."
        onAdd={openCreateModal}
        addTooltip="Thêm đơn hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredOrders} loading={loading} />

      <Modal
        title={editingOrder ? `Sửa đơn hàng ${editingOrder.docNumber}` : 'Thêm đơn hàng'}
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
              <Form.Item label="Số đơn" name="docNumber" extra={editingOrder ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingOrder} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày đặt hàng" name="docDate" rules={[{ required: true, message: 'Ngày đặt hàng không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho xuất" name="warehouseId" rules={[{ required: true, message: 'Kho xuất không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khách hàng" name="customerId" rules={[{ required: true, message: 'Khách hàng không được để trống' }]}>
                <Select options={customerOptions} placeholder="Chọn khách hàng" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết đơn hàng</Text>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12 }}>
          <Text>
            Tổng số lượng: <Text strong>{totalQty.toLocaleString('vi-VN')}</Text>
          </Text>
          <Text>
            Tổng tiền: <Text strong>{totalAmount.toLocaleString('vi-VN')} đ</Text>
          </Text>
        </div>
      </Modal>

      <Modal
        title="Thêm dòng sản phẩm"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}
          >
            <Select
              options={productOptions}
              placeholder="Chọn sản phẩm"
              onChange={handleProductSelect}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số lượng"
                name="quantity"
                rules={[{ required: true, message: 'Số lượng không được để trống' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Đơn giá"
                name="unitPrice"
                rules={[{ required: true, message: 'Đơn giá không được để trống' }]}
              >
                <InputNumber min={0} step={1000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
