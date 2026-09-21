import { ProjectInputs, SizingResult, ConfigurableRules, ProductOption } from '../types';

export function calculateSizing(inputs: ProjectInputs, config: ConfigurableRules): SizingResult {
  const result: SizingResult = {
    roomTypeLabel: '',
    description: '',
    bom: [],
    bestPractices: []
  };

  const areaSqMeters = inputs.roomWidthMeters * inputs.roomLengthMeters;
  const isVeryLarge = areaSqMeters > 40 || inputs.peopleCount > 15;
  const isLarge = !isVeryLarge && (areaSqMeters > 25 || inputs.peopleCount >= 10);
  const isMedium = !isVeryLarge && !isLarge && (areaSqMeters > 15 || inputs.peopleCount > 4);

  let computedSize: 'small' | 'medium' | 'large' | 'very_large' = 'small';
  
  if (isVeryLarge) {
    computedSize = 'very_large';
    result.roomTypeLabel = 'Sala de Reunião Muito Grande (Boardroom / Treinamento)';
    result.description = `Ambiente muito espaçoso de ${areaSqMeters.toFixed(1)}m² para ${inputs.peopleCount} pessoas. Exige captação e sonorização de teto para distribuição homogênea do áudio.`;
  } else if (isLarge) {
    computedSize = 'large';
    result.roomTypeLabel = 'Sala de Reunião Grande';
    result.description = `Ambiente espaçoso de ${areaSqMeters.toFixed(1)}m² para ${inputs.peopleCount} pessoas.`;
  } else if (isMedium) {
    computedSize = 'medium';
    result.roomTypeLabel = 'Sala de Reunião Média';
    result.description = `Ambiente de aproximadamente ${areaSqMeters.toFixed(1)}m², projetado para equipes de até ${inputs.peopleCount} pessoas.`;
  } else {
    computedSize = 'small';
    result.roomTypeLabel = 'Sala de Reunião Pequena (Huddle Room)';
    result.description = `Ambiente compacto de aproximadamente ${areaSqMeters.toFixed(1)}m², ideal para reuniões rápidas com ${inputs.peopleCount} pessoas.`;
  }

  // Calculate distances for Cables
  // Assuming table is roughly in the middle, distance to display wall = roomLength/2
  // + floor distance + wall distance ~ add 3 to 4 meters slack
  let estimatedCableDistance = (inputs.roomLengthMeters / 2) + 3;
  if (inputs.tableAttachedToWall) {
    estimatedCableDistance = 3; // minimal slack distance since the table touches the display wall
  }

  let usbCableLength = 5;
  if (estimatedCableDistance > 15) usbCableLength = 20;
  else if (estimatedCableDistance > 10) usbCableLength = 15;
  else if (estimatedCableDistance > 5) usbCableLength = 10;

  let hdmiCableLength = 1.5;
  if (estimatedCableDistance > 15) hdmiCableLength = 20;
  else if (estimatedCableDistance > 10) hdmiCableLength = 15;
  else if (estimatedCableDistance > 5) hdmiCableLength = 10;
  else if (estimatedCableDistance > 3) hdmiCableLength = 5;
  else if (estimatedCableDistance > 1.5) hdmiCableLength = 3;

  // Formatting for HDMI ID which uses underscore instead of dot
  const hdmiLengthStr = hdmiCableLength === 1.5 ? '1_5' : hdmiCableLength.toString();
  const targetHdmiId = `cable_hdmi_${hdmiLengthStr}m`;
  const targetUsbId = `cable_usb_${usbCableLength}m`;

  // Audio Logic Check
  const useBMCTH = computedSize === 'very_large';

  // Process Catalog
  config.catalog.forEach(product => {
    
    // CAMERAS
    const needsOpticalZoom = inputs.roomLengthMeters >= 5 || inputs.peopleCount > 8;
    const isTableAttached = inputs.tableAttachedToWall;

    if (product.category === 'camera') {
      if (isTableAttached && product.id === 'cam_506') {
        // Se a mesa for encostada, a câmera 506 (amplo ângulo) é mandatória para não "cortar" as pessoas da ponta
        result.bom.push({ ...product, quantity: 1, unit: 'un', notes: 'Câmera ePTZ de ângulo ultra-amplo (120º). Extremamente necessária pois a mesa está encostada na parede, garantindo que as primeiras pessoas não fiquem fora de quadro.' });
      } else if (!isTableAttached) {
        if (!needsOpticalZoom && product.id === 'cam_506') {
          result.bom.push({ ...product, quantity: 1, unit: 'un', notes: 'Câmera ePTZ de grande angular, ideal para captar todos de perto sem cortes.' });
        } else if (needsOpticalZoom && product.id === 'cam_600') {
          result.bom.push({ ...product, quantity: 1, unit: 'un', notes: 'Câmera PTZ com zoom óptico, essencial para focar pessoas distantes na mesa, já que a mesa está afastada da parede.' });
        }
      }
    }

    // SPEAKERPHONES / MICS
    if (product.category === 'speakerphone') {
      if (useBMCTH && product.id === 'mic_bmcth') {
        result.bom.push({ ...product, quantity: 1, unit: 'un', notes: 'Microfone de teto Beamforming (já possui saída amplificada para caixas).' });
      } else if (!useBMCTH && product.id === 'spk_bm35') {
        const qty = computedSize === 'large' ? 2 : 1;
        const notes = qty === 2 
          ? '2x BM35 sincronizados em cascata cobrem toda a mesa sem necessidade de caixas extras.' 
          : '1x BM35 centralizado cobre um raio de até 6m perfeitamente.';
        result.bom.push({ ...product, quantity: qty, unit: 'un', notes });
      }
    }

    // SPEAKERS
    if (product.category === 'speaker') {
      // BM35 acts as a speaker. Only add external speakers if using BMCTH or explicitly wanted
      if (useBMCTH && product.id === 'spk_amt5') {
        result.bom.push({ ...product, quantity: 2, unit: 'un', notes: 'Ligadas diretamente na saída do microfone BMCTH no teto.' });
      }
    }

    // WIRELESS SYSTEM
    if (product.category === 'wireless_system' && inputs.wirelessSystem && product.id === 'wireless_airtame') {
      result.bom.push({ ...product, quantity: 1, unit: 'un', notes: 'Mini PC com software Airtame para BYOM (traga sua própria reunião) 100% sem fio.' });
    }

    // DOCKING STATION
    if (product.category === 'docking_station' && !inputs.wirelessSystem && product.id === 'dock_avlink') {
      result.bom.push({ ...product, quantity: 1, unit: 'un', notes: 'Fica na mesa recebendo todos os cabos (Câmera, Áudio, Telas) e entrega um único cabo para o notebook.' });
    }

    // CABLES
    if (product.category === 'cable_hdmi' && product.id === targetHdmiId) {
      result.bom.push({ ...product, quantity: inputs.displayCount, unit: 'un', notes: `Cabo HDMI para conectar ${inputs.displayCount} tela(s). Distância mesa-tela: ~${hdmiCableLength}m.` });
    }
    
    if (product.category === 'cable_usb' && product.id === targetUsbId) {
      result.bom.push({ 
        ...product, 
        quantity: 1, 
        unit: 'un', 
        notes: `Comprimento de ${usbCableLength}m calculado pela distância mesa-tela.` 
      });
    }
    
    // Audio Cable
    if (product.category === 'cable_audio' && product.id === 'cable_audio' && useBMCTH) {
       result.bom.push({ ...product, quantity: 1, unit: 'un', notes: `Cabo de áudio para conexão no teto.` });
    }
  });

  result.bestPractices.push(`Posicionamos a mesa centralizada. Foram considerados ${inputs.peopleCount} assentos e ${inputs.displayCount} tela(s).`);
  
  if (useBMCTH) {
    result.bestPractices.push('Para a sala muito grande, indicamos o microfone de teto ClearOne BMCTH, dispensando a poluição visual na mesa. As caixas de som ligam diretamente nele.');
  } else {
    result.bestPractices.push('O Speakerphone BM35 (Discabos) já resolve a captação de voz (Cancelamento de Eco/Ruído) e a reprodução de som da chamada, dispensando caixas de som extras na parede/teto.');
  }

  if (inputs.wirelessSystem) {
    result.bestPractices.push('A solução sugerida inclui o Mini PC com Airtame. Isso permite usar a câmera e microfone da sala sem conectar nenhum cabo no notebook do usuário (BYOM sem fio).');
  } else {
    result.bestPractices.push('Evite passar os cabos HDMI e USB da Docking Station junto com a rede elétrica para não haver interferências no trajeto mesa-parede.');
  }

  // Generate basic diagram payload
  result.diagramData = {
    roomW: inputs.roomWidthMeters,
    roomL: inputs.roomLengthMeters,
    tableW: inputs.tableWidthMeters,
    tableL: inputs.tableLengthMeters,
    tableAttachedToWall: inputs.tableAttachedToWall,
    people: inputs.peopleCount,
    displays: inputs.displayCount,
    wireless: inputs.wirelessSystem,
    audio: useBMCTH ? 'ceiling' : 'table',
    bm35Count: computedSize === 'large' ? 2 : 1
  };

  return result;
}
