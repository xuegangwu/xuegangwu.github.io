import { useState, useEffect } from 'react';
import { Card, Typography, Space, Row, Col, Statistic, Table, Tag } from 'antd';
import { designsApi } from '../services/api';

const { Text } = Typography;

const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
  battery: { color: '#52c41a', icon: '🔋', label: '电池簇' },
  pcs: { color: '#1890ff', icon: '⚡', label: 'PCS' },
  bms: { color: '#722ed1', icon: '📊', label: 'BMS' },
  ems: { color: '#fa8c16', icon: '🖥️', label: 'EMS' },
  fire: { color: '#f5222d', icon: '🚨', label: '消防' },
  cabinet: { color: '#8c8c8c', icon: '📦', label: '集装箱' },
};

export default function SystemTopology() {
  const [items, setItems] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Load latest design
    designsApi.list().then(res => {
      if (res.data.data.length > 0) {
        const latest = res.data.data[0];
        setItems(latest.bom.map((b: any) => ({
          component: {
            type: b.type,
            brand: b.brand,
            model: b.model,
            name: b.name,
          },
          quantity: b.quantity,
        })));
        setTotalCost(latest.totalCost);
      }
    }).catch(() => {});
  }, []);

  const getCount = (type: string) => {
    const item = items.find(i => i.component.type === type);
    return item?.quantity || 0;
  };

  const batteryCount = getCount('battery');
  const pcsCount = getCount('pcs');
  const bmsCount = getCount('bms');
  const emsCount = getCount('ems');
  const fireCount = getCount('fire');
  const cabinetCount = getCount('cabinet');
  const hasData = items.length > 0;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="PCS 功率" value={pcsCount * 100} suffix="kW" prefix="⚡" /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="储能容量" value={batteryCount * 200} suffix="kWh" prefix="🔋" /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="BMS 数量" value={bmsCount} prefix="📊" /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="预估成本" value={totalCost} prefix="¥" valueStyle={{ color: '#f5222d' }} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title={<Space><span style={{ fontSize: 20 }}>📐</span> 系统电气拓扑图</Space>}>
            {!hasData ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                <Text type="secondary">暂无设计数据，请先在"设计画布"中添加组件并保存</Text>
              </div>
            ) : (
              <svg width="750" height="450" viewBox="0 0 750 450" style={{ display: 'block', margin: '0 auto' }}>
                {/* Background */}
                <defs>
                  <pattern id="grid2" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
                  </pattern>
                  <marker id="arrGold" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#faad14"/>
                  </marker>
                  <marker id="arrGreen" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#52c41a"/>
                  </marker>
                  <marker id="arrBlue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#1890ff"/>
                  </marker>
                </defs>
                <rect width="750" height="450" fill="url(#grid2)" rx="8"/>

                {/* === 光伏输入 === */}
                <g transform="translate(300, 15)">
                  <rect x="0" y="0" width="150" height="50" rx="6" fill="#1890ff15" stroke="#1890ff" strokeWidth="2"/>
                  <text x="75" y="22" textAnchor="middle" fontSize="13" fill="#1890ff" fontWeight="bold">☀️ 光伏输入</text>
                  <text x="75" y="40" textAnchor="middle" fontSize="10" fill="#1890ff">DC</text>
                </g>

                {/* 光伏→PCS 虚线 */}
                {pcsCount > 0 && (
                  <line x1="375" y1="65" x2="375" y2="95" stroke="#faad14" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrGold)"/>
                )}

                {/* === PCS 变流器 === */}
                {pcsCount > 0 && (
                  <g transform="translate(275, 95)">
                    <rect x="0" y="0" width="200" height="60" rx="6" fill="#1890ff20" stroke="#1890ff" strokeWidth="2"/>
                    <text x="100" y="22" textAnchor="middle" fontSize="12" fill="#1890ff" fontWeight="bold">⚡ PCS 储能变流器</text>
                    <text x="100" y="40" textAnchor="middle" fontSize="10" fill="#1890ff">
                      {items.find(i => i.component.type === 'pcs')?.component.brand || 'PCS'} × {pcsCount}台
                    </text>
                    <text x="100" y="54" textAnchor="middle" fontSize="9" fill="#666">双向DC↔AC · 效率99%</text>
                  </g>
                )}

                {/* PCS→电池 */}
                {batteryCount > 0 && pcsCount > 0 && (
                  <line x1="275" y1="140" x2="150" y2="160" stroke="#52c41a" strokeWidth="2" markerEnd="url(#arrGreen)"/>
                )}

                {/* PCS→电网 */}
                {pcsCount > 0 && (
                  <line x1="475" y1="140" x2="550" y2="160" stroke="#faad14" strokeWidth="2" markerEnd="url(#arrGold)"/>
                )}

                {/* === 电池簇 === */}
                {batteryCount > 0 && (
                  <g transform="translate(30, 155)">
                    <rect x="0" y="0" width="180" height="80" rx="6" fill="#52c41a20" stroke="#52c41a" strokeWidth="2"/>
                    <text x="90" y="20" textAnchor="middle" fontSize="12" fill="#52c41a" fontWeight="bold">🔋 电池簇</text>
                    <text x="90" y="38" textAnchor="middle" fontSize="10" fill="#52c41a">
                      {items.find(i => i.component.type === 'battery')?.component.brand || 'Battery'} × {batteryCount}簇
                    </text>
                    <text x="90" y="55" textAnchor="middle" fontSize="9" fill="#666">容量 {batteryCount * 200}kWh (估)</text>
                    <text x="90" y="70" textAnchor="middle" fontSize="9" fill="#666">LFP · 循环6000+</text>
                  </g>
                )}

                {/* === 电网 === */}
                <g transform="translate(550, 150)">
                  <rect x="0" y="0" width="120" height="60" rx="6" fill="#faad1420" stroke="#faad14" strokeWidth="2"/>
                  <text x="60" y="22" textAnchor="middle" fontSize="12" fill="#b8860b" fontWeight="bold">🏭 电网</text>
                  <text x="60" y="40" textAnchor="middle" fontSize="10" fill="#b8860b">AC Grid</text>
                  <text x="60" y="54" textAnchor="middle" fontSize="9" fill="#666">380V/50Hz</text>
                </g>

                {/* 电池↔PCS 双向箭头 */}
                {batteryCount > 0 && pcsCount > 0 && (
                  <>
                    <line x1="210" y1="175" x2="275" y2="155" stroke="#52c41a" strokeWidth="2" markerEnd="url(#arrGreen)"/>
                    <line x1="275" y1="155" x2="210" y2="175" stroke="#52c41a" strokeWidth="2" markerEnd="url(#arrGreen)" strokeDasharray="6,3"/>
                  </>
                )}

                {/* === BMS === */}
                {bmsCount > 0 && (
                  <g transform="translate(240, 210)">
                    <rect x="0" y="0" width="160" height="55" rx="6" fill="#722ed120" stroke="#722ed1" strokeWidth="2"/>
                    <text x="80" y="20" textAnchor="middle" fontSize="11" fill="#722ed1" fontWeight="bold">📊 BMS</text>
                    <text x="80" y="38" textAnchor="middle" fontSize="10" fill="#722ed1">
                      {items.find(i => i.component.type === 'bms')?.component.brand || 'BMS'} × {bmsCount}套
                    </text>
                    <text x="80" y="50" textAnchor="middle" fontSize="9" fill="#666">电池管理 / SOC均衡</text>
                  </g>
                )}

                {/* BMS→电池 虚线 */}
                {bmsCount > 0 && batteryCount > 0 && (
                  <line x1="240" y1="237" x2="210" y2="237" stroke="#722ed1" strokeWidth="1.5" strokeDasharray="4,2"/>
                )}

                {/* === EMS 云端 === */}
                {emsCount > 0 && (
                  <g transform="translate(560, 230)">
                    <rect x="0" y="0" width="140" height="55" rx="6" fill="#fa8c1620" stroke="#fa8c16" strokeWidth="2"/>
                    <text x="70" y="20" textAnchor="middle" fontSize="11" fill="#fa8c16" fontWeight="bold">🖥️ EMS</text>
                    <text x="70" y="38" textAnchor="middle" fontSize="10" fill="#fa8c16">
                      {items.find(i => i.component.type === 'ems')?.component.brand || 'EMS'}
                    </text>
                    <text x="70" y="50" textAnchor="middle" fontSize="9" fill="#666">能量调度 · 云端监控</text>
                  </g>
                )}

                {/* EMS 通信虚线 */}
                {emsCount > 0 && (
                  <>
                    {bmsCount > 0 && <line x1="560" y1="257" x2="400" y2="257" stroke="#fa8c16" strokeWidth="1.5" strokeDasharray="4,2"/>}
                    {pcsCount > 0 && <line x1="560" y1="245" x2="475" y2="175" stroke="#fa8c16" strokeWidth="1.5" strokeDasharray="4,2"/>}
                  </>
                )}

                {/* === 负载 === */}
                <g transform="translate(280, 310)">
                  <rect x="0" y="0" width="180" height="50" rx="6" fill="#666620" stroke="#666" strokeWidth="2"/>
                  <text x="90" y="22" textAnchor="middle" fontSize="11" fill="#666" fontWeight="bold">🏭 工厂/负载</text>
                  <text x="90" y="40" textAnchor="middle" fontSize="10" fill="#666">AC 交流</text>
                </g>

                {/* PCS→负载 */}
                {pcsCount > 0 && (
                  <line x1="375" y1="155" x2="370" y2="310" stroke="#1890ff" strokeWidth="2" markerEnd="url(#arrBlue)"/>
                )}

                {/* === 消防 === */}
                {fireCount > 0 && (
                  <g transform="translate(30, 310)">
                    <rect x="0" y="0" width="150" height="45" rx="6" fill="#f5222d15" stroke="#f5222d" strokeWidth="2"/>
                    <text x="75" y="18" textAnchor="middle" fontSize="10" fill="#f5222d" fontWeight="bold">🚨 消防系统</text>
                    <text x="75" y="35" textAnchor="middle" fontSize="9" fill="#666">
                      {items.find(i => i.component.type === 'fire')?.component.brand || 'Fire'} × {fireCount}
                    </text>
                  </g>
                )}

                {/* === 集装箱 === */}
                {cabinetCount > 0 && (
                  <g transform="translate(550, 310)">
                    <rect x="0" y="0" width="150" height="45" rx="6" fill="#8c8c8c15" stroke="#8c8c8c" strokeWidth="2"/>
                    <text x="75" y="18" textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">📦 集装箱/机柜</text>
                    <text x="75" y="35" textAnchor="middle" fontSize="9" fill="#666">
                      {items.find(i => i.component.type === 'cabinet')?.component.brand || 'Cabinet'} × {cabinetCount}
                    </text>
                  </g>
                )}

                {/* 图例 */}
                <g transform="translate(20, 400)">
                  <rect x="0" y="0" width="700" height="35" rx="4" fill="#fafafa" stroke="#e8eaed"/>
                  <text x="15" y="22" fontSize="11" fill="#666" fontWeight="bold">图例：</text>
                  <line x1="70" y1="17" x2="100" y2="17" stroke="#faad14" strokeWidth="2"/>
                  <text x="105" y="22" fontSize="10" fill="#666">AC电力流</text>
                  <line x1="180" y1="17" x2="210" y2="17" stroke="#52c41a" strokeWidth="2"/>
                  <text x="215" y="22" fontSize="10" fill="#666">DC直流</text>
                  <line x1="280" y1="17" x2="310" y2="17" stroke="#1890ff" strokeWidth="2"/>
                  <text x="315" y="22" fontSize="10" fill="#666">PCS输出</text>
                  <line x1="380" y1="17" x2="410" y2="17" stroke="#fa8c16" strokeWidth="1.5" strokeDasharray="4,2"/>
                  <text x="415" y="22" fontSize="10" fill="#666">EMS通信</text>
                  <text x="510" y="22" fontSize="10" fill="#52c41a">●</text>
                  <text x="520" y="22" fontSize="10" fill="#666">充电</text>
                  <text x="560" y="22" fontSize="10" fill="#1890ff">●</text>
                  <text x="570" y="22" fontSize="10" fill="#666">放电</text>
                </g>
              </svg>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title={<Space><span>📋</span> 组件清单</Space>}>
            {!hasData ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <Text type="secondary">暂无数据</Text>
              </div>
            ) : (
              <Table
                size="small"
                dataSource={items}
                rowKey={(_, idx) => String(idx)}
                pagination={false}
                columns={[
                  { title: '类型', dataIndex: ['component', 'type'], key: 'type', render: (t: string) => (
                    <Tag color={typeConfig[t]?.color || '#999'}>{typeConfig[t]?.icon} {typeConfig[t]?.label || t}</Tag>
                  )},
                  { title: '品牌', dataIndex: ['component', 'brand'], key: 'brand' },
                  { title: '数量', dataIndex: 'quantity', key: 'qty', width: 60, render: (q: number) => `×${q}` },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
