// Moonshot AI (Kimi) API client
const apiKey = process.env.KIMI_API_KEY;
const baseURL = 'https://api.moonshot.cn/v1';
const model = 'moonshot-v1-8k';

export const Configuration = {};
export const MoonshotAPI = {};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not configured');
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function generateAIResponse(message: string, designId?: string): Promise<string> {
  // Get all components for context
  const components = db.prepare('SELECT * FROM components').all() as any[];
  
  // Build component context
  const componentContext = components.map((c: any) => {
    const specs = JSON.parse(c.specs);
    const specStr = Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ');
    return `${c.type} | ${c.brand} | ${c.model} | ${c.name} | 价格: ¥${c.price} | 规格: ${specStr}`;
  }).join('\n');

  const systemPrompt = `你是储能系统设计专家，帮助用户设计和选型工商业储能系统。
  
现有组件库：
${componentContext}

每次回复请：
1. 根据用户需求推荐最佳组件配置
2. 解释为什么选择这些组件
3. 给出大致的成本估算
4. 如果需要更多信息才能推荐，请询问用户

保持回复简洁专业，控制在500字以内。`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ];

  return await chat(messages);
}

// Import db for use in generateAIResponse
import db from './db.js';
