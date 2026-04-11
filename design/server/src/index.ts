import express from 'express';
import { Configuration, MoonshotAPI } from './moonshot.js';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3013;

app.use(cors());
app.use(express.json());

// ── Components API ────────────────────────────────────────────────────────────

// GET /api/components - List all components (with optional filters)
app.get('/api/components', (req, res) => {
  const { type, brand, search } = req.query;
  let sql = 'SELECT * FROM components WHERE 1=1';
  const params: string[] = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type as string);
  }
  if (brand) {
    sql += ' AND brand = ?';
    params.push(brand as string);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR brand LIKE ? OR model LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ' ORDER BY type, brand, model';
  const rows = db.prepare(sql).all(...params);
  const components = rows.map((row: any) => ({
    ...row,
    specs: JSON.parse(row.specs),
  }));
  res.json({ success: true, data: components });
});

// GET /api/components/types - Get all component types with counts
app.get('/api/components/types', (req, res) => {
  const rows = db.prepare('SELECT type, COUNT(*) as count FROM components GROUP BY type ORDER BY type').all();
  const typeMap: Record<string, string> = {
    battery: '电池簇',
    pcs: '储能变流器PCS',
    bms: '电池管理系统BMS',
    ems: '能量管理系统EMS',
    fire: '消防系统',
    cabinet: '储能集装箱/柜',
  };
  const data = rows.map((r: any) => ({
    type: r.type,
    label: typeMap[r.type] || r.type,
    count: r.count,
  }));
  res.json({ success: true, data });
});

// GET /api/components/brands - Get all brands for a type
app.get('/api/components/brands', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT DISTINCT brand FROM components WHERE parentId IS NULL';
  const params: string[] = [];
  if (type) {
    sql += ' AND type = ?';
    params.push(type as string);
  }
  sql += ' ORDER BY brand';
  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows.map((r: any) => r.brand) });
});

// GET /api/components/hierarchical - Get components with sub-components
app.get('/api/components/hierarchical', (req, res) => {
  const { type } = req.query;
  
  // Get all top-level components (parentId is null)
  let sql = 'SELECT * FROM components WHERE parentId IS NULL';
  const params: string[] = [];
  if (type) {
    sql += ' AND type = ?';
    params.push(type as string);
  }
  sql += ' ORDER BY type, brand, model';
  const topLevel = db.prepare(sql).all(...params) as any[];
  
  // Get all sub-components
  const allChildren = db.prepare('SELECT * FROM components WHERE parentId IS NOT NULL ORDER BY type, brand, model').all() as any[];
  
  // Build tree structure
  const childrenMap = new Map<string, any[]>();
  for (const child of allChildren) {
    if (!childrenMap.has(child.parentId)) {
      childrenMap.set(child.parentId, []);
    }
    childrenMap.get(child.parentId)!.push({
      ...child,
      specs: JSON.parse(child.specs),
    });
  }
  
  const tree = topLevel.map(comp => ({
    ...comp,
    specs: JSON.parse(comp.specs),
    children: childrenMap.get(comp.id) || [],
  }));
  
  res.json({ success: true, data: tree });
});

// GET /api/components/:id - must be LAST (after /api/components/types and /api/components/brands and /api/components/hierarchical)
app.get('/api/components/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM components WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ success: false, error: 'Not found' });
  
  // Get children
  const children = db.prepare('SELECT * FROM components WHERE parentId = ?').all(req.params.id) as any[];
  
  res.json({ 
    success: true, 
    data: {
      ...row,
      specs: JSON.parse(row.specs),
      children: children.map(c => ({ ...c, specs: JSON.parse(c.specs) })),
    },
  });
});
app.get('/api/components/brands', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT DISTINCT brand FROM components';
  const params: string[] = [];
  if (type) {
    sql += ' WHERE type = ?';
    params.push(type as string);
  }
  sql += ' ORDER BY brand';
  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows.map((r: any) => r.brand) });
});

// ── Designs API ─────────────────────────────────────────────────────────────

// GET /api/designs - List all designs
app.get('/api/designs', (req, res) => {
  const rows = db.prepare('SELECT * FROM designs ORDER BY updatedAt DESC').all() as any[];
  const designs = rows.map(r => ({
    ...r,
    requirements: JSON.parse(r.requirements),
    components: JSON.parse(r.components),
    bom: JSON.parse(r.bom),
  }));
  res.json({ success: true, data: designs });
});

// GET /api/designs/:id
app.get('/api/designs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({
    success: true,
    data: {
      ...row,
      requirements: JSON.parse(row.requirements),
      components: JSON.parse(row.components),
      bom: JSON.parse(row.bom),
    },
  });
});

// POST /api/designs - Create new design
app.post('/api/designs', (req, res) => {
  const { name, description, requirements, components, bom, totalCost, aiSuggestion } = req.body;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO designs (id, name, description, requirements, components, bom, totalCost, aiSuggestion, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name || '未命名设计方案',
    description || '',
    JSON.stringify(requirements),
    JSON.stringify(components || []),
    JSON.stringify(bom || []),
    totalCost || 0,
    aiSuggestion || '',
    now,
    now
  );

  const row = db.prepare('SELECT * FROM designs WHERE id = ?').get(id) as any;
  res.json({
    success: true,
    data: {
      ...row,
      requirements: JSON.parse(row.requirements),
      components: JSON.parse(row.components),
      bom: JSON.parse(row.bom),
    },
  });
});

// PUT /api/designs/:id - Update design
app.put('/api/designs/:id', (req, res) => {
  const { name, description, requirements, components, bom, totalCost, aiSuggestion, status } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE designs SET name=?, description=?, requirements=?, components=?, bom=?, totalCost=?, aiSuggestion=?, status=?, updatedAt=?
    WHERE id=?
  `).run(
    name,
    description || '',
    JSON.stringify(requirements),
    JSON.stringify(components || []),
    JSON.stringify(bom || []),
    totalCost || 0,
    aiSuggestion || '',
    status || 'draft',
    now,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id) as any;
  res.json({
    success: true,
    data: {
      ...row,
      requirements: JSON.parse(row.requirements),
      components: JSON.parse(row.components),
      bom: JSON.parse(row.bom),
    },
  });
});

// DELETE /api/designs/:id
app.delete('/api/designs/:id', (req, res) => {
  db.prepare('DELETE FROM designs WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM component_history WHERE designId = ?').run(req.params.id);
  res.json({ success: true });
});

// ── AI Assistant API ─────────────────────────────────────────────────────────

// POST /api/ai/suggest - AI component recommendation
app.post('/api/ai/suggest', async (req, res) => {
  const { power, capacity, scenario, voltage } = req.body;

  // Simple rule-based recommendation (in production, integrate with LLM API)
  const recommendations = suggestComponents({ power, capacity, scenario, voltage });

  // Calculate BOM
  const bom = calculateBOM(recommendations);

  res.json({
    success: true,
    data: {
      recommendations,
      bom,
      totalCost: bom.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
    },
  });
});

// POST /api/ai/chat - Chat with AI about design
// POST /api/ai/chat - Chat with AI about design
app.post('/api/ai/chat', async (req, res) => {
  const { message, designId } = req.body;

  try {
    const response = await generateAIResponse(message, designId);
    res.json({ success: true, data: { response } });
  } catch (error: any) {
    console.error('AI Chat Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  const components = db.prepare('SELECT COUNT(*) as c FROM components').get() as { c: number };
  const designs = db.prepare('SELECT COUNT(*) as c FROM designs').get() as { c: number };
  res.json({
    success: true,
    data: {
      status: 'online',
      components: components.c,
      designs: designs.c,
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Helper Functions ─────────────────────────────────────────────────────────

function suggestComponents(req: { power?: number; capacity?: number; scenario?: string; voltage?: string }) {
  const { power = 100, capacity = 1000, scenario = '工商业', voltage = '800V' } = req;
  const suggestions: any[] = [];

  // Battery suggestion based on capacity
  const batteryCount = Math.ceil(capacity / 200); // 200kWh per battery cluster
  const battery = db.prepare('SELECT * FROM components WHERE type = ? ORDER BY price ASC LIMIT 1').get('battery') as any;
  if (battery) {
    suggestions.push({
      componentId: battery.id,
      type: 'battery',
      brand: battery.brand,
      model: battery.model,
      name: battery.name,
      quantity: batteryCount,
      unitPrice: battery.price,
      specs: JSON.parse(battery.specs),
      reason: `根据容量需求${capacity}kWh，配置${batteryCount}簇`,
    });
  }

  // PCS suggestion based on power
  const pcsCount = Math.ceil(power / 100); // 100kW per PCS
  const pcs = db.prepare('SELECT * FROM components WHERE type = ? ORDER BY price ASC LIMIT 1').get('pcs') as any;
  if (pcs) {
    suggestions.push({
      componentId: pcs.id,
      type: 'pcs',
      brand: pcs.brand,
      model: pcs.model,
      name: pcs.name,
      quantity: pcsCount,
      unitPrice: pcs.price,
      specs: JSON.parse(pcs.specs),
      reason: `根据功率需求${power}kW，配置${pcsCount}台${pcs.brand} PCS`,
    });
  }

  // BMS
  const bms = db.prepare('SELECT * FROM components WHERE type = ? ORDER BY price ASC LIMIT 1').get('bms') as any;
  if (bms) {
    suggestions.push({
      componentId: bms.id,
      type: 'bms',
      brand: bms.brand,
      model: bms.model,
      name: bms.name,
      quantity: batteryCount,
      unitPrice: bms.price,
      specs: JSON.parse(bms.specs),
      reason: `配套${batteryCount}簇电池的系统管理`,
    });
  }

  // EMS
  const ems = db.prepare('SELECT * FROM components WHERE type = ? ORDER BY price ASC LIMIT 1').get('ems') as any;
  if (ems) {
    suggestions.push({
      componentId: ems.id,
      type: 'ems',
      brand: ems.brand,
      model: ems.model,
      name: ems.name,
      quantity: 1,
      unitPrice: ems.price,
      specs: JSON.parse(ems.specs),
      reason: `场站级能量管理${scenario}场景`,
    });
  }

  // Fire protection
  const fire = db.prepare('SELECT * FROM components WHERE type = ? ORDER BY price ASC LIMIT 1').get('fire') as any;
  if (fire) {
    suggestions.push({
      componentId: fire.id,
      type: 'fire',
      brand: fire.brand,
      model: fire.model,
      name: fire.name,
      quantity: 1,
      unitPrice: fire.price,
      specs: JSON.parse(fire.specs),
      reason: `储能系统消防安全`,
    });
  }

  // Cabinet
  const cabinetCount = Math.ceil(capacity / 2500); // 2.5MWh per cabinet
  const cabinet = db.prepare('SELECT * FROM components WHERE type = ? ORDER BY price ASC LIMIT 1').get('cabinet') as any;
  if (cabinet) {
    suggestions.push({
      componentId: cabinet.id,
      type: 'cabinet',
      brand: cabinet.brand,
      model: cabinet.model,
      name: cabinet.name,
      quantity: cabinetCount,
      unitPrice: cabinet.price,
      specs: JSON.parse(cabinet.specs),
      reason: `容纳${batteryCount}簇电池的设备空间`,
    });
  }

  return suggestions;
}

function calculateBOM(suggestions: any[]) {
  return suggestions.map((s: any) => ({
    componentId: s.componentId,
    type: s.type,
    brand: s.brand,
    model: s.model,
    name: s.name,
    quantity: s.quantity,
    unitPrice: s.unitPrice,
    totalPrice: s.quantity * s.unitPrice,
    specs: s.specs,
  }));
}

async function generateAIResponse(message: string, designId?: string) {
  // Mock AI response - in production, call OpenAI/Claude API
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('推荐') || lowerMsg.includes('配置') || lowerMsg.includes('选型')) {
    return '根据您的需求，我建议配置：\n\n1. **电池簇**：宁德时代280Ah × 5簇 = 1400kWh\n2. **PCS**：阳光电源125kW × 2台 = 250kW\n3. **BMS**：宁德时代BMS-2000S × 5套\n4. **EMS**：远景能源ENOS-EMS\n5. **消防**：国安达PACK级消防系统\n6. **集装箱**：华为20尺储能集装箱 × 1套\n\n总成本估算：约 185万元\n\n您可以点击「应用推荐」直接生成设计方案，或调整参数重新计算。';
  }

  if (lowerMsg.includes('成本') || lowerMsg.includes('价格') || lowerMsg.includes('预算')) {
    return '工商业储能系统成本构成参考：\n\n- 电池簇：占整体成本 50-60%（约 0.6-0.8元/Wh）\n- PCS：占 10-15%（约 0.4-0.5元/W）\n- BMS + EMS：占 8-12%\n- 消防系统：占 3-5%\n- 集装箱/机柜：占 8-12%\n- 线缆/配电：占 5-8%\n\n以1MW/2MWh系统为例，的整体造价约 120-150万元，具体取决于品牌选择。';
  }

  if (lowerMsg.includes('效率') || lowerMsg.includes('损耗')) {
    return '储能系统效率主要受以下因素影响：\n\n1. **电池效率**：LFP电池充放电效率约 95-98%\n2. **PCS效率**：主流产品效率 98-99%\n3. **系统综合效率**：约 85-92%（含辅助负荷）\n\n建议选型时关注：\n- PCS效率曲线（满载/半载效率）\n- 电池自放电率（每月<3%）\n- 热管理系统能耗';
  }

  return '我理解您的问题。对于工商业储能设计，我可以帮助您：\n\n1. **组件选型**：根据功率/容量需求推荐最佳配置\n2. **成本估算**：提供详细成本构成分析\n3. **技术咨询**：解答电池、PCS、BMS等技术问题\n\n请告诉我您的具体需求（如功率kW、容量kWh、应用场景）';
}

app.listen(PORT, () => {
  console.log(`Design server running on port ${PORT}`);
});
