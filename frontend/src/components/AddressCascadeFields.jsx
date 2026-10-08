import { useEffect, useState } from 'react';
import { Form, Select, Row, Col } from 'antd';
import axiosClient from '../api/axiosClient';

// Dung chung cho form Vung ban hang/Chi nhanh/Khach hang: 4 Form.Item
// regionId/provinceId/districtId/wardId, dat ben trong 1 <Form> AntD (truyen chung `form`
// instance qua prop). KHONG disabled/khoa thu tu - bam chon o nao truoc cung duoc. Nhung moi o
// VAN LOC theo dung o cha (neu cha da chon): chon "Mien Bac" thi Tinh/Thanh chi hien tinh thuoc
// Mien Bac, khong cho lan sang Mien Nam - API /provinces, /districts, /wards deu ho tro tham so
// loc rieng, khong truyen gi thi tra ve toan bo (dung khi cha chua chon). Doi 1 o se tu xoa cac o
// con (vi co the khong con khop) nhung KHONG dong gi o cha.
export default function AddressCascadeFields({ form }) {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const regionId = Form.useWatch('regionId', form);
  const provinceId = Form.useWatch('provinceId', form);
  const districtId = Form.useWatch('districtId', form);

  useEffect(() => {
    axiosClient.get('/regions').then(({ data }) => setRegions(data.data)).catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    axiosClient
      .get('/provinces', { params: regionId ? { regionId } : {} })
      .then(({ data }) => setProvinces(data.data))
      .catch(() => setProvinces([]));
  }, [regionId]);

  useEffect(() => {
    axiosClient
      .get('/districts', { params: provinceId ? { provinceId } : {} })
      .then(({ data }) => setDistricts(data.data))
      .catch(() => setDistricts([]));
  }, [provinceId]);

  useEffect(() => {
    axiosClient
      .get('/wards', { params: districtId ? { districtId } : {} })
      .then(({ data }) => setWards(data.data))
      .catch(() => setWards([]));
  }, [districtId]);

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
            onChange={() => form.setFieldsValue({ provinceId: undefined, districtId: undefined, wardId: undefined })}
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
            onChange={() => form.setFieldsValue({ districtId: undefined, wardId: undefined })}
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
            onChange={() => form.setFieldsValue({ wardId: undefined })}
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
