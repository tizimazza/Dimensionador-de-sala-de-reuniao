import React, { useState, useEffect } from 'react';
import { WPSettings } from '../types';
import { Settings, Save, CheckCircle2, List } from 'lucide-react';
import { INITIAL_SIZING_CONFIG } from '../data/sizingConfig';

export default function AdminView() {
  const [settings, setSettings] = useState<WPSettings>({
    hubspotKey: '',
    copyEmail: '',
    productSkus: {},
    colors: { selection: '#df1319', action: '#9ebf24' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Collect all products from the config to generate the fields
  const allProducts = INITIAL_SIZING_CONFIG.catalog;

  useEffect(() => {
    // Carregar do ambiente (no WP real isso vem do wp_localize_script via window.discabosSalaCalcSettings)
    const wpSettings = (window as any).discabosSalaCalcSettings;
    if (wpSettings) {
       setSettings({
          hubspotKey: wpSettings.hubspotKey || '',
          copyEmail: wpSettings.copyEmail || '',
          productSkus: wpSettings.productSkus || {},
          colors: wpSettings.colors || { selection: '#df1319', action: '#9ebf24' }
       });
       return;
    }

    // Fallback: Carregar do localStorage no ambiente de preview/dev
    const savedSettings = localStorage.getItem('discabos_sala_wp_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // No ambiente WordPress Real
    const wpSettings = (window as any).discabosSalaCalcSettings;
    if (wpSettings && wpSettings.ajaxUrl) {
       try {
          await fetch(wpSettings.ajaxUrl + 'settings', {
             method: 'POST',
             headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
             },
             body: JSON.stringify(settings)
          });
       } catch (e) {
          console.error('Failed to save via REST API', e);
       }
    } else {
       // Simular no Preview Local
       await new Promise(resolve => setTimeout(resolve, 800));
       localStorage.setItem('discabos_sala_wp_settings', JSON.stringify(settings));
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (field: keyof WPSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleProductSkuChange = (id: string, value: string) => {
    setSettings(prev => ({
       ...prev,
       productSkus: {
          ...prev.productSkus,
          [id]: value
       }
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 my-8">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações do Plugin</h2>
          <p className="text-slate-500 text-sm">Ajustes gerais para o Dimensionador de Salas de Reunião</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 flex flex-col sm:flex-row items-center justify-between">
        <div>
          <strong className="block text-sm">Como usar no site:</strong>
          <span className="text-sm">Copie o shortcode ao lado e cole em qualquer página ou post do WordPress.</span>
        </div>
        <div className="mt-2 sm:mt-0 bg-white px-3 py-1.5 rounded border border-blue-200 font-mono text-sm shadow-sm select-all">
          [dimensionador_de_sala]
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Chave de API do HubSpot</label>
          <p className="text-xs text-slate-500 mb-2">Token de acesso privado (Private App) para envio de leads.</p>
          <input 
            type="password" 
            value={settings.hubspotKey}
            onChange={e => handleChange('hubspotKey', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#DF1319] font-mono text-sm"
            placeholder="pat-na1-xxxx..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">E-mail para Cópia Oculta</label>
          <p className="text-xs text-slate-500 mb-2">E-mail que receberá os orçamentos solicitados pelos clientes no frontend.</p>
          <input 
            type="email" 
            value={settings.copyEmail}
            onChange={e => handleChange('copyEmail', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#DF1319]"
            placeholder="vendas@discabos.com.br"
          />
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Cores do Aplicativo</h3>
          <p className="text-sm text-slate-500 mb-4">Ajuste as cores principais para combinar com a identidade visual do seu site.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cor de Seleção (Primária)</label>
              <p className="text-xs text-slate-500 mb-2">Usada em botões de adicionar e itens selecionados.</p>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={settings.colors?.selection || '#df1319'}
                  onChange={e => setSettings(s => ({...s, colors: {...(s.colors || {selection:'', action:''}), selection: e.target.value}}))}
                  className="w-10 h-10 border-0 p-0 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.colors?.selection || '#df1319'}
                  onChange={e => setSettings(s => ({...s, colors: {...(s.colors || {selection:'', action:''}), selection: e.target.value}}))}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cor de Ação (Secundária)</label>
              <p className="text-xs text-slate-500 mb-2">Usada nos botões inferiores como "Enviar E-mail" e "Novo Cálculo".</p>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={settings.colors?.action || '#9ebf24'}
                  onChange={e => setSettings(s => ({...s, colors: {...(s.colors || {selection:'', action:''}), action: e.target.value}}))}
                  className="w-10 h-10 border-0 p-0 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.colors?.action || '#9ebf24'}
                  onChange={e => setSettings(s => ({...s, colors: {...(s.colors || {selection:'', action:''}), action: e.target.value}}))}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <List size={20} className="text-slate-500" />
            <h3 className="text-lg font-bold text-slate-800">SKUs dos Produtos</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Mapeie os produtos lógicos da calculadora para os SKUs reais da sua loja. Deixe em branco se o produto não estiver no catálogo (ele será exibido no orçamento sem link e sem botão de comprar).</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allProducts.map(product => {
               const isAirtame = product.id === 'wireless_airtame';
               return (
               <div key={product.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                 <label className="block text-xs font-bold text-slate-700 mb-1">{product.name}</label>
                 <div className="text-[10px] text-slate-400 mb-2">ID Interno: {product.id} {isAirtame ? '(Requer Link)' : ''}</div>
                 <input 
                   type="text" 
                   value={settings.productSkus[product.id] !== undefined ? settings.productSkus[product.id] : product.sku}
                   onChange={e => handleProductSkuChange(product.id, e.target.value)}
                   className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-[#DF1319]"
                   placeholder={isAirtame ? "https://..." : `Ex: ${product.sku}`}
                 />
                 {isAirtame && <div className="text-[10px] text-blue-600 mt-1 font-semibold">Insira o link da página do produto aqui, ao invés do SKU.</div>}
               </div>
               )
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
        {saved && <span className="text-green-600 flex items-center gap-1 text-sm font-semibold"><CheckCircle2 size={16} /> Salvo com sucesso!</span>}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
