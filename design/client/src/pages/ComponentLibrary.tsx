import { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Tag, Typography, Space, Button, Empty, Spin, Drawer, Descriptions, Divider } from 'antd';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { componentsApi, type Component, type ComponentType } from '../services/api';

const { Text, Title } = Typography;

const typeColors: Record<string, string> = {
  battery: '#52c41a',
  pcs: '#1890ff',
  bms: '#722ed1',
  ems: '#fa8c16',
  fire: '#f5222d',
  cabinet: '#8c8c8c',
};

const typeLabels: Record<string, string> = {
  battery: '电池簇',
  pcs: '储能变流器PCS',
  bms: '电池管理系统BMS',
  ems: '能量管理系统EMS',
  fire: '消防系统',
  cabinet: '储能集装箱/柜',
};

const typeIcons: Record<string, string> = {
  battery: '🔋',
  pcs: '⚡',
  bms: '📊',
  ems: '🖥️',
  fire: '🚨',
  cabinet: '📦',
};

interface Props {
  onAddToDesign?: (component: Component) => void;
}

export default function ComponentLibrary(_props: Props) {
  const [components, setComponents] = useState<Component[]>([]);
  const [types, setTypes] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { loadTypes(); }, []);

  const loadTypes = async () => {
    try {
      const res = await componentsApi.types();
      setTypes(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadComponents(); }, [selectedType, search]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const res = await componentsApi.list({
        type: selectedType || undefined,
        search: search || undefined,
      });
      setComponents(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openDetail = (comp: Component) => {
    setSelectedComponent(comp);
    setDrawerOpen(true);
  };

  return (
    <div style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Title level={2} style={{ margin: '0 0 12px 0' }}>📚 组件库</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>选择组件添加到设计方案</Text>
      </div>

      {/* Search & Filter */}
      <Card style={{ marginBottom: 32, padding: 12 }}>
        <Row gutter={24} align="middle">
          <Col flex="auto">
            <Input
              placeholder="搜索组件名称，品牌或型号..."
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Col>
          <Col>
            <Space size={12} wrap>
              <Tag onClick={() => setSelectedType('')} style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 14, borderRadius: 8 }} color={!selectedType ? '#e6342a' : '#999'}>
                全部 ({components.length})
              </Tag>
              {types.map(t => (
                <Tag key={t.type} onClick={() => setSelectedType(t.type)} style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 14, borderRadius: 8 }} color={selectedType === t.type ? typeColors[t.type] : undefined}>
                  {typeIcons[t.type]} {t.label} ({t.count})
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Component Grid */}
      <Spin spinning={loading}>
        {components.length === 0 ? (
          <Card><Empty description="未找到组件" /></Card>
        ) : (
          <Row gutter={[32, 32]}>
            {components.map(comp => (
              <Col key={comp.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                  onClick={() => openDetail(comp)}
                  cover={
                    <div style={{ 
                      height: 160, 
                      background: `linear-gradient(135deg, ${typeColors[comp.type]}15, ${typeColors[comp.type]}30)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72,
                    }}>
                      {typeIcons[comp.type]}
                    </div>
                  }
                >
                  <div style={{ padding: 20 }}>
                    <Tag color={typeColors[comp.type]} style={{ marginBottom: 12, borderRadius: 6 }}>{typeLabels[comp.type]}</Tag>
                    <Text strong style={{ display: 'block', fontSize: 17, marginBottom: 6 }}>{comp.name}</Text>
                    <Text type="secondary" style={{ fontSize: 14 }}>{comp.brand} · {comp.model}</Text>
                    
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#e6342a', fontSize: 22 }}>¥{comp.price.toLocaleString()}</Text>
                      <Button type="primary" icon={<ShoppingCartOutlined />}>添加</Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* Detail Drawer */}
      <Drawer
        title={<Space><span style={{ fontSize: 24 }}>{selectedComponent ? typeIcons[selectedComponent.type] : ''}</span><span>{selectedComponent?.name}</span></Space>}
        placement="right" width={520} onClose={() => setDrawerOpen(false)} open={drawerOpen}
      >
        {selectedComponent && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="品牌">{selectedComponent.brand}</Descriptions.Item>
              <Descriptions.Item label="型号">{selectedComponent.model}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeLabels[selectedComponent.type]}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{selectedComponent.price.toLocaleString()}</Descriptions.Item>
            </Descriptions>
            <Divider>规格参数</Divider>
            <Descriptions column={1} size="small">
              {Object.entries(selectedComponent.specs || {}).map(([k, v]) => (
                <Descriptions.Item key={k} label={k}>{String(v)}</Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}
