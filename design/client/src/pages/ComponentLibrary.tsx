import { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Tag, Typography, Space, Button, Empty, Spin, Drawer, Table, Descriptions, Divider, Badge } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';
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

export default function ComponentLibrary({ onAddToDesign }: Props) {
  const [components, setComponents] = useState<Component[]>([]);
  const [types, setTypes] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    loadComponents();
  }, [selectedType, search]);

  const loadTypes = async () => {
    try {
      const res = await componentsApi.types();
      setTypes(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComponents = async () => {
    setLoading(true);
    try {
      const res = await componentsApi.list({
        type: selectedType || undefined,
        search: search || undefined,
      });
      setComponents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (comp: Component) => {
    setSelectedComponent(comp);
    setDrawerOpen(true);
  };

  const specColumns = selectedComponent ? Object.entries(selectedComponent.specs).map(([key, value]) => ({
    key,
    property: key,
    value: String(value),
  })) : [];

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 600 }}>
      {/* Left Sidebar - Category Tree */}
      <div style={{
        width: 220,
        background: '#fff',
        borderRadius: 8,
        padding: '16px 0',
        border: '1px solid #e8eaed',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #e8eaed' }}>
          <Input
            placeholder="搜索组件..."
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            size="small"
          />
        </div>

        <div style={{ padding: '12px 0' }}>
          <div
            onClick={() => setSelectedType('')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              background: !selectedType ? '#00D4AA15' : 'transparent',
              borderLeft: !selectedType ? '3px solid #00D4AA' : '3px solid transparent',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong={!selectedType}>全部组件</Text>
            <Badge count={components.length} style={{ backgroundColor: '#999' }} />
          </div>

          {types.map(t => (
            <div
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                background: selectedType === t.type ? '#00D4AA15' : 'transparent',
                borderLeft: selectedType === t.type ? `3px solid ${typeColors[t.type]}` : '3px solid transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <span>{typeIcons[t.type]}</span>
                <Text strong={selectedType === t.type} style={{ color: selectedType === t.type ? typeColors[t.type] : undefined }}>
                  {t.label}
                </Text>
              </Space>
              <Badge count={t.count} style={{ backgroundColor: typeColors[t.type] }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Component Grid */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {selectedType ? typeIcons[selectedType] + ' ' + typeLabels[selectedType] : '📦 全部组件'}
            </Title>
            <Text type="secondary">{components.length} 个组件</Text>
          </Space>
        </div>

        {/* Component Cards */}
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            {components.map(comp => (
              <Col key={comp.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  size="small"
                  style={{ borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => openDetail(comp)}
                  cover={
                    <div style={{
                      height: 100,
                      background: `linear-gradient(135deg, ${typeColors[comp.type]}22, ${typeColors[comp.type]}44)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 48,
                    }}>
                      {typeIcons[comp.type]}
                    </div>
                  }
                  actions={onAddToDesign ? [
                    <Button key="add" type="text" icon={<ShoppingCartOutlined />} onClick={(e) => { e.stopPropagation(); onAddToDesign(comp); }}>
                      添加
                    </Button>
                  ] : [
                    <Button key="view" type="text" icon={<InfoCircleOutlined />} onClick={(e) => { e.stopPropagation(); openDetail(comp); }}>
                      详情
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space direction="vertical" size={2}>
                        <Tag color={typeColors[comp.type]} style={{ marginRight: 0 }}>{typeLabels[comp.type]}</Tag>
                        <Text strong>{comp.brand}</Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Text style={{ fontSize: 12 }}>{comp.name}</Text>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {Object.entries(comp.specs).slice(0, 2).map(([k, v]) => (
                            <Tag key={k} style={{ marginBottom: 0, fontSize: 11 }}>{k}: {String(v)}</Tag>
                          ))}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text strong style={{ color: '#f5222d', fontSize: 16 }}>
                            ¥{comp.price.toLocaleString()}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}> / {comp.unit}</Text>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          {!loading && components.length === 0 && (
            <Empty description="未找到组件" style={{ marginTop: 48 }} />
          )}
        </Spin>
      </div>

      {/* Right Drawer - Component Detail */}
      <Drawer
        title={
          <Space>
            <span style={{ fontSize: 24 }}>{selectedComponent ? typeIcons[selectedComponent.type] : ''}</span>
            <div>
              <Text strong style={{ fontSize: 16, display: 'block' }}>{selectedComponent?.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{selectedComponent?.brand} · {selectedComponent?.model}</Text>
            </div>
          </Space>
        }
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button icon={<CloseOutlined />} type="text" onClick={() => setDrawerOpen(false)} />
        }
      >
        {selectedComponent && (
          <div>
            {/* Price Banner */}
            <div style={{
              background: `linear-gradient(135deg, ${typeColors[selectedComponent.type]}22, ${typeColors[selectedComponent.type]}44)`,
              borderRadius: 8,
              padding: 20,
              textAlign: 'center',
              marginBottom: 24,
            }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>参考价格</Text>
              <Title level={2} style={{ color: '#f5222d', margin: 0 }}>
                ¥{selectedComponent.price.toLocaleString()}
              </Title>
              <Text type="secondary">/ {selectedComponent.unit}</Text>
            </div>

            {/* Specs Table */}
            <Title level={5}>📋 规格参数</Title>
            <Table
              size="small"
              dataSource={specColumns}
              rowKey="key"
              pagination={false}
              columns={[
                { title: '参数', dataIndex: 'property', key: 'property', width: 120 },
                { title: '值', dataIndex: 'value', key: 'value' },
              ]}
              style={{ marginBottom: 24 }}
            />

            {/* Actions */}
            {onAddToDesign && (
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  size="large"
                  block
                  onClick={() => {
                    onAddToDesign(selectedComponent);
                    setDrawerOpen(false);
                  }}
                >
                  添加到设计方案
                </Button>
              </div>
            )}

            <Divider />

            {/* Additional Info */}
            <Descriptions column={1} size="small">
              <Descriptions.Item label="品牌">{selectedComponent.brand}</Descriptions.Item>
              <Descriptions.Item label="型号">{selectedComponent.model}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeLabels[selectedComponent.type]}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{(selectedComponent as any).createdAt ? new Date((selectedComponent as any).createdAt).toLocaleDateString('zh-CN') : '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}
