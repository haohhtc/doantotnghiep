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

- Da xong: dang nhap, xem Kho NV, Ung hang/Tra hang, Dat hang Pre-order (tao + xac nhan + tiep
  ca chuoi: tao Don giao hang + xac nhan giao + xuat hoa don), Ban hang Van Sale (tao + xac nhan
  + xuat hoa don, sua duoc so luong truoc khi xuat de ho tro xuat tung phan/giao thieu).
- Chua lam: chon san pham/khach hang dang danh sach cham chon, chua co o tim kiem (on neu danh
  muc it, se kho dung khi chi nhanh co nhieu san pham/khach hang); **chua chay thu tren may/dien
  thoai thuc** (moi truong dev hien tai khong co emulator/Android SDK) - can chay `npx expo start`
  + Expo Go de kiem tra UI thuc; **chua build ra file `.apk`** - can tai khoan Expo (mien phi) de
  chay `eas build -p android --profile preview` (xem `mobile/AGENTS.md` muc "Building with EAS").
