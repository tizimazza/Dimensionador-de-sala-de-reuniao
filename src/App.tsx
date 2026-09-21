import React, { useState } from 'react';
import FrontendView from './views/FrontendView';
import AdminView from './views/AdminView';
import { Monitor, Settings, Download, PackageOpen } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'frontend' | 'admin' | 'download'>('frontend');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Dev Mode Toolbar */}
      <div className="bg-slate-900 text-white p-2 flex flex-wrap justify-center items-center gap-4 text-sm font-medium z-50 shadow-md sticky top-0">
        <span className="text-slate-400 mr-4 font-bold text-xs uppercase tracking-wider">Modo Previsualização:</span>
        <button 
          onClick={() => setView('frontend')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${view === 'frontend' ? 'bg-[#DF1319] text-white shadow-inner' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          <Monitor className="w-4 h-4" />
          Frontend (Shortcode)
        </button>
        <button 
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${view === 'admin' ? 'bg-[#DF1319] text-white shadow-inner' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          <Settings className="w-4 h-4" />
          Admin WordPress
        </button>
        <div className="w-px h-6 bg-slate-700 mx-2 hidden sm:block"></div>
        <button 
          onClick={() => setView('download')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${view === 'download' ? 'bg-emerald-600 text-white shadow-inner' : 'hover:bg-emerald-800 bg-emerald-700 text-white'}`}
        >
          <Download className="w-4 h-4" />
          Exportar Plugin
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        {view === 'frontend' && <FrontendView />}
        {view === 'admin' && <AdminView />}
        {view === 'download' && (
          <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageOpen size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Plugin WordPress Pronto!</h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Seu plugin foi compilado com a estrutura exata para o WordPress (incluindo apenas a pasta <code>/dist</code> e o arquivo principal PHP).
            </p>
            
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                try {
                  btn.innerHTML = "Gerando pacote...";
                  btn.disabled = true;
                  btn.classList.add("opacity-70");
                  
                  const res = await fetch("/api/download-plugin");
                  const data = await res.json();
                  if (!data.success || !data.zipBase64) {
                      throw new Error(data.error || "Falha na geração do ZIP");
                  }
    
                  const byteCharacters = atob(data.zipBase64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], {type: "application/zip"});
                  
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.style.display = "none";
                  a.href = url;
                  a.download = data.filename || "dimensionador-de-sala.zip";
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (err: any) {
                  alert("Erro ao baixar: " + err.message);
                } finally {
                  btn.innerHTML = originalText;
                  btn.disabled = false;
                  btn.classList.remove("opacity-70");
                }
              }}
              className="mx-auto w-full max-w-md py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-md"
            >
              <Download size={24} />
              Baixar ZIP para WordPress
            </button>
            
            <div className="mt-8 text-left bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
              <strong className="block mb-1">Como instalar:</strong>
              1. Acesse seu painel WordPress.<br/>
              2. Vá em <strong>Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong>.<br/>
              3. Envie o arquivo <code>dimensionador-de-sala.zip</code> e ative-o.<br/>
              4. Crie uma página e adicione o shortcode: <code>[dimensionador_de_sala]</code>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
