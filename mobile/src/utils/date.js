// Kiem tra chuoi dung dung dinh dang YYYY-MM-DD VA la 1 ngay thuc su ton tai trong lich (vd
// chan "2026-14-11" - thang 14 khong co, hay "2026-02-30" - thang 2 khong co ngay 30). Truoc day
// cac man Pre-order chi kiem tra o deliveryDate co rong khong, khong kiem tra dung dinh dang, nen
// gui thang len Backend gay loi JSON parse tho lo ra man hinh nguoi dung.
export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
