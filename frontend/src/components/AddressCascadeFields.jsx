import { useEffect, useState } from 'react';
import { Form, Select, Row, Col } from 'antd';
import axiosClient from '../api/axiosClient';

// Dung chung cho form Vung ban hang/Chi nhanh/Khach hang: 4 Form.Item doc lap hoan toan
// regionId/provinceId/districtId/wardId, dat ben trong 1 <Form> AntD (truyen chung `form`
// instance qua prop). Moi o tu tai DU DANH SACH cua no ngay tu dau (API /provinces, /districts,
// /wards deu ho tro goi khong can tham so loc - tra ve toan bo) - KHONG bat buoc chon theo thu tu,
// KHONG tu xoa o con khi doi o cha (theo yeu cau nguoi dung: chon rieng o nao cung duoc).
export default function AddressCascadeFields() {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    axiosClient.get('/regions').then(({ data }) => setRegions(data.data)).catch(() => setRegions([]));
    axiosClient.get('/provinces').then(({ data }) => setProvinces(data.data)).catch(() => setProvinces([]));
    axiosClient.get('/districts').then(({ data }) => setDistricts(data.data)).catch(() => setDistricts([]));
    axiosClient.get('/wards').then(({ data }) => setWards(data.data)).catch(() => setWards([]));
  }, []);

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Vùng" name="regionId">
          <Select
            allowClear
            placeholder="Chọn vùng"
            showSearch
            optionFilterProp="label"
            options={regions.map((r) => ({ value: r.id, label: r.name }))}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Tỉnh/Thành phố" name="provinceId">
          <Select
            allowClear
            placeholder="Chọn tỉnh/thành phố"
            showSearch
            optionFilterProp="label"
            options={provinces.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Quận/Huyện" name="districtId">
          <Select
            allowClear
            placeholder="Chọn quận/huyện"
            showSearch
            optionFilterProp="label"
            options={districts.map((d) => ({ value: d.id, label: d.name }))}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Phường/Xã" name="wardId">
          <Select
            allowClear
            placeholder="Chọn phường/xã"
            showSearch
            optionFilterProp="label"
            options={wards.map((w) => ({ value: w.id, label: w.name }))}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
