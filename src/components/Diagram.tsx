import React from 'react';
import { ProjectInputs, SizingResult } from '../types';

export default function Diagram({ inputs, sizing }: { inputs: ProjectInputs, sizing: SizingResult }) {
  if (!sizing.diagramData) return null;

  const data = sizing.diagramData;
  const roomW = Math.max(data.roomW, 3);
  const roomL = Math.max(data.roomL, 3);
  
  // Set drawing scale where the max room dimension fills ~600px
  const maxDim = Math.max(roomW, roomL);
  const scale = 600 / maxDim;
  const svgW = roomW * scale;
  const svgH = roomL * scale;

  // Table dims
  const tw = (data.tableW || Math.min(roomW * 0.4, 1.2)) * scale;
  const tl = (data.tableL || Math.min(roomL * 0.6, 2.4)) * scale;
  const tx = (svgW - tw) / 2;
  const dispH = 0.15 * scale; // Display height calculation reference
  const ty = data.tableAttachedToWall ? dispH + 20 : (svgH - tl) / 2;

  // Calculate chairs
  const chairs = [];
  const totalChairs = data.people || 4;
  const chairSize = 0.5 * scale;
  
  const isOdd = totalChairs % 2 !== 0;
  const sideChairsTotal = isOdd ? totalChairs - 1 : totalChairs;
  const chairsPerSide = sideChairsTotal / 2;
  const spacing = tl / (chairsPerSide + 1);
  
  for(let i = 1; i <= chairsPerSide; i++) {
    const yPos = ty + (spacing * i);
    chairs.push({ cx: tx - chairSize/2 - 15, cy: yPos }); // Left
    chairs.push({ cx: tx + tw + chairSize/2 + 15, cy: yPos }); // Right
  }

  // Head of table (opposite screen) for odd numbers
  if (isOdd) {
    chairs.push({ cx: tx + tw / 2, cy: ty + tl + chairSize/2 + 15 });
  }

  // Calculate displays (top wall)
  const displays = [];
  const dispW = 1.2 * scale;
  const gap = 20;
  const totalDispW = (data.displays * dispW) + ((data.displays - 1) * gap);
  const startX = (svgW - totalDispW) / 2;
  
  for(let i=0; i<data.displays; i++) {
    displays.push({ x: startX + (i * (dispW + gap)), y: 0, w: dispW, h: dispH });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Floor Plan */}
      <div className="w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm overflow-hidden flex flex-col items-center">
        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Planta Baixa (Layout da Sala)</h3>
        <div className="relative border-4 border-slate-300 bg-slate-50" style={{ width: svgW, height: svgH }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Displays */}
            {displays.map((d, i) => (
              <g key={`disp-${i}`}>
                <rect x={d.x} y={d.y} width={d.w} height={d.h} fill="#1e293b" rx="4" />
                <text x={d.x + d.w/2} y={d.y + 12} fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">TELA</text>
              </g>
            ))}

            {/* Camera */}
            <circle cx={svgW/2} cy={dispH + 10} r="10" fill="#DF1319" />
            <path d={`M ${svgW/2 - 15} ${dispH + 10} L ${svgW/2 + 15} ${dispH + 10} L ${svgW/2} ${dispH + 35} Z`} fill="rgba(223, 19, 25, 0.2)" />
            <text x={svgW/2 + 20} y={dispH + 14} fill="#DF1319" fontSize="12" fontWeight="bold">CÂMERA</text>

            {/* Cables (Table to Display) */}
            <path d={`M ${svgW/2} ${ty} L ${svgW/2} ${dispH}`} stroke="#0072CE" strokeWidth="3" strokeDasharray="5,5" fill="none" />
            <text x={svgW/2 + 5} y={ty - 30} fill="#0072CE" fontSize="11" fontWeight="bold">CABOS/TUBULAÇÃO</text>

            {/* Chairs */}
            {chairs.map((c, i) => (
               <circle key={`chair-${i}`} cx={c.cx} cy={c.cy} r={chairSize/2} fill="#94a3b8" />
            ))}

            {/* Table */}
            <rect x={tx} y={ty} width={tw} height={tl} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" rx="10" />

            {/* Audio on Table */}
            {data.audio === 'table' ? (
              Array.from({length: data.bm35Count}).map((_, i) => {
                const yPos = data.bm35Count === 1 ? ty + (tl/2) : ty + (tl/3) * (i+1);
                return (
                  <g key={`bm35-${i}`}>
                    <circle cx={tx + tw/2} cy={yPos} r="15" fill="#0f172a" />
                    <circle cx={tx + tw/2} cy={yPos} r={6 * scale} fill="none" stroke="rgba(15, 23, 42, 0.1)" strokeWidth="2" strokeDasharray="4,4" />
                    <text x={tx + tw/2 + 20} y={yPos + 4} fill="#0f172a" fontSize="11" fontWeight="bold">BM35</text>
                  </g>
                )
              })
            ) : (
              <g>
                <rect x={tx + tw/2 - 30} y={ty + tl/2 - 30} width="60" height="60" fill="rgba(223, 19, 25, 0.1)" stroke="#DF1319" strokeWidth="2" strokeDasharray="4,4" />
                <text x={tx + tw/2} y={ty + tl/2 + 4} fill="#DF1319" fontSize="11" fontWeight="bold" textAnchor="middle">MIC TETO</text>
              </g>
            )}

            {/* Equipment Core / Airtame / Dock */}
            <rect x={tx + tw/2 - 20} y={ty + 10} width="40" height="20" fill="#334155" rx="3" />
            <text x={tx + tw/2} y={ty + 23} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">
              {data.wireless ? 'AIRTAME' : 'DOCK'}
            </text>
          </svg>
        </div>
        <div className="mt-4 text-sm text-slate-500 flex gap-6">
           <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#DF1319]"></div> Câmera / Captação Teto</span>
           <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0f172a]"></div> Captação Mesa</span>
           <span className="flex items-center gap-2"><div className="w-4 h-1 bg-[#0072CE] border-dashed border"></div> Infra / Cabos</span>
        </div>
      </div>

      {/* Logic Connection Diagram */}
      <div className="w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm overflow-hidden flex flex-col items-center">
        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Diagrama de Conexões (Topologia)</h3>
        <svg width="100%" viewBox="0 0 700 350" className="bg-slate-50 border border-slate-200 rounded" style={{ maxWidth: '700px' }}>
          
          {/* Base Nodes */}
          {/* Laptop */}
          <rect x="30" y="140" width="120" height="60" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <text x="90" y="170" fill="#334155" fontSize="14" fontWeight="bold" textAnchor="middle">User / Notebook</text>
          <text x="90" y="185" fill="#64748b" fontSize="11" textAnchor="middle">Traga sua reunião</text>

          {/* Central Hub (Dock or Airtame) */}
          <rect x="250" y="140" width="140" height="60" rx="8" fill="#DF1319" />
          <text x="320" y="170" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">{data.wireless ? 'Mini PC + Airtame' : 'Docking AVLink'}</text>
          <text x="320" y="185" fill="rgba(255,255,255,0.8)" fontSize="11" textAnchor="middle">Central (Na Mesa)</text>

          {/* Peripherals */}
          {/* Display */}
          <rect x="520" y="40" width="130" height="50" rx="4" fill="#1e293b" />
          <text x="585" y="65" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">{data.displays > 1 ? `${data.displays}x Telas` : 'Tela / Display'}</text>
          <text x="585" y="78" fill="#94a3b8" fontSize="10" textAnchor="middle">Parede</text>

          {/* Camera */}
          <rect x="520" y="145" width="130" height="50" rx="4" fill="#1e293b" />
          <text x="585" y="170" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">Câmera PTZ / ePTZ</text>
          <text x="585" y="183" fill="#94a3b8" fontSize="10" textAnchor="middle">Parede / Suporte</text>

          {/* Audio */}
          <rect x="520" y="250" width="130" height="50" rx="4" fill="#1e293b" />
          <text x="585" y="275" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">{data.audio === 'ceiling' ? 'Mic Teto ClearOne' : `${data.bm35Count}x Speakerphone BM35`}</text>
          <text x="585" y="288" fill="#94a3b8" fontSize="10" textAnchor="middle">{data.audio === 'ceiling' ? 'Embutido no Teto' : 'Mesa'}</text>

          {/* Lines */}
          <g stroke="#0072CE" strokeWidth="3" fill="none">
             {/* Laptop to Hub */}
             <path d="M 150 170 L 250 170" strokeDasharray={data.wireless ? "5,5" : "none"} />
             
             {/* Hub to Display */}
             <path d="M 390 155 L 450 155 L 450 65 L 520 65" />
             
             {/* Hub to Camera */}
             <path d="M 390 170 L 520 170" />
             
             {/* Hub to Audio */}
             <path d="M 390 185 L 450 185 L 450 275 L 520 275" />
          </g>

          {/* Labels for lines */}
          <text x="200" y="160" fill="#334155" fontSize="10" fontWeight="bold" textAnchor="middle">{data.wireless ? 'Sem Fio (WiFi)' : 'USB-C / HDMI'}</text>
          <text x="475" y="60" fill="#0072CE" fontSize="10" fontWeight="bold" textAnchor="middle">HDMI</text>
          <text x="475" y="165" fill="#0072CE" fontSize="10" fontWeight="bold" textAnchor="middle">USB</text>
          <text x="475" y="270" fill="#0072CE" fontSize="10" fontWeight="bold" textAnchor="middle">USB / Áudio</text>

        </svg>
      </div>
    </div>
  )
}
