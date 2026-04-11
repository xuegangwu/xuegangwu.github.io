import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

interface DesignData {
  name: string;
  requirements: {
    power?: number;
    capacity?: number;
    scenario?: string;
    voltage?: string;
  };
  bom: BOMItem[];
  totalCost: number;
}

const typeLabels: Record<string, string> = {
  battery: '电池簇',
  pcs: '储能变流器PCS',
  bms: '电池管理系统BMS',
  ems: '能量管理系统EMS',
  fire: '消防系统',
  cabinet: '储能集装箱/柜',
};

export function exportDesignToPDF(design: DesignData) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 77, 64);
  doc.text('储能系统设计方案', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`方案名称: ${design.name}`, 20, 35);
  doc.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 20, 42);

  // Requirements
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('系统需求', 20, 55);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const req = design.requirements;
  doc.text(`系统功率: ${req.power || '-'} kW`, 25, 63);
  doc.text(`储能容量: ${req.capacity || '-'} kWh`, 25, 70);
  doc.text(`应用场景: ${req.scenario || '-'}`, 25, 77);
  doc.text(`电压等级: ${req.voltage || '-'}`, 25, 84);

  // BOM Table
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('物料清单 (BOM)', 20, 98);

  const tableData = design.bom.map(item => [
    typeLabels[item.type] || item.type,
    item.brand,
    item.model,
    item.quantity.toString(),
    `¥${item.unitPrice.toLocaleString()}`,
    `¥${item.totalPrice.toLocaleString()}`,
  ]);

  (doc as any).autoTable({
    startY: 103,
    head: [['类型', '品牌', '型号', '数量', '单价', '小计']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 77, 64],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  // Total Cost
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setTextColor(245, 38, 38);
  doc.text(`预估总成本: ¥${design.totalCost.toLocaleString()}`, 105, finalY, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('本方案仅供参考，实际价格以报价为准。', 105, 285, { align: 'center' });
  doc.text('Solaripple Energy Technology · design.solaripple.com', 105, 290, { align: 'center' });

  // Save
  doc.save(`储能方案_${design.name}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBOMToCSV(design: DesignData) {
  const headers = ['类型', '品牌', '型号', '名称', '数量', '单价', '小计'];
  const rows = design.bom.map(item => [
    typeLabels[item.type] || item.type,
    item.brand,
    item.model,
    item.name,
    item.quantity.toString(),
    item.unitPrice.toString(),
    item.totalPrice.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    '',
    `,,,总计,¥${design.totalCost.toLocaleString()}`,
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `储能BOM_${design.name}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
