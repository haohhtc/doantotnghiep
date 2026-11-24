-- V60: Thay doi cach cap quyen mac dinh tu "du 4 nhom nghiep vu nhu nhau cho moi role" (V58/V59)
-- sang DUNG pham vi cong viec that cua tung Role (xem PermissionCatalog.defaultCodesForRole()):
--   - SALES_STAFF: toan quyen Ban hang (gom Giao hang/Hoa don/Tra hang khach) + CHI XEM Danh muc.
--   - WAREHOUSE_MANAGER: toan quyen Kho + Giao hang (xuat kho that su) + CHI XEM Danh muc.
-- Ghi de lai permissions cua TOAN BO user hien co (khong chi user moi) de dong bo - Admin van co
-- the tu tay cap them qua modal "Phan quyen" neu can ngoai pham vi mac dinh nay.

UPDATE user u JOIN role r ON r.id = u.role_id SET u.permissions =
'sales_order:view,sales_order:create,sales_order:edit,sales_order:confirm,sales_order:cancel,sales_order:delete,sales_request:view,sales_request:create,sales_request:edit,sales_request:confirm,sales_request:delete,delivery_order:view,delivery_order:create,delivery_order:edit,delivery_order:confirm,delivery_order:cancel,delivery_order:delete,invoice:view,invoice:create,invoice:cancel,sales_return:view,sales_return:create,sales_return:edit,sales_return:confirm,sales_return:cancel,sales_return:delete,product:view,product_category:view,product_group:view,customer:view,customer_group:view,customer_channel:view,supplier:view,warehouse:view,branch:view,selling_zone:view,route_master:view,region:view,province:view,district:view,ward:view,uom:view,uom_group:view,tax_group:view,price_list:view,employee:view,employee_position:view,salesman_type:view,company:view'
WHERE r.code = 'SALES_STAFF';

UPDATE user u JOIN role r ON r.id = u.role_id SET u.permissions =
'goods_receipt:view,goods_receipt:create,goods_receipt:edit,goods_receipt:confirm,goods_receipt:delete,goods_issue:view,goods_issue:create,goods_issue:edit,goods_issue:confirm,goods_issue:delete,inventory_transfer:view,inventory_transfer:create,inventory_transfer:edit,inventory_transfer:confirm_send,inventory_transfer:confirm_receive,inventory_transfer:delete,stock_take:view,stock_take:create,stock_take:edit,stock_take:confirm,stock_take:delete,stock_receipt:view,stock_receipt:create,stock_receipt:edit,stock_receipt:confirm,stock_receipt:delete,stock:view,delivery_order:view,delivery_order:create,delivery_order:edit,delivery_order:confirm,delivery_order:cancel,delivery_order:delete,product:view,product_category:view,product_group:view,customer:view,customer_group:view,customer_channel:view,supplier:view,warehouse:view,branch:view,selling_zone:view,route_master:view,region:view,province:view,district:view,ward:view,uom:view,uom_group:view,tax_group:view,price_list:view,employee:view,employee_position:view,salesman_type:view,company:view'
WHERE r.code = 'WAREHOUSE_MANAGER';
