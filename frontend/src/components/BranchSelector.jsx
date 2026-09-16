import { useMemo, useState } from 'react';
import { Modal, Input, List, Tag } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { useBranch } from '../contexts/BranchContext';

// Badge o Header hang 1 - bam mo popup chon chi nhanh (tim theo Ma/Ten chi nhanh, theo mau OMS
// that o hinhanh/). Nhan hien thi tam thoi la "{ma CN} - {ten CN}" - phan "nguoi phu trach" se
// bo sung sau khi Nhom 5 them cot Branch.default_manager_id (xem tonghop.md, muc Nhom 1).
export default function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranchId, loading } = useBranch();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return branches;
    return branches.filter(
      (b) =>
        b.code.toLowerCase().includes(kw) ||
        b.name.toLowerCase().includes(kw) ||
        (b.company?.name || '').toLowerCase().includes(kw)
    );
  }, [branches, keyword]);

  function handlePick(branch) {
    setSelectedBranchId(branch.id);
    setOpen(false);
    setKeyword('');
  }

  return (
    <>
      <Tag
        icon={<BankOutlined />}
        color="blue"
        style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 13 }}
        onClick={() => setOpen(true)}
      >
        {loading ? 'Đang tải...' : selectedBranch ? `${selectedBranch.code} - ${selectedBranch.name}` : 'Chưa chọn chi nhánh'}
      </Tag>

      <Modal
        title="Chọn chi nhánh"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Input.Search
          placeholder="Tìm theo mã chi nhánh, tên chi nhánh hoặc công ty..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          autoFocus
          style={{ marginBottom: 12 }}
        />
        <List
          dataSource={filtered}
          style={{ maxHeight: 360, overflowY: 'auto' }}
          renderItem={(b) => (
            <List.Item
              onClick={() => handlePick(b)}
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                background: b.id === selectedBranch?.id ? '#e6f4ff' : undefined,
                borderRadius: 4,
              }}
            >
              <List.Item.Meta
                title={`${b.code} - ${b.name}`}
                description={b.company?.name || ''}
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}
