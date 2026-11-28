import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Client } from '@stomp/stompjs';
import { useSession } from './SessionContext';
import { BASE_URL } from '../api/client';

const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws-native';
const NOTIF_MAX = 30;

// Bao cho App khi phieu Ung hang CUA DUNG NVBH nay vua duoc thu kho xac nhan tren Web
// (eventType=ADVANCE_CONFIRMED, kem employeeId - xem InventoryEventPublisher/VanSaleAdvanceService
// o backend). Noi qua /ws-native (native WebSocket, KHONG qua SockJS vi sockjs-client phu thuoc
// API trinh duyet, khong chay duoc trong React Native) - cung 1 broker "/topic/inventory" voi Web.
// Hien thong bao he thong kieu Android (local notification qua expo-notifications - chay duoc
// trong Expo Go, khong can dev build) + luu 1 danh sach xem lai trong Header "Tổng quan".
// CHI luu trong bo nho (khong AsyncStorage) - mat khi tat han app: doi lai de KHONG phai them thu
// vien native nao khac, van test duoc qua Expo Go (quyet dinh cua nguoi dung, xem dalam.md).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const NotificationContext = createContext(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications phai dung trong NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }) {
  const { session } = useSession();
  const employeeId = session?.employee?.id;
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Xin quyen + tao Android notification channel 1 lan khi co nhan vien dang nhap.
  useEffect(() => {
    if (!employeeId || Platform.OS === 'web') return;
    (async () => {
      if (Platform.OS === 'android') {
        try {
          // Bug co that cua Expo Go SDK 58 (expo/expo#53907, chua duoc Expo fix): goi ham nay
          // trong Expo Go nem NullPointerException ("Expo") - bat loi, de thu vien tu dung
          // channel du phong "Miscellaneous" khi gui thong bao (van hien duoc, chi khong tuy
          // chinh duoc ten/do uu tien channel trong Expo Go). Dev build thi goi nay se chay dung.
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Thông báo',
            importance: Notifications.AndroidImportance.MAX,
          });
        } catch {
          // bo qua - xem comment tren
        }
      }
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch {
        // bo qua - khong chan luong neu API quyen cung gap su co tren thiet bi/moi truong nao do
      }
    })();
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId || Platform.OS === 'web') return undefined;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/inventory', (msg) => {
          const { eventType, employeeId: targetEmployeeId, docNumber } = JSON.parse(msg.body);
          if (eventType !== 'ADVANCE_CONFIRMED') return;
          if (Number(targetEmployeeId) !== Number(employeeId)) return;

          const title = 'Ứng hàng đã được xác nhận';
          const body = docNumber
            ? `Phiếu ${docNumber} đã được kho xác nhận - tồn kho đã cập nhật.`
            : 'Phiếu ứng hàng của bạn đã được kho xác nhận.';

          Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null }).catch(() => {});

          setNotifications((prev) =>
            [
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title,
                body,
                createdAt: Date.now(),
                read: false,
              },
              ...prev,
            ].slice(0, NOTIF_MAX)
          );
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [employeeId]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
