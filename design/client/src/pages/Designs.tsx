import { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Typography, Empty, Popconfirm, message, Row, Col, Statistic, Modal } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { designsApi, type Design } from '../services/api';

const { Title, Text } = Typography;

const typeLabels: Record<string, string> = {
  battery: '电池簇',
  pcs: 'PCS',
  bms: 'BMS',
  ems: 'EMS',
  fire: '消防',
  cabinet: '集装箱',
};

const typeColors: Record<string, string> = {
  battery: '#52c41a',
  pcs: '#1890ff',
  bms: '#722ed1',
  ems: '#fa8c16',
  fire: '#f5222d',
  cabinet: '#8c8c8c',
};

export default function Designs() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    setLoading(true);
    try {
      const res = await designsApi.list();
      setDesigns(res.data.data);
    } catch (err) {
      message.error('加载设计方案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await designsApi.delete(id);
      message.success('删除成功');
      loadDesigns();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '设计方案',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Design) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.requirements?.power}kW / {record.requirements?.capacity}kWh · {record.requirements?.scenario}
          </Text>
        </Space>
      ),
    },
    {
      title: '组件数',
      dataIndex: 'bom',
      key: 'bom',
      render: (bom: any[]) => <Tag>{bom.length} 种</Tag>,
    },
    {
      title: '估算成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => <Text strong style={{ color: '#f5222d' }}>¥{cost.toLocaleString()}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'finalized' ? 'green' : 'default'}>
          {status === 'finalized' ? '已定稿' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Design) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedDesign(record)}>
            查看
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        dataSource={designs}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="暂无设计方案" /> }}
      />

      {/* Design Detail Modal */}
      <Modal
        open={!!selectedDesign}
        onCancel={() => setSelectedDesign(null)}
        footer={null}
        width={700}
        title={selectedDesign?.name}
      >
        {selectedDesign && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic title="系统功率" value={selectedDesign.requirements?.power} suffix="kW" />
              </Col>
              <Col span={8}>
                <Statistic title="储能容量" value={selectedDesign.requirements?.capacity} suffix="kWh" />
              </Col>
              <Col span={8}>
                <Statistic title="估算成本" value={selectedDesign.totalCost} prefix="¥" />
              </Col>
            </Row>

            <Text type="secondary">{selectedDesign.requirements?.scenario} · {selectedDesign.requirements?.voltage}</Text>

            <div style={{ marginTop: 24 }}>
              <Title level={5}>📋 BOM 清单</Title>
              <Table
                size="small"
                dataSource={selectedDesign.bom}
                rowKey="componentId"
                pagination={false}
                columns={[
                  { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={typeColors[t]}>{typeLabels[t]}</Tag> },
                  { title: '品牌型号', dataIndex: 'name', key: 'name' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (q: number) => `×${q}` },
                  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (p: number) => `¥${p.toLocaleString()}` },
                  { title: '小计', dataIndex: 'totalPrice', key: 'totalPrice', render: (t: number) => <Text strong>¥{t.toLocaleString()}</Text> },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
