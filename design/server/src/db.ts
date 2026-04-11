import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

const db = new Database('design.db');

// Migration: add columns if they don't exist
try {
  db.exec("ALTER TABLE components ADD COLUMN parentId TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE components ADD COLUMN level INTEGER DEFAULT 0");
} catch (e) {}
try {
  db.exec("ALTER TABLE components ADD COLUMN quantity INTEGER DEFAULT 1");
} catch (e) {}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,          -- battery | pcs | bms | ems | fire | cabinet | module | cell
    parentId TEXT,                -- parent component id for hierarchical BOM
    level INTEGER DEFAULT 0,      -- 0: top-level, 1: sub-component, 2: sub-sub
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    name TEXT NOT NULL,
    specs TEXT NOT NULL,          -- JSON string
    price REAL,
    unit TEXT DEFAULT '元/套',
    quantity INTEGER DEFAULT 1,   -- quantity in parent
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    requirements TEXT NOT NULL,  -- JSON: { power, capacity, scenario, voltage }
    components TEXT NOT NULL,     -- JSON: [{ componentId, quantity, children: [...] }]
    bom TEXT NOT NULL,            -- JSON: computed BOM flat list
    totalCost REAL,
    aiSuggestion TEXT,            -- AI recommendation text
    status TEXT DEFAULT 'draft',  -- draft | finalized
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS component_history (
    id TEXT PRIMARY KEY,
    designId TEXT,
    componentId TEXT,
    action TEXT,                  -- added | removed | configured
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed components - always rebuild for now (development mode)
try {
  db.exec('DELETE FROM components');
  seedComponents();
} catch (e) {
  console.log('Seed error:', e);
}

function seedComponents() {
  const stmt = db.prepare(`
    INSERT INTO components (id, type, parentId, level, brand, model, name, specs, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ── Level 0: Top-level components (same as before) ──────────────────────────
  const topLevel = [
    // 电池簇 (Battery)
    { type: 'battery', brand: '宁德时代', model: 'CATL-280Ah', name: '宁德时代280Ah电芯', specs: { type: 'LFP', capacity: '280Ah', voltage: '3.2V', cycleLife: '6000+', energy: '896Wh', weight: '2.5kg' }, price: 850 },
    { type: 'battery', brand: '比亚迪', model: 'BYD-302Ah', name: '比亚迪刀片电池302Ah', specs: { type: 'LFP', capacity: '302Ah', voltage: '3.2V', cycleLife: '5000+', energy: '966Wh', weight: '2.8kg' }, price: 920 },
    { type: 'battery', brand: '亿纬锂能', model: 'EVE-280Ah', name: '亿纬280Ah电芯', specs: { type: 'LFP', capacity: '280Ah', voltage: '3.2V', cycleLife: '6000+', energy: '896Wh', weight: '2.4kg' }, price: 820 },
    { type: 'battery', brand: '中创新航', model: 'CALB-280Ah', name: '中创新航280Ah电芯', specs: { type: 'LFP', capacity: '280Ah', voltage: '3.2V', cycleLife: '5000+', energy: '896Wh', weight: '2.6kg' }, price: 880 },
    // PCS
    { type: 'pcs', brand: '阳光电源', model: 'SG125HV', name: '阳光电源125kW储能变流器', specs: { power: '125kW', efficiency: '99%', voltage: '800V', protection: 'IP65', cooling: '风冷' }, price: 45000 },
    { type: 'pcs', brand: '科华恒盛', model: 'KSG-100kW', name: '科华100kW储能变流器', specs: { power: '100kW', efficiency: '98.5%', voltage: '720V', protection: 'IP54', cooling: '风冷' }, price: 38000 },
    { type: 'pcs', brand: '上能电气', model: 'SP-100kW', name: '上能电气100kW PCS', specs: { power: '100kW', efficiency: '98.8%', voltage: '750V', protection: 'IP65', cooling: '液冷' }, price: 42000 },
    { type: 'pcs', brand: '华为', model: 'SUN2000-100KTL', name: '华为100kW储能PCS', specs: { power: '100kW', efficiency: '99%', voltage: '800V', protection: 'IP65', cooling: '液冷' }, price: 48000 },
    // BMS
    { type: 'bms', brand: '宁德时代', model: 'BMS-2000S', name: '宁德时代BMS电池管理系统', specs: { channels: '16', socAccuracy: '5%', temperaturePoints: '24', communication: 'CAN/RS485' }, price: 15000 },
    { type: 'bms', brand: '比亚迪', model: 'BMS-3000Pro', name: '比亚迪BMS Pro版', specs: { channels: '24', socAccuracy: '3%', temperaturePoints: '48', communication: 'CAN/RS485/以太网' }, price: 22000 },
    { type: 'bms', brand: '高特电子', model: 'GT-BMS-16S', name: '高特电子16串BMS', specs: { channels: '16', socAccuracy: '5%', temperaturePoints: '16', communication: 'RS485' }, price: 8500 },
    // EMS
    { type: 'ems', brand: '远景能源', model: 'ENOS-EMS', name: '远景能源EMS系统', specs: { functions: '调度/优化/预测', protocols: 'IEC61850/IEC104', scale: '100MW级' }, price: 80000 },
    { type: 'ems', brand: '华为', model: 'FusionSolar-EMS', name: '华为FusionSolar EMS', specs: { functions: '监控/告警/能量管理', protocols: 'Modbus/IEC104', scale: '50MW级' }, price: 65000 },
    { type: 'ems', brand: '南瑞继保', model: 'NRI-EMS', name: '南瑞继保EMS', specs: { functions: 'AGC/AVC/调频', protocols: 'IEC61850', scale: '200MW级' }, price: 120000 },
    // 消防
    { type: 'fire', brand: '国安达', model: 'GAZD-PACK', name: '国安达PACK级消防系统', specs: { type: '气溶胶/水喷淋', coverage: 'PACK内', responseTime: '<30s', certification: 'UL认证' }, price: 25000 },
    { type: 'fire', brand: '青鸟消防', model: 'QJ-EMS', name: '青鸟储能消防系统', specs: { type: '可燃气体探测+水喷淋', coverage: '舱级', responseTime: '<60s', certification: 'GB标准' }, price: 18000 },
    { type: 'fire', brand: '海湾安全', model: 'GST-FP', name: '海湾储能消防方案', specs: { type: '七氟丙烷+水雾', coverage: '舱级', responseTime: '<45s', certification: 'UL认证' }, price: 22000 },
    // 集装箱
    { type: 'cabinet', brand: '华为', model: 'SmartCabinet-20ft', name: '华为20尺储能集装箱', specs: { size: '20ft', capacity: '2.5MWh', material: '防腐钢', protection: 'IP54', dimensions: '6058x2438x2591mm' }, price: 180000 },
    { type: 'cabinet', brand: '阳光电源', model: 'SG-Cabinet-10ft', name: '阳光电源10尺储能柜', specs: { size: '10ft', capacity: '1.2MWh', material: '防腐钢', protection: 'IP55', dimensions: '2991x2438x2591mm' }, price: 120000 },
    { type: 'cabinet', brand: '科陆电子', model: 'KL-Cabinet-20ft', name: '科陆20尺储能集装箱', specs: { size: '20ft', capacity: '2.8MWh', material: '防腐钢', protection: 'IP56', dimensions: '6058x2438x2891mm' }, price: 200000 },
  ];

  const insert = db.transaction(() => {
    for (const item of topLevel) {
      stmt.run(uuid(), item.type, null, 0, item.brand, item.model, item.name, JSON.stringify(item.specs), item.price);
    }
  });
  insert();

  // ── Level 1: Sub-components ──────────────────────────────────────────────────
  // 电池簇的子组件：电池模组
  const batteryClusterModule = [
    { parentType: 'battery', brand: '宁德时代', model: 'CATL-MODULE-1', name: '电池模组1P10S', specs: { cells: '10S', arrangement: '1P10S', voltage: '32V', capacity: '280Ah', weight: '25kg' }, price: 2800 },
    { parentType: 'battery', brand: '比亚迪', model: 'BYD-MODULE-1', name: '刀片电池模组', specs: { cells: '4S2P', arrangement: '4S2P', voltage: '12.8V', capacity: '302Ah', weight: '30kg' }, price: 3200 },
  ];

  // PCS 的子组件：功率模块
  const pcsModule = [
    { parentType: 'pcs', brand: '阳光电源', model: 'SG-POWER-MODULE', name: '功率模块50kW', specs: { power: '50kW', voltage: '800V', efficiency: '99%', weight: '15kg' }, price: 12000 },
    { parentType: 'pcs', brand: '华为', model: 'HW-POWER-MODULE', name: '功率模块50kW', specs: { power: '50kW', voltage: '800V', efficiency: '99.1%', weight: '14kg' }, price: 14000 },
  ];

  // BMS 的子组件
  const bmsModule = [
    { parentType: 'bms', brand: '宁德时代', model: 'BMS-SLAVE', name: 'BMS从控模块', specs: { channels: '16S', voltage: '48V', temperaturePoints: '12' }, price: 3500 },
    { parentType: 'bms', brand: '比亚迪', model: 'BMS-MASTER', name: 'BMS主控模块', specs: { channels: '24S', voltage: '72V', communication: 'CAN' }, price: 8000 },
  ];

  // Insert level 1 components
  const level1Stmt = db.prepare(`
    INSERT INTO components (id, type, parentId, level, brand, model, name, specs, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Find parent IDs and insert children
  const batteryParents = db.prepare("SELECT id, brand FROM components WHERE type = 'battery'").all() as any[];
  const pcsParents = db.prepare("SELECT id, brand FROM components WHERE type = 'pcs'").all() as any[];
  const bmsParents = db.prepare("SELECT id, brand FROM components WHERE type = 'bms'").all() as any[];

  // Insert battery module children
  if (batteryParents.length > 0 && batteryClusterModule.length > 0) {
    for (const mod of batteryClusterModule) {
      level1Stmt.run(uuid(), 'module', batteryParents[0].id, 1, mod.brand, mod.model, mod.name, JSON.stringify(mod.specs), mod.price);
    }
  }

  // Insert PCS module children
  if (pcsParents.length > 0 && pcsModule.length > 0) {
    for (const mod of pcsModule) {
      level1Stmt.run(uuid(), 'module', pcsParents[0].id, 1, mod.brand, mod.model, mod.name, JSON.stringify(mod.specs), mod.price);
    }
  }

  // Insert BMS module children
  if (bmsParents.length > 0 && bmsModule.length > 0) {
    for (const mod of bmsModule) {
      level1Stmt.run(uuid(), 'module', bmsParents[0].id, 1, mod.brand, mod.model, mod.name, JSON.stringify(mod.specs), mod.price);
    }
  }

  console.log(`Seeded ${topLevel.length} top-level components + sub-components`);
}

export default db;
