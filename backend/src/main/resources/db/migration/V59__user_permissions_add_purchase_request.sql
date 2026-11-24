-- V59: Bo sung quyen "Yeu cau mua hang" (purchase_request:*) vao nhom "Mua hang" cua catalog
-- (truoc do co chu y de ngoai pham vi) - noi theo them vao permissions cua user KHONG phai ADMIN
-- (giu dung tinh than "mac dinh du quyen 6 nhom nghiep vu" da chot o V58), ADMIN khong can backfill
-- vi luon tu dong co toan bo (xem PermissionCatalog.java).

UPDATE user u JOIN role r ON r.id = u.role_id
SET u.permissions = CONCAT(
    COALESCE(u.permissions, ''),
    CASE WHEN u.permissions IS NULL OR u.permissions = '' THEN '' ELSE ',' END,
    'purchase_request:view,purchase_request:create,purchase_request:edit,purchase_request:confirm,purchase_request:convert,purchase_request:delete'
)
WHERE r.code <> 'ADMIN';
