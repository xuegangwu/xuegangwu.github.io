import { useState, useEffect } from 'react';
import { Card, Tree, Typography, Space, Tag, Empty, Spin, Button, message, Modal, InputNumber, Input, Divider } from 'antd';
import { ApartmentOutlined, AppstoreOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { componentsApi, designsApi, type Component } from '../services/api';

const { Text, Title } = Typography;

const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
  battery: { color: '#52c41a', icon: '🔋', label: '电池簇' },
  pcs: { color: '#1890ff', icon: '⚡', label: 'PCS' },
  bms: { color: '#722ed1', icon: '📊', label: 'BMS' },
  ems: { color: '#fa8c16', icon: '🖥️', label: 'EMS' },
  fire: { color: '#f5222d', icon: '🚨', label: '消防' },
  cabinet: { color: '#8c8c8c', icon: '📦', label: '集装箱' },
  module: { color: '#13c2c2', icon: '📱', label: '模组' },
};

interface TreeNode {
  key: string;
  title: React.ReactNode;
  children?: TreeNode[];
  data: Component;
}

interface SelectedItem {
  component: Component;
  quantity: number;
  children?: Array<{ component: Component; quantity: number }>;
}

export default function HierarchicalBOM() {
  const [loading, setLoading] = useState(true);
  const [hierarchicalData, setHierarchicalData] = useState<Component[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [designName, setDesignName] = useState('');
  const [requirements, setRequirements] = useState({ power: 100, capacity: 1000, scenario: '工商业峰谷套利', voltage: '800V' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await componentsApi.hierarchical();
      setHierarchicalData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (components: Component[]): TreeNode[] => {
    return components.map(comp => ({
      key: comp.id,
      title: (
        <Space>
          <span style={{ fontSize: 16 }}>{typeConfig[comp.type]?.icon || '📦'}</span>
          <Text strong>{comp.name}</Text>
          <Tag color={typeConfig[comp.type]?.color}>{typeConfig[comp.type]?.label}</Tag>
          <Text type="secondary">¥{comp.price.toLocaleString()}</Text>
        </Space>
      ),
      children: comp.children?.map(child => ({
        key: child.id,
        title: (
          <Space>
            <span style={{ fontSize: 14 }}>{typeConfig[child.type]?.icon || '📱'}</span>
            <Text>{child.name}</Text>
            <Tag color={typeConfig[child.type]?.color}>子模块</Tag>
            <Text type="secondary">¥{child.price.toLocaleString()}</Text>
          </Space>
        ),
        data: child,
      })),
      data: comp,
    }));
  };

  const handleSelect = (selected: boolean, record: any) => {
    const comp = record.data;

    if (selected) {
      // Add to selection
      const newItem: SelectedItem = {
        component: comp,
        quantity: 1,
        children: comp.children?.map((child: Component) => ({ component: child, quantity: 1 })) || [],
      };

      // If parent has children, also add the parent
      if (!selectedItems.some(s => s.component.id === comp.id)) {
        setSelectedItems(prev => [...prev, newItem]);
      }
    } else {
      // Remove from selection
      setSelectedItems(prev => prev.filter(s => s.component.id !== comp.id));
    }
  };

  const updateQuantity = (compId: string, qty: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.component.id === compId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const calculateCost = (item: SelectedItem): number => {
    const mainCost = item.component.price * item.quantity;
    const childrenCost = item.children?.reduce((sum, c) => sum + c.component.price * c.quantity, 0) || 0;
    return mainCost + childrenCost;
  };

  const totalCost = selectedItems.reduce((sum, item) => sum + calculateCost(item), 0);

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      message.warning('请输入设计方案名称');
      return;
    }
    try {
      const allComponents: Array<Component & { quantity: number }> = [];
      selectedItems.forEach(item => {
        allComponents.push({ ...item.component, quantity: item.quantity });
        item.children?.forEach((c: { component: Component; quantity: number }) => {
          allComponents.push({ ...c.component, quantity: c.quantity });
        });
      });

      const bom = allComponents.map((c: any) => ({
        componentId: c.component.id,
        type: c.component.type,
        brand: c.component.brand,
        model: c.component.model,
        name: c.component.name,
        quantity: c.quantity,
        unitPrice: c.component.price,
        totalPrice: c.component.price * c.quantity,
        specs: c.component.specs,
      }));

      await designsApi.create({
        name: designName,
        requirements,
        components: selectedItems.map(i => i.component),
        bom,
        totalCost,
        aiSuggestion: `层级BOM设计方案：${requirements.scenario}，功率${requirements.power}kW，容量${requirements.capacity}kWh`,
      });
      message.success('设计方案已保存');
      setSaveModalOpen(false);
    } catch (err) {
      message.error('保存失败');
    }
  };

  const treeData = buildTree(hierarchicalData);

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 180px)' }}>
      {/* Left: Hierarchical Tree */}
      <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #e8eaed', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ApartmentOutlined style={{ color: '#00D4AA' }} />
            <Title level={5} style={{ margin: 0 }}>层级 BOM 结构</Title>
          </Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => setSaveModalOpen(true)} disabled={selectedItems.length === 0}>
            保存方案
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <Spin spinning={loading}>
            {treeData.length === 0 ? (
              <Empty description="暂无组件数据" />
            ) : (
              <Tree
                showLine={{ showLeafIcon: false }}
                defaultExpandAll
                treeData={treeData}
                titleRender={(nodeData) => {
                  const isSelected = selectedItems.some(s => s.component.id === nodeData.key);
                  return (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const comp = nodeData.data as Component;
                        if (!isSelected) {
                          handleSelect(true, { data: comp });
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: isSelected ? '#00D4AA15' : 'transparent',
                        border: isSelected ? '1px solid #00D4AA' : '1px solid transparent',
                        cursor: 'pointer',
                        marginBottom: 4,
                      }}
                    >
                      {nodeData.title}
                      {isSelected && (
                        <Tag color="green" style={{ marginLeft: 8 }}>已选</Tag>
                      )}
                    </div>
                  );
                }}
              />
            )}
          </Spin>
        </div>
      </div>

      {/* Right: Selected BOM */}
      <div style={{ width: 400, background: '#fff', borderRadius: 8, border: '1px solid #e8eaed', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed' }}>
          <Space>
            <AppstoreOutlined style={{ color: '#00D4AA' }} />
            <Title level={5} style={{ margin: 0 }}>已选组件</Title>
            <Tag>{selectedItems.length}</Tag>
          </Space>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {selectedItems.length === 0 ? (
            <Empty description="点击左侧组件添加到 BOM" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            selectedItems.map(item => (
              <Card
                key={item.component.id}
                size="small"
                style={{ marginBottom: 12, border: `1px solid ${typeConfig[item.component.type]?.color || '#ddd'}33` }}
                title={
                  <Space>
                    <span style={{ fontSize: 18 }}>{typeConfig[item.component.type]?.icon}</span>
                    <Text strong>{item.component.name}</Text>
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => setSelectedItems(prev => prev.filter(s => s.component.id !== item.component.id))}
                  />
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <Space split={<span style={{ color: '#ddd' }}>|</span>}>
                    <Text type="secondary">{item.component.brand}</Text>
                    <Text type="secondary">¥{item.component.price.toLocaleString()}/个</Text>
                  </Space>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>数量:</Text>
                  <Button size="small" onClick={() => updateQuantity(item.component.id, item.quantity - 1)}>-</Button>
                  <InputNumber
                    size="small"
                    min={1}
                    value={item.quantity}
                    onChange={(val) => updateQuantity(item.component.id, val || 1)}
                    style={{ width: 60 }}
                  />
                  <Button size="small" onClick={() => updateQuantity(item.component.id, item.quantity + 1)}>+</Button>
                </div>

                {/* Children */}
                {item.children && item.children.length > 0 && (
                  <div style={{ marginTop: 8, paddingLeft: 16, borderLeft: '2px solid #00D4AA' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>子模块:</Text>
                    {item.children.map((child, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                        <Space>
                          <span style={{ fontSize: 12 }}>📱</span>
                          <Text style={{ fontSize: 12 }}>{child.component.name}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>×{child.quantity} ¥{child.component.price.toLocaleString()}</Text>
                      </div>
                    ))}
                  </div>
                )}

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary">小计: </Text>
                  <Text strong style={{ color: '#f5222d' }}>
                    ¥{calculateCost(item).toLocaleString()}
                  </Text>
                </div>
              </Card>
            ))
          )}
        </div>

        {selectedItems.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e8eaed', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>预估总成本</Text>
              <Title level={4} style={{ margin: 0, color: '#f5222d' }}>
                ¥{totalCost.toLocaleString()}
              </Title>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      <Modal
        title={<Space><SaveOutlined /> 保存设计方案</Space>}
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={handleSaveDesign}
        okText="保存"
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>方案名称</Text>
            <Input
              placeholder="输入设计方案名称"
              value={designName}
              onChange={e => setDesignName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>系统功率 (kW)</Text>
              <InputNumber
                value={requirements.power}
                onChange={val => setRequirements(r => ({ ...r, power: val || 0 }))}
                min={10}
                max={10000}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>储能容量 (kWh)</Text>
              <InputNumber
                value={requirements.capacity}
                onChange={val => setRequirements(r => ({ ...r, capacity: val || 0 }))}
                min={100}
                max={100000}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
          </div>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Text type="secondary">预估总成本: </Text>
            <Text strong style={{ color: '#f5222d', fontSize: 18 }}>¥{totalCost.toLocaleString()}</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}
