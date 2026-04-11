import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Space, Dropdown, Button, Tag, Card } from 'antd';
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

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const { SubMenu } = Menu;

// Current design context
interface DesignContext {
  id: string;
  name: string;
  status: string;
}

const workflowItems = [
  { key: 'hbom', icon: <ApartmentOutlined />, label: '层级BOM' },
  { key: 'layout', icon: <LayoutOutlined />, label: '内部布局' },
  { key: 'container3d', icon: <ClusterOutlined />, label: '3D外观' },
  { key: 'topology', icon: <AimOutlined />, label: '系统拓扑' },
  { key: 'canvas', icon: <ThunderboltOutlined />, label: '设计画布' },
];

export default function App() {
  const [selectedKey, setSelectedKey] = useState('component-library');
  const [design, setDesign] = useState<DesignContext | null>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const res = await designsApi.list();
      setDesigns(res.data.data || []);
      if (res.data.data?.length > 0 && !design) {
        setDesign({
          id: res.data.data[0].id,
          name: res.data.data[0].name,
          status: res.data.data[0].status,
        });
      }
    } catch (err) {
      console.error('Failed to load designs', err);
    }
  };

  const handleDesignChange = ({ key }: { key: string }) => {
    const d = designs.find((x: any) => x.id === key);
    if (d) {
      setDesign({ id: d.id, name: d.name, status: d.status });
    }
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'component-library':
        return <ComponentLibrary />;
      case 'designs':
        return <Designs onSelectDesign={(d) => setDesign(d ? { id: d.id, name: d.name, status: d.status } : null)} />;
      case 'hbom':
      case 'layout':
      case 'container3d':
      case 'topology':
      case 'canvas':
        if (!design) {
          return (
            <Card style={{ textAlign: 'center', padding: 60 }}>
              <Text type="secondary" style={{ fontSize: 16 }}>
                请先在「设计方案」中选择一个设计方案
              </Text>
            </Card>
          );
        }
        switch (selectedKey) {
          case 'hbom': return <HierarchicalBOM />;
          case 'layout': return <InternalLayout />;
          case 'container3d': return <Container3D />;
          case 'topology': return <SystemTopology />;
          case 'canvas': return <DesignCanvas />;
        }
      case 'sizing':
        return <AISizing />;
      default:
        return <ComponentLibrary />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'component-library': '📚 组件库',
      'designs': '📋 设计方案',
      'hbom': '🏗️ 层级BOM',
      'layout': '📐 内部布局',
      'container3d': '🏭 3D外观',
      'topology': '⚡ 系统拓扑',
      'canvas': '🎨 设计画布',
      'sizing': '🤖 AI选型',
    };
    return titles[selectedKey] || 'Design Platform';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: '#001529',
          borderRight: '1px solid #333',
        }}
        theme="dark"
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: '1px solid #333',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #00D4AA, #00A080)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}>
            ⚡
          </div>
          {!collapsed && (
            <Text strong style={{ color: '#fff', marginLeft: 12, fontSize: 15 }}>
              Design<span style={{ color: '#00D4AA' }}>.solaripple</span>
            </Text>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
        >
          {/* Component Library */}
          <Menu.Item key="component-library" icon={<AppstoreOutlined />}>
            组件库
          </Menu.Item>

          {/* AI Sizing */}
          <Menu.Item key="sizing" icon={<RobotOutlined />}>
            AI 选型
          </Menu.Item>

          {/* Designs */}
          <Menu.Item key="designs" icon={<FileTextOutlined />}>
            设计方案
          </Menu.Item>

          {/* Workflow Submenu */}
          <SubMenu
            key="workflow"
            icon={<ClusterOutlined />}
            title={collapsed ? '工作流' : '🎯 设计工作流'}
          >
            {workflowItems.map(item => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </SubMenu>
        </Menu>

        {/* Bottom: collapse button */}
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            borderTop: '1px solid #333',
            textAlign: 'center',
          }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              工商业储能设计平台 · 2026
            </Text>
          </div>
        )}
      </Sider>

      <Layout>
        {/* Header */}
        <Header style={{
          background: '#0a0a14',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #222',
          height: 64,
        }}>
          {/* Page Title */}
          <Space size="middle">
            <Text strong style={{ fontSize: 18, color: '#fff' }}>
              {getPageTitle()}
            </Text>
            {design && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                {design.name}
              </Tag>
            )}
          </Space>

          {/* Right actions */}
          <Space>
            {design && selectedKey !== 'designs' && selectedKey !== 'component-library' && (
              <>
                <Button icon={<SaveOutlined />} size="small">
                  保存
                </Button>
                <Button icon={<ExportOutlined />} size="small">
                  导出
                </Button>
              </>
            )}
            <Dropdown
              menu={{
                items: designs.map((d: any) => ({
                  key: d.id,
                  label: d.name,
                })),
                onClick: handleDesignChange,
              }}
              placement="bottomRight"
            >
              <Button size="small">
                切换方案 ▾
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{
          padding: 24,
          overflow: 'auto',
          background: '#0f0f1a',
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
