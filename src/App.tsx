import React, { useState, useRef, useEffect } from 'react';
import { Settings, Edit3, Copy, RotateCcw, LayoutTemplate, Check, Image as ImageIcon, UploadCloud, Loader2, Download, FileText } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const DEFAULT_CONTENT = `# 数字时代的阅读美学
### The Aesthetics of Reading in the Digital Age
#### 作者：前端设计专家 • 2026年4月6日

在信息爆炸的今天，如何让读者在屏幕前获得沉浸式的阅读体验，成为了网页设计的核心课题。这不仅仅是关于排版，更是关于*情感的传递*。

## Typography & Layout
优秀的排版能够引导读者的视线，减轻视觉疲劳。我们通过精心挑选的字体组合，构建了一个层次分明的阅读空间。

> "我现在的任务是什么？"
> "我已经做了哪几步？"
> "这一步结果怎样？"
> "下一步怎么办？"

---

在这个设计规范中，我们特别定义了以下几个**核心元素**：

- **深色沉浸背景**：减少环境光干扰，聚焦于白色卡片。
- **多层次阴影**：赋予卡片物理世界的真实感与悬浮感。
- <mark>高亮标记</mark>：用于突出文章中最核心的观点，吸引眼球。
- **行内代码**：英文更省，\`running\` 是 1 个 token，但 \`unbelievable\` 会被切成 \`un / believ / able\` 三块。

## Code Integration
对于技术类文章，优雅的代码展示同样重要。我们选择了专为开发者设计的字体，并配合柔和的背景色。更多设计灵感可以参考 [Google Fonts](https://fonts.google.com)。

\`\`\`javascript
// 示例：一个简单的阅读时间计算器
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

console.log(\`预计阅读时间：\${calculateReadingTime(article)} 分钟\`);
\`\`\`

希望这套排版规范能为你的内容创作带来新的灵感。请提供你需要排版的具体文章内容，我将为你生成完美的页面。`;

const DEFAULT_STYLES = {
  bgGrad1: '#1e1e2e',
  bgGrad2: '#2d2b55',
  bgGrad3: '#3e3a5f',
  bgTexture: 'none',
  cardBg: '#ffffff',
  cardTexture: 'none',
  textureOpacity: 1,
  cardWidth: 600,
  cardHeight: 1000,
  cardRadius: 12,
  contentPadding: 50,
  bodyFontSize: 24,
  bodyLineHeight: 1.8,
  bodyColor: '#333333',
  h1Size: 48,
  h1Color: '#000000',
  h2Size: 26,
  h2Color: '#000000',
  enTitleSize: 20,
  enTitleColor: '#888888',
  metaSize: 14,
  metaColor: '#888888',
  linkColor: '#4a9eff',
  markBg: '#fff59d',
  markBorder: '#ff9800',
  hrColor: '#888888',
  hrThickness: 1,
  hrStyle: 'solid',
  hrOpacity: 0.3,
  codeColor: '#c27b65',
  codeBg: '#fcf3f0',
  hideScrollbar: false,
  fontBody: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontHeading: '"Noto Serif SC", serif',
  fontEnTitle: '"Inter", sans-serif',
  fontCode: '"JetBrains Mono", monospace',
  customH1Css: '',
  customH2Css: ''
};

const PRESET_THEMES = [
  {
    name: '✨ 星光紫 (默认)',
    styles: {
      bgGrad1: '#1e1e2e', bgGrad2: '#2d2b55', bgGrad3: '#3e3a5f',
      cardBg: '#ffffff', textureOpacity: 1, bodyColor: '#333333', h1Color: '#000000', h2Color: '#000000',
      enTitleColor: '#888888', metaColor: '#888888', linkColor: '#4a9eff',
      markBg: '#fff59d', markBorder: '#ff9800', hrColor: '#888888',
      codeColor: '#c27b65', codeBg: '#fcf3f0'
    },
    coverStyles: { bg: '#2d2b55', title: '#ffffff', text: '#e2e8f0', accent: '#4a9eff' }
  },
  {
    name: '☁️ 极简白',
    styles: {
      bgGrad1: '#f5f5f7', bgGrad2: '#eeeeee', bgGrad3: '#e0e0e0',
      cardBg: '#ffffff', bodyColor: '#1d1d1f', h1Color: '#000000', h2Color: '#1d1d1f',
      enTitleColor: '#86868b', metaColor: '#86868b', linkColor: '#0066cc',
      markBg: '#fef08a', markBorder: '#facc15', hrColor: '#d2d2d7',
      codeColor: '#ff3b30', codeBg: '#f5f5f7'
    },
    coverStyles: { bg: '#f5f5f7', title: '#000000', text: '#1d1d1f', accent: '#0066cc' }
  },
  {
    name: '☕ 莫兰迪',
    styles: {
      bgGrad1: '#e8ecea', bgGrad2: '#d8e0e0', bgGrad3: '#c8cfd1',
      cardBg: '#faf9f7', bodyColor: '#48525c', h1Color: '#2b333e', h2Color: '#3d4551',
      enTitleColor: '#8d98a0', metaColor: '#8d98a0', linkColor: '#a97b66',
      markBg: '#e6ded3', markBorder: '#c3b19b', hrColor: '#d4d8db',
      codeColor: '#8c6052', codeBg: '#f2eee9'
    },
    coverStyles: { bg: '#d8e0e0', title: '#2b333e', text: '#48525c', accent: '#a97b66' }
  },
  {
    name: '🌌 深邃夜空',
    styles: {
      bgGrad1: '#0f172a', bgGrad2: '#1e293b', bgGrad3: '#0f172a',
      cardBg: '#1e293b', textureOpacity: 1, bodyColor: '#f8fafc', h1Color: '#ffffff', h2Color: '#f1f5f9',
      enTitleColor: '#94a3b8', metaColor: '#64748b', linkColor: '#38bdf8',
      markBg: '#fef08a', markBorder: '#eab308', hrColor: '#475569',
      codeColor: '#7dd3fc', codeBg: '#0f172a'
    },
    coverStyles: { bg: '#0f172a', title: '#ffffff', text: '#f8fafc', accent: '#38bdf8' }
  },
  {
    name: '📜 复古牛皮',
    styles: {
      bgGrad1: '#dfd1bb', bgGrad2: '#d1c1a9', bgGrad3: '#c1b199',
      cardBg: '#f4ebd8', bodyColor: '#4a3b2c', h1Color: '#2b1c11', h2Color: '#382515',
      enTitleColor: '#8c7a65', metaColor: '#8c7a65', linkColor: '#ab6545',
      markBg: '#e6d3ba', markBorder: '#c2a784', hrColor: '#c7bcae',
      codeColor: '#b05e3f', codeBg: '#eae1d1'
    },
    coverStyles: { bg: '#dfd1bb', title: '#2b1c11', text: '#4a3b2c', accent: '#ab6545' }
  },
  {
    name: '🥑 清新薄荷',
    styles: {
      bgGrad1: '#e0f2fe', bgGrad2: '#bae6fd', bgGrad3: '#7dd3fc',
      cardBg: '#ffffff', bodyColor: '#0f172a', h1Color: '#0369a1', h2Color: '#075985',
      enTitleColor: '#38bdf8', metaColor: '#7dd3fc', linkColor: '#0284c7',
      markBg: '#bbf7d0', markBorder: '#22c55e', hrColor: '#e0f2fe',
      codeColor: '#0f766e', codeBg: '#f0fdf4'
    },
    coverStyles: { bg: '#e0f2fe', title: '#0369a1', text: '#0f172a', accent: '#0284c7' }
  }
];

const SliderControl = ({ label, value, min, max, step = 1, onChange, unit = '' }: any) => (
  <div className="mb-5">
    <div className="flex justify-between mb-2 items-center">
      <label className="text-sm font-medium text-white/90">{label}</label>
      <span className="text-xs font-medium text-white/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="glass-slider"
    />
  </div>
);

const ColorControl = ({ label, value, onChange }: any) => (
  <div className="mb-4 flex items-center justify-between glass-panel p-3 rounded-2xl hover:bg-white/20 transition-colors">
    <label className="text-sm font-medium text-white/90">{label}</label>
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/80 uppercase font-mono bg-white/10 px-2 py-1 rounded-lg border border-white/20 shadow-sm">{value}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-color-picker"
      />
    </div>
  </div>
);

const ToggleControl = ({ label, value, onChange }: any) => (
  <div className="mb-4 flex items-center justify-between glass-panel p-3 rounded-2xl hover:bg-white/20 transition-colors">
    <label className="text-sm font-medium text-white/90">{label}</label>
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-indigo-500' : 'bg-white/20'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  </div>
);

const SelectControl = ({ label, value, options, onChange }: any) => (
  <div className="mb-4 flex items-center justify-between glass-panel p-3 rounded-2xl hover:bg-white/20 transition-colors">
    <label className="text-sm font-medium text-white/90">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-black/20 border border-white/20 text-white/90 text-sm rounded-lg focus:ring-white/50 focus:border-white/50 block p-1.5 backdrop-blur-sm outline-none cursor-pointer"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">{opt.label}</option>
      ))}
    </select>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'style' | 'theme'>('theme');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [copied, setCopied] = useState(false);

  // API Key management
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(() => !localStorage.getItem('gemini_api_key'));
  const [apiKeyInput, setApiKeyInput] = useState('');

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed.startsWith('AIza')) {
      alert('请输入有效的 Gemini API Key（以 AIza 开头）');
      return;
    }
    localStorage.setItem('gemini_api_key', trimmed);
    setApiKey(trimmed);
    setShowApiKeyModal(false);
  };

  const getApiKey = () => {
    const key = localStorage.getItem('gemini_api_key') || apiKey;
    if (!key) {
      setShowApiKeyModal(true);
      return null;
    }
    return key;
  };
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appMode, setAppMode] = useState<'article' | 'cover'>('article');
  const [styleOptions, setStyleOptions] = useState({ colors: true, fonts: true, paper: true });
  const [savedThemes, setSavedThemes] = useState<{id: string, name: string, styles: any}[]>(() => {
    try {
      const saved = localStorage.getItem('myThemes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [themeNameInput, setThemeNameInput] = useState('');
  const [coverContent, setCoverContent] = useState('# 封面大标题\n这里是封面的副标题或简介内容');
  const [coverHtml, setCoverHtml] = useState('<div class="default-cover"><h1>封面大标题</h1><p>这里是封面的副标题或简介内容</p></div>');
  const [coverCss, setCoverCss] = useState(`
.default-cover {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: sans-serif;
}
.default-cover h1 {
  font-size: var(--title-size);
  margin-bottom: 20px;
  font-weight: bold;
}
.default-cover p {
  font-size: calc(var(--title-size) * 0.4);
  opacity: 0.8;
}
  `);
  const [coverVars, setCoverVars] = useState<Record<string, any>>({
    '--bg-color': { type: 'color', value: '#2d2b55', label: '背景颜色' },
    '--text-color': { type: 'color', value: '#ffffff', label: '文字颜色' },
    '--title-size': { type: 'number', value: 64, unit: 'px', label: '标题字号' }
  });
  const [coverFont, setCoverFont] = useState<string>("system-ui, sans-serif");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverPreviewImage, setCoverPreviewImage] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverThemeFileInputRef = useRef<HTMLInputElement>(null);
  const coverPreviewRef = useRef<HTMLDivElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const clickedImageRef = useRef<HTMLElement | null>(null);
  const dragInfo = useRef<{
    isMouseDown: boolean;
    isDragging: boolean;
    target: HTMLElement | null;
    startX: number;
    startY: number;
    initialTransform: string;
    initialX: number;
    initialY: number;
    initialScale: number;
  }>({
    isMouseDown: false,
    isDragging: false,
    target: null,
    startX: 0,
    startY: 0,
    initialTransform: '',
    initialX: 0,
    initialY: 0,
    initialScale: 1
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo.current.isMouseDown || !dragInfo.current.target) return;

      const dx = e.clientX - dragInfo.current.startX;
      const dy = e.clientY - dragInfo.current.startY;

      if (!dragInfo.current.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragInfo.current.isDragging = true;
      }

      if (dragInfo.current.isDragging) {
        if (e.shiftKey) {
          // Resize mode
          const scaleDelta = (dx - dy) * 0.005; // -dy so moving up increases size
          const newScale = Math.max(0.1, dragInfo.current.initialScale + scaleDelta);
          
          dragInfo.current.target.setAttribute('data-scale', newScale.toString());
          
          const x = dragInfo.current.initialX;
          const y = dragInfo.current.initialY;
          dragInfo.current.target.style.transform = `${dragInfo.current.initialTransform} translate(${x}px, ${y}px) scale(${newScale})`.trim();
        } else {
          // Move mode
          const newX = dragInfo.current.initialX + dx;
          const newY = dragInfo.current.initialY + dy;

          dragInfo.current.target.setAttribute('data-x', newX.toString());
          dragInfo.current.target.setAttribute('data-y', newY.toString());
          
          const scale = dragInfo.current.target.getAttribute('data-scale') || '1';
          dragInfo.current.target.style.transform = `${dragInfo.current.initialTransform} translate(${newX}px, ${newY}px) scale(${scale})`.trim();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragInfo.current.isDragging && dragInfo.current.target) {
        if (coverPreviewRef.current) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          const stuckElements = coverPreviewRef.current.querySelectorAll('[contenteditable="true"]');
          stuckElements.forEach((el) => {
            const h = el as HTMLElement;
            h.removeAttribute('contenteditable');
            h.style.removeProperty('outline');
            h.style.removeProperty('outline-offset');
            if (h.getAttribute('style') === '') h.removeAttribute('style');
          });
          setCoverHtml(coverPreviewRef.current.innerHTML);
        }
        const preventClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
          window.removeEventListener('click', preventClick, true);
        };
        window.addEventListener('click', preventClick, true);
        setTimeout(() => window.removeEventListener('click', preventClick, true), 0);
      }
      dragInfo.current.isMouseDown = false;
      dragInfo.current.isDragging = false;
      dragInfo.current.target = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [appMode]);

  useEffect(() => {
    const fontsToLoad = [styles.fontBody, styles.fontHeading, styles.fontEnTitle, styles.fontCode]
      .map(f => f?.split(',')[0].replace(/['"]/g, '').trim())
      .filter(f => f && !['sans-serif', 'serif', 'monospace', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Times New Roman', 'Times', 'Courier New', 'Courier', 'Microsoft YaHei', 'PingFang SC', 'SimHei', 'KaiTi', 'STKaiti', 'SimSun', 'STSong'].includes(f));
    
    if (fontsToLoad.length > 0) {
      // Deduplicate fonts
      const uniqueFonts = Array.from(new Set(fontsToLoad));
      const fontUrl = `https://fonts.googleapis.com/css2?${uniqueFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;700`).join('&')}&display=swap`;
      
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      return () => { 
        if (document.head.contains(link)) {
          document.head.removeChild(link); 
        }
      };
    }
  }, [styles.fontBody, styles.fontHeading, styles.fontEnTitle, styles.fontCode]);

  useEffect(() => {
    const fontName = coverFont.split(',')[0].replace(/['"]/g, '').trim();
    if (['Zhi Mang Xing', 'Ma Shan Zheng', 'Long Cang', 'Noto Serif SC'].includes(fontName)) {
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [coverFont]);

  const handleStyleChange = (key: keyof typeof DEFAULT_STYLES, value: any) => {
    setStyles(prev => ({ ...prev, [key]: value }));
  };

  const resetStyles = () => {
    if(confirm('确定要重置所有样式到默认值吗？')) {
      setStyles(DEFAULT_STYLES);
      setPreviewImage(null);
    }
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveCurrentTheme = () => {
    if (!themeNameInput.trim()) return;
    const newTheme = { id: Date.now().toString(), name: themeNameInput, styles: { ...styles } };
    const updatedThemes = [...savedThemes, newTheme];
    setSavedThemes(updatedThemes);
    localStorage.setItem('myThemes', JSON.stringify(updatedThemes));
    setThemeNameInput('');
  };

  const applyTheme = (theme: any) => {
    // Determine if we were passed a full theme object or just styles
    const stylesToApply = theme.styles ? theme.styles : theme;
    setStyles(prev => ({ ...prev, ...stylesToApply }));
    
    if (theme.coverStyles) {
      setCoverVars(prev => {
        const newVars = { ...prev };
        Object.keys(newVars).forEach(key => {
          if (newVars[key].type === 'color') {
            const keyLower = key.toLowerCase();
            const label = newVars[key].label || '';
            
            if (keyLower.includes('bg') || keyLower.includes('background') || label.includes('背景') || keyLower.includes('card')) {
              newVars[key].value = theme.coverStyles.bg;
            } else if (keyLower.includes('text') || keyLower.includes('body') || keyLower.includes('copy') || label.includes('文字') || label.includes('正文')) {
              newVars[key].value = theme.coverStyles.text;
            } else if (keyLower.includes('title') || keyLower.includes('head') || label.includes('标题')) {
              newVars[key].value = theme.coverStyles.title;
            } else {
              newVars[key].value = theme.coverStyles.accent;
            }
          }
        });
        return newVars;
      });
    }
  };
  
  const deleteTheme = (id: string) => {
    const updated = savedThemes.filter(t => t.id !== id);
    setSavedThemes(updated);
    localStorage.setItem('myThemes', JSON.stringify(updated));
  };

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    const extractKeys: string[] = [];
    if (styleOptions.colors) {
       extractKeys.push('bodyColor', 'h1Color', 'h2Color', 'enTitleColor', 'metaColor', 'linkColor', 'markBg', 'markBorder', 'hrColor', 'codeColor', 'codeBg');
    }
    if (styleOptions.paper) {
       extractKeys.push('cardBg', 'cardTexture');
    }
    if (styleOptions.fonts) {
       extractKeys.push('fontBody', 'fontHeading', 'fontEnTitle', 'fontCode', 'customH1Css', 'customH2Css');
    }

    if (extractKeys.length === 0) {
      alert('请至少选择一项提取内容（配色、字体或纸张）');
      return;
    }

    setIsExtracting(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        const base64Data = base64String.split(',')[1];

        const resolvedKey = getApiKey();
        if (!resolvedKey) return;
        const ai = new GoogleGenAI({ apiKey: resolvedKey });
        
        const properties: any = {};
        extractKeys.forEach(key => {
          properties[key] = { type: Type.STRING };
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { inlineData: { data: base64Data, mimeType: file.type } },
            `Analyze this image and extract the requested styling information. Map the extracted styles to the following JSON keys: ${JSON.stringify(extractKeys)}. 
            
            Key definitions:
            - bodyColor, h1Color, h2Color, enTitleColor, metaColor, linkColor, markBg, markBorder, hrColor, codeColor, codeBg: Text and element colors. Use hex codes.
            - cardBg: The background color of the main content paper. Use hex code.
            - cardTexture: The background CSS of the content paper. ONLY return '[UPLOADED_IMAGE]' if the uploaded image is a PURE texture/background pattern without ANY content, text, or focal objects. If the reference image has content but the "paper" area has a textured/grainy/rough paper look, return the exact string 'PAPER_NOISE'. If it's a smooth gradient, return a CSS gradient. 
            - fontBody, fontHeading, fontEnTitle, fontCode: Extract and match the font families used in the image. For Chinese text, you MUST select the closest visual match from these available Google Fonts to ensure it renders correctly: Sans-serif -> "'Noto Sans SC', sans-serif"; Classic Serif -> "'Noto Serif SC', serif"; KaiTi (楷体)/Calligraphy/Warm Handwriting -> "'LXGW WenKai TC', 'KaiTi', serif"; Cursive/Brush -> "'Zhi Mang Xing', cursive" or "'Ma Shan Zheng', cursive"; Artistic/Display -> "'ZCOOL XiaoWei', serif", "'ZCOOL QingKe HuangYou', display". For English texts, use standard Google Fonts like "'Inter', sans-serif". Return proper CSS font-family strings.
            - customH1Css, customH2Css: If the reference image's primary and secondary headings have specific decorative styles (like background colors, strokes, underlines, border-bottom, text-shadow, padding), return raw CSS string to apply ONLY to the text. Provide empty string if no special decoration is needed.
            
            Return ONLY a JSON object where keys are the requested variable names and values are the extracted styles.`
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: properties,
              required: extractKeys
            }
          }
        });

        if (response.text) {
          const extractedStyles = JSON.parse(response.text);
          if (extractedStyles.bgTexture === '[UPLOADED_IMAGE]') {
            extractedStyles.bgTexture = `url(${base64String}) center/cover no-repeat`;
          }
          if (extractedStyles.cardTexture === '[UPLOADED_IMAGE]') {
            extractedStyles.cardTexture = `url(${base64String})`;
          }
          
          const paperNoise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;
          if (extractedStyles.cardTexture === 'PAPER_NOISE') {
             extractedStyles.cardTexture = paperNoise;
          }
          if (extractedStyles.bgTexture === 'PAPER_NOISE') {
             extractedStyles.bgTexture = paperNoise;
          }

          setStyles(prev => ({ ...prev, ...extractedStyles }));
        }
      } catch (e: any) {
        console.error(e);
        if (e.message && e.message.includes('429')) {
          alert('API 额度已耗尽 (Quota Exceeded)。请稍后再试，或检查您的 API 密钥额度。');
        } else {
          alert(`提取风格失败: ${e.message || '未知错误'}，请重试`);
        }
      } finally {
        setIsExtracting(false);
      }
    };
  };

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && clickedImageRef.current && coverPreviewRef.current) {
      const reader = new FileReader();
      reader.onload = () => {
        if (clickedImageRef.current && coverPreviewRef.current) {
          if (clickedImageRef.current.tagName.toLowerCase() === 'img') {
            (clickedImageRef.current as HTMLImageElement).src = reader.result as string;
          } else {
            clickedImageRef.current.style.backgroundImage = `url(${reader.result})`;
            clickedImageRef.current.style.backgroundSize = 'cover';
            clickedImageRef.current.style.backgroundPosition = 'center';
          }
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          const stuckElements = coverPreviewRef.current.querySelectorAll('[contenteditable="true"]');
          stuckElements.forEach((el) => {
            const h = el as HTMLElement;
            h.removeAttribute('contenteditable');
            h.style.removeProperty('outline');
            h.style.removeProperty('outline-offset');
            if (h.getAttribute('style') === '') h.removeAttribute('style');
          });
          setCoverHtml(coverPreviewRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCoverPreviewMouseDown = (e: React.MouseEvent) => {
    if (appMode !== 'cover') return;
    if (!e.altKey) return; // Only drag with Alt key

    const target = e.target as HTMLElement;
    if (target === coverPreviewRef.current) return;

    e.preventDefault(); // Prevent text selection

    // If it's editable, blur it first so we can drag
    if (target.contentEditable === 'true') {
      target.blur();
    }

    const currentTransform = target.style.transform || '';
    const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
    const initialScale = scaleMatch ? parseFloat(scaleMatch[1]) : parseFloat(target.getAttribute('data-scale') || '1');
    const baseTransform = currentTransform.replace(/translate\([^)]+\)/g, '').replace(/scale\([^)]+\)/g, '').trim();

    dragInfo.current = {
      isMouseDown: true,
      isDragging: false,
      target,
      startX: e.clientX,
      startY: e.clientY,
      initialTransform: baseTransform,
      initialX: parseFloat(target.getAttribute('data-x') || '0'),
      initialY: parseFloat(target.getAttribute('data-y') || '0'),
      initialScale: initialScale
    };
  };

  const handleCoverPreviewClick = (e: React.MouseEvent) => {
    if (appMode !== 'cover') return;
    if (e.altKey) return; // Don't trigger edit/replace if Alt key is pressed (dragging)

    const target = e.target as HTMLElement;
    
    if (target.tagName.toLowerCase() === 'a') {
      e.preventDefault();
    }

    if (target === coverPreviewRef.current) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Recover any stuck elements
      const stuckElements = coverPreviewRef.current.querySelectorAll('[contenteditable="true"]');
      stuckElements.forEach((el) => {
        const h = el as HTMLElement;
        h.removeAttribute('contenteditable');
        h.style.removeProperty('outline');
        h.style.removeProperty('outline-offset');
        if (h.getAttribute('style') === '') h.removeAttribute('style');
      });
      if (stuckElements.length > 0) {
        setCoverHtml(coverPreviewRef.current.innerHTML);
      }
      return;
    }

    const bgImage = window.getComputedStyle(target).getPropertyValue('background-image');
    const hasPhotoBg = bgImage && (bgImage.includes('url("http') || bgImage.includes('url(http') || bgImage.includes('url("data:image/jpeg') || bgImage.includes('url("data:image/png') || bgImage.includes('url(data:image/'));

    if (target.tagName.toLowerCase() === 'img' || hasPhotoBg) {
      clickedImageRef.current = target;
      replaceImageInputRef.current?.click();
    } else if (target.contentEditable === 'true') {
      // User requested: click again to hide the dashed line and exit edit mode
      target.removeAttribute('contenteditable');
      target.style.removeProperty('outline');
      target.style.removeProperty('outline-offset');
      if (target.getAttribute('style') === '') {
          target.removeAttribute('style');
      }
      target.blur();
      if (coverPreviewRef.current) {
        setCoverHtml(coverPreviewRef.current.innerHTML);
      }
    } else {
      target.contentEditable = 'true';
      target.focus();
      
      const originalOutline = target.style.outline;
      target.style.outline = '2px dashed rgba(99, 102, 241, 0.5)';
      target.style.outlineOffset = '2px';

      const handleBlur = () => {
        target.removeAttribute('contenteditable');
        if (originalOutline) {
          target.style.outline = originalOutline;
        } else {
          target.style.removeProperty('outline');
        }
        target.style.removeProperty('outline-offset');
        
        if (target.getAttribute('style') === '') {
            target.removeAttribute('style');
        }
        target.removeEventListener('blur', handleBlur);
        if (coverPreviewRef.current) {
          setCoverHtml(coverPreviewRef.current.innerHTML);
        }
      };
      target.addEventListener('blur', handleBlur);
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) insertLocalImage(file, e.target as HTMLTextAreaElement);
      }
    }
  };

  const handleEditorDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      insertLocalImage(file, e.target as HTMLTextAreaElement);
    }
  };

  const insertLocalImage = (file: File, textarea?: HTMLTextAreaElement) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      // Auto compress the image if it's too large to prevent lagging
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
        import('uuid').then(({ v4: uuidv4 }) => {
          const imgId = `img_${uuidv4().substring(0,8)}`;
          setLocalImages(prev => ({ ...prev, [imgId]: compressedBase64 }));
          
          const markdownImg = `\n![图片](local:${imgId})\n`;
          
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + markdownImg + content.substring(end);
            setContent(newContent);
            
            // Refocus text area after state update
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + markdownImg.length, start + markdownImg.length);
            }, 0);
          } else {
            setContent(prev => prev + markdownImg);
          }
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const generateCover = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    setIsGeneratingCover(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];

        const resolvedKey2 = getApiKey();
        if (!resolvedKey2) return;
        const ai = new GoogleGenAI({ apiKey: resolvedKey2 });
        const promptText = `逆向还原排版prompt 

你是一名资深的前端逆向工程专家，具备设计系统思维 。你擅长从各类网页截图中逆向推导完整实现：精确还原视觉设计(HTML/CSS)，从静态画面推断交互逻辑与状态变化(必要时使用JavaScript)，并识别设计系统的完整性与合理性 。你的目标是创建一个在视觉保真度、功能完整性和用户体验上都高度还原原始设计的网页实现 。

请仔细观察所提供的网页截图(可能是组件、卡片、页面布局或文字排版等) 。你的任务是：通过系统化的逆向工程分析，完整还原截图中的视觉元素、配色，并推断必要的交互行为，最终生成一个完整且可运行的HTML页面(包含CSS样式，必要时包含JavaScript交互) 。你生成的网页需要在视觉保真度、功能完整性和使用流畅度上都高度还原原始设计 。

在给出最终代码之前，请使用下面的思考步骤进行系统化分析 ：

系统分析步骤
1. 整体结构与布局分析
2. 视觉设计系统分析
3. 组件与交互分析
4. 技术实现策略
5. 上下文与设计意图推断

【重要附加要求 - 必读】
1. 这是一个封面生成任务。请将以下用户提供的文本内容合理地融入到你设计的封面 HTML 中：
<user_text>
${coverContent}
</user_text>

2. 尺寸要求：生成的封面尺寸比例必须为 3:4（例如 600x800，适合小红书等平台）。请在设计布局时严格遵循此纵向比例。

3. 输出格式要求：
- 请将生成的 HTML 结构放在 \`\`\`html 代码块中（只需内部结构，不需要 html/body 标签）。
- 请将生成的 CSS 样式放在 \`\`\`css 代码块中。

4. 样式变量化要求：
- **必须**在 CSS 中使用 CSS 变量（如 var(--bg-color)）来控制所有的主要颜色（背景、文字、边框等）和主要尺寸（字号、圆角、间距等）。
- 不要在 CSS 中写死这些主要颜色和尺寸，也不要在 CSS 中定义 \`:root\`，我们将从外部动态注入这些变量。

5. 变量声明要求：
- 在回答的最后，**必须**提供一个 JSON 对象，放在 \`\`\`json 代码块中。
- 该 JSON 需声明所有你在 CSS 中使用的变量及其默认值。格式必须严格如下：
{
  "--bg-color": { "type": "color", "value": "#1a1a1a", "label": "背景颜色" },
  "--title-color": { "type": "color", "value": "#ffffff", "label": "标题颜色" },
  "--title-size": { "type": "number", "value": 64, "unit": "px", "label": "标题字号" },
  "--card-radius": { "type": "number", "value": 16, "unit": "px", "label": "卡片圆角" }
}
支持的 type 仅为 "color" 和 "number"。

6. 质感与纹理模拟（关键）：
- 如果参考图中包含特殊的材质质感（如揉皱的纸张、噪点、牛皮纸、反光、磨砂玻璃等），请务必使用 CSS 技巧（如多重径向/线性渐变、SVG noise 滤镜作为 background-image、box-shadow 叠加等）来尽力模拟这些质感。
- **如果背景包含复杂的摄影级纹理（如树影、水波纹、真实风景等）**，纯 CSS 无法模拟，请务必在 CSS 中使用 \`background-image: url('https://picsum.photos/seed/shadow/800/1200');\` 这样的高质量占位图作为背景，而不要仅仅使用纯色。这对于还原设计的灵魂至关重要。

7. 字体使用（重要）：
- 容器已经通过 \`var(--cover-font)\` 提供了一个全局字体。请让封面内的文本（标题、正文等）继承该字体，或者显式地使用 \`font-family: var(--cover-font);\`, 也可以使用 \`font-family: inherit;\`。不要硬编码具体的字体名称（如 'Arial', 'sans-serif' 等），以确保用户可以在外部切换字体。

8. 图片处理（重要）：
- 如果参考图中包含照片、插图、人物等真实图像元素，请务必在 HTML 中使用 \`<img>\` 标签 (并建议配合 style="object-fit:cover") 而不是 \`background-image\` 来进行占位，并使用高质量的占位图（如 \`https://picsum.photos/seed/cover/800/600\`）来代替，以确保用户可以直接点击图片元素准确触发等比替换。**绝对不要遗漏原图中的主要图案元素**。
- 注：除非是全屏的纯装饰性纹理底图才使用 \`background-image\`。`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: [
            { inlineData: { data: base64Data, mimeType: file.type } },
            promptText
          ]
        });

        const text = response.text || '';
        
        const htmlMatch = text.match(/```html\n([\s\S]*?)\n```/);
        const html = htmlMatch ? htmlMatch[1] : '<div class="error">HTML extraction failed</div>';
        
        const cssMatch = text.match(/```css\n([\s\S]*?)\n```/);
        const css = cssMatch ? cssMatch[1] : '';
        
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        let vars = {};
        if (jsonMatch) {
          try {
            vars = JSON.parse(jsonMatch[1]);
          } catch(e) {
            console.error("JSON parse error", e);
          }
        }

        setCoverHtml(html);
        setCoverCss(css);
        setCoverVars(vars);
        setActiveTab('style');
      } catch (e: any) {
        console.error(e);
        if (e.message && e.message.includes('429')) {
          alert('API 额度已耗尽 (Quota Exceeded)。请稍后再试，或检查您的 API 密钥额度。');
        } else {
          alert('生成封面失败，请重试');
        }
      } finally {
        setIsGeneratingCover(false);
      }
    };
  };

  const processCoverThemeImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    setIsExtracting(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        setCoverPreviewImage(base64String);
        const base64Data = base64String.split(',')[1];
        
        const colorKeys = Object.keys(coverVars).filter(k => coverVars[k].type === 'color');
        if (colorKeys.length === 0) {
          alert('当前封面没有可修改的颜色变量。');
          setIsExtracting(false);
          return;
        }

        const resolvedKey3 = getApiKey();
        if (!resolvedKey3) return;
        const ai = new GoogleGenAI({ apiKey: resolvedKey3 });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { inlineData: { data: base64Data, mimeType: file.type } },
            `Analyze this image and extract a cohesive color palette. Map the extracted colors to the following CSS variable names: ${JSON.stringify(colorKeys)}. Return ONLY a JSON object where keys are the variable names and values are the hex color codes.`
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: colorKeys.reduce((acc, key) => {
                acc[key] = { type: Type.STRING };
                return acc;
              }, {} as any),
              required: colorKeys
            }
          }
        });

        if (response.text) {
          const newColors = JSON.parse(response.text);
          setCoverVars(prev => {
            const next = { ...prev };
            for (const key in newColors) {
              if (next[key]) {
                next[key] = { ...next[key], value: newColors[key] };
              }
            }
            return next;
          });
        }
      } catch (e: any) {
        console.error(e);
        if (e.message && e.message.includes('429')) {
          alert('API 额度已耗尽 (Quota Exceeded)。请稍后再试，或检查您的 API 密钥额度。');
        } else {
          alert('提取颜色失败，请重试');
        }
      } finally {
        setIsExtracting(false);
      }
    };
  };

  const exportPDF = async () => {
    let targetSelector = appMode === 'article' ? '.card-container' : '.cover-preview-container';
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    
    if (!targetElement) {
      alert('未找到需要导出的内容，请重试');
      return;
    }

    try {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const stuckElements = targetElement.querySelectorAll('[contenteditable="true"]');
      stuckElements.forEach((el) => {
        const h = el as HTMLElement;
        h.removeAttribute('contenteditable');
        h.style.removeProperty('outline');
        h.style.removeProperty('outline-offset');
      });

      // Show loading indicator in a real app, here we just proceed
      const originalScale = targetElement.style.transform;
      // Reset any transforms for clean export
      targetElement.style.transform = 'none';
      
      const canvas = await html2canvas(targetElement, {
        scale: 2, // 2x resolution
        useCORS: true,
        backgroundColor: appMode === 'article' ? styles.cardBg : null,
      });
      
      // Restore transforms
      targetElement.style.transform = originalScale;

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF format
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const filename = appMode === 'article' ? 'article_export.pdf' : 'cover_export.pdf';
      pdf.save(filename);
    } catch (e: any) {
      console.error('PDF generation failed', e);
      alert('生成 PDF 失败，请检查控制台了解详情。');
    }
  };

  const exportHTML = () => {
    if (appMode === 'article') {
      const contentRawHtml = document.querySelector('.content-area')?.innerHTML || '';
      // We don't actually need to replace custom urls here because React renders the actual base64 local image into img src.
      // E.g. <img src="data:image/png;base64,....." /> becomes the innerHTML directly.
      const contentHtml = contentRawHtml;

      const fontsToLoad = [styles.fontBody, styles.fontHeading, styles.fontEnTitle, styles.fontCode]
        .map(f => f?.split(',')[0].replace(/['"]/g, '').trim())
        .filter(f => f && !['sans-serif', 'serif', 'monospace', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Times New Roman', 'Times', 'Courier New', 'Courier'].includes(f));
      const uniqueFonts = Array.from(new Set(fontsToLoad));
      const dynamicFontImport = uniqueFonts.length > 0 
        ? `@import url('https://fonts.googleapis.com/css2?${uniqueFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;700`).join('&')}&display=swap');`
        : '';

      const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>阅读美学 - 导出</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&family=JetBrains+Mono:wght@400;700&family=Noto+Serif+SC:wght@700&display=swap');
    ${dynamicFontImport}
    
    :root {
      --bg-grad-1: ${styles.bgGrad1};
      --bg-grad-2: ${styles.bgGrad2};
      --bg-grad-3: ${styles.bgGrad3};
      --card-bg: ${styles.cardBg};
      --card-width: ${styles.cardWidth}px;
      --card-radius: ${styles.cardRadius}px;
      --content-padding: ${styles.contentPadding}px;
      --body-font-size: ${styles.bodyFontSize}px;
      --body-line-height: ${styles.bodyLineHeight};
      --body-color: ${styles.bodyColor};
      --h1-size: ${styles.h1Size}px;
      --h1-color: ${styles.h1Color};
      --h2-size: ${styles.h2Size}px;
      --h2-color: ${styles.h2Color};
      --en-title-size: ${styles.enTitleSize}px;
      --en-title-color: ${styles.enTitleColor};
      --meta-size: ${styles.metaSize}px;
      --meta-color: ${styles.metaColor};
      --link-color: ${styles.linkColor};
      --mark-bg: ${styles.markBg};
      --mark-border: ${styles.markBorder};
      --hr-color: ${styles.hrColor};
      --hr-thickness: ${styles.hrThickness}px;
      --hr-style: ${styles.hrStyle};
      --hr-opacity: ${styles.hrOpacity};
      --code-color: ${styles.codeColor};
      --code-bg: ${styles.codeBg};
      --font-body: ${styles.fontBody};
      --font-heading: ${styles.fontHeading};
      --font-en-title: ${styles.fontEnTitle};
      --font-code: ${styles.fontCode};
    }
    
    body {
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      background-image: ${styles.bgTexture !== 'none' ? `${styles.bgTexture}, ` : ''}linear-gradient(135deg, var(--bg-grad-1) 0%, var(--bg-grad-2) 50%, var(--bg-grad-3) 100%);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      font-family: var(--font-body);
    }
    
    .card-container {
      width: 100%;
      max-width: var(--card-width);
      background-color: var(--card-bg);
      border-radius: var(--card-radius);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      position: relative;
    }
    
    .card-container::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      background-image: ${styles.cardTexture !== 'none' ? styles.cardTexture : 'none'};
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: ${styles.textureOpacity};
      z-index: 0;
    }
    
    .content-area {
      position: relative;
      z-index: 1;
      padding: var(--content-padding);
      font-size: var(--body-font-size);
      color: var(--body-color);
      line-height: var(--body-line-height);
    }
    
    ${styles.customH1Css ? `.content-area h1 { ${styles.customH1Css} }` : ''}
    ${styles.customH2Css ? `.content-area h2 { ${styles.customH2Css} }` : ''}
    
    h1 { font-family: var(--font-heading); font-weight: 700; font-size: var(--h1-size); margin-bottom: 16px; line-height: 1.3; color: var(--h1-color); margin-top: 0; }
    h2 { font-family: var(--font-heading); font-size: var(--h2-size); margin-top: 40px; margin-bottom: 16px; font-weight: bold; color: var(--h2-color); }
    .en-title { font-family: var(--font-en-title); font-size: var(--en-title-size); color: var(--en-title-color); font-weight: 300; margin-bottom: 24px; }
    .metadata { font-size: var(--meta-size); color: var(--meta-color); margin-bottom: 32px; }
    p { margin-bottom: 20px; margin-top: 0; }
    a { color: var(--link-color); text-decoration: none; }
    a:hover { text-decoration: underline; }
    em { color: inherit; font-style: italic; }
    strong { font-weight: bold; }
    mark { background-color: var(--mark-bg); color: #111111; font-weight: bold; border-bottom: 2px solid var(--mark-border); border-radius: 4px; padding: 2px 6px; }
    ul, ol { font-size: calc(var(--body-font-size) - 2px); padding-left: 20px; margin-bottom: 20px; margin-top: 0; }
    li { margin-bottom: 8px; }
    blockquote { border-left: 6px solid var(--mark-border); background-color: rgba(128, 128, 128, 0.08); padding: 24px 24px 24px 20px; border-radius: 0 12px 12px 0; font-style: italic; margin: 32px 0; color: var(--body-color); opacity: 0.85; }
    blockquote p { margin-bottom: 16px; white-space: pre-line; line-height: 2.2; }
    blockquote p:last-child { margin-bottom: 0; }
    table { width: 100%; border-collapse: collapse; margin: 32px 0; font-size: 0.9em; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); }
    th, td { padding: 16px; text-align: left; border-bottom: 1px solid rgba(128, 128, 128, 0.15); }
    th { background-color: rgba(128, 128, 128, 0.08); font-weight: 700; color: var(--h2-color); }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background-color: rgba(128, 128, 128, 0.02); }
    hr { border: none; border-top-width: var(--hr-thickness); border-top-style: var(--hr-style); border-top-color: var(--hr-color); opacity: var(--hr-opacity); margin: 40px 0; }
    code { font-family: var(--font-code); color: var(--code-color); background-color: var(--code-bg); padding: 0.2em 0.4em; border-radius: 6px; font-size: 0.85em; }
    pre { background: var(--code-bg); padding: 20px; border-radius: 8px; font-size: calc(var(--body-font-size) - 7px); overflow-x: auto; margin-bottom: 20px; margin-top: 0; }
    pre code { background-color: transparent; color: inherit; padding: 0; font-size: inherit; }
    img.article-image { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); margin: 16px 0 24px 0; display: block; }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="content-area">
      ${contentHtml}
    </div>
  </div>
</body>
</html>`;
      
      const blob = new Blob([htmlTemplate], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'article.html';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const coverFontName = coverFont.split(',')[0].replace(/['"]/g, '').trim();
      const coverFontImport = ['Zhi Mang Xing', 'Ma Shan Zheng', 'Long Cang', 'Noto Serif SC'].includes(coverFontName)
        ? `@import url('https://fonts.googleapis.com/css2?family=${coverFontName.replace(/ /g, '+')}:wght@400;700&display=swap');`
        : '';

      const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>封面 - 导出</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&family=JetBrains+Mono:wght@400;700&family=Noto+Serif+SC:wght@700&display=swap');
    ${coverFontImport}
    
    :root {
      --cover-font: ${coverFont};
      ${Object.entries(coverVars).map(([k, v]) => `${k}: ${v.value}${v.unit || ''};`).join('\n      ')}
    }
    
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .cover-export-container {
      width: 100%;
      max-width: 600px;
      aspect-ratio: 3/4;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      font-family: var(--cover-font);
    }
    
    ${coverCss}
  </style>
</head>
<body>
  <div class="cover-export-container">
    ${coverHtml}
  </div>
</body>
</html>`;
      const blob = new Blob([htmlTemplate], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  };

  useEffect(() => {
    if (coverHtml.includes('class="default-cover"')) {
      const lines = coverContent.split('\n').filter(l => l.trim() !== '');
      const h1Str = lines[0] ? lines[0].replace(/^#+\s*/, '') : '封面大标题';
      const pStr = lines.slice(1).join('<br/>') || '这里是封面的副标题或简介内容';
      setCoverHtml(`<div class="default-cover"><h1>${h1Str}</h1><p>${pStr}</p></div>`);
    }
  }, [coverContent]);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (appMode === 'article' && activeTab === 'theme') {
              processImage(file);
            } else if (appMode === 'cover' && activeTab === 'editor') {
              generateCover(file);
            } else if (appMode === 'cover' && activeTab === 'theme') {
              processCoverThemeImage(file);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab, appMode, coverVars]);

  const styleVars = {
    '--bg-grad-1': styles.bgGrad1,
    '--bg-grad-2': styles.bgGrad2,
    '--bg-grad-3': styles.bgGrad3,
    '--card-bg': styles.cardBg,
    '--card-texture': styles.cardTexture,
    '--texture-opacity': styles.textureOpacity,
    '--card-width': `${styles.cardWidth}px`,
    '--card-height': `${styles.cardHeight}px`,
    '--card-radius': `${styles.cardRadius}px`,
    '--content-padding': `${styles.contentPadding}px`,
    '--body-font-size': `${styles.bodyFontSize}px`,
    '--body-line-height': styles.bodyLineHeight,
    '--body-color': styles.bodyColor,
    '--h1-size': `${styles.h1Size}px`,
    '--h1-color': styles.h1Color,
    '--h2-size': `${styles.h2Size}px`,
    '--h2-color': styles.h2Color,
    '--en-title-size': `${styles.enTitleSize}px`,
    '--en-title-color': styles.enTitleColor,
    '--meta-size': `${styles.metaSize}px`,
    '--meta-color': styles.metaColor,
    '--link-color': styles.linkColor,
    '--mark-bg': styles.markBg,
    '--mark-border': styles.markBorder,
    '--hr-color': styles.hrColor,
    '--hr-thickness': `${styles.hrThickness}px`,
    '--hr-style': styles.hrStyle,
    '--hr-opacity': styles.hrOpacity,
    '--code-color': styles.codeColor,
    '--code-bg': styles.codeBg,
    '--font-body': styles.fontBody,
    '--font-heading': styles.fontHeading,
    '--font-en-title': styles.fontEnTitle,
    '--font-code': styles.fontCode,
  } as React.CSSProperties;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans relative transition-colors duration-500 bg-black" style={{ 
      ...styleVars,
      backgroundImage: `${styles.bgTexture !== 'none' ? `${styles.bgTexture}, ` : ''}linear-gradient(135deg, var(--bg-grad-1) 0%, var(--bg-grad-2) 50%, var(--bg-grad-3) 100%)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-sm flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-white text-xl font-bold">输入 Gemini API Key</h2>
              <p className="text-white/60 text-sm">Key 仅保存在你的本地浏览器，不会上传到任何服务器。</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="password"
                placeholder="AIza..."
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                className="glass-input rounded-xl px-4 py-3 text-sm w-full"
                autoFocus
              />
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 text-xs hover:text-white/70 transition-colors"
              >
                还没有 Key？点这里免费获取 →
              </a>
            </div>
            <button
              onClick={saveApiKey}
              className="glass-button-active text-white font-semibold py-3 rounded-xl text-sm transition-all"
            >
              保存并开始使用
            </button>
            {apiKey && (
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-white/40 text-xs text-center hover:text-white/70 transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Preview Area */}
      <div className="absolute inset-0 w-full h-full overflow-auto preview-container-wrapper z-0 pb-[100px]" onClick={() => setIsSheetOpen(false)}>
        {appMode === 'article' ? (
          <div className="preview-wrapper bg-transparent min-h-full flex items-center justify-center p-4">
            {(styles.customH1Css || styles.customH2Css) && (
              <style dangerouslySetInnerHTML={{__html: `
                .content-area h1 { ${styles.customH1Css} }
                .content-area h2 { ${styles.customH2Css} }
              `}} />
            )}
            <div className="card-container scale-[0.6] sm:scale-100 origin-top lg:origin-center mt-10 sm:mt-0 transition-transform">
              <div className={`content-area ${styles.hideScrollbar ? 'hide-scrollbar' : ''}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  urlTransform={(value: string) => value}
                  components={{
                    h3: ({node, ...props}) => <div className="en-title" {...props} />,
                    h4: ({node, ...props}) => <div className="metadata" {...props} />,
                    img: ({node, src, alt, ...props}) => {
                      if (src?.startsWith('local:')) {
                        const imgId = src.replace('local:', '');
                        const base64 = localImages[imgId];
                        if (base64) {
                          return <img src={base64} alt={alt || 'img'} className="article-image" {...props} />;
                        }
                      }
                      return <img src={src} alt={alt || 'img'} className="article-image" {...props} />;
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-wrapper bg-transparent flex items-center justify-center min-h-full p-4 pb-24">
            <div 
              className="cover-preview-container relative w-full h-[60vh] max-h-[800px] max-w-lg bg-white shadow-2xl overflow-hidden rounded-2xl"
              style={{
                aspectRatio: '3/4',
                '--cover-font': coverFont,
                fontFamily: 'var(--cover-font)',
                ...(Object.entries(coverVars).reduce((acc, [k, v]) => {
                  acc[k] = `${v.value}${v.unit || ''}`;
                  return acc;
                }, {} as any))
              } as React.CSSProperties}
            >
              <style>{coverCss}</style>
              <div 
                ref={coverPreviewRef}
                dangerouslySetInnerHTML={{ __html: coverHtml }} 
                className="w-full h-full cursor-text" 
                onClick={handleCoverPreviewClick}
                onMouseDown={handleCoverPreviewMouseDown}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={replaceImageInputRef}
                onChange={handleReplaceImage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for Bottom Sheet */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-300 ${isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSheetOpen(false)}
      />

      {/* Floating Action Tab Bar (Bottom) */}
      <div className={`fixed z-50 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-full overflow-hidden transition-all duration-300 bg-black/60 backdrop-blur-2xl border border-white/20 shadow-2xl pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 px-1.5 w-[90%] max-w-[400px] ${isSheetOpen ? 'bottom-[-100px] opacity-0' : 'bottom-6 opacity-100'}`}>
         <button
            onClick={() => { setActiveTab('editor'); setIsSheetOpen(true); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'editor' ? 'bg-indigo-500/80 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Edit3 className="w-4 h-4" /> 文本
          </button>
          <button
            onClick={() => { setActiveTab('style'); setIsSheetOpen(true); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'style' ? 'bg-indigo-500/80 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Settings className="w-4 h-4" /> 样式
          </button>
          <button
            onClick={() => { setActiveTab('theme'); setIsSheetOpen(true); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'theme' ? 'bg-indigo-500/80 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <ImageIcon className="w-4 h-4" /> 风格
          </button>
      </div>

      {/* Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-40 bg-[rgba(30,30,35,0.75)] backdrop-blur-3xl border-t border-white/20 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSheetOpen ? 'translate-y-0' : 'translate-y-[110%]'}`} style={{ height: '82vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        
        {/* Drag Handle */}
        <div className="w-full h-10 flex items-center justify-center cursor-pointer flex-shrink-0" onClick={() => setIsSheetOpen(false)}>
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-wide">
              {appMode === 'article' ? '排版设置' : '封面设置'}
            </h1>
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
            <button 
              onClick={() => setAppMode('article')} 
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${appMode === 'article' ? 'bg-indigo-500/80 text-white shadow-sm' : 'text-white/60 hover:text-white/80'}`}
            >
              排版
            </button>
            <button 
              onClick={() => setAppMode('cover')} 
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${appMode === 'cover' ? 'bg-indigo-500/80 text-white shadow-sm' : 'text-white/60 hover:text-white/80'}`}
            >
              封面
            </button>
          </div>
        </div>

        {/* Tabs inside Sheet */}
        <div className="flex p-3 gap-2 border-b border-white/10 overflow-x-auto hide-scrollbar flex-shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 min-w-[80px] py-2.5 text-sm font-medium flex items-center justify-center gap-2 rounded-xl transition-all ${
              activeTab === 'editor' ? 'glass-button-active text-white' : 'glass-button text-white/70 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" /> 编辑
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 min-w-[80px] py-2.5 text-sm font-medium flex items-center justify-center gap-2 rounded-xl transition-all ${
              activeTab === 'style' ? 'glass-button-active text-white' : 'glass-button text-white/70 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> 样式
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 min-w-[80px] py-2.5 text-sm font-medium flex items-center justify-center gap-2 rounded-xl transition-all ${
              activeTab === 'theme' ? 'glass-button-active text-white' : 'glass-button text-white/70 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> 风格
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-4">
          {activeTab === 'editor' && (
            <div className="p-5 h-full flex flex-col">
              {appMode === 'article' ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-white/90">Markdown 内容</label>
                    <div className="flex gap-2">
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         ref={editorImageInputRef} 
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if(file) {
                              const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
                              insertLocalImage(file, textarea);
                           }
                           if(e.target) e.target.value = '';
                         }}
                       />
                       <button
                         onClick={() => editorImageInputRef.current?.click()}
                         className="text-xs flex items-center gap-1 text-white bg-indigo-500/80 hover:bg-indigo-500 border border-indigo-400/30 px-3 py-1.5 rounded-lg transition-colors shadow-sm backdrop-blur-md"
                       >
                         <ImageIcon className="w-3.5 h-3.5" /> 插入图片
                       </button>
                      <button
                        onClick={copyHtml}
                        className="text-xs flex items-center gap-1 text-white bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-1.5 rounded-lg transition-colors shadow-sm backdrop-blur-md"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? '已复制' : '复制文本'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="markdown-editor"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handleEditorPaste}
                    onDrop={handleEditorDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 w-full p-4 glass-input rounded-xl font-mono text-sm resize-none border-2 border-transparent focus:border-indigo-500/50"
                    placeholder="在此输入 Markdown 文本... (支持直接拖入/粘贴图片)"
                  />
                  <p className="text-xs text-white/60 mt-4 leading-relaxed">
                    提示：使用 <code>#</code> 表示主标题，<code>##</code> 表示副标题，<code>###</code> 表示英文标题，<code>####</code> 表示元数据（日期/作者）。支持 <code>&lt;mark&gt;高亮&lt;/mark&gt;</code>。
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white/90">
                      封面文案设定
                    </label>
                  </div>
                  
                  {!coverHtml.includes('default-cover') && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-xs text-blue-200 leading-relaxed font-medium mb-1">
                        💡 提示：您已经生成了自定义封面！
                      </p>
                      <p className="text-xs text-blue-200/80 leading-relaxed">
                        由于 AI 已接管布局，左侧框内的文本<b>将不再实时同步</b>到右侧预览中。如果想修改文案，请<b>直接在右侧画布上点击对应的文字进行修改</b>（支持富文本就地编辑）。如果想基于新文案重新排版，请修改框内文本后重新上传图片。
                      </p>
                    </div>
                  )}

                  <textarea
                    value={coverContent}
                    onChange={(e) => setCoverContent(e.target.value)}
                    className="w-full p-4 glass-input rounded-xl font-mono text-sm resize-y h-60 mb-6"
                    placeholder="输入封面文本..."
                  />
                  
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-white/90 mb-1">参考图上传 (生成封面)</h3>
                    <p className="text-xs text-white/60">上传参考图，AI将根据图片风格和上方文本生成封面代码。</p>
                    <p className="text-xs text-indigo-300 mt-1">✨ 提示：生成后，点击文字可修改，点击图片可替换。<b>按住 Alt (或 Option) 键并拖拽</b>可移动元素位置。</p>
                  </div>
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) generateCover(file);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => coverFileInputRef.current?.click()}
                    className={`flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all border-dashed border-2 ${
                      isGeneratingCover ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/30 hover:border-white/60 hover:bg-white/20'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={coverFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) generateCover(file);
                      }}
                    />
                    {isGeneratingCover ? (
                      <>
                        <Loader2 className="w-10 h-10 text-white/80 animate-spin mb-4" />
                        <p className="text-sm font-medium text-white/90">AI 正在逆向还原设计...</p>
                        <p className="text-xs text-white/60 mt-2">这可能需要 10-20 秒</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white/10 text-white/80 rounded-full flex items-center justify-center mb-5 border border-white/20 shadow-inner">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium text-white/90 mb-2">点击上传，或将参考图拖拽到此处</p>
                        <p className="text-xs text-white/50">支持直接粘贴图片</p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white/90 mb-2 block">HTML 源码</label>
                      <textarea
                        value={coverHtml}
                        onChange={(e) => setCoverHtml(e.target.value)}
                        className="w-full p-4 glass-input rounded-xl font-mono text-xs resize-y h-32"
                        placeholder="HTML 代码..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/90 mb-2 block">CSS 源码</label>
                      <textarea
                        value={coverCss}
                        onChange={(e) => setCoverCss(e.target.value)}
                        className="w-full p-4 glass-input rounded-xl font-mono text-xs resize-y h-32"
                        placeholder="CSS 代码..."
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'style' && (
            <div className="p-5 space-y-8">
              {appMode === 'article' ? (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={resetStyles}
                      className="text-xs flex items-center gap-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg transition-colors shadow-sm backdrop-blur-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> 重置样式
                    </button>
                  </div>

                  <section>
                    <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span> 容器与背景
                    </h3>
                    <ToggleControl label="隐藏阅读滑杆" value={styles.hideScrollbar} onChange={(v: boolean) => handleStyleChange('hideScrollbar', v)} />
                    <SliderControl label="卡片宽度" value={styles.cardWidth} min={300} max={1200} unit="px" onChange={(v: number) => handleStyleChange('cardWidth', v)} />
                    <SliderControl label="卡片高度" value={styles.cardHeight} min={400} max={2000} unit="px" onChange={(v: number) => handleStyleChange('cardHeight', v)} />
                    <SliderControl label="圆角大小" value={styles.cardRadius} min={0} max={40} unit="px" onChange={(v: number) => handleStyleChange('cardRadius', v)} />
                    <SliderControl label="内容内边距" value={styles.contentPadding} min={10} max={100} unit="px" onChange={(v: number) => handleStyleChange('contentPadding', v)} />
                    
                    <ColorControl label="卡片背景色" value={styles.cardBg} onChange={(v: string) => handleStyleChange('cardBg', v)} />
                    <ColorControl label="背景渐变 1" value={styles.bgGrad1} onChange={(v: string) => handleStyleChange('bgGrad1', v)} />
                    <ColorControl label="背景渐变 2" value={styles.bgGrad2} onChange={(v: string) => handleStyleChange('bgGrad2', v)} />
                    <ColorControl label="背景渐变 3" value={styles.bgGrad3} onChange={(v: string) => handleStyleChange('bgGrad3', v)} />
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span> 字体选择 (云端加载)
                    </h3>
                    <SelectControl 
                      label="中文正文字体" 
                      value={styles.fontBody} 
                      onChange={(v: string) => handleStyleChange('fontBody', v)}
                      options={[
                        { label: '系统默认 (System)', value: "'-apple-system', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
                        { label: '微软雅黑 (无衬线)', value: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
                        { label: '传统宋体 (有衬线)', value: "'SimSun', 'STSong', serif" },
                        { label: '传统楷体 (书法)', value: "'KaiTi', 'STKaiti', serif" },
                        { label: '思源黑体 (Noto Sans SC) ☁️', value: "'Noto Sans SC', sans-serif" },
                        { label: '思源宋体 (Noto Serif SC) ☁️', value: "'Noto Serif SC', serif" },
                        { label: '霞鹜文楷 (LXGW WenKai) ☁️', value: "'LXGW WenKai TC', serif" },
                        { label: '站酷小薇体 (ZCOOL XiaoWei) ☁️', value: "'ZCOOL XiaoWei', serif" },
                        { label: '硬笔写意 (Ma Shan Zheng) ☁️', value: "'Ma Shan Zheng', cursive" },
                      ]}
                    />
                    <SelectControl 
                      label="中文标题字体" 
                      value={styles.fontHeading} 
                      onChange={(v: string) => handleStyleChange('fontHeading', v)}
                      options={[
                        { label: '系统黑体 (加粗)', value: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
                        { label: '传统宋体 (有衬线)', value: "'SimSun', 'STSong', serif" },
                        { label: '传统楷书 (毛笔)', value: "'KaiTi', 'STKaiti', serif" },
                        { label: '思源宋体 (Noto Serif SC) ☁️', value: "'Noto Serif SC', serif" },
                        { label: '思源黑体 (Noto Sans SC) ☁️', value: "'Noto Sans SC', sans-serif" },
                        { label: '站酷黄油体 (HuangYou) ☁️', value: "'ZCOOL QingKe HuangYou', display" },
                        { label: '站酷快乐体 (KuaiLe) ☁️', value: "'ZCOOL KuaiLe', display" },
                        { label: '站酷小薇体 (XiaoWei) ☁️', value: "'ZCOOL XiaoWei', serif" },
                        { label: '智芒星行书 (Zhi Mang Xing) ☁️', value: "'Zhi Mang Xing', cursive" },
                        { label: '龙藏草书 (Long Cang) ☁️', value: "'Long Cang', cursive" },
                        { label: '刘建毛草体 (Mao Cao) ☁️', value: "'Liu Jian Mao Cao', cursive" },
                        { label: '霞鹜文楷 (LXGW WenKai) ☁️', value: "'LXGW WenKai TC', serif" },
                        { label: '系统默认', value: "system-ui, sans-serif" }
                      ]}
                    />
                    <SelectControl 
                      label="英文标题字体" 
                      value={styles.fontEnTitle} 
                      onChange={(v: string) => handleStyleChange('fontEnTitle', v)}
                      options={[
                        { label: 'Inter (默认) ☁️', value: "'Inter', sans-serif" },
                        { label: 'Roboto ☁️', value: "'Roboto', sans-serif" },
                        { label: 'Playfair Display ☁️', value: "'Playfair Display', serif" },
                        { label: 'Cinzel (古典) ☁️', value: "'Cinzel', serif" },
                        { label: 'Montserrat (现代) ☁️', value: "'Montserrat', sans-serif" },
                        { label: 'Courier New', value: "'Courier New', Courier, monospace" }
                      ]}
                    />
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span> 基础排版
                    </h3>
                    <SliderControl label="正文字号" value={styles.bodyFontSize} min={12} max={36} unit="px" onChange={(v: number) => handleStyleChange('bodyFontSize', v)} />
                    <SliderControl label="行高" value={styles.bodyLineHeight} min={1} max={3} step={0.1} onChange={(v: number) => handleStyleChange('bodyLineHeight', v)} />
                    <ColorControl label="正文颜色" value={styles.bodyColor} onChange={(v: string) => handleStyleChange('bodyColor', v)} />
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span> 标题样式
                    </h3>
                    <SliderControl label="H1 主标题字号" value={styles.h1Size} min={24} max={72} unit="px" onChange={(v: number) => handleStyleChange('h1Size', v)} />
                    <ColorControl label="H1 主标题颜色" value={styles.h1Color} onChange={(v: string) => handleStyleChange('h1Color', v)} />
                    
                    <SliderControl label="H2 副标题字号" value={styles.h2Size} min={18} max={48} unit="px" onChange={(v: number) => handleStyleChange('h2Size', v)} />
                    <ColorControl label="H2 副标题颜色" value={styles.h2Color} onChange={(v: string) => handleStyleChange('h2Color', v)} />
                    
                    <SliderControl label="英文标题字号" value={styles.enTitleSize} min={12} max={36} unit="px" onChange={(v: number) => handleStyleChange('enTitleSize', v)} />
                    <ColorControl label="英文标题颜色" value={styles.enTitleColor} onChange={(v: string) => handleStyleChange('enTitleColor', v)} />
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span> 特殊元素
                    </h3>
                    <SliderControl label="元数据字号" value={styles.metaSize} min={10} max={24} unit="px" onChange={(v: number) => handleStyleChange('metaSize', v)} />
                    <ColorControl label="元数据颜色" value={styles.metaColor} onChange={(v: string) => handleStyleChange('metaColor', v)} />
                    
                    <ColorControl label="链接颜色" value={styles.linkColor} onChange={(v: string) => handleStyleChange('linkColor', v)} />
                    <ColorControl label="高亮背景色" value={styles.markBg} onChange={(v: string) => handleStyleChange('markBg', v)} />
                    <ColorControl label="高亮边框色" value={styles.markBorder} onChange={(v: string) => handleStyleChange('markBorder', v)} />
                    <ColorControl label="代码字体颜色" value={styles.codeColor} onChange={(v: string) => handleStyleChange('codeColor', v)} />
                    <ColorControl label="代码背景色" value={styles.codeBg} onChange={(v: string) => handleStyleChange('codeBg', v)} />
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/30"></span> 分割线样式
                    </h3>
                    <SliderControl label="线条粗细" value={styles.hrThickness} min={1} max={10} unit="px" onChange={(v: number) => handleStyleChange('hrThickness', v)} />
                    <SliderControl label="不透明度" value={styles.hrOpacity} min={0.1} max={1} step={0.1} onChange={(v: number) => handleStyleChange('hrOpacity', v)} />
                    <SelectControl 
                      label="线条样式" 
                      value={styles.hrStyle} 
                      options={[
                        { label: '实线 (Solid)', value: 'solid' },
                        { label: '虚线 (Dashed)', value: 'dashed' },
                        { label: '点线 (Dotted)', value: 'dotted' }
                      ]}
                      onChange={(v: string) => handleStyleChange('hrStyle', v)} 
                    />
                    <ColorControl label="线条颜色" value={styles.hrColor} onChange={(v: string) => handleStyleChange('hrColor', v)} />
                  </section>
                </>
              ) : (
                <>
                  <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white/30"></span> 封面样式控制
                  </h3>
                  
                  <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-xs text-indigo-200 mb-1 flex items-center gap-1.5 font-medium">
                      <LayoutTemplate className="w-3.5 h-3.5" /> 自由排版技巧
                    </p>
                    <ul className="text-[11px] text-indigo-200/70 space-y-1 pl-5 list-disc">
                      <li>按住 <kbd className="bg-black/30 px-1 rounded text-white/90">Alt</kbd> 拖拽画板内元素可移动位置</li>
                      <li>按住 <kbd className="bg-black/30 px-1 rounded text-white/90">Alt</kbd> + <kbd className="bg-black/30 px-1 rounded text-white/90">Shift</kbd> 拖拽可缩放大小</li>
                      <li>直接点击文字即可修改内容</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-medium text-white/60 mb-2">封面字体</label>
                    <select
                      value={coverFont}
                      onChange={(e) => setCoverFont(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-white/30"
                    >
                      <option value="system-ui, sans-serif">默认无衬线</option>
                      <option value="'Noto Serif SC', serif">经典宋体</option>
                      <option value="'Zhi Mang Xing', cursive">潇洒手写</option>
                      <option value="'Ma Shan Zheng', cursive">苍劲毛笔</option>
                      <option value="'Long Cang', cursive">飘逸草书</option>
                    </select>
                  </div>
                  {Object.keys(coverVars).length === 0 && (
                    <p className="text-sm text-white/60">请先在「编辑」面板上传参考图生成封面。</p>
                  )}
                  {Object.entries(coverVars).map(([key, config]: [string, any]) => {
                    if (config.type === 'color') {
                      return (
                        <ColorControl 
                          key={key} 
                          label={config.label || key} 
                          value={config.value} 
                          onChange={(v: string) => setCoverVars(prev => ({...prev, [key]: {...prev[key], value: v}}))} 
                        />
                      );
                    } else if (config.type === 'number') {
                      return (
                        <SliderControl 
                          key={key} 
                          label={config.label || key} 
                          value={config.value} 
                          min={0} 
                          max={Math.max(config.value * 3, 100)}
                          unit={config.unit || ''} 
                          onChange={(v: number) => setCoverVars(prev => ({...prev, [key]: {...prev[key], value: v}}))} 
                        />
                      );
                    }
                    return null;
                  })}
                </>
              )}
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="p-5 h-full flex flex-col overflow-y-auto">
              <div className="mb-8 border-b border-white/10 pb-6">
                <h3 className="text-sm font-bold text-white/90 mb-4">预设主题</h3>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_THEMES.map(theme => (
                    <button
                      key={theme.name}
                      onClick={() => applyTheme(theme)}
                      className="flex flex-col items-center gap-2 p-2 rounded-xl border border-white/10 hover:bg-white/20 transition-colors group"
                    >
                      <div 
                        className="w-full h-14 rounded-lg border border-white/20 shadow-inner overflow-hidden flex flex-col items-center"
                        style={{ background: `linear-gradient(135deg, ${theme.styles.bgGrad1}, ${theme.styles.bgGrad3})` }}
                      >
                        <div className="w-[80%] h-12 mt-2 rounded-t shadow-sm border-t border-x border-black/10" style={{ backgroundColor: theme.styles.cardBg }} />
                      </div>
                      <span className="text-xs text-white/80 font-medium group-hover:text-white">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-white/90 mb-2">智能风格提取</h3>
                <p className="text-xs text-white/60 leading-relaxed">上传、拖拽或粘贴一张图片，AI 将自动提取选中的风格元素并应用。</p>
              </div>

              {appMode === 'article' && (
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                    <input type="checkbox" checked={styleOptions.colors} onChange={e => setStyleOptions(p => ({...p, colors: e.target.checked}))} className="rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500/50" />
                    配色
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                    <input type="checkbox" checked={styleOptions.fonts} onChange={e => setStyleOptions(p => ({...p, fonts: e.target.checked}))} className="rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500/50" />
                    字体
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                    <input type="checkbox" checked={styleOptions.paper} onChange={e => setStyleOptions(p => ({...p, paper: e.target.checked}))} className="rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500/50" />
                    纸张
                  </label>
                </div>
              )}

              <div
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (appMode === 'article') processImage(file);
                    else processCoverThemeImage(file);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => {
                  if (appMode === 'article') fileInputRef.current?.click();
                  else coverThemeFileInputRef.current?.click();
                }}
                className={`flex-shrink-0 glass-panel rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all border-dashed border-2 min-h-[200px] ${
                  isExtracting ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/30 hover:border-white/60 hover:bg-white/20'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={appMode === 'article' ? fileInputRef : coverThemeFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (appMode === 'article') processImage(file);
                      else processCoverThemeImage(file);
                    }
                  }}
                />
                
                {isExtracting ? (
                  <>
                    <Loader2 className="w-10 h-10 text-white/80 animate-spin mb-4" />
                    <p className="text-sm font-medium text-white/90">AI 正在分析图片风格...</p>
                    <p className="text-xs text-white/60 mt-2">这可能需要几秒钟</p>
                  </>
                ) : (appMode === 'article' ? previewImage : coverPreviewImage) ? (
                  <div className="flex flex-col items-center h-full w-full">
                    <div className="flex-1 w-full relative mb-4 flex items-center justify-center">
                      <img src={(appMode === 'article' ? previewImage : coverPreviewImage) as string} alt="Preview" className="max-h-[150px] max-w-full object-contain rounded-xl shadow-lg border border-white/20" />
                    </div>
                    <div className="flex items-center gap-2 text-white/80 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
                      <UploadCloud className="w-4 h-4" />
                      <span className="text-sm font-medium">点击或粘贴更换图片</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white/10 text-white/80 rounded-full flex items-center justify-center mb-5 border border-white/20 shadow-inner">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-white/90 mb-2">点击上传，或将图片拖拽到此处</p>
                    <p className="text-xs text-white/50">也支持直接 Ctrl+V / Cmd+V 粘贴图片</p>
                  </>
                )}
              </div>
              
              {(appMode === 'article' ? previewImage : coverPreviewImage) && !isExtracting && (
                <div className="mt-5 p-4 bg-green-500/20 border border-green-500/30 text-green-100 rounded-xl text-sm flex items-start gap-3 backdrop-blur-md shadow-sm">
                  <Check className="w-5 h-5 flex-shrink-0 text-green-400" />
                  <p className="leading-relaxed">风格已更新！你可以在「样式」中继续微调，排版布局保持不变。</p>
                </div>
              )}

              {appMode === 'article' && styles.cardTexture !== 'none' && (
                <div className="mt-6 p-4 glass-panel rounded-xl">
                  <SliderControl
                    label="卡片背景纹理透明度"
                    value={styles.textureOpacity}
                    min={0}
                    max={1}
                    step={0.05}
                    unit=""
                    onChange={(v: number) => handleStyleChange('textureOpacity', v)}
                  />
                  <p className="text-xs text-white/50 mt-2">控制提取的背景纹理的不透明度，0 为完全透明（只显示底片纯色）。</p>
                </div>
              )}

              {appMode === 'article' && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <h3 className="text-sm font-bold text-white/90 mb-4">我的主题</h3>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={themeNameInput} 
                      onChange={e => setThemeNameInput(e.target.value)} 
                      placeholder="输入主题名称..." 
                      className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                    <button 
                      onClick={saveCurrentTheme}
                      disabled={!themeNameInput.trim()}
                      className="px-4 py-2 text-sm bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      保存
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {savedThemes.map(theme => (
                      <div key={theme.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="text-sm text-white/90">{theme.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => applyTheme(theme)} className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors">应用</button>
                          <button onClick={() => deleteTheme(theme.id)} className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded transition-colors">删除</button>
                        </div>
                      </div>
                    ))}
                    {savedThemes.length === 0 && (
                      <p className="text-xs text-white/40 text-center py-4">暂无保存的主题</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Actions inside Sheet */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-2 bg-black/20 flex-shrink-0">
          <div className="flex gap-3">
            <button onClick={exportHTML} className="flex-1 glass-button py-3 text-sm font-medium text-white flex items-center justify-center gap-2 hover:bg-white/20 rounded-[1rem]">
              <Download className="w-4 h-4" /> 导出 HTML
            </button>
            <button onClick={exportPDF} className="flex-1 glass-button py-3 text-sm font-medium text-white flex items-center justify-center gap-2 hover:bg-white/20 rounded-[1rem]">
              <FileText className="w-4 h-4" /> 导出 PDF
            </button>
          </div>
          <button
            onClick={() => { setApiKeyInput(''); setShowApiKeyModal(true); }}
            className="w-full text-white/30 text-xs py-1 hover:text-white/60 transition-colors text-center"
          >
            🔑 更换 API Key
          </button>
        </div>
      </div>
    </div>
  );
}
