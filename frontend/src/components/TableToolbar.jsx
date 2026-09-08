import { useEffect, useState } from 'react';
import { Button, Input, Space, Tooltip, Popover, Form, Select, Badge, message } from 'antd';
import { PlusOutlined, ReloadOutlined, ExportOutlined, FilterOutlined } from '@ant-design/icons';

// Thanh cong cu chuan kieu OMS: nut icon nho (+/Reload/Export/Filter) can le phai kem
// o Search gon - dung chung cho cac trang danh muc (Vendors, Warehouses, Uoms, ProductCategory...).
// Export van la UI mau (mock, chua co logic that). Filter: neu trang truyen prop `filters`
// thi mo popover loc that theo tung field; neu khong truyen thi giu hanh vi cu (bao "chua ho tro").
export default function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  onAdd,
  addTooltip = 'Thêm mới',
  onReload,
  filters,
  filterValues,
  onFilterChange,
  extra,
  beforeFilter,
}) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const hasFilters = Array.isArray(filters) && filters.length > 0;
  const activeFilterCount = filterValues
    ? Object.values(filterValues).filter((v) => v !== undefined && v !== null && v !== '').length
    : 0;

  useEffect(() => {
    if (open) form.setFieldsValue(filterValues || {});
  }, [open, filterValues, form]);

  function handleApply() {
    onFilterChange(form.getFieldsValue());
    setOpen(false);
  }

  function handleClear() {
    form.resetFields();
    onFilterChange({});
    setOpen(false);
  }

  const filterPopoverContent = hasFilters && (
    <Form form={form} layout="vertical" style={{ width: 240 }}>
      {filters.map((f) => (
        <Form.Item key={f.name} name={f.name} label={f.label} style={{ marginBottom: 12 }}>
          <Select allowClear placeholder="Tất cả" options={f.options} />
        </Form.Item>
      ))}
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button size="small" onClick={handleClear}>
          Xóa lọc
        </Button>
        <Button size="small" type="primary" onClick={handleApply}>
          Áp dụng
        </Button>
      </Space>
    </Form>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Space size={4}>
        {extra}
        {onAdd && (
          <Tooltip title={addTooltip}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} />
          </Tooltip>
        )}
        <Tooltip title="Làm mới">
          <Button icon={<ReloadOutlined />} onClick={onReload} />
        </Tooltip>
        <Tooltip title="Xuất file">
          <Button icon={<ExportOutlined />} onClick={() => message.info('Chưa hỗ trợ xuất file - đây là dữ liệu mẫu')} />
        </Tooltip>
        {beforeFilter}
        {hasFilters ? (
          <Popover
            open={open}
            onOpenChange={setOpen}
            trigger="click"
            placement="bottomRight"
            content={filterPopoverContent}
            title="Lọc nâng cao"
          >
            <Badge dot={activeFilterCount > 0} offset={[-4, 4]}>
              <Tooltip title="Lọc nâng cao">
                <Button icon={<FilterOutlined />} type={activeFilterCount > 0 ? 'primary' : 'default'} ghost={activeFilterCount > 0} />
              </Tooltip>
            </Badge>
          </Popover>
        ) : (
          <Tooltip title="Lọc">
            <Button icon={<FilterOutlined />} onClick={() => message.info('Chưa hỗ trợ lọc nâng cao - dùng ô tìm kiếm')} />
          </Tooltip>
        )}
      </Space>
      <Input.Search
        placeholder={searchPlaceholder}
        allowClear
        style={{ width: 220 }}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
