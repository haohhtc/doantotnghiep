import { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const BranchContext = createContext(null);

const STORAGE_KEY = 'selectedBranchId';

// Chi nhanh dang chon toan cuc - lam nen cho loc Kho/Ton kho (Nhom 2) va validate Sales Order
// (Nhom 6). Luu vao localStorage de giu lua chon qua cac lan reload, nhung luon doi chieu lai
// voi danh sach chi nhanh that tu API (tranh giu 1 id da bi xoa).
export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  function loadBranches() {
    setLoading(true);
    axiosClient
      .get('/branches')
      .then(({ data }) => {
        const list = data.data || [];
        setBranches(list);
        setSelectedBranchIdState((prev) => {
          if (prev && list.some((b) => b.id === prev)) return prev;
          const fallback = list.find((b) => b.active) || list[0];
          return fallback ? fallback.id : null;
        });
      })
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function setSelectedBranchId(id) {
    setSelectedBranchIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, String(id));
    else localStorage.removeItem(STORAGE_KEY);
  }

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;

  return (
    <BranchContext.Provider
      value={{ branches, selectedBranch, selectedBranchId, setSelectedBranchId, loading, reloadBranches: loadBranches }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch phai duoc dung ben trong BranchProvider');
  return ctx;
}
