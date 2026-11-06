import axios from 'axios';

// AI-01/02/03 (ai-services/forecasting, stock-risk, anomaly-detection) - service Python rieng,
// goi TRUC TIEP tu Frontend (khong qua Backend Spring Boot), giong het cach lam voi Chatbot/
// Reports - xem docs/05-api-contract/api-endpoints.md muc "AI Services [BE2]".
const forecastingClient = axios.create({
  baseURL: import.meta.env.VITE_FORECASTING_API_URL || 'http://localhost:8001',
  timeout: 15000,
});
const stockRiskClient = axios.create({
  baseURL: import.meta.env.VITE_STOCK_RISK_API_URL || 'http://localhost:8002',
  timeout: 20000,
});
const anomalyClient = axios.create({
  baseURL: import.meta.env.VITE_ANOMALY_API_URL || 'http://localhost:8003',
  timeout: 15000,
});

export async function fetchForecast(productId, horizonDays = 7) {
  const { data } = await forecastingClient.post('/forecast', { productId, horizonDays });
  return data;
}

export async function fetchStockRisk(warehouseId) {
  const { data } = await stockRiskClient.get('/stock-risk', {
    params: warehouseId ? { warehouseId } : {},
  });
  return data;
}

export async function fetchAnomalies(from, to) {
  const { data } = await anomalyClient.get('/anomalies', { params: { from, to } });
  return data;
}
