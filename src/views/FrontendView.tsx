import React, { useState, useEffect, useRef } from 'react';
import { ProjectInputs } from '../types';
import { INITIAL_SIZING_CONFIG } from '../data/sizingConfig';
import { calculateSizing } from '../utils/sizingEngine';
import { Settings, Send, AlertCircle, ChevronRight, ChevronLeft, CheckCircle2, ExternalLink, Package } from 'lucide-react';
import html2canvas from 'html2canvas';
import Diagram from '../components/Diagram';

export default function FrontendView() {
  const [step, setStep] = useState(1);
  const [wooProducts, setWooProducts] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [customConfig, setCustomConfig] = useState(INITIAL_SIZING_CONFIG);
  
  useEffect(() => {
     const wpSettingsGlobal = (window as any).discabosSalaCalcSettings;
     if (wpSettingsGlobal && wpSettingsGlobal.productSkus && Object.keys(wpSettingsGlobal.productSkus).length > 0) {
        const productSkus = wpSettingsGlobal.productSkus;
        const newConfig = { ...INITIAL_SIZING_CONFIG };
        newConfig.catalog = newConfig.catalog.map(p => {
           const customSku = productSkus[p.id];
           return {
               ...p,
               sku: (customSku !== undefined && customSku !== '') ? customSku : p.sku
            };
        });
        setCustomConfig(newConfig);
     }
  }, []);

  const [inputs, setInputs] = useState<ProjectInputs>({
    userEmail: '',
    roomWidthMeters: 4,
    roomLengthMeters: 5,
    tableWidthMeters: 1.2,
    tableLengthMeters: 2.4,
    tableAttachedToWall: false,
    peopleCount: 4,
    displayCount: 1,
    wirelessSystem: false,
    roomSize: 'small'
  });

  const [isQuoteSent, setIsQuoteSent] = useState(false);

  const handleInputChange = (field: keyof ProjectInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const resultStep = 3;
  const calcStep = 2;

  const handleNext = () => setStep(s => Math.min(s + 1, resultStep));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const wpSettingsGlobal = (window as any).discabosSalaCalcSettings;
  const colors = wpSettingsGlobal?.colors || { selection: '#df1319', action: '#9ebf24' };

  const handleCalculate = async () => {
    setValidationError(null);

    if (inputs.tableLengthMeters > inputs.roomLengthMeters) {
      setValidationError("Atenção: O comprimento da mesa não pode ser maior que o comprimento da sala.");
      return;
    }
    if (inputs.tableWidthMeters > inputs.roomWidthMeters) {
      setValidationError("Atenção: A largura da mesa não pode ser maior que a largura da sala.");
      return;
    }
    
    const maxChairsPerSide = Math.floor(inputs.tableLengthMeters / 0.6);
    const maxHeads = inputs.tableAttachedToWall ? 1 : 2;
    const maxTotalCapacity = (maxChairsPerSide * 2) + maxHeads;

    if (inputs.peopleCount > maxTotalCapacity) {
      setValidationError(`Uma mesa de ${inputs.tableLengthMeters}m comporta no máximo ${maxTotalCapacity} cadeiras. Aumente a mesa ou reduza o número de pessoas.`);
      return;
    }

    setIsCalculating(true);
    
    const sizingResult = calculateSizing(inputs, customConfig);
    const skus = sizingResult.bom.map(item => item.sku).filter(sku => sku && sku.trim() !== '');

    let mockWcResponse: Record<string, any> = {};
    
    const wpSettings = (window as any).discabosSalaCalcSettings;
    if (wpSettings && wpSettings.ajaxUrl) {
      try {
        const res = await fetch(wpSettings.ajaxUrl + 'products?skus=' + skus.join(','));
        if (res.ok) {
           mockWcResponse = await res.json();
        }
      } catch (e) {
        console.warn("Could not fetch real products, falling back to mock.");
      }
    }

    if (Object.keys(mockWcResponse).length === 0) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    sizingResult.bom.forEach(item => {
      const sku = item.sku;
      if (!sku || sku.trim() === '') {
         mockWcResponse[sku] = null;
      } else if (!mockWcResponse[sku]) {
         const originalProduct = customConfig.catalog.find(p => p.sku === sku || p.id === item.id);
         const displaySku = originalProduct?.sku || sku;
         const isAirtame = item.id === 'wireless_airtame';
         
         mockWcResponse[displaySku] = {
           id: Math.floor(Math.random() * 10000),
           name: originalProduct ? originalProduct.name : `Produto (${displaySku})`,
           url: isAirtame && displaySku.startsWith('http') ? displaySku : `https://discabos.com.br/busca?q=${encodeURIComponent(displaySku)}`,
           image: `https://via.placeholder.com/80?text=${displaySku}`,
           price: ''
         };
      }
    });

    setWooProducts(mockWcResponse);
    setIsCalculating(false);
    setStep(resultStep);
  };

  const handleSendQuote = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setIsQuoteSent(true);
  };

  const sizing = step === resultStep ? calculateSizing(inputs, customConfig) : null;

  return (
    <>
      <style>{`
        .discabos-sala-calc-wrapper input:focus, 
        .discabos-sala-calc-wrapper select:focus {
          outline-color: var(--color-selection) !important;
          border-color: var(--color-selection) !important;
          box-shadow: 0 0 0 1px var(--color-selection) !important;
        }
      `}</style>
    <div 
      className="discabos-sala-calc-wrapper w-full font-[inherit]" 
      style={{ 
        '--color-selection': colors.selection, 
        '--color-action': colors.action,
        fontFamily: 'inherit'
      } as React.CSSProperties}
    >
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full">
        
        {/* Wizard Header / Progress */}
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: resultStep }, (_, i) => i + 1).map(num => (
              <React.Fragment key={num}>
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= num ? 'text-white' : 'bg-slate-200 text-slate-500'}`}
                  style={{ backgroundColor: step >= num ? 'var(--color-selection)' : undefined }}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                </div>
                {num < resultStep && (
                  <div 
                    className="flex-1 h-1.5 rounded-full"
                    style={{ backgroundColor: step > num ? 'var(--color-selection)' : '#e2e8f0' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-slate-500 px-1">
            <span>Dimensões do Ambiente</span>
            <span>Características do Sistema</span>
            <span>Solução Recomendada</span>
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 md:p-8 min-h-[350px]">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Dimensões do Ambiente</h3>
              <p className="text-slate-600 mb-8">Defina as medidas do local, da mesa e a capacidade de pessoas.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                   <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Dimensões da Sala (metros)</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Largura</label>
                        <input type="number" min={1} value={inputs.roomWidthMeters} onChange={e => handleInputChange('roomWidthMeters', (e.target.value === '' ? '' : parseFloat(e.target.value)) as any)} className="w-full px-4 py-2 font-bold border border-slate-300 rounded focus:ring-2 text-center focus:outline-none" style={{ outlineColor: 'var(--color-selection)' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Comprimento</label>
                        <input type="number" min={1} value={inputs.roomLengthMeters} onChange={e => handleInputChange('roomLengthMeters', (e.target.value === '' ? '' : parseFloat(e.target.value)) as any)} className="w-full px-4 py-2 font-bold border border-slate-300 rounded focus:ring-2 text-center focus:outline-none" style={{ outlineColor: 'var(--color-selection)' }} />
                      </div>
                   </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                   <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">A Mesa</h4>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Largura (m)</label>
                        <input type="number" step={0.1} min={0.5} value={inputs.tableWidthMeters} onChange={e => handleInputChange('tableWidthMeters', (e.target.value === '' ? '' : parseFloat(e.target.value)) as any)} className="w-full px-4 py-2 font-bold border border-slate-300 rounded focus:ring-2 text-center focus:outline-none" style={{ outlineColor: 'var(--color-selection)' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Comprimento (m)</label>
                        <input type="number" step={0.1} min={0.5} value={inputs.tableLengthMeters} onChange={e => handleInputChange('tableLengthMeters', (e.target.value === '' ? '' : parseFloat(e.target.value)) as any)} className="w-full px-4 py-2 font-bold border border-slate-300 rounded focus:ring-2 text-center focus:outline-none" style={{ outlineColor: 'var(--color-selection)' }} />
                      </div>
                   </div>
                   <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Quantas pessoas vão sentar?</label>
                      <input type="number" min={1} value={inputs.peopleCount} onChange={e => handleInputChange('peopleCount', (e.target.value === '' ? '' : parseInt(e.target.value)) as any)} className="w-full px-4 py-2 font-bold border border-slate-300 rounded focus:ring-2 text-center focus:outline-none" style={{ outlineColor: 'var(--color-selection)' }} />
                   </div>
                   
                   <label className="flex items-center gap-2 cursor-pointer bg-white p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                     <input type="checkbox" checked={inputs.tableAttachedToWall} onChange={e => handleInputChange('tableAttachedToWall', e.target.checked)} className="w-5 h-5 rounded focus:outline-none focus:ring-0" style={{ accentColor: 'var(--color-selection)' }} />
                     <span className="font-semibold text-slate-700 text-sm">A mesa ficará encostada na parede das telas?</span>
                   </label>
                </div>
              </div>

              {validationError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="font-medium">{validationError}</div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Características do Sistema</h3>
              <p className="text-slate-600 mb-8">Defina a quantidade de telas e as preferências de cabeamento e conexão de vídeo.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                   <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Sistema AV</h4>
                   <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Quantas telas (Monitores/TVs) possui?</label>
                      <input type="number" min={1} max={4} value={inputs.displayCount} onChange={e => handleInputChange('displayCount', (e.target.value === '' ? '' : parseInt(e.target.value)) as any)} className="w-full px-4 py-2 font-bold border border-slate-300 rounded focus:ring-2 text-center focus:outline-none" style={{ outlineColor: 'var(--color-selection)' }} />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Cabeamento de Reunião</label>
                      <div className="flex flex-col gap-2">
                        <label 
                          className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${!inputs.wirelessSystem ? 'bg-slate-50' : 'border-slate-200 bg-white'}`}
                          style={!inputs.wirelessSystem ? { borderColor: 'var(--color-selection)', backgroundColor: 'color-mix(in srgb, var(--color-selection) 5%, white)' } : undefined}
                        >
                           <input type="radio" checked={!inputs.wirelessSystem} onChange={() => handleInputChange('wirelessSystem', false)} className="w-4 h-4 focus:outline-none focus:ring-0" style={{ accentColor: 'var(--color-selection)' }} />
                           <span className="text-sm font-bold text-slate-700">Tradicional (HDMI e USB na Mesa)</span>
                        </label>
                        <label 
                          className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${inputs.wirelessSystem ? 'bg-slate-50' : 'border-slate-200 bg-white'}`}
                          style={inputs.wirelessSystem ? { borderColor: 'var(--color-selection)', backgroundColor: 'color-mix(in srgb, var(--color-selection) 5%, white)' } : undefined}
                        >
                           <input type="radio" checked={inputs.wirelessSystem} onChange={() => handleInputChange('wirelessSystem', true)} className="w-4 h-4 focus:outline-none focus:ring-0" style={{ accentColor: 'var(--color-selection)' }} />
                           <span className="text-sm font-bold text-slate-700">Totalmente Sem Fio (BYOM / Airtame)</span>
                        </label>
                      </div>
                   </div>
                </div>
              </div>

              {validationError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="font-medium">{validationError}</div>
                </div>
              )}
            </div>
          )}

          {step === resultStep && sizing && (
            <div className="animate-in fade-in zoom-in-95 duration-500" ref={resultRef}>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Solução Recomendada</h2>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-bold border border-blue-200 shadow-sm">
                      {sizing.roomTypeLabel}
                    </span>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mb-8 shadow-sm">
                     <p className="text-blue-800 font-medium">
                       Esta solução foi desenhada para uma sala de <strong>{inputs.roomWidthMeters}x{inputs.roomLengthMeters}m</strong> com 
                       mesa para <strong>{inputs.peopleCount} lugares</strong>.
                     </p>
                  </div>

                  <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                     <div className="bg-white p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                        <Diagram inputs={inputs} sizing={sizing} />
                     </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" style={{ color: 'var(--color-selection)' }} /> Lista de Equipamentos
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="p-4 font-bold text-slate-600 w-24">Qtd</th>
                            <th className="p-4 font-bold text-slate-600">Produto</th>
                            <th className="p-4 font-bold text-slate-600 w-32">Categoria</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {sizing.bom.map((item, idx) => {
                            const isNotFound = wooProducts[item.sku] === null;
                            const wcProduct = wooProducts[item.sku];

                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-semibold text-slate-800 whitespace-nowrap text-lg">
                                  {item.quantity} <span className="text-xs font-normal text-slate-500 uppercase">{item.unit}</span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-start gap-4">
                                    {!isNotFound && wcProduct ? (
                                      <img src={wcProduct.image} alt={item.name} className="w-16 h-16 object-cover rounded border border-slate-200 shrink-0" />
                                    ) : (
                                      !isNotFound && (
                                        <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                          <Package className="w-6 h-6" />
                                        </div>
                                      )
                                    )}
                                    <div>
                                      <div className="font-bold text-slate-800 text-base mb-1">{wcProduct ? wcProduct.name : item.name}</div>
                                      {item.id === 'wireless_airtame' ? (
                                          <div className="text-xs text-slate-500 font-mono">
                                            Link: <a href={item.sku} target="_blank" rel="noreferrer" className="text-[#0072CE] underline break-all">{item.sku}</a> | Marca: {item.brand}
                                          </div>
                                      ) : isNotFound ? (
                                          <div className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block mb-1">não encontrado no catalogo</div>
                                      ) : (
                                          <div className="text-xs text-slate-500 font-mono">SKU: {item.sku} | Marca: {item.brand}</div>
                                      )}
                                      {item.notes && <div className="text-[12px] text-slate-400 mt-2 italic border-l-2 border-slate-200 pl-2">{item.notes}</div>}
                                      {!isNotFound && wcProduct && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                          <a href={wcProduct.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded transition-colors">
                                            Ver Produto <ExternalLink className="w-3 h-3" />
                                          </a>
                                          <a href={`/?add-to-cart=${wcProduct.id}&quantity=${item.quantity}`} className="inline-flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded transition-colors" style={{ backgroundColor: 'var(--color-action)' }}>
                                            Adicionar ao Pedido
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-600 font-semibold">
                                    {item.category.replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    {!isQuoteSent ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="text-slate-800">
                          <span className="font-bold text-lg block mb-1">Gostou desta solução?</span>
                          <span className="text-sm opacity-90">Envie o relatório completo para o seu e-mail corporativo.</span>
                        </div>
                        <button 
                          onClick={handleSendQuote}
                          disabled={isSending}
                          className="w-full sm:w-auto px-8 py-4 disabled:opacity-70 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-3 shadow-md shrink-0 text-lg"
                          style={{ backgroundColor: 'var(--color-action)' }}
                        >
                          <Send className="w-5 h-5" />
                          {isSending ? 'Enviando...' : 'Enviar por E-mail'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center animate-in fade-in zoom-in-95">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <div className="text-emerald-800 font-bold text-xl mb-2">E-mail enviado com sucesso!</div>
                        <div className="text-emerald-600">Verifique sua caixa de entrada para visualizar o relatório completo.</div>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

        </div>
        
        {/* Wizard Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
          {step > 1 && step < resultStep ? (
            <button onClick={handlePrev} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          ) : <div></div>}

          {step < calcStep ? (
            <button onClick={handleNext} className="px-6 py-2.5 text-white font-bold rounded-lg transition shadow-md flex items-center gap-2" style={{ backgroundColor: 'var(--color-selection)' }}>
              Avançar <ChevronRight className="w-4 h-4" />
            </button>
          ) : step === calcStep ? (
            <button onClick={handleCalculate} disabled={isCalculating} className="px-8 py-3 disabled:opacity-70 text-white font-bold rounded-lg transition shadow-md flex items-center gap-2 text-lg" style={{ backgroundColor: 'var(--color-selection)' }}>
              {isCalculating ? 'Calculando...' : 'Sugerir Equipamentos'} {!isCalculating && <ChevronRight className="w-5 h-5" />}
            </button>
          ) : step === resultStep ? (
             <button onClick={() => { setStep(1); setIsQuoteSent(false); }} className="px-6 py-2.5 text-white font-bold rounded-lg transition flex items-center gap-2 shadow-md" style={{ backgroundColor: 'var(--color-action)' }}>
              Fazer Novo Dimensionamento
            </button>
          ) : null}
        </div>

      </div>
    </div>
    </>
  );
}
