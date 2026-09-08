import { useEffect, useState } from 'react';
import { Form, Select, Row, Col } from 'antd';
import axiosClient from '../api/axiosClient';

// Dung chung cho form Vung ban hang/Chi nhanh/Khach hang: 4 Form.Item long nhau
// regionId -> provinceId -> districtId -> wardId, dat ben trong 1 <Form> AntD (truyen chung
// `form` instance qua prop). Tu tai danh sach theo tung cap va tu xoa cap con khi doi cap cha
// (ke ca khi prefill du lieu de sua - Form.useWatch bat duoc ca thay doi tu form.setFieldsValue).
export default function AddressCascadeFields({ form }) {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const regionId = Form.useWatch('regionId', form);
  const provinceId = Form.useWatch('provinceId', form);
  const districtId = Form.useWatch('districtId', form);

  useEffect(() => {
    axiosClient
      .get('/regions')
      .then(({ data }) => setRegions(data.data))
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    if (!regionId) {
      setProvinces([]);
      return;
    }
    axiosClient
      .get('/provinces', { params: { regionId } })
      .then(({ data }) => setProvinces(data.data))
      .catch(() => setProvinces([]));
  }, [regionId]);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    axiosClient
      .get('/districts', { params: { provinceId } })
      .then(({ data }) => setDistricts(data.data))
      .catch(() => setDistricts([]));
  }, [provinceId]);

  useEffect(() => {
    if (!districtId) {
      setWards([]);
      return;
    }
    axiosClient
      .get('/wards', { params: { districtId } })
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
            options={regions.map((r) => ({ value: r.id, label: r.name }))}
            onChange={() => form.setFieldsValue({ provinceId: undefined, districtId: undefined, wardId: undefined })}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Tỉnh/Thành phố" name="provinceId">
          <Select
            allowClear
            disabled={!regionId}
            placeholder="Chọn tỉnh/thành phố"
            options={provinces.map((p) => ({ value: p.id, label: p.name }))}
            onChange={() => form.setFieldsValue({ districtId: undefined, wardId: undefined })}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Quận/Huyện" name="districtId">
          <Select
            allowClear
            disabled={!provinceId}
            placeholder="Chọn quận/huyện"
            options={districts.map((d) => ({ value: d.id, label: d.name }))}
            onChange={() => form.setFieldsValue({ wardId: undefined })}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Phường/Xã" name="wardId">
          <Select
            allowClear
            disabled={!districtId}
            placeholder="Chọn phường/xã"
            options={wards.map((w) => ({ value: w.id, label: w.name }))}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
