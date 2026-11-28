-- V61: SALES_STAFF (NVBH dung App Van-Sale) thieu quyen "stock:view" -> man "Ung/Tra hang" tren
-- app goi GET /api/stock de hien cot "Ton NPP" bi chan 403 "Ban khong co quyen thuc hien thao tac
-- nay" (phat hien qua test that tai khoan sale01). Bo sung "stock:view" (chi xem, khong phai toan
-- quyen nhom Kho) vao bo quyen mac dinh cua SALES_STAFF - xem PermissionCatalog.defaultCodesForRole().
-- Chi THEM neu chua co (giu nguyen moi tuy chinh rieng Admin da cap tay qua modal "Phan quyen"),
-- khong ghi de toan bo nhu cach V60 da lam.

UPDATE user u JOIN role r ON r.id = u.role_id
SET u.permissions = CASE
    WHEN u.permissions IS NULL OR u.permissions = '' THEN 'stock:view'
    ELSE CONCAT(u.permissions, ',stock:view')
END
WHERE r.code = 'SALES_STAFF'
  AND (u.permissions IS NULL OR u.permissions = '' OR FIND_IN_SET('stock:view', u.permissions) = 0);
