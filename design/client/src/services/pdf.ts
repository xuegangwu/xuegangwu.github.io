import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export interface DesignPDFData {
  name: string;
  description?: string;
  requirements: {
    power?: number;
    capacity?: number;
    scenario?: string;
    voltage?: string;
  };
  components?: Array<{
    name?: string;
    type: string;
    brand?: string;
    model?: string;
    specs?: any;
    price?: number;
    quantity?: number;
  }>;
  // Support 'bom' as alias for 'components'
  bom?: Array<{
    name?: string;
    type: string;
    brand?: string;
    model?: string;
    specs?: any;
    price?: number;
    quantity?: number;
  }>;
  totalCost?: number;
  createdAt?: string;
}

export function generateDesignPDF(design: DesignPDFData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const components = design.components || design.bom || [];

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('储能系统设计方案', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Design name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(design.name, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  const date = design.createdAt ? new Date(design.createdAt).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN');
  doc.text(`生成日期：${date}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Requirements section
  if (design.requirements) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('项目需求', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reqData: string[][] = [];
    if (design.requirements.power) reqData.push(['系统功率', `${design.requirements.power} kW`]);
    if (design.requirements.capacity) reqData.push(['储能容量', `${design.requirements.capacity} kWh`]);
    if (design.requirements.scenario) reqData.push(['应用场景', design.requirements.scenario]);
    if (design.requirements.voltage) reqData.push(['系统电压', design.requirements.voltage]);

    if (reqData.length > 0) {
      doc.autoTable({
        startY: y,
        body: reqData,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' },
        },
        margin: { left: 20, right: 20 },
        tableWidth: 'wrap',
      });
      y = doc.lastAutoTable.finalY + 15;
    }
  }

  // Components section
  if (components.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('设备清单', 20, y);
    y += 8;

    const componentData = components.map((c: any, i: number) => [
      i + 1,
      c.type === 'battery' ? '🔋 电池' :
      c.type === 'pcs' ? '⚡ PCS' :
      c.type === 'bms' ? '📊 BMS' :
      c.type === 'ems' ? '🖥️ EMS' :
      c.type === 'fire' ? '🚨 消防' :
      c.type === 'cabinet' ? '📦 集装箱' : c.type,
      c.brand || '',
      c.model || '',
      `${c.quantity || 0} ${getUnit(c.type)}`,
      c.price ? `¥${c.price.toLocaleString()}` : '-',
    ]);

    doc.autoTable({
      startY: y,
      head: [['#', '类型', '品牌', '型号', '数量', '单价']],
      body: componentData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 37, 36], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
      },
      margin: { left: 20, right: 20 },
    });
    y = doc.lastAutoTable.finalY + 15;
  }

  // Total cost
  if (design.totalCost !== undefined) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`总造价：¥${design.totalCost.toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  doc.text('Solaripple Energy Technology · Design Platform', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

function getUnit(type: string): string {
  switch (type) {
    case 'battery': return '块';
    case 'pcs': return '台';
    case 'bms': return '套';
    case 'ems': return '套';
    case 'fire': return '套';
    case 'cabinet': return '台';
    default: return '个';
  }
}

export function downloadDesignPDF(design: DesignPDFData, filename?: string) {
  const doc = generateDesignPDF(design);
  const name = filename || `${design.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;
  doc.save(name);
}

// Alias for backward compatibility
export const exportDesignToPDF = generateDesignPDF;

export function exportBOMToCSV(design: any): void {
  const headers = ['类型', '品牌', '型号', '数量', '单位', '单价', '小计'];
  const rows = (design.bom || []).map((b: any) => [
    b.type || '',
    b.brand || '',
    b.model || '',
    b.quantity || 0,
    getUnit(b.type),
    b.price || 0,
    (b.price || 0) * (b.quantity || 0),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(design.name || 'design').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
