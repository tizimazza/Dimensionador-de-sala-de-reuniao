import { ConfigurableRules } from '../types';

export const INITIAL_SIZING_CONFIG: ConfigurableRules = {
  version: "2.0",
  lastUpdated: "2024-03-01",
  adminEmail: "comercial@discabos.com.br",
  catalog: [
    {
      id: "cam_600",
      name: "Câmera PTZ CAM600",
      sku: "CAM-600",
      brand: "Discabos",
      category: "camera",
      description: "Câmera PTZ de alta resolução ideal para salas médias e grandes.",
      recommendedFor: ["medium", "large", "very_large"]
    },
    {
      id: "cam_506",
      name: "Câmera CAM506",
      sku: "CAM-506",
      brand: "Discabos",
      category: "camera",
      description: "Câmera grande angular perfeita para salas pequenas.",
      recommendedFor: ["small"]
    },
    {
      id: "dock_avlink",
      name: "Docking Station AVLink",
      sku: "AVLINK-DOCK",
      brand: "AVLink",
      category: "docking_station",
      description: "Docking station para integração de dispositivos USB e HDMI na mesa.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "wireless_airtame",
      name: "Mini PC + Software Virtual Airtame",
      sku: "https://discabos.com.br/produtos/airtame",
      brand: "Airtame",
      category: "wireless_system",
      description: "Sistema de compartilhamento e BYOM totalmente sem fio.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "spk_amt5",
      name: "Caixa de Som AMT5",
      sku: "AMT-5",
      brand: "Discabos",
      category: "speaker",
      description: "Caixa de som de parede para sonorização de qualidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "spk_neo3",
      name: "Caixa de Som NEO 3",
      sku: "NEO-3",
      brand: "Discabos",
      category: "speaker",
      description: "Caixa compacta de alto desempenho.",
      recommendedFor: ["large", "very_large"]
    },
    {
      id: "spk_bm35",
      name: "Speakerphone BM35",
      sku: "BM-35",
      brand: "Discabos",
      category: "speakerphone",
      description: "Microfone e alto-falante de mesa com cancelamento de ruído e eco. Capta raio de ~6m.",
      recommendedFor: ["small", "medium", "large"]
    },
    {
      id: "mic_bmcth",
      name: "Microfone de Teto ClearOne BMA CT",
      sku: "BMCTH",
      brand: "ClearOne",
      category: "speakerphone",
      description: "Microfone Beamforming de teto. Possui saída amplificada embutida para ligar até 2 alto-falantes.",
      recommendedFor: ["very_large"]
    },
    {
      id: "cable_hdmi_1_5m",
      name: "Cabo HDMI 4K (1.5m)",
      sku: "CABO-HDMI-1.5M",
      brand: "Discabos",
      category: "cable_hdmi",
      description: "Cabo HDMI de alta velocidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_hdmi_3m",
      name: "Cabo HDMI 4K (3m)",
      sku: "CABO-HDMI-3M",
      brand: "Discabos",
      category: "cable_hdmi",
      description: "Cabo HDMI de alta velocidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_hdmi_5m",
      name: "Cabo HDMI 4K (5m)",
      sku: "CABO-HDMI-5M",
      brand: "Discabos",
      category: "cable_hdmi",
      description: "Cabo HDMI de alta velocidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_hdmi_10m",
      name: "Cabo HDMI 4K (10m)",
      sku: "CABO-HDMI-10M",
      brand: "Discabos",
      category: "cable_hdmi",
      description: "Cabo HDMI de alta velocidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_hdmi_15m",
      name: "Cabo HDMI 4K (15m)",
      sku: "CABO-HDMI-15M",
      brand: "Discabos",
      category: "cable_hdmi",
      description: "Cabo HDMI de alta velocidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_hdmi_20m",
      name: "Cabo HDMI 4K (20m)",
      sku: "CABO-HDMI-20M",
      brand: "Discabos",
      category: "cable_hdmi",
      description: "Cabo HDMI de alta velocidade.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_audio",
      name: "Cabo de Áudio Analógico",
      sku: "CABO-AUDIO",
      brand: "Discabos",
      category: "cable_audio",
      description: "Cabo P2/RCA para conexões de áudio.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_usb_5m",
      name: "Cabo Extensor USB Ativo (5m)",
      sku: "CABO-USB-5M",
      brand: "Discabos",
      category: "cable_usb",
      description: "Cabo para conectar as câmeras e periféricos na mesa.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_usb_10m",
      name: "Cabo Extensor USB Ativo (10m)",
      sku: "CABO-USB-10M",
      brand: "Discabos",
      category: "cable_usb",
      description: "Cabo para conectar as câmeras e periféricos na mesa.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_usb_15m",
      name: "Cabo Extensor USB Ativo (15m)",
      sku: "CABO-USB-15M",
      brand: "Discabos",
      category: "cable_usb",
      description: "Cabo para conectar as câmeras e periféricos na mesa.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    },
    {
      id: "cable_usb_20m",
      name: "Cabo Extensor USB Ativo (20m)",
      sku: "CABO-USB-20M",
      brand: "Discabos",
      category: "cable_usb",
      description: "Cabo para conectar as câmeras e periféricos na mesa.",
      recommendedFor: ["small", "medium", "large", "very_large"]
    }
  ]
};
