import axiosClient from '../api/axiosClient';

// Cache danh sach quy doi theo nhom (moi nhom chi goi API 1 lan).
const groupCache = new Map();

// Tra ve [{ value: uomId, label: ten DVT, factor }] cac DVT co the chon cho 1 san pham (theo nhom quy
// doi cua san pham). San pham chua co nhom quy doi -> [] (dong khong co DVT, he so 1).
export async function fetchUomOptions(product) {
  const groupId = product?.uomGroup?.id;
  if (!groupId) return [];
  if (!groupCache.has(groupId)) {
    const { data } = await axiosClient.get(`/uom-groups/${groupId}/conversions`);
    groupCache.set(
      groupId,
      data.data.map((c) => ({ value: c.uom.id, label: c.uom.name, factor: Number(c.factor) }))
    );
  }
  return groupCache.get(groupId);
}

export function defaultUomId(product, options) {
  const preferred = product?.saleUom?.id;
  if (preferred && options.some((o) => o.value === preferred)) return preferred;
  return options[0]?.value;
}
