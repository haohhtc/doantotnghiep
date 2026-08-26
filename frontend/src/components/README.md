# Components dùng chung

UI library: **Ant Design** (`antd` + `@ant-design/icons`, đã thêm vào `package.json`) — chọn vì bám sát layout dạng grid + sidebar của DMS tham khảo trong `ui-reference/`.

- `AppLayout.jsx` — **đã dựng** — Sider (menu theo module, Ant Design `Menu`) + Header + `<Outlet/>` cho nội dung route
- `PlaceholderPage.jsx` — **đã dựng** — trang tạm hiển thị tiêu đề, mọi page trong `pages/` đang dùng cái này, thay bằng UI thật khi code
- Còn cần tự làm: `DataTable.jsx` (bọc Ant Design `<Table>` với phân trang/filter dùng chung cho mọi màn hình danh sách), `ConfirmDialog.jsx` (bọc `Modal.confirm`)
