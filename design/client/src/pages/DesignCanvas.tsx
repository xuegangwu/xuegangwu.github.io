import { useState, useEffect } from 'react';
import { Row, Col, Input, Tag, Typography, Space, Button, Empty, Spin, Drawer, Table, Descriptions, Divider, Badge, Modal, message, Select, InputNumber, Form, Slider, Tooltip, Dropdown } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, DeleteOutlined, SaveOutlined, ThunderboltOutlined, AimOutlined, PlusOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { componentsApi, designsApi, type Component, type ComponentType } from '../services/api';
import { exportDesignToPDF, exportBOMToCSV } from '../services/pdf';

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

export default function DesignCanvas() {
  const [components, setComponents] = useState<Component[]>([]);
  const [types, setTypes] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{ component: Component; quantity: number }>>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [designName, setDesignName] = useState('');
  const [requirements, setRequirements] = useState({ power: 100, capacity: 1000, scenario: '工商业峰谷套利', voltage: '800V' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [specFilters, setSpecFilters] = useState<Record<string, [number, number]>>({});

  useEffect(() => {
    loadTypes();
    loadComponents();
  }, [selectedType, search, specFilters]);

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
      let filtered = res.data.data;

      // Apply spec filters
      if (Object.keys(specFilters).length > 0) {
        filtered = filtered.filter((comp: Component) => {
          for (const [key, [min, max]] of Object.entries(specFilters)) {
            const val = comp.specs[key];
            if (val === undefined) continue;
            const numVal = parseFloat(String(val).replace(/[^0-9.]/g, ''));
            if (isNaN(numVal)) continue;
            if (numVal < min || numVal > max) return false;
          }
          return true;
        });
      }

      setComponents(filtered);
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

  const addToDesign = (comp: Component) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.component.id === comp.id);
      if (existing) {
        return prev.map(item =>
          item.component.id === comp.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { component: comp, quantity: 1 }];
    });
    message.success(`已添加 ${comp.name}`);
  };

  const removeFromDesign = (compId: string) => {
    setSelectedItems(prev => prev.filter(item => item.component.id !== compId));
  };

  const updateQuantity = (compId: string, qty: number) => {
    if (qty <= 0) {
      removeFromDesign(compId);
      return;
    }
    setSelectedItems(prev =>
      prev.map(item =>
        item.component.id === compId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearFilters = () => {
    setSpecFilters({});
    setSearch('');
    setSelectedType('');
  };

  const totalCost = selectedItems.reduce(
    (sum, item) => sum + item.component.price * item.quantity,
    0
  );

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      message.warning('请输入设计方案名称');
      return;
    }
    try {
      const bom = selectedItems.map(item => ({
        componentId: item.component.id,
        type: item.component.type,
        brand: item.component.brand,
        model: item.component.model,
        name: item.component.name,
        quantity: item.quantity,
        unitPrice: item.component.price,
        totalPrice: item.component.price * item.quantity,
        specs: item.component.specs,
      }));

      await designsApi.create({
        name: designName,
        requirements,
        components: selectedItems.map(i => i.component),
        bom,
        totalCost,
        aiSuggestion: `手动配置方案：${requirements.scenario}，功率${requirements.power}kW，容量${requirements.capacity}kWh`,
      });
      message.success('设计方案已保存');
      setSaveModalOpen(false);
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleExportPDF = () => {
    if (selectedItems.length === 0) {
      message.warning('请先添加组件');
      return;
    }
    const design = {
      name: designName || '未命名方案',
      requirements,
      bom: selectedItems.map(item => ({
        componentId: item.component.id,
        type: item.component.type,
        brand: item.component.brand,
        model: item.component.model,
        name: item.component.name,
        quantity: item.quantity,
        unitPrice: item.component.price,
        totalPrice: item.component.price * item.quantity,
        specs: item.component.specs,
      })),
      totalCost,
    };
    exportDesignToPDF(design);
    message.success('PDF 导出成功');
  };

  const handleExportCSV = () => {
    if (selectedItems.length === 0) {
      message.warning('请先添加组件');
      return;
    }
    const design = {
      name: designName || '未命名方案',
      requirements,
      bom: selectedItems.map(item => ({
        componentId: item.component.id,
        type: item.component.type,
        brand: item.component.brand,
        model: item.component.model,
        name: item.component.name,
        quantity: item.quantity,
        unitPrice: item.component.price,
        totalPrice: item.component.price * item.quantity,
        specs: item.component.specs,
      })),
      totalCost,
    };
    exportBOMToCSV(design);
    message.success('CSV 导出成功');
  };

  // Group components by type
  const groupedComponents = components.reduce((acc, comp) => {
    if (!acc[comp.type]) acc[comp.type] = [];
    acc[comp.type].push(comp);
    return acc;
  }, {} as Record<string, Component[]>);

  // Get available filter specs from current components
  const availableFilterKeys = ['capacity', 'efficiency', 'power', 'voltage', 'cycleLife'];
  const filterLabels: Record<string, string> = {
    capacity: '容量 (Ah)',
    efficiency: '效率 (%)',
    power: '功率 (kW)',
    voltage: '电压 (V)',
    cycleLife: '循环寿命 (次)',
  };

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 'calc(100vh - 96px)', height: 'calc(100vh - 96px)' }}>
      {/* Left Sidebar - Component Library */}
      <div style={{
        width: 300,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e8eaed',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input
              placeholder="搜索组件..."
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              size="small"
              style={{ flex: 1 }}
            />
            <Tooltip title="规格筛选">
              <Button
                size="small"
                icon={<FilterOutlined />}
                onClick={() => setFilterOpen(!filterOpen)}
                type={Object.keys(specFilters).length > 0 ? 'primary' : 'default'}
              />
            </Tooltip>
          </Space>
        </div>

        {/* Spec Filters */}
        {filterOpen && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8eaed', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong style={{ fontSize: 12 }}>规格筛选</Text>
              <Button size="small" type="link" icon={<ClearOutlined />} onClick={clearFilters}>
                清除
              </Button>
            </div>
            {availableFilterKeys.map(key => {
              const values = components
                .map(c => parseFloat(String(c.specs[key] || 0).replace(/[^0-9.]/g, '')))
                .filter(v => !isNaN(v) && v > 0);
              if (values.length === 0) return null;
              const min = Math.min(...values);
              const max = Math.max(...values);
              return (
                <div key={key} style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{filterLabels[key] || key}</Text>
                  <Slider
                    range
                    min={min}
                    max={max}
                    value={specFilters[key] || [min, max]}
                    onChange={(val) => setSpecFilters(f => ({ ...f, [key]: val as [number, number] }))}
                    marks={{ [min]: min.toString(), [max]: max.toString() }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Type Filters */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8eaed', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Tag onClick={() => setSelectedType('')} style={{ cursor: 'pointer', margin: 0 }} color={!selectedType ? '#e6342a' : '#999'}>全部</Tag>
          {types.map(t => (
            <Tag key={t.type} onClick={() => setSelectedType(t.type)} style={{ cursor: 'pointer', margin: 0 }} color={selectedType === t.type ? typeColors[t.type] : '#999'}>
              {typeIcons[t.type]} {t.count}
            </Tag>
          ))}
        </div>

        {/* Component List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          <Spin spinning={loading}>
            {Object.entries(groupedComponents).map(([type, comps]) => (
              <div key={type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>{typeIcons[type]}</span>
                  <Text strong style={{ fontSize: 12, color: typeColors[type] }}>{typeLabels[type]}</Text>
                  <Badge count={comps.length} style={{ backgroundColor: typeColors[type] }} />
                </div>
                {comps.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => openDetail(comp)}
                    style={{
                      padding: '8px 10px',
                      marginBottom: 6,
                      background: selectedItems.some(i => i.component.id === comp.id) ? '#e6342a15' : '#f5f5f5',
                      borderRadius: 6,
                      cursor: 'pointer',
                      border: selectedItems.some(i => i.component.id === comp.id) ? '1px solid #e6342a' : '1px solid transparent',
                    }}
                  >
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <Text style={{ fontSize: 12, display: 'block' }}>{comp.brand}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{comp.model}</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 10 }}>¥{comp.price.toLocaleString()}</Text>
                        </div>
                      </div>
                      <Button size="small" type="text" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); addToDesign(comp); }} />
                    </Space>
                  </div>
                ))}
              </div>
            ))}
            {components.length === 0 && !loading && (
              <Empty description="未找到匹配组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Spin>
        </div>
      </div>

      {/* Center - Design Canvas */}
      <div style={{
        flex: 1,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e8eaed',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ThunderboltOutlined style={{ color: '#e6342a' }} />
            <Title level={5} style={{ margin: 0 }}>设计方案</Title>
            <Badge count={selectedItems.length} style={{ backgroundColor: '#e6342a' }} />
          </Space>
          <Space>
            <Button icon={<AimOutlined />} onClick={() => setSaveModalOpen(true)} disabled={selectedItems.length === 0}>
              AI 推荐
            </Button>
            <Dropdown menu={{
              items: [
                { key: 'pdf', icon: <FilePdfOutlined />, label: '导出 PDF', onClick: handleExportPDF },
                { key: 'csv', icon: <FileExcelOutlined />, label: '导出 CSV', onClick: handleExportCSV },
              ]
            }}>
              <Button icon={<DownloadOutlined />} disabled={selectedItems.length === 0}>
                导出
              </Button>
            </Dropdown>
            <Button type="primary" icon={<SaveOutlined />} onClick={() => setSaveModalOpen(true)} disabled={selectedItems.length === 0}>
              保存方案
            </Button>
          </Space>
        </div>

        {/* Design Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {selectedItems.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="从左侧点击 + 添加组件" />
          ) : (
            <Table
              size="small"
              dataSource={selectedItems}
              rowKey={(item) => item.component.id}
              pagination={false}
              columns={[
                { title: '组件', key: 'component', render: (_, item) => (
                  <Space>
                    <span style={{ fontSize: 20 }}>{typeIcons[item.component.type]}</span>
                    <div>
                      <Text strong style={{ display: 'block' }}>{item.component.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.component.brand} · ¥{item.component.price.toLocaleString()}</Text>
                    </div>
                  </Space>
                )},
                { title: '类型', dataIndex: ['component', 'type'], key: 'type', width: 120, render: (type: string) => (
                  <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>
                )},
                { title: '数量', key: 'quantity', width: 140, render: (_, item) => (
                  <Space>
                    <Button size="small" onClick={() => updateQuantity(item.component.id, item.quantity - 1)}>-</Button>
                    <InputNumber size="small" min={1} value={item.quantity} onChange={(val) => updateQuantity(item.component.id, val || 1)} style={{ width: 60 }} />
                    <Button size="small" onClick={() => updateQuantity(item.component.id, item.quantity + 1)}>+</Button>
                  </Space>
                )},
                { title: '小计', key: 'subtotal', width: 120, render: (_, item) => (
                  <Text strong style={{ color: '#f5222d' }}>¥{(item.component.price * item.quantity).toLocaleString()}</Text>
                )},
                { title: '操作', key: 'action', width: 80, render: (_, item) => (
                  <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => removeFromDesign(item.component.id)} />
                )},
              ]}
            />
          )}
        </div>

        {/* Footer - Total */}
        {selectedItems.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e8eaed', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text>共 {selectedItems.length} 种组件</Text>
            </Space>
            <Space>
              <Text type="secondary">预估总成本：</Text>
              <Title level={4} style={{ margin: 0, color: '#f5222d' }}>¥{totalCost.toLocaleString()}</Title>
            </Space>
          </div>
        )}
      </div>

      {/* Right Drawer */}
      <Drawer title={selectedComponent ? <Space><span style={{ fontSize: 24 }}>{typeIcons[selectedComponent.type]}</span><div><Text strong style={{ fontSize: 16, display: 'block' }}>{selectedComponent.name}</Text><Text type="secondary" style={{ fontSize: 12 }}>{selectedComponent.brand} · {selectedComponent.model}</Text></div></Space> : ''} placement="right" width={400} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {selectedComponent && (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${typeColors[selectedComponent.type]}22, ${typeColors[selectedComponent.type]}44)`, borderRadius: 8, padding: 20, textAlign: 'center', marginBottom: 24 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>参考价格</Text>
              <Title level={2} style={{ color: '#f5222d', margin: 0 }}>¥{selectedComponent.price.toLocaleString()}</Title>
              <Text type="secondary">/ {selectedComponent.unit}</Text>
            </div>
            <Title level={5}>📋 规格参数</Title>
            <Table size="small" dataSource={Object.entries(selectedComponent.specs).map(([key, value]) => ({ key, property: key, value: String(value) }))} rowKey="key" pagination={false} columns={[{ title: '参数', dataIndex: 'property', key: 'property', width: 100 }, { title: '值', dataIndex: 'value', key: 'value' }]} style={{ marginBottom: 24 }} />
            <Button type="primary" icon={<ShoppingCartOutlined />} size="large" block onClick={() => { addToDesign(selectedComponent); setDrawerOpen(false); }}>添加到设计方案</Button>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="品牌">{selectedComponent.brand}</Descriptions.Item>
              <Descriptions.Item label="型号">{selectedComponent.model}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeLabels[selectedComponent.type]}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* Save Modal */}
      <Modal title={<Space><SaveOutlined /> 保存设计方案</Space>} open={saveModalOpen} onCancel={() => setSaveModalOpen(false)} onOk={handleSaveDesign} okText="保存">
        <Form layout="vertical">
          <Form.Item label="方案名称" required>
            <Input placeholder="输入设计方案名称" value={designName} onChange={e => setDesignName(e.target.value)} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="系统功率 (kW)"><InputNumber value={requirements.power} onChange={val => setRequirements(r => ({ ...r, power: val || 0 }))} min={10} max={10000} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="储能容量 (kWh)"><InputNumber value={requirements.capacity} onChange={val => setRequirements(r => ({ ...r, capacity: val || 0 }))} min={100} max={100000} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="应用场景"><Select value={requirements.scenario} onChange={val => setRequirements(r => ({ ...r, scenario: val }))} options={[{ value: '工商业峰谷套利', label: '工商业峰谷套利' }, { value: '需求侧响应', label: '需求侧响应' }, { value: '备用电源', label: '备用电源' }, { value: '微电网', label: '微电网' }, { value: '光储一体化', label: '光储一体化' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item label="电压等级"><Select value={requirements.voltage} onChange={val => setRequirements(r => ({ ...r, voltage: val }))} options={[{ value: '400V', label: '400V 低压' }, { value: '800V', label: '800V 中压' }, { value: '1500V', label: '1500V 高压' }]} /></Form.Item></Col>
          </Row>
          <Divider />
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary">预估总成本：</Text>
            <Title level={3} style={{ margin: 0, color: '#f5222d' }}>¥{totalCost.toLocaleString()}</Title>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
