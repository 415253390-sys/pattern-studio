import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, Image as ImageIcon, Settings, Download, Trash2, 
  RefreshCw, Maximize, Circle, Move, Plus, Layers, Wand2, Pipette, Eraser
} from 'lucide-react';

// --- Helper Functions ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CANVAS_SIZE = 800;
const CENTER = CANVAS_SIZE / 2;

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`文件 ${file.name} 超过 5MB 限制`));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadImage = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// 升级版自动抠图算法：支持容差、全局消除、边缘羽化去白边、多目标颜色
const processBackgroundRemoval = async (imgObj, config) => {
  const { tolerance = 50, global = true, pickColors = [] } = config;
  
  const canvas = document.createElement('canvas');
  canvas.width = imgObj.width;
  canvas.height = imgObj.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgObj, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  let targetColors = [...pickColors];
  if (targetColors.length === 0) {
    // 自动检测左上角边缘作为背景色
    targetColors.push([data[0], data[1], data[2]]);
  }

  const getMinDist = (r, g, b) => {
    let minDist = 999;
    for (let c of targetColors) {
      const dist = Math.sqrt((r-c[0])**2 + (g-c[1])**2 + (b-c[2])**2);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  const smoothRange = 30;

  if (global) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] === 0) continue;
      const dist = getMinDist(data[i], data[i+1], data[i+2]);
      
      if (dist <= tolerance) {
        data[i+3] = 0; 
      } else if (dist <= tolerance + smoothRange) {
        const factor = (dist - tolerance) / smoothRange;
        data[i+3] = Math.floor(data[i+3] * (factor * factor)); 
      }
    }
  } else {
    const stack = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const idx = y * width + x;
      
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pIdx = idx * 4;
      if (data[pIdx + 3] === 0) continue;

      const dist = getMinDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]);

      if (dist <= tolerance) {
        data[pIdx + 3] = 0;
        if (x + 1 < width) stack.push([x + 1, y]);
        if (x - 1 >= 0) stack.push([x - 1, y]);
        if (y + 1 < height) stack.push([x, y + 1]);
        if (y - 1 >= 0) stack.push([x, y - 1]);
      } else if (dist <= tolerance + smoothRange) {
        const factor = (dist - tolerance) / smoothRange;
        data[pIdx + 3] = Math.floor(data[pIdx + 3] * (factor * factor));
        visited[idx] = 1;
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  
  return new Promise((resolve) => {
    const newImg = new Image();
    newImg.onload = () => resolve({ img: newImg, dataUrl });
    newImg.src = dataUrl;
  });
};

// --- UI Components ---
const Slider = ({ label, value, min, max, onChange, unit = '' }) => (
  <div className="mb-4 mt-2">
    <div className="flex justify-between text-xs text-zinc-400 mb-2 font-medium">
      <span>{label}</span>
      <span className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 min-w-[3ch] text-right font-mono">
        {Math.round(value)}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
    />
  </div>
);

const Toggle = ({ checked, onChange, label, activeColor = 'bg-blue-500' }) => (
  <div className="flex items-center justify-between py-2 mt-1">
    <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${checked ? activeColor : 'bg-zinc-700'}`}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  </div>
);

const SectionPanel = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon size={16} className="text-zinc-400" />
          {title}
        </div>
        <div className={`transform transition-transform text-zinc-500 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </div>
      {isOpen && <div className="p-4 pt-0 space-y-2">{children}</div>}
    </div>
  );
};

export default function App() {
  const canvasRef = useRef(null);
  const processTimeouts = useRef({});
  
  // State
  const [centerImage, setCenterImage] = useState(null); 
  const [decorations, setDecorations] = useState([]); 
  const [exportRes, setExportRes] = useState(1);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportTransparent, setExportTransparent] = useState(true); // 透明背景导出设置
  
  // Interaction State
  const [activeDrag, setActiveDrag] = useState(null);
  const [hoveredRingId, setHoveredRingId] = useState(null);
  const [snapData, setSnapData] = useState({ angle: null, radius: null, x: null, y: null });

  // --- Background Removal Process Triggers ---
  const triggerCenterProcess = useCallback((newState) => {
    clearTimeout(processTimeouts.current['center']);
    processTimeouts.current['center'] = setTimeout(async () => {
      if (newState.removeBg) {
        const { img, dataUrl } = await processBackgroundRemoval(newState.originalImg, {
          tolerance: newState.bgTolerance,
          global: newState.bgGlobal,
          pickColors: newState.bgPickColors
        });
        setCenterImage(prev => prev ? { ...prev, img, dataUrl } : null);
      } else {
        setCenterImage(prev => prev ? { ...prev, img: prev.originalImg, dataUrl: prev.originalDataUrl } : null);
      }
    }, 200);
  }, []);

  const triggerDecProcess = useCallback((id, newState) => {
    clearTimeout(processTimeouts.current[id]);
    processTimeouts.current[id] = setTimeout(async () => {
      if (newState.removeBg) {
        const { img, dataUrl } = await processBackgroundRemoval(newState.originalImg, {
          tolerance: newState.bgTolerance,
          global: newState.bgGlobal,
          pickColors: newState.bgPickColors
        });
        setDecorations(prev => prev.map(d => d.id === id ? { ...d, img, dataUrl } : d));
      } else {
        setDecorations(prev => prev.map(d => d.id === id ? { ...d, img: d.originalImg, dataUrl: d.originalDataUrl } : d));
      }
    }, 200);
  }, []);

  // --- Core Drawing Logic ---
  const drawScene = useCallback((ctx, isExport = false, scaleFactor = 1) => {
    const size = CANVAS_SIZE * scaleFactor;
    const center = size / 2;

    if (!isExport) {
      // Editor background
      ctx.fillStyle = '#0b1121';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 40 * scaleFactor;
      for (let i = 0; i <= size; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      [100, 200, 300, 400].forEach(r => {
        ctx.beginPath(); 
        ctx.arc(center, center, r * scaleFactor, 0, Math.PI * 2); 
        ctx.stroke();
      });

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath(); ctx.moveTo(center, 0); ctx.lineTo(center, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, center); ctx.lineTo(size, center); ctx.stroke();

      ctx.beginPath(); 
      ctx.arc(center, center, 8 * scaleFactor, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; 
      ctx.stroke();
      
      ctx.beginPath(); 
      ctx.arc(center, center, 3 * scaleFactor, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; 
      ctx.fill();
    } else {
      // Export mode background behavior
      if (exportFormat === 'jpg' || !exportTransparent) {
        ctx.fillStyle = '#0b1121';
        ctx.fillRect(0, 0, size, size);
      } else {
        ctx.clearRect(0, 0, size, size); // Transparent for PNG/SVG
      }
    }

    if (centerImage) {
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate((centerImage.rotation * Math.PI) / 180);
      const w = centerImage.img.width * (centerImage.scale / 100) * scaleFactor;
      const h = centerImage.img.height * (centerImage.scale / 100) * scaleFactor;
      ctx.drawImage(centerImage.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    decorations.forEach((dec) => {
      for (let i = 0; i < dec.count; i++) {
        const angleDeg = (360 / dec.count) * i + dec.angleOffset;
        const angleRad = (angleDeg * Math.PI) / 180;
        const r = dec.radius * scaleFactor;
        const x = center + r * Math.cos(angleRad);
        const y = center + r * Math.sin(angleRad);

        ctx.save();
        ctx.translate(x, y);

        // 计算最终旋转角度：如果开启了朝向中心，则在用户自定义旋转角度基础上，附加指向圆心的切角调整 (90度偏移)
        let finalRotationRad = (dec.rotation * Math.PI) / 180;
        if (dec.faceCenter) {
          finalRotationRad += angleRad + Math.PI / 2;
        }
        ctx.rotate(finalRotationRad);

        const w = dec.img.width * (dec.scale / 100) * scaleFactor;
        const h = dec.img.height * (dec.scale / 100) * scaleFactor;
        ctx.drawImage(dec.img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    });

    if (!isExport) {
      decorations.forEach((dec) => {
        const isHovered = hoveredRingId === dec.id;
        const isDragging = activeDrag?.id === dec.id;
        
        if (isHovered || isDragging) {
          ctx.beginPath();
          ctx.arc(center, center, dec.radius, 0, Math.PI * 2);
          ctx.strokeStyle = isDragging ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)';
          ctx.lineWidth = isDragging ? 2 : 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          for (let i = 0; i < dec.count; i++) {
             const angleRad = ((360 / dec.count) * i + dec.angleOffset) * Math.PI / 180;
             const nx = center + dec.radius * Math.cos(angleRad);
             const ny = center + dec.radius * Math.sin(angleRad);
             ctx.beginPath();
             ctx.arc(nx, ny, 4, 0, Math.PI * 2);
             ctx.fillStyle = '#3b82f6';
             ctx.fill();
          }
        }
      });

      if (activeDrag && snapData.angle !== null) {
         ctx.beginPath();
         ctx.moveTo(center, center);
         const endX = center + 600 * Math.cos(snapData.angle * Math.PI / 180);
         const endY = center + 600 * Math.sin(snapData.angle * Math.PI / 180);
         ctx.lineTo(endX, endY);
         ctx.strokeStyle = '#ef4444'; 
         ctx.lineWidth = 1;
         ctx.stroke();
      }
      
      if (activeDrag && snapData.x !== null) {
         ctx.fillStyle = 'rgba(11, 17, 33, 0.85)';
         ctx.padding = 4;
         ctx.fillRect(snapData.x + 15, snapData.y + 15, 90, 40);
         ctx.fillStyle = '#fff';
         ctx.font = '12px sans-serif';
         const currentDec = decorations.find(d => d.id === activeDrag.id);
         if(currentDec){
            ctx.fillText(`半径: ${Math.round(currentDec.radius)}px`, snapData.x + 24, snapData.y + 30);
            ctx.fillText(`角度: ${Math.round(currentDec.angleOffset)}°`, snapData.x + 24, snapData.y + 45);
         }
      }
    }
  }, [centerImage, decorations, exportFormat, exportTransparent, hoveredRingId, activeDrag, snapData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawScene(ctx);
  }, [drawScene]);

  // --- Handlers ---
  const handleUploadCenter = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file);
      const img = await loadImage(dataUrl);

      // Default background removal configs
      const initConfig = { tolerance: 60, global: true, pickColors: [] };
      const processed = await processBackgroundRemoval(img, initConfig);

      setCenterImage({ 
        id: Date.now().toString(), 
        originalFile: file,
        originalImg: img, 
        originalDataUrl: dataUrl,
        img: processed.img, 
        dataUrl: processed.dataUrl, 
        scale: 100, 
        rotation: 0,
        removeBg: true, // 默认开启智能抠图
        bgTolerance: 60,
        bgGlobal: true,
        bgPickColors: []
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCenterBgChange = (updates) => {
    setCenterImage(prev => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        if ('removeBg' in updates || 'bgTolerance' in updates || 'bgGlobal' in updates || 'bgPickColors' in updates) {
            triggerCenterProcess(next);
        }
        return next;
    });
  };

  const handleUploadDecoration = async (e) => {
    try {
      const files = Array.from(e.target.files).slice(0, 8 - decorations.length);
      if (files.length === 0) return;
      
      const newDecs = [];
      for (const file of files) {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImage(dataUrl);

        // Default background removal configs
        const initConfig = { tolerance: 60, global: true, pickColors: [] };
        const processed = await processBackgroundRemoval(img, initConfig);

        newDecs.push({
          id: Date.now().toString() + Math.random(),
          originalFile: file,
          originalImg: img, 
          originalDataUrl: dataUrl,
          img: processed.img, 
          dataUrl: processed.dataUrl, 
          count: 4, radius: 200, angleOffset: 0, scale: 50, rotation: 0,
          faceCenter: false, 
          removeBg: true, // 默认开启智能抠图
          bgTolerance: 60, bgGlobal: true, bgPickColors: []
        });
      }
      setDecorations([...decorations, ...newDecs].slice(0, 8));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDecBgChange = (id, updates) => {
    setDecorations(prev => {
        const decIndex = prev.findIndex(d => d.id === id);
        if (decIndex === -1) return prev;
        const nextDec = { ...prev[decIndex], ...updates };
        const nextList = [...prev];
        nextList[decIndex] = nextDec;
        if ('removeBg' in updates || 'bgTolerance' in updates || 'bgGlobal' in updates || 'bgPickColors' in updates) {
            triggerDecProcess(id, nextDec);
        }
        return nextList;
    });
  };

  const handlePreviewClick = (e, item, isCenter) => {
    if (!item.removeBg) return;
    const rect = e.target.getBoundingClientRect();
    const imgRatio = item.originalImg.width / item.originalImg.height;
    const boxRatio = rect.width / rect.height;

    let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
    if (imgRatio > boxRatio) {
        renderWidth = rect.width;
        renderHeight = rect.width / imgRatio;
        offsetY = (rect.height - renderHeight) / 2;
    } else {
        renderHeight = rect.height;
        renderWidth = rect.height * imgRatio;
        offsetX = (rect.width - renderWidth) / 2;
    }

    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;

    if (clickX >= 0 && clickX <= renderWidth && clickY >= 0 && clickY <= renderHeight) {
        const actualX = Math.floor((clickX / renderWidth) * item.originalImg.width);
        const actualY = Math.floor((clickY / renderHeight) * item.originalImg.height);

        const canvas = document.createElement('canvas');
        canvas.width = item.originalImg.width;
        canvas.height = item.originalImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(item.originalImg, 0, 0);
        const pixel = ctx.getImageData(actualX, actualY, 1, 1).data;
        
        if (pixel[3] < 10) return;

        const newColors = [...(item.bgPickColors || []), [pixel[0], pixel[1], pixel[2]]];
        if (isCenter) {
            handleCenterBgChange({ bgPickColors: newColors });
        } else {
            handleDecBgChange(item.id, { bgPickColors: newColors });
        }
    }
  };

  // --- Canvas Interaction Logic ---
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    if (!hoveredRingId) return;
    setActiveDrag({ id: hoveredRingId, type: 'radius-angle' });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const pos = getMousePos(e);
    const dx = pos.x - CENTER;
    const dy = pos.y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    if (activeDrag) {
      let newRadius = dist;
      let newAngle = angle;
      let sAngle = null;
      let sRadius = null;

      for (let a = 0; a <= 360; a += 45) {
          let diff = Math.abs(newAngle - a);
          if (diff > 180) diff = 360 - diff; 
          if (diff < 5) { newAngle = a; sAngle = a; break; }
      }
      for (let r = 50; r <= 400; r += 50) {
          if (Math.abs(newRadius - r) < 10) { newRadius = r; sRadius = r; break; }
      }

      setSnapData({ angle: sAngle, radius: sRadius, x: pos.x, y: pos.y });
      setDecorations(decs => decs.map(d => 
        d.id === activeDrag.id 
          ? { ...d, radius: Math.max(10, Math.min(newRadius, 400)), angleOffset: newAngle } 
          : d
      ));
    } else {
      let hovered = null;
      for (let i = decorations.length - 1; i >= 0; i--) {
        if (Math.abs(dist - decorations[i].radius) < 15) { hovered = decorations[i].id; break; }
      }
      setHoveredRingId(hovered);
      canvasRef.current.style.cursor = hovered ? 'grab' : 'default';
    }
  };

  const handlePointerUp = (e) => {
    setActiveDrag(null);
    setSnapData({ angle: null, radius: null, x: null, y: null });
    e.target.releasePointerCapture(e.pointerId);
    if(hoveredRingId) canvasRef.current.style.cursor = 'grab';
  };

  // --- Export Logic ---
  const generateSVG = () => {
    const size = CANVAS_SIZE * exportRes;
    const center = size / 2;
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    if (exportFormat === 'jpg' || !exportTransparent) {
        svgContent += `<rect width="100%" height="100%" fill="#0b1121"/>`;
    } else {
        svgContent += `<rect width="100%" height="100%" fill="transparent"/>`;
    }

    if (centerImage) {
      const w = centerImage.img.width * (centerImage.scale / 100) * exportRes;
      const h = centerImage.img.height * (centerImage.scale / 100) * exportRes;
      svgContent += `
        <g transform="translate(${center}, ${center}) rotate(${centerImage.rotation})">
          <image href="${centerImage.dataUrl}" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}"/>
        </g>
      `;
    }

    decorations.forEach((dec) => {
      for (let i = 0; i < dec.count; i++) {
        const angleDeg = (360 / dec.count) * i + dec.angleOffset;
        const angleRad = (angleDeg * Math.PI) / 180;
        const r = dec.radius * exportRes;
        const x = center + r * Math.cos(angleRad);
        const y = center + r * Math.sin(angleRad);
        const w = dec.img.width * (dec.scale / 100) * exportRes;
        const h = dec.img.height * (dec.scale / 100) * exportRes;

        // SVG 中的旋转逻辑同步
        let finalRotationRad = (dec.rotation * Math.PI) / 180;
        if (dec.faceCenter) {
          finalRotationRad += angleRad + Math.PI / 2;
        }
        const finalRotationDeg = finalRotationRad * 180 / Math.PI;

        svgContent += `
          <g transform="translate(${x}, ${y}) rotate(${finalRotationDeg})">
            <image href="${dec.dataUrl}" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}"/>
          </g>
        `;
      }
    });

    svgContent += `</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  };

  const handleExport = () => {
    let downloadUrl = '';
    if (exportFormat === 'svg') {
      downloadUrl = generateSVG();
    } else {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_SIZE * exportRes;
      exportCanvas.height = CANVAS_SIZE * exportRes;
      const ctx = exportCanvas.getContext('2d');
      drawScene(ctx, true, exportRes);
      downloadUrl = exportCanvas.toDataURL(`image/${exportFormat}`, 0.9);
    }
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `pattern-design_${exportRes}x.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 w-full flex flex-col md:flex-row bg-zinc-950 text-zinc-300 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Left Panel - Controls (手机端下放，桌面端居左) */}
      <div className="flex-1 md:flex-none w-full md:w-80 bg-zinc-900 border-t md:border-t-0 md:border-r border-zinc-800 flex flex-col z-10 shadow-2xl overflow-y-auto custom-scrollbar order-2 md:order-1 shrink-0">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/95 sticky top-0 backdrop-blur-md z-20">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="text-purple-500" size={18} />
            Pattern Studio
          </h1>
        </div>

        <SectionPanel title="中心图案模块" icon={Circle}>
          {centerImage ? (
            <div className="space-y-1">
              <div 
                className={`relative group rounded-lg overflow-hidden border transition-all h-32 flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3PBEWwYhQxqmBkYGBgYIQrAAgwAF2VAiB+K8e/AAAAAElFTkSuQmCC')] ${centerImage.removeBg ? 'cursor-crosshair border-purple-500 ring-2 ring-purple-500/20' : 'border-zinc-700 bg-zinc-800'}`}
                onClick={(e) => handlePreviewClick(e, centerImage, true)}
              >
                 <img src={centerImage.dataUrl} alt="center" className="max-h-full max-w-full object-contain p-2 drop-shadow-xl pointer-events-none" />
                 
                 {/* Tips Overlay */}
                 {centerImage.removeBg && (
                    <div className="absolute bottom-0 inset-x-0 bg-purple-900/80 backdrop-blur text-[10px] text-purple-100 py-1 text-center font-medium border-t border-purple-500/50 pointer-events-none">
                      点击图像吸取要抠除的背景色
                    </div>
                 )}

                 <button 
                    onClick={(e) => { e.stopPropagation(); setCenterImage(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow"
                 >
                   <Trash2 size={14} />
                 </button>
              </div>

              {/* Advanced BG Removal Controls */}
              <div className="py-2">
                <Toggle 
                  label={<><Wand2 size={13} className={centerImage.removeBg ? "text-purple-400" : "text-zinc-500"} /> 自动抠图提取</>}
                  checked={centerImage.removeBg} 
                  onChange={(val) => handleCenterBgChange({ removeBg: val })}
                  activeColor="bg-purple-500"
                />
                
                {centerImage.removeBg && (
                  <div className="mt-2 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/80 space-y-3 relative">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-zinc-400 flex items-center gap-1"><Pipette size={12}/> 已吸取颜色</span>
                       {centerImage.bgPickColors?.length > 0 && (
                         <button onClick={() => handleCenterBgChange({ bgPickColors: [] })} className="text-[10px] text-zinc-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800"><Eraser size={10}/> 清空</button>
                       )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {centerImage.bgPickColors?.length > 0 ? centerImage.bgPickColors.map((color, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-zinc-600 shadow-inner" style={{ backgroundColor: `rgb(${color[0]},${color[1]},${color[2]})` }} />
                      )) : <span className="text-[10px] text-zinc-600 italic">默认边缘智能识别 (可手动点击灰框/黑底)</span>}
                    </div>

                    <Toggle label="全局穿透抠图 (清理内部孤岛)" checked={centerImage.bgGlobal} onChange={(val) => handleCenterBgChange({ bgGlobal: val })} activeColor="bg-purple-500" />
                    <Slider label="抠除容差 (消除白边锯齿)" value={centerImage.bgTolerance} min={0} max={150} onChange={(val) => handleCenterBgChange({ bgTolerance: val })} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                <Slider label="缩放比例" value={centerImage.scale} min={10} max={200} unit="%"
                  onChange={(val) => setCenterImage({ ...centerImage, scale: val })} />
                <Slider label="旋转角度" value={centerImage.rotation} min={0} max={360} unit="°"
                  onChange={(val) => setCenterImage({ ...centerImage, rotation: val })} />
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all">
              <Upload size={24} className="text-zinc-500 mb-2" />
              <span className="text-xs text-zinc-500 font-medium">点击上传中心图案</span>
              <span className="text-[10px] text-zinc-600 mt-1">JPG / PNG / SVG &lt; 5MB</span>
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.svg" onChange={handleUploadCenter} />
            </label>
          )}
        </SectionPanel>

        <SectionPanel title={`外围装饰图案 (${decorations.length}/8)`} icon={RefreshCw}>
          {decorations.length < 8 && (
            <label className="flex items-center justify-center gap-2 w-full py-2 px-4 mb-3 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-zinc-700">
              <Plus size={16} /> 添加层
              <input type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.svg" onChange={handleUploadDecoration} />
            </label>
          )}
          
          <div className="space-y-4">
            {decorations.map((dec, index) => (
              <div 
                key={dec.id} 
                className={`p-3 bg-zinc-950 rounded-lg border transition-colors duration-200 ${hoveredRingId === dec.id || activeDrag?.id === dec.id ? 'border-purple-500' : 'border-zinc-800'}`}
                onMouseEnter={() => setHoveredRingId(dec.id)}
                onMouseLeave={() => setHoveredRingId(null)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                       className={`w-10 h-10 rounded border flex items-center justify-center overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3PBEWwYhQxqmBkYGBgYIQrAAgwAF2VAiB+K8e/AAAAAElFTkSuQmCC')] ${dec.removeBg ? 'cursor-crosshair border-purple-500 ring-1 ring-purple-500' : 'border-zinc-700 bg-zinc-800'}`}
                       onClick={(e) => handlePreviewClick(e, dec, false)}
                       title={dec.removeBg ? "点击吸取颜色" : ""}
                    >
                       <img src={dec.dataUrl} className="max-w-full max-h-full object-contain drop-shadow-md pointer-events-none" alt="dec" />
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-zinc-300">图层 {index + 1}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Wand2 size={10}/>自动抠图</span>
                        <button
                          type="button"
                          onClick={() => handleDecBgChange(dec.id, { removeBg: !dec.removeBg })}
                          className={`relative inline-flex h-3 w-5 items-center rounded-full transition-colors ${dec.removeBg ? 'bg-purple-500' : 'bg-zinc-700'}`}
                        >
                          <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${dec.removeBg ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setDecorations(decorations.filter(d => d.id !== dec.id))} className="text-zinc-500 hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {dec.removeBg && (
                  <div className="mb-3 p-2 bg-zinc-900/80 rounded border border-zinc-800/80">
                     <Toggle label="全局穿透抠图" checked={dec.bgGlobal} onChange={(val) => handleDecBgChange(dec.id, { bgGlobal: val })} activeColor="bg-purple-500" />
                     <Slider label="容差去白边" value={dec.bgTolerance} min={0} max={150} onChange={(val) => handleDecBgChange(dec.id, { bgTolerance: val })} />
                  </div>
                )}

                <Slider label="阵列数量" value={dec.count} min={2} max={12} unit="个"
                  onChange={(val) => setDecorations(decs => decs.map(d => d.id === dec.id ? { ...d, count: val } : d))} />
                <Slider label="环绕半径 (可画布拖拽)" value={dec.radius} min={0} max={500} unit="px"
                  onChange={(val) => setDecorations(decs => decs.map(d => d.id === dec.id ? { ...d, radius: val } : d))} />
                <Slider label="分布角度 (可画布拖拽)" value={dec.angleOffset} min={0} max={360} unit="°"
                  onChange={(val) => setDecorations(decs => decs.map(d => d.id === dec.id ? { ...d, angleOffset: val } : d))} />
                
                <Toggle 
                  label="图案底部朝向中心" 
                  checked={dec.faceCenter} 
                  onChange={(val) => setDecorations(decs => decs.map(d => d.id === dec.id ? { ...d, faceCenter: val } : d))}
                  activeColor="bg-purple-500"
                />

                <div className="grid grid-cols-2 gap-3 mt-1 pt-1 border-t border-zinc-800/50">
                  <Slider label="缩放" value={dec.scale} min={10} max={200} unit="%"
                    onChange={(val) => setDecorations(decs => decs.map(d => d.id === dec.id ? { ...d, scale: val } : d))} />
                  <Slider label="附加旋转" value={dec.rotation} min={0} max={360} unit="°"
                    onChange={(val) => setDecorations(decs => decs.map(d => d.id === dec.id ? { ...d, rotation: val } : d))} />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="导出设置" icon={Download}>
          <div className="space-y-4">
            <div>
               <span className="block text-xs text-zinc-400 mb-2 font-medium">格式</span>
               <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                 {['png', 'jpg', 'svg'].map(fmt => (
                   <button 
                     key={fmt}
                     onClick={() => setExportFormat(fmt)}
                     className={`flex-1 py-1.5 text-xs font-medium rounded ${exportFormat === fmt ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >
                     {fmt.toUpperCase()}
                   </button>
                 ))}
               </div>
            </div>
            
            {exportFormat !== 'svg' && (
              <div>
                <span className="block text-xs text-zinc-400 mb-2 font-medium">分辨率</span>
                <div className="flex bg-zinc-95
