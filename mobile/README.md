# App Van-Sale (di dong)

App React Native (Expo Router) cho nhan vien ban hang (NVBH) di tuyen: dat hang Pre-order,
ban hang Van Sale tai cho, Ung/Tra hang giua Kho Main va "Kho NV" (xem `dalam.md` o goc repo,
muc "App Van-Sale (di dong)").

## Chay thu (Expo Go tren dien thoai thuc)

1. `cp .env.example .env` roi sua `EXPO_PUBLIC_API_URL` thanh IP LAN cua may dang chay backend
   (lenh `ipconfig`, lay IP cua Wi-Fi) - dien thoai va may dev phai cung 1 mang Wi-Fi.
2. Dam bao backend + MySQL dang chay (`..\scripts\dev-start.ps1` o goc repo).
3. `npm install` (lan dau) roi `npx expo start`.
4. Cai app **Expo Go** tren dien thoai, quet QR code hien ra o terminal.

Dang nhap bang tai khoan co san (vd `admin`/`admin123`, hoac tai khoan NVBH da gan Nhan vien
trong trang "Nhan vien" cua web - can gan dung Chi nhanh cho User cua NVBH do thi app moi suy
ra duoc Kho Main/Kho Van/Kho NV).

## Cau truc

- `src/app/` - man hinh, dinh tuyen theo file (Expo Router). `(app)/` la nhom man hinh can dang
  nhap (bao ve boi `Stack.Protected` trong `src/app/_layout.js`).
- `src/ctx/SessionContext.js` - luu token + thong tin dang nhap (gom ca Nhan vien tu `/api/employees/me`).
- `src/api/client.js` - axios instance, tu dinh kem Bearer token.

## Pham vi hien tai (v1 - 2026-10-17)

- Da xong: dang nhap, xem Kho NV, Dat hang Pre-order (tao + xac nhan), Ban hang Van Sale
  (tao + xac nhan + xuat hoa don thang), Ung hang/Tra hang.
- Chua lam: man hinh xac nhan giao hang + xuat hoa don cho chuoi Pre-order (DO/Invoice) - hien
  tam phai lam tiep tren web; xuat hoa don Van Sale tung phan (v1 chi xuat full 1 lan/don); chon
  san pham/khach hang dang danh sach cham chon, chua co o tim kiem.
