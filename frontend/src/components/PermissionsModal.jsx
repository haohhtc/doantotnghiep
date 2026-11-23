import { useEffect, useMemo, useState } from 'react';
import { Modal, Checkbox, Tree, List, message, Spin, Typography } from 'antd';
import axiosClient from '../api/axiosClient';

const { Text } = Typography;

// Khop dung nhan voi cac action dang dung trong PermissionCatalog.java (Backend).
const ACTION_LABELS = {
  view: 'Xem', create: 'Tạo', edit: 'Sửa', delete: 'Xóa',
  confirm: 'Duyệt/Xác nhận', cancel: 'Hủy',
  confirm_send: 'Xác nhận xuất (kho nguồn)', confirm_receive: 'Xác nhận nhận (kho đích)',
};

// Modal "Phân quyền" chi tiết (trang x hành động) - đặt cạnh nút "Sửa" ở trang Người dùng. Lấy
// danh mục quyền từ Backend (GET /api/permissions/catalog, nguồn duy nhất - xem PermissionCatalog.
// java) rồi vẽ cây 2 cột giống ảnh mẫu OMS: trái = Permission Group kèm số lượng, phải = Select
// all + cây checkbox Trang > Hành động (Tree tự lo quan hệ cha-con). ADMIN luôn có toàn bộ quyền
// tự động (Backend không đọc cột permissions của ADMIN) nên modal cho ADMIN chỉ xem, không sửa.
export default function PermissionsModal({ open, user, onClose, onSaved }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [checkedCodes, setCheckedCodes] = useState([]);

  const isAdmin = user?.role?.code === 'ADMIN';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    axiosClient
      .get('/permissions/catalog')
      .then(({ data }) => {
        setCatalog(data.data);
        setActiveGroup(data.data[0]?.code || null);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh mục quyền'))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isAdmin) {
      // ADMIN luon duoc toan bo - hien du de nguoi dung thay, khong doc tu cot permissions (rong).
      setCheckedCodes(catalog.flatMap((g) => g.pages.flatMap((p) => p.actions.map((a) => `${p.code}:${a}`))));
    } else {
      setCheckedCodes((user?.permissions || '').split(',').map((s) => s.trim()).filter(Boolean));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, catalog]);

  const allCodes = useMemo(
    () => catalog.flatMap((g) => g.pages.flatMap((p) => p.actions.map((a) => `${p.code}:${a}`))),
    [catalog]
  );
  const grantAllChecked = allCodes.length > 0 && allCodes.every((c) => checkedCodes.includes(c));

  function handleGrantAll(checked) {
    setCheckedCodes(checked ? allCodes : []);
  }

  const currentGroup = catalog.find((g) => g.code === activeGroup);
  const groupCodes = currentGroup ? currentGroup.pages.flatMap((p) => p.actions.map((a) => `${p.code}:${a}`)) : [];
  const groupAllChecked = groupCodes.length > 0 && groupCodes.every((c) => checkedCodes.includes(c));
  const groupSomeChecked = groupCodes.some((c) => checkedCodes.includes(c));

  function handleGroupSelectAll(checked) {
    setCheckedCodes((prev) => {
      const withoutGroup = prev.filter((c) => !groupCodes.includes(c));
      return checked ? [...withoutGroup, ...groupCodes] : withoutGroup;
    });
  }

  const treeData = currentGroup
    ? currentGroup.pages.map((p) => ({
        key: p.code,
        title: p.label,
        children: p.actions.map((a) => ({
          key: `${p.code}:${a}`,
          title: ACTION_LABELS[a] || a,
        })),
      }))
    : [];

  function handleTreeCheck(checkedKeysValue) {
    // Tree tra ve ca key cua trang (cha, vd "sales_order") lan key hanh dong (con, "sales_order:view")
    // khi checkStrictly=false - chi luu lai cac key THAT la ma quyen (co dau ":"), key cha chi
    // dung de hien thi indeterminate, khong phai 1 ma quyen that.
    const leafKeysInGroup = checkedKeysValue.filter((k) => k.includes(':'));
    setCheckedCodes((prev) => {
      const withoutGroup = prev.filter((c) => !groupCodes.includes(c));
      return [...withoutGroup, ...leafKeysInGroup];
    });
  }

  function handleSave() {
    setSaving(true);
    axiosClient
      .put(`/users/${user.id}/permissions`, checkedCodes)
      .then(() => {
        message.success('Đã cập nhật phân quyền');
        onSaved?.();
        onClose();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Cập nhật phân quyền thất bại'))
      .finally(() => setSaving(false));
  }

  return (
    <Modal
      title={`Phân quyền - ${user?.username || ''}`}
      open={open}
      onCancel={onClose}
      onOk={isAdmin ? onClose : handleSave}
      okText={isAdmin ? 'Đóng' : 'Lưu'}
      cancelButtonProps={isAdmin ? { style: { display: 'none' } } : undefined}
      confirmLoading={saving}
      width={720}
      destroyOnHidden
    >
      {loading ? (
        <Spin />
      ) : (
        <>
          {isAdmin && (
            <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
              Quản trị viên luôn có toàn bộ quyền - chỉ xem, không sửa được ở đây.
            </Text>
          )}
          <Checkbox checked={grantAllChecked} disabled={isAdmin} onChange={(e) => handleGrantAll(e.target.checked)} style={{ marginBottom: 12 }}>
            Cấp tất cả quyền
          </Checkbox>
          <div style={{ display: 'flex', gap: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
            <div style={{ width: 220, borderRight: '1px solid #f0f0f0', maxHeight: 420, overflowY: 'auto' }}>
              <List
                size="small"
                dataSource={catalog}
                renderItem={(g) => {
                  const total = g.pages.reduce((sum, p) => sum + p.actions.length, 0);
                  return (
                    <List.Item
                      onClick={() => setActiveGroup(g.code)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 12px',
                        background: activeGroup === g.code ? '#f0f5ff' : undefined,
                        fontWeight: activeGroup === g.code ? 600 : 400,
                      }}
                    >
                      {g.label} ({total})
                    </List.Item>
                  );
                }}
              />
            </div>
            <div style={{ flex: 1, padding: 12, maxHeight: 420, overflowY: 'auto' }}>
              <Checkbox
                checked={groupAllChecked}
                indeterminate={!groupAllChecked && groupSomeChecked}
                disabled={isAdmin}
                onChange={(e) => handleGroupSelectAll(e.target.checked)}
                style={{ marginBottom: 8 }}
              >
                Chọn tất cả
              </Checkbox>
              <Tree
                checkable
                disabled={isAdmin}
                treeData={treeData}
                checkedKeys={checkedCodes.filter((c) => groupCodes.includes(c))}
                onCheck={handleTreeCheck}
                defaultExpandAll
              />
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
