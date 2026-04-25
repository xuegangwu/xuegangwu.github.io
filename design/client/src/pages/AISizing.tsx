import { useState } from 'react';
import { Card, Form, InputNumber, Select, Button, Row, Col, List, Tag, Typography, Space, Divider, message, Spin, Avatar, Input } from 'antd';
import { AimOutlined, RobotOutlined, CheckCircleOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { aiApi, designsApi } from '../services/api';

const { Title, Text } = Typography;

const scenarioOptions = [
  { value: '工商业峰谷套利', label: '工商业峰谷套利' },
  { value: '需求侧响应', label: '需求侧响应' },
  { value: '备用电源', label: '备用电源' },
  { value: '微电网', label: '微电网' },
  { value: '光储一体化', label: '光储一体化' },
];

const voltageOptions = [
  { value: '400V', label: '400V (低压)' },
  { value: '800V', label: '800V (中压)' },
  { value: '1500V', label: '1500V (高压)' },
];

interface BOMItem {
  componentId: string;
  type: string;
  brand: string;
  model: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specs: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AISizing() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [bom, setBom] = useState<BOMItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [designName, setDesignName] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '您好！我是储能系统设计助手。您可以告诉我您的需求，比如：\n\n"我需要500kW功率，2MWh容量的储能系统，用于峰谷套利"\n\n我会为您推荐最佳组件配置。' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSuggest = async () => {
    const values = form.getFieldsValue();
    setLoading(true);
    try {
      const res = await aiApi.suggest({
        power: values.power,
        capacity: values.capacity,
        scenario: values.scenario,
        voltage: values.voltage,
      });
      setSuggestions(res.data.data.recommendations);
      setBom(res.data.data.bom);
      setTotalCost(res.data.data.totalCost);
    } catch (err) {
      message.error('AI推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await aiApi.chat(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.response }]);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'AI回复失败');
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI回复失败了。请稍后重试。' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      message.warning('请输入设计方案名称');
      return;
    }
    try {
      await designsApi.create({
        name: designName,
        requirements: form.getFieldsValue(),
        components: suggestions,
        bom,
        totalCost,
        aiSuggestion: `AI推荐方案：${form.getFieldValue('scenario')}，功率${form.getFieldValue('power')}kW，容量${form.getFieldValue('capacity')}kWh`,
      });
      message.success('设计方案已保存');
    } catch (err) {
      message.error('保存失败');
    }
  };

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
    pcs: '储能变流器',
    bms: '电池管理',
    ems: '能量管理',
    fire: '消防',
    cabinet: '集装箱/柜',
  };

  return (
    <div>
      <Row gutter={24}>
        {/* Left: AI Chat */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><RobotOutlined /> AI 设计助手</Space>}
            style={{ height: '100%' }}
          >
            {/* Chat Messages */}
            <div style={{ 
              height: 400, 
              overflow: 'auto', 
              border: '1px solid #e8eaed', 
              borderRadius: 8, 
              padding: 16,
              marginBottom: 16,
              background: '#fafafa'
            }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 12
                }}>
                  {msg.role === 'assistant' && (
                    <Avatar icon={<RobotOutlined />} style={{ marginRight: 8, backgroundColor: '#e6342a' }} />
                  )}
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    background: msg.role === 'user' ? '#e6342a' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar icon={<UserOutlined />} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999' }}>
                  <Spin size="small" />
                  <Text type="secondary">AI 思考中...</Text>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入您的需求，如：500kW功率，2MWh容量..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onPressEnter={handleChat}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleChat} loading={chatLoading} />
            </Space.Compact>
          </Card>
        </Col>

        {/* Right: Requirements Form + Results */}
        <Col xs={24} lg={12}>
          <Card title={<Space><AimOutlined /> 快速配置</Space>}>
            <Form form={form} layout="vertical" initialValues={{ voltage: '800V' }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="系统功率" name="power" rules={[{ required: true }]}>
                    <InputNumber min={10} max={10000} addonAfter="kW" style={{ width: '100%' }} placeholder="如: 500" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="储能容量" name="capacity" rules={[{ required: true }]}>
                    <InputNumber min={100} max={100000} addonAfter="kWh" style={{ width: '100%' }} placeholder="如: 2000" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="应用场景" name="scenario" rules={[{ required: true }]}>
                    <Select options={scenarioOptions} placeholder="选择应用场景" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="电压等级" name="voltage">
                    <Select options={voltageOptions} />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                icon={<AimOutlined />}
                size="large"
                block
                onClick={handleSuggest}
                loading={loading}
              >
                获取 AI 组件推荐
              </Button>
            </Form>
          </Card>

          {/* Result Summary */}
          {suggestions.length > 0 && (
            <Card style={{ marginTop: 16 }} title="💰 成本估算">
              <Title level={2} style={{ color: '#f5222d', margin: 0 }}>
                ¥{totalCost.toLocaleString()}
              </Title>
              <Text type="secondary">系统总成本（仅供参考）</Text>

              <Divider />

              <List
                size="small"
                dataSource={suggestions}
                renderItem={(item: any) => (
                  <List.Item>
                    <Space>
                      <Tag color={typeColors[item.type]}>{typeLabels[item.type]}</Tag>
                      <Text>{item.brand} {item.model}</Text>
                      <Text type="secondary">× {item.quantity}</Text>
                    </Space>
                    <Text strong>¥{(item.quantity * item.unitPrice).toLocaleString()}</Text>
                  </List.Item>
                )}
              />

              <Divider />

              <Form.Item label="保存为设计方案">
                <Input
                  placeholder="输入设计方案名称"
                  value={designName}
                  onChange={e => setDesignName(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSaveDesign}>
                  保存设计方案
                </Button>
              </Form.Item>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
