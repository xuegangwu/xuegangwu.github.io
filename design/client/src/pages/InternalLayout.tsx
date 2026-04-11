import { useState, useEffect } from 'react';
import { Card, Typography, Space, Row, Col, Select, Table, Slider } from 'antd';
import { AppstoreOutlined, AimOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { designsApi } from '../services/api';

const { Text } = Typography;

interface Component {
  type: string;
  brand: string;
  model: string;
  name: string;
  specs: any;
  quantity: number;
}

interface LayoutItem {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const typeConfig: Record<string, { color: string; icon: string; label: string; defaultWidth: number; defaultHeight: number }> = {
  battery: { color: '#52c41a', icon: '🔋', label: '电池簇', defaultWidth: 120, defaultHeight: 80 },
  pcs: { color: '#1890ff', icon: '⚡', label: 'PCS变流器', defaultWidth: 80, defaultHeight: 60 },
  bms: { color: '#722ed1', icon: '📊', label: 'BMS柜', defaultWidth: 60, defaultHeight: 60 },
  ems: { color: '#fa8c16', icon: '🖥️', label: 'EMS柜', defaultWidth: 60, defaultHeight: 60 },
  fire: { color: '#f5222d', icon: '🚨', label: '消防系统', defaultWidth: 60, defaultHeight: 40 },
  cabinet: { color: '#8c8c8c', icon: '📦', label: '集装箱', defaultWidth: 600, defaultHeight: 300 },
};

export default function InternalLayout() {
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [cabinetSize, setCabinetSize] = useState({ width: 600, height: 300 }); // 20ft container
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    loadDesigns();
  }, []);

  useEffect(() => {
    if (selectedDesign) {
      generateLayout();
    }
  }, [selectedDesign, cabinetSize]);

  const loadDesigns = async () => {
    try {
      const res = await designsApi.list();
      setDesigns(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedDesign(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateLayout = () => {
    if (!selectedDesign) return;

    const items: LayoutItem[] = [];
    let currentX = 20;
    let currentY = 20;
    const gap = 15;

    // Add cabinet outline
    items.push({
      id: 'cabinet-main',
      type: 'cabinet',
      name: selectedDesign.bom.find((b: any) => b.type === 'cabinet')?.name || '20尺储能集装箱',
      x: 0,
      y: 0,
      width: cabinetSize.width,
      height: cabinetSize.height,
      color: typeConfig.cabinet.color,
    });

    // Add battery clusters
    const batteries = selectedDesign.bom.filter((b: any) => b.type === 'battery');
    batteries.forEach((b: Component, idx: number) => {
      const config = typeConfig.battery;
      const rows = Math.ceil(Math.sqrt(b.quantity || 1));
      const cols = Math.ceil((b.quantity || 1) / rows);
      const itemWidth = config.defaultWidth;
      const itemHeight = config.defaultHeight;

      for (let r = 0; r < Math.min(rows, 4); r++) {
        for (let c = 0; c < Math.min(cols, 3); c++) {
          if (currentX + itemWidth > cabinetSize.width - 20) {
            currentX = 20;
            currentY += itemHeight + gap;
          }
          if (currentY + itemHeight > cabinetSize.height - 80) break;

          items.push({
            id: `battery-${idx}-${r}-${c}`,
            type: 'battery',
            name: `${b.brand} ${b.model}`,
            x: currentX,
            y: currentY,
            width: itemWidth,
            height: itemHeight,
            color: config.color,
          });
          currentX += itemWidth + gap;
        }
      }
    });

    // Add PCS
    const pcsCount = selectedDesign.bom.find((b: any) => b.type === 'pcs')?.quantity || 0;
    if (pcsCount > 0) {
      const config = typeConfig.pcs;
      for (let i = 0; i < Math.min(pcsCount, 3); i++) {
        if (currentX + config.defaultWidth > cabinetSize.width - 20) {
          currentX = 20;
          currentY += config.defaultHeight + gap;
        }
        items.push({
          id: `pcs-${i}`,
          type: 'pcs',
          name: `PCS #${i + 1}`,
          x: currentX,
          y: currentY,
          width: config.defaultWidth,
          height: config.defaultHeight,
          color: config.color,
        });
        currentX += config.defaultWidth + gap;
      }
    }

    // Add BMS
    const bms = selectedDesign.bom.find((b: any) => b.type === 'bms');
    if (bms) {
      const config = typeConfig.bms;
      items.push({
        id: 'bms-main',
        type: 'bms',
        name: bms.name,
        x: cabinetSize.width - config.defaultWidth - 10,
        y: cabinetSize.height - config.defaultHeight - 10,
        width: config.defaultWidth,
        height: config.defaultHeight,
        color: config.color,
      });
    }

    // Add EMS
    const ems = selectedDesign.bom.find((b: any) => b.type === 'ems');
    if (ems) {
      const config = typeConfig.ems;
      items.push({
        id: 'ems-main',
        type: 'ems',
        name: ems.name,
        x: cabinetSize.width - config.defaultWidth - 10,
        y: cabinetSize.height - config.defaultHeight - 80,
        width: config.defaultWidth,
        height: config.defaultHeight,
        color: config.color,
      });
    }

    // Add Fire
    const fire = selectedDesign.bom.find((b: any) => b.type === 'fire');
    if (fire) {
      const config = typeConfig.fire;
      items.push({
        id: 'fire-main',
        type: 'fire',
        name: fire.brand,
        x: 10,
        y: cabinetSize.height - config.defaultHeight - 10,
        width: config.defaultWidth,
        height: config.defaultHeight,
        color: config.color,
      });
    }

    setLayoutItems(items);
  };

  const scale = 1;
  const viewWidth = cabinetSize.width * scale + 40;
  const viewHeight = cabinetSize.height * scale + 40;

  return (
    <div>
      <Row gutter={16}>
        {/* Left: Design Selector + Controls */}
        <Col span={6}>
          <Card size="small" title={<Space><AppstoreOutlined /> 选择设计方案</Space>}>
            <Select
              style={{ width: '100%' }}
              value={selectedDesign?.id}
              onChange={(val) => {
                const d = designs.find(d => d.id === val);
                setSelectedDesign(d);
              }}
              options={designs.map(d => ({ value: d.id, label: d.name }))}
            />
          </Card>

          <Card size="small" style={{ marginTop: 12 }} title={<Space><AimOutlined /> 布局设置</Space>}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>集装箱规格</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={`${cabinetSize.width}x${cabinetSize.height}`}
                onChange={(val) => {
                  if (val === '6058x2438') setCabinetSize({ width: 600, height: 300 });
                  else if (val === '2991x2438') setCabinetSize({ width: 300, height: 240 });
                  else setCabinetSize({ width: 500, height: 250 });
                }}
                options={[
                  { value: '6058x2438', label: '20尺集装箱 (6058×2438mm)' },
                  { value: '2991x2438', label: '10尺储能柜 (2991×2438mm)' },
                  { value: '5000x2500', label: '非标集装箱 (5000×2500mm)' },
                ]}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>宽度 (mm)</Text>
              <Slider
                min={2000}
                max={7000}
                value={cabinetSize.width * 10}
                onChange={(val) => setCabinetSize(s => ({ ...s, width: val / 10 }))}
                marks={{ 2000: '2m', 4000: '4m', 6000: '6m' }}
              />
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>高度 (mm)</Text>
              <Slider
                min={1500}
                max={3000}
                value={cabinetSize.height * 10}
                onChange={(val) => setCabinetSize(s => ({ ...s, height: val / 10 }))}
                marks={{ 1500: '1.5m', 2500: '2.5m' }}
              />
            </div>
          </Card>

          {/* Component Legend */}
          <Card size="small" style={{ marginTop: 12 }} title="组件图例">
            <Table
              size="small"
              dataSource={[
                { type: 'battery', name: '电池簇', color: typeConfig.battery.color },
                { type: 'pcs', name: 'PCS变流器', color: typeConfig.pcs.color },
                { type: 'bms', name: 'BMS柜', color: typeConfig.bms.color },
                { type: 'ems', name: 'EMS柜', color: typeConfig.ems.color },
                { type: 'fire', name: '消防系统', color: typeConfig.fire.color },
              ]}
              rowKey="type"
              pagination={false}
              columns={[
                { title: '颜色', dataIndex: 'color', key: 'color', width: 40, render: (c: string) => <div style={{ width: 16, height: 16, background: c, borderRadius: 4 }} /> },
                { title: '组件', dataIndex: 'name', key: 'name' },
              ]}
            />
          </Card>
        </Col>

        {/* Center: Floor Plan */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <AppstoreOutlined />
                <span>集装箱内部布局</span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cabinetSize.width * 10} × {cabinetSize.height * 10} mm
                </Text>
              </Space>
            }
          >
            <div style={{ 
              background: '#f5f5f5', 
              borderRadius: 8, 
              padding: 20, 
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}>
              <svg width={viewWidth} height={viewHeight} viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
                {/* Background */}
                <rect x="20" y="20" width={cabinetSize.width} height={cabinetSize.height} fill="#fafafa" stroke="#ddd" strokeWidth="2" strokeDasharray="5,5"/>
                
                {/* Grid */}
                <defs>
                  <pattern id="floorGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#eee" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect x="20" y="20" width={cabinetSize.width} height={cabinetSize.height} fill="url(#floorGrid)" />

                {/* Layout Items */}
                {layoutItems.map(item => (
                  <g
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={item.x + 20}
                      y={item.y + 20}
                      width={item.width}
                      height={item.height}
                      fill={item.color + '30'}
                      stroke={selectedItem === item.id ? '#000' : item.color}
                      strokeWidth={selectedItem === item.id ? 2 : 1}
                      rx="4"
                    />
                    <text
                      x={item.x + 20 + item.width / 2}
                      y={item.y + 20 + item.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill={item.color}
                      fontWeight="bold"
                    >
                      {typeConfig[item.type]?.icon} {item.name.substring(0, 8)}
                    </text>
                    {item.type !== 'cabinet' && (
                      <text
                        x={item.x + 20 + item.width / 2}
                        y={item.y + 20 + item.height / 2 + 14}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#666"
                      >
                        {item.width}×{item.height}
                      </text>
                    )}
                  </g>
                ))}

                {/* Dimension Labels */}
                <text x={20 + cabinetSize.width / 2} y={viewHeight - 5} textAnchor="middle" fontSize="11" fill="#999">
                  {cabinetSize.width * 10} mm
                </text>
                <text x={10} y={20 + cabinetSize.height / 2} textAnchor="middle" fontSize="11" fill="#999" transform={`rotate(-90, 10, ${20 + cabinetSize.height / 2})`}>
                  {cabinetSize.height * 10} mm
                </text>

                {/* Direction Indicator */}
                <g transform={`translate(${viewWidth - 40}, ${viewHeight - 40})`}>
                  <circle r="15" fill="#fff" stroke="#ddd" strokeWidth="1"/>
                  <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#999">前</text>
                  <text x="0" y="20" textAnchor="middle" fontSize="6" fill="#ccc">进门侧</text>
                </g>
              </svg>
            </div>
          </Card>
        </Col>

        {/* Right: Component List & Stats */}
        <Col span={6}>
          <Card size="small" title={<Space><ThunderboltOutlined /> BOM清单</Space>}>
            {selectedDesign ? (
              <Table
                size="small"
                dataSource={selectedDesign.bom}
                rowKey="componentId"
                pagination={false}
                columns={[
                  { title: '组件', key: 'name', render: (_: any, r: Component) => (
                    <Space>
                      <span>{typeConfig[r.type]?.icon || '📦'}</span>
                      <Text>{r.name}</Text>
                    </Space>
                  )},
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 50, render: (q: number) => `×${q}` },
                ]}
              />
            ) : (
              <Text type="secondary">请选择设计方案</Text>
            )}
          </Card>

          <Card size="small" style={{ marginTop: 12 }} title="布局统计">
            <Table
              size="small"
              dataSource={[
                { label: '集装箱尺寸', value: `${cabinetSize.width * 10}×${cabinetSize.height * 10}mm` },
                { label: '可用面积', value: `${(cabinetSize.width * cabinetSize.height / 1000000).toFixed(2)} m²` },
                { label: '电池簇数量', value: layoutItems.filter(i => i.type === 'battery').length },
                { label: 'PCS数量', value: layoutItems.filter(i => i.type === 'pcs').length },
                { label: '总面积', value: `${(layoutItems.filter(i => i.type !== 'cabinet').reduce((s, i) => s + i.width * i.height, 0) / 1000000).toFixed(2)} m²` },
              ]}
              rowKey="label"
              pagination={false}
              columns={[
                { title: '项目', dataIndex: 'label', key: 'label' },
                { title: '数值', dataIndex: 'value', key: 'value' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
