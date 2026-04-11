import { useState } from 'react';
import { Layout, Tabs, Typography, Space, Card } from 'antd';
import { ThunderboltOutlined, AppstoreOutlined, FileTextOutlined, AimOutlined, ApartmentOutlined, LayoutOutlined, ClusterOutlined } from '@ant-design/icons';
import ComponentLibrary from './pages/ComponentLibrary';
import AISizing from './pages/AISizing';
import Designs from './pages/Designs';
import DesignCanvas from './pages/DesignCanvas';
import SystemTopology from './pages/SystemTopology';
import HierarchicalBOM from './pages/HierarchicalBOM';
import InternalLayout from './pages/InternalLayout';
import Container3D from './pages/Container3D';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const [activeTab, setActiveTab] = useState('hbom');

  const items = [
    {
      key: 'hbom',
      label: (
        <Space>
          <ApartmentOutlined />
          层级BOM
        </Space>
      ),
      children: <HierarchicalBOM />,
    },
    {
      key: 'layout',
      label: (
        <Space>
          <LayoutOutlined />
          内部布局
        </Space>
      ),
      children: <InternalLayout />,
    },
    {
      key: 'container3d',
      label: (
        <Space>
          <ClusterOutlined />
          3D外观
        </Space>
      ),
      children: <Container3D />,
    },
    {
      key: 'canvas',
      label: (
        <Space>
          <ThunderboltOutlined />
          设计画布
        </Space>
      ),
      children: <DesignCanvas />,
    },
    {
      key: 'topology',
      label: (
        <Space>
          <AimOutlined />
          系统拓扑
        </Space>
      ),
      children: <SystemTopology />,
    },
    {
      key: 'library',
      label: (
        <Space>
          <AppstoreOutlined />
          组件库
        </Space>
      ),
      children: <ComponentLibrary />,
    },
    {
      key: 'sizing',
      label: (
        <Space>
          <ThunderboltOutlined />
          AI 选型
        </Space>
      ),
      children: <AISizing />,
    },
    {
      key: 'designs',
      label: (
        <Space>
          <FileTextOutlined />
          设计方案
        </Space>
      ),
      children: <Designs />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{
        background: '#001529',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Space>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00D4AA, #00A080)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            ⚡
          </div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Design<span style={{ color: '#00D4AA' }}>.solaripple</span>
          </Title>
        </Space>
        <Space>
          <Text type="secondary" style={{ color: 'rgba(255,255,255,0.65)' }}>
            工商业储能产品设计平台
          </Text>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            size="large"
          />
        </Card>
      </Content>

      <Footer style={{
        textAlign: 'center',
        background: '#f5f5f5',
        padding: '16px',
        color: '#999',
        fontSize: 12,
      }}>
        Design Platform · Solaripple Energy Technology · 2026
      </Footer>
    </Layout>
  );
}
