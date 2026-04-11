import { useState, useEffect, Suspense, useRef } from 'react';
import { Card, Typography, Space, Select, Spin, Button, Row, Col, Statistic, Slider, message } from 'antd';
import { FullscreenOutlined } from '@ant-design/icons';
import { designsApi } from '../services/api';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const { Text: AntText } = Typography;

interface Component {
  type: string;
  brand: string;
  model: string;
  name: string;
  specs: any;
  quantity: number;
}

interface Design {
  id: string;
  name: string;
  bom: Component[];
}

const typeConfig: Record<string, { color: string; emissive: string; label: string; height: number }> = {
  battery: { color: '#52c41a', emissive: '#237804', label: '电池簇', height: 1.2 },
  pcs: { color: '#1890ff', emissive: '#096dd9', label: 'PCS变流器', height: 1.6 },
  bms: { color: '#722ed1', emissive: '#531d93', label: 'BMS柜', height: 1.4 },
  ems: { color: '#fa8c16', emissive: '#d46b08', label: 'EMS柜', height: 1.4 },
  fire: { color: '#f5222d', emissive: '#a8071a', label: '消防系统', height: 0.8 },
  cabinet: { color: '#8c8c8c', emissive: '#434343', label: '集装箱', height: 2.6 },
};

// Cabinet dimensions (20ft container in meters)
const CABINET_WIDTH = 6.058;
const CABINET_HEIGHT = 2.6;
const CABINET_DEPTH = 2.438;

function CabinetMesh({ width = CABINET_WIDTH, height = CABINET_HEIGHT, depth = CABINET_DEPTH }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="#8c8c8c" metalness={0.6} roughness={0.4} />
    </mesh>
  );
}

interface ComponentMeshProps {
  type: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  label: string;
}

function ComponentMesh({ type, x, y, z, width, depth, label }: ComponentMeshProps) {
  const config = typeConfig[type] || typeConfig.cabinet;
  const height = config.height;
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={[x, y, z]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={0.15}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      <Html position={[0, height / 2 + 0.15, 0]} center distanceFactor={10}>
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 10,
          whiteSpace: 'nowrap',
          fontFamily: 'Inter, sans-serif'
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

interface SceneProps {
  design: Design;
  cabinetSize: { width: number; height: number; depth: number };
}

function Scene({ design, cabinetSize }: SceneProps) {
  const items: React.ReactElement[] = [];
  let currentX = 0.3;
  let currentY = 0.1;
  const gap = 0.15;

  // Battery clusters
  const batteries = design.bom.filter((b: any) => b.type === 'battery');
  batteries.forEach((b: Component, idx: number) => {
    const config = typeConfig.battery;
    const itemWidth = 1.2;
    const itemDepth = 0.8;

    for (let q = 0; q < Math.min(b.quantity || 1, 8); q++) {
      if (currentX + itemWidth > cabinetSize.width - 0.3) {
        currentX = 0.3;
        currentY += config.height + gap;
      }
      items.push(
        <ComponentMesh
          key={`battery-${idx}-${q}`}
          type="battery"
          x={currentX + itemWidth / 2}
          y={currentY + config.height / 2}
          z={cabinetSize.depth / 2}
          width={itemWidth}
          depth={itemDepth}
          label={`${b.brand} ${b.model}`}
        />
      );
      currentX += itemWidth + gap;
    }
  });

  // PCS
  const pcsCount = design.bom.find((b: any) => b.type === 'pcs')?.quantity || 0;
  for (let i = 0; i < Math.min(pcsCount, 3); i++) {
    const config = typeConfig.pcs;
    if (currentX + config.height > cabinetSize.width - 0.3) {
      currentX = 0.3;
      currentY += config.height + gap;
    }
    items.push(
      <ComponentMesh
        key={`pcs-${i}`}
        type="pcs"
        x={currentX + config.height / 2}
        y={currentY + config.height / 2}
        z={cabinetSize.depth / 2}
        width={config.height}
        depth={0.6}
        label={`PCS #${i + 1}`}
      />
    );
    currentX += config.height + gap;
  }

  // Floor grid
  const gridHelper = (
    <gridHelper args={[10, 20, '#333', '#222']} position={[0, 0.01, 0]} />
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffd700" />

      {/* Cabinet */}
      <CabinetMesh width={cabinetSize.width} height={cabinetSize.height} depth={cabinetSize.depth} />

      {/* Components inside */}
      {items}

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {gridHelper}

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.6}
        scale={20}
        blur={2}
        far={10}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载 3D 场景...</div>
      </div>
    </Html>
  );
}

export default function Container3D() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [cabinetSize, setCabinetSize] = useState({ width: 6.058, height: 2.6, depth: 2.438 });
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const res = await designsApi.list();
      setDesigns(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedDesign(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
      messageApi.error('加载设计方案失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#0f0f1a', minHeight: '100vh' }}>
      {contextHolder}

      {/* Header */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Space direction="vertical" size={4}>
            <AntText strong style={{ fontSize: 20, color: '#fff' }}>🏭 储能集装箱 3D 外观渲染</AntText>
            <AntText type="secondary">拖拽旋转 · 滚轮缩放 · 右键平移</AntText>
          </Space>
        </Col>
        <Col span={8}>
          <Space>
            <Select
              style={{ width: 240 }}
              placeholder="选择设计方案"
              value={selectedDesign?.id}
              onChange={(id) => {
                const d = designs.find((x: any) => x.id === id);
                setSelectedDesign(d || null);
              }}
              options={designs.map((d: any) => ({ value: d.id, label: d.name }))}
              loading={loading}
            />
            <Button icon={<FullscreenOutlined />} onClick={() => messageApi.info('浏览器全屏模式')}>
              全屏
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats */}
      {selectedDesign && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {selectedDesign.bom.slice(0, 6).map((item: any, idx: number) => (
            <Col key={idx} span={4}>
              <Card size="small" style={{ background: '#1a1a2e', border: '1px solid #333' }}>
                <Statistic
                  title={<AntText style={{ color: '#888' }}>{typeConfig[item.type]?.label || item.type}</AntText>}
                  value={item.quantity || 1}
                  prefix={<AntText style={{ color: typeConfig[item.type]?.color }}>{typeConfig[item.type]?.label?.[0] || '?'}</AntText>}
                  valueStyle={{ color: '#fff' }}
                />
                <AntText type="secondary" style={{ fontSize: 10 }}>{item.brand}</AntText>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 3D Canvas */}
      <Card
        style={{
          background: '#0a0a14',
          border: '1px solid #222',
          borderRadius: 12,
          overflow: 'hidden',
          height: 'calc(100vh - 280px)',
          minHeight: 500,
        }}
        bodyStyle={{ height: '100%', padding: 0 }}
      >
        {selectedDesign ? (
          <Suspense fallback={<LoadingFallback />}>
            <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
              <Scene design={selectedDesign} cabinetSize={cabinetSize} />
            </Canvas>
          </Suspense>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
            {loading ? '加载中...' : '请选择设计方案'}
          </div>
        )}

        {/* Controls overlay */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 16px',
          borderRadius: 8,
          color: '#888',
          fontSize: 12,
        }}>
          <Space>
            <span>🖱️ 左键拖拽旋转</span>
            <span>🖱️ 右键平移</span>
            <span>⚙️ 滚轮缩放</span>
          </Space>
        </div>

        {/* Cabinet size control */}
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.8)',
          padding: 16,
          borderRadius: 8,
          width: 220,
        }}>
          <AntText strong style={{ color: '#fff', fontSize: 12 }}>集装箱尺寸</AntText>
          <div style={{ marginTop: 12 }}>
            <AntText type="secondary" style={{ fontSize: 11 }}>长度: {cabinetSize.width.toFixed(1)}m</AntText>
            <Slider
              min={3}
              max={12}
              step={0.1}
              value={cabinetSize.width}
              onChange={(v) => setCabinetSize({ ...cabinetSize, width: v })}
            />
          </div>
          <div>
            <AntText type="secondary" style={{ fontSize: 11 }}>高度: {cabinetSize.height.toFixed(1)}m</AntText>
            <Slider
              min={2}
              max={4}
              step={0.1}
              value={cabinetSize.height}
              onChange={(v) => setCabinetSize({ ...cabinetSize, height: v })}
            />
          </div>
          <div>
            <AntText type="secondary" style={{ fontSize: 11 }}>宽度: {cabinetSize.depth.toFixed(1)}m</AntText>
            <Slider
              min={2}
              max={4}
              step={0.1}
              value={cabinetSize.depth}
              onChange={(v) => setCabinetSize({ ...cabinetSize, depth: v })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
