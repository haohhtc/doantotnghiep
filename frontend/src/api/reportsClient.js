import axios from 'axios';

const reportsClient = axios.create({
  baseURL: import.meta.env.VITE_REPORTS_API_URL || 'http://localhost:8005',
  timeout: 15000,
});

export async function fetchSalesReport() {
  const { data } = await reportsClient.get('/reports/sales');
  return data;
}

export async function fetchInventoryReport() {
  const { data } = await reportsClient.get('/reports/inventory');
  return data;
}

export default reportsClient;
