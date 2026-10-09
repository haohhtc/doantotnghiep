import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã duyệt</Tag>;
  return <Tag color="gold">Nháp</Tag>;
}

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/duyet
// phieu tra hang NCC, SALES_STAFF chi duoc xem (GET).

// Phieu tra hang NCC (gop Goods Return Request + Confirm thanh 1 buoc) - xem
// backend/.../inbound/controller/PurchaseReturnController.java. Duyet (DRAFT -> CLOSED) se tru
// ton kho qua StockService, tai dung y het pattern Goods Issue.
// canWrite tinh trong component (khong o module scope) - xem ghi chu o pages/branches/index.jsx.
export default function PurchaseGoodsReturnPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const { selectedBranchId } = useBranch();
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));
  // Kho xuat tra gio khong cho chon tay nua - tu dong la Kho hu (DAMAGE) cua chi nhanh dang chon
  // (hang tra NCC thuong la hang loi/hu dang nam o kho DAMAGE) - xem openCreateModal. Van giu rieng
  // kho cua ban ghi dang sua (editingReturn) de khong mat label, giong cac trang khac.
  const warehouseOptions = warehouses
    .filter((w) => w.id === editingReturn?.warehouse?.id || (!selectedBranchId || w.branch?.id === selectedBranchId))
    .map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const goodsReceiptOptions = goodsReceipts.map((g) => ({ value: g.id, label: g.docNumber }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/purchase-returns'),
      axiosClient.get('/suppliers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
      axiosClient.get('/goods-receipts'),
    ])
      .then(([retRes, suppliersRes, warehousesRes, productsRes, receiptsRes]) => {
        setReturns(retRes.data.data);
        setSuppliers(suppliersRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
        setGoodsReceipts(receiptsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu phiếu trả hàng NCC'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredReturns = returns.filter((r) => {
    if (selectedBranchId && r.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.docNumber.toLowerCase().includes(keyword) || (r.supplier?.name || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingReturn(null);
    form.resetFields();
    const damageWarehouse = warehouses.find((w) => w.branch?.id === selectedBranchId && w.warehouseType === 'DAMAGE');
    if (!damageWarehouse) {
      message.error('Chi nhánh này chưa có Kho hư (DAMAGE) - vui lòng cấu hình kho trước');
    }
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10), warehouseId: damageWarehouse?.id });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingReturn(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      postingDate: record.postingDate,
      supplierId: record.supplier?.id,
      warehouseId: record.warehouse?.id,
      goodsReceiptId: record.goodsReceipt?.id,
      reason: record.reason,
      remarks: record.remarks,
    });
    setDetailRows(record.items.map((d) => ({ id: d.id, productId: d.product.id, quantity: d.quantity, note: d.note })));
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/purchase-returns/${record.id}`)
      .then(() => {
        message.success('Đã xóa phiếu trả hàng NCC');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmReturn(record) {
    axiosClient
      .post(`/purchase-returns/${record.id}/confirm`)
      .then(() => {
        message.success('Đã duyệt phiếu trả hàng NCC - đã trừ tồn kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Duyệt thất bại'));
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
      if (detailRows.length === 0) {
        message.error('Phiếu trả hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, quantity: d.quantity, note: d.note })),
      };
      const request = editingReturn
        ? axiosClient.put(`/purchase-returns/${editingReturn.id}`, payload)
        : axiosClient.post('/purchase-returns', payload);
      request
        .then(() => {
          message.success(editingReturn ? 'Cập nhật thành công' : 'Tạo phiếu trả hàng NCC thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Nhà cung cấp', key: 'supplier', render: (_, r) => r.supplier?.name },
    { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Phiếu nhập gốc', key: 'goodsReceipt', render: (_, r) => r.goodsReceipt?.docNumber || '-' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} disabled={record.status === 'CLOSED'} onClick={() => openEditModal(record)} />
                {record.status === 'DRAFT' && (
                  <Popconfirm
                    title="Duyệt phiếu trả hàng NCC này?"
                    description="Sau khi duyệt sẽ trừ vào tồn kho và không thể sửa/xóa."
                    onConfirm={() => handleConfirmReturn(record)}
                  >
                    <Button icon={<CheckOutlined />} type="primary" ghost />
                  </Popconfirm>
                )}
                <Popconfirm title="Xóa phiếu trả hàng NCC này?" disabled={record.status === 'CLOSED'} onConfirm={() => handleDelete(record)}>
                  <Button icon={<DeleteOutlined />} danger disabled={record.status === 'CLOSED'} />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
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
      <Title level={3}>Trả hàng nhà cung cấp</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc nhà cung cấp..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm phiếu trả hàng NCC"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredReturns} loading={loading} />

      <Modal
        title={editingReturn ? `Sửa phiếu trả hàng NCC ${editingReturn.docNumber}` : 'Thêm phiếu trả hàng NCC'}
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
              <Form.Item label="Số phiếu" name="docNumber" extra={editingReturn ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingReturn} placeholder="Tự sinh nếu để trống" />
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
              <Form.Item label="Nhà cung cấp" name="supplierId" rules={[{ required: true, message: 'Nhà cung cấp không được để trống' }]}>
                <Select options={supplierOptions} placeholder="Chọn nhà cung cấp" showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Kho xuất trả"
                name="warehouseId"
                rules={[{ required: true, message: 'Chi nhánh chưa có Kho hư (DAMAGE)' }]}
                extra="Tự động là Kho hư (DAMAGE) của chi nhánh đang chọn"
              >
                <Select options={warehouseOptions} placeholder="Chưa xác định được Kho hư" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Phiếu nhập gốc" name="goodsReceiptId">
                <Select options={goodsReceiptOptions} placeholder="Chọn phiếu nhập gốc (nếu có)" allowClear showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do trả" name="reason">
                <Input placeholder="VD: Hàng lỗi, giao sai..." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Ghi chú" name="remarks">
            <TextArea rows={1} />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết hàng trả</Text>
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
      </Modal>

      <Modal
        title="Thêm dòng hàng trả"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
