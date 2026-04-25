import { useState, useEffect } from 'react';
import { Layout, Typography, Space, Button, Tag, Dropdown, Tooltip, Divider } from 'antd';
import {
  AppstoreOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  LayoutOutlined,
  AimOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  RobotOutlined,
  SaveOutlined,
  ExportOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import ComponentLibrary from './pages/ComponentLibrary';
import AISizing from './pages/AISizing';
import Designs from './pages/Designs';
import DesignCanvas from './pages/DesignCanvas';
import SystemTopology from './pages/SystemTopology';
import HierarchicalBOM from './pages/HierarchicalBOM';
import InternalLayout from './pages/InternalLayout';
import Container3D from './pages/Container3D';
import { designsApi } from './services/api';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function App() {
  const [selectedKey, setSelectedKey] = useState('designs');
  const [design, setDesign] = useState<any>(null);
  const [designs, setDesigns] = useState<any[]>([]);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const res = await designsApi.list();
      setDesigns(res.data.data || []);
      if (res.data.data?.length > 0 && !design) {
        setDesign(res.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load designs', err);
    }
  };

  const handleDesignChange = ({ key }: { key: string }) => {
    const d = designs.find((x: any) => x.id === key);
    if (d) setDesign(d);
  };

  const handleSelectDesign = (d: any) => {
    setDesign(d);
    if (d) setSelectedKey('canvas');
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'designs':
        return <Designs onSelectDesign={handleSelectDesign} />;
      case 'component-library':
        return <ComponentLibrary />;
      case 'sizing':
        return <AISizing />;
      case 'canvas':
      case 'hbom':
      case 'layout':
      case 'container3d':
      case 'topology':
        if (!design) {
          return (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 'calc(100vh - 120px)',
              gap: 20 
            }}>
              <div style={{ 
                width: 100, height: 100, borderRadius: 24, 
                background: 'linear-gradient(135deg, #e6342a, #ff6b6b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, boxShadow: '0 12px 40px rgba(230,52,42,0.3)'
              }}>
                ⚡
              </div>
              <Text style={{ fontSize: 20, color: '#4a5568' }}>请选择一个设计方案开始</Text>
              <Button type="primary" size="large" icon={<FileTextOutlined />} onClick={() => setSelectedKey('designs')}>
                选择设计方案
              </Button>
            </div>
          );
        }
        switch (selectedKey) {
          case 'canvas': return <DesignCanvas />;
          case 'hbom': return <HierarchicalBOM />;
          case 'layout': return <InternalLayout />;
          case 'container3d': return <Container3D />;
          case 'topology': return <SystemTopology />;
        }
      default:
        return <Designs onSelectDesign={handleSelectDesign} />;
    }
  };

  const isDesignMode = ['canvas', 'hbom', 'layout', 'container3d', 'topology'].includes(selectedKey);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6f8' }}>
      {/* Top Header */}
      <Header style={{
        background: '#ffffff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e8eaed',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {/* Left: Logo + Nav */}
        <Space size={20}>
          <Space size={10}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #e6342a, #ff6b6b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 12px rgba(230,52,42,0.3)',
            }}>
              ⚡
            </div>
            <Text strong style={{ fontSize: 18, color: '#1a1a2e', letterSpacing: '-0.3px' }}>
              Solar<span style={{ color: '#e6342a' }}>Design</span>
            </Text>
          </Space>
          
          <Divider type="vertical" style={{ height: 28, margin: '0 8px' }} />
          
          {/* Main Nav */}
          <Space size={4}>
            <Button 
              type={selectedKey === 'designs' ? 'primary' : 'text'} 
              icon={<FileTextOutlined />}
              onClick={() => setSelectedKey('designs')}
              style={{ borderRadius: 8, background: selectedKey === 'designs' ? '#e6342a' : undefined }}
            >
              设计方案
            </Button>
            <Button 
              type={selectedKey === 'component-library' ? 'primary' : 'text'} 
              icon={<AppstoreOutlined />}
              onClick={() => setSelectedKey('component-library')}
              style={{ borderRadius: 8, background: selectedKey === 'component-library' ? '#e6342a' : undefined }}
            >
              组件库
            </Button>
            <Button 
              type={selectedKey === 'sizing' ? 'primary' : 'text'} 
              icon={<RobotOutlined />}
              onClick={() => setSelectedKey('sizing')}
              style={{ borderRadius: 8, background: selectedKey === 'sizing' ? '#e6342a' : undefined }}
            >
              AI选型
            </Button>
          </Space>
        </Space>

        {/* Center: Design Mode Tabs */}
        {isDesignMode && (
          <Space size={4} style={{ 
            background: '#f5f6f8', 
            padding: '6px 12px', 
            borderRadius: 12,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}>
            {[
              { key: 'canvas', icon: <ThunderboltOutlined />, label: '画布' },
              { key: 'hbom', icon: <ApartmentOutlined />, label: 'BOM' },
              { key: 'layout', icon: <LayoutOutlined />, label: '布局' },
              { key: 'container3d', icon: <ClusterOutlined />, label: '3D' },
              { key: 'topology', icon: <AimOutlined />, label: '拓扑' },
            ].map(item => (
              <Button
                key={item.key}
                type={selectedKey === item.key ? 'primary' : 'text'}
                size="small"
                icon={item.icon}
                onClick={() => setSelectedKey(item.key)}
                style={{ 
                  borderRadius: 8,
                  background: selectedKey === item.key ? '#e6342a' : 'transparent',
                  color: selectedKey === item.key ? '#fff' : '#4a5568',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Space>
        )}

        {/* Right: Design Selector + Actions */}
        <Space size={16}>
          {design && isDesignMode && (
            <>
              <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: '4px 12px', fontSize: 13 }}>
                {design.name}
              </Tag>
              <Dropdown
                menu={{
                  items: designs.map((d: any) => ({ key: d.id, label: d.name })),
                  onClick: handleDesignChange,
                }}
                placement="bottomRight"
              >
                <Button size="small" type="text">切换方案 ▾</Button>
              </Dropdown>
              <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
              <Tooltip title="保存">
                <Button icon={<SaveOutlined />} size="small" style={{ borderRadius: 8 }} />
              </Tooltip>
              <Tooltip title="导出">
                <Button icon={<ExportOutlined />} size="small" style={{ borderRadius: 8 }} />
              </Tooltip>
            </>
          )}
        </Space>
      </Header>

      {/* Main Content */}
      <Content style={{
        padding: 0,
        background: '#f5f6f8',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {renderContent()}
      </Content>
    </Layout>
  );
}
