import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ZipArchive } from "archiver";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Armazenamento em memória para histórico de dimensionamentos / logs de usuários
const sizingLogsHistory: Array<{
  id: string;
  timestamp: string;
  userEmail: string;
  userName?: string;
  projectName?: string;
  summary: string;
  bomItemsCount: number;
  totalEstimatedPrice: number;
  hubspotSynced: boolean;
}> = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.get("/api/download-plugin", async (req, res) => {
    try {
      console.log("Packaging project for download...");
      const pluginName = "dimensionador-de-sala";

      const archive = new ZipArchive({
        zlib: { level: 9 }, // Sets the compression level.
      });

      const chunks: any[] = [];
      archive.on('data', (chunk: any) => chunks.push(chunk));
      archive.on('end', () => {
        const result = Buffer.concat(chunks);
        res.json({
          success: true,
          filename: `${pluginName}.zip`,
          zipBase64: result.toString('base64')
        });
      });

      archive.on("error", function (err: any) {
        res.status(500).json({ error: err.message });
      });

      // Pasta principal dentro do ZIP
      const baseDir = pluginName;

      // Adicionar o arquivo PHP
      const phpFilePath = path.join(process.cwd(), "dimensionador-de-sala.php");
      if (fs.existsSync(phpFilePath)) {
        archive.file(phpFilePath, { name: `${baseDir}/dimensionador-de-sala.php` });
      }

      // Adicionar a pasta dist (IMPORTANTE: precisamos buildar antes)
      const distPath = path.join(process.cwd(), "dist");
      if (fs.existsSync(distPath)) {
        archive.directory(distPath, `${baseDir}/dist`);
      }

      archive.finalize();
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Erro ao gerar ZIP" });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      version: "2.0.0",
      app: "Calculador HDMI & AVLIFE Discabos",
      aiAvailable: !!process.env.GEMINI_API_KEY,
      hubspotConfigured: !!process.env.HUBSPOT_ACCESS_TOKEN,
    });
  });

  // HubSpot Integration: Log user sizing note to HubSpot CRM
  app.post("/api/hubspot/log-sizing", async (req, res) => {
    try {
      const { userEmail, userName, projectName, projectInputs, sizingResult, hubspotToken } = req.body;

      if (!userEmail) {
        return res.status(400).json({
          success: false,
          error: "O email do usuário logado é obrigatório para registrar a nota no HubSpot CRM.",
        });
      }

      const activeToken = hubspotToken || process.env.HUBSPOT_ACCESS_TOKEN;
      const formattedDate = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

      const noteContent = `📐 [CALCULADORA HDMI & AVLIFE - GRUPO DISCABOS]
Data/Hora: ${formattedDate}
Projeto: ${projectName || "Projeto HDMI"}
Usuário: ${userName || "Usuário do Site"} (${userEmail})

⚙️ PARÂMETROS SELECIONADOS:
• Ambiente: ${projectInputs?.environment?.toUpperCase() || "GERAL"}
• Fontes de Entrada: ${projectInputs?.sourcesCount || 1} (${projectInputs?.sourceTypes?.join(", ") || "Fontes HDMI"})
• Displays / Telas: ${projectInputs?.displaysCount || 1} (${projectInputs?.displayTypes?.join(", ") || "Displays"})
• Modo de Exibição: ${projectInputs?.displayMode === "same_content" ? "Replicar mesmo sinal (Splitter)" : "Matriz Independente / AV over IP"}
• Distância Máxima: ${projectInputs?.maxDistance || 10} metros
• Tipo de Tubulação: ${projectInputs?.infraType || "Padrão"}
• Resolução Desejada: ${projectInputs?.resolution || "4K@60Hz HDR"}
• Recursos: ${projectInputs?.specialFeatures?.join(", ") || "Nenhum"}

🏆 SOLUÇÃO TÉCNICA RECOMENDADA:
• Topologia: ${sizingResult?.architectureName || "Conexão HDMI"}
• Cabeamento: ${sizingResult?.primaryCableName || "Cabo Discabos"} (SKU: ${sizingResult?.primaryCableSku || "N/A"})
• Equipamento: ${sizingResult?.primaryEquipmentName || "Conexão Direta"} ${sizingResult?.primaryEquipmentSku ? `(SKU: ${sizingResult.primaryEquipmentSku})` : ""}
• Investimento Estimado BOM: R$ ${(sizingResult?.totalEstimatedPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

📦 LISTA DE MATERIAIS (BOM - SKUs WOOCOMMERCE):
${sizingResult?.bomItems?.map((item: any, idx: number) => `${idx + 1}. [SKU: ${item.sku}] ${item.quantity}x ${item.name} - R$ ${(item.unitPrice || 0).toFixed(2)} un`).join("\n") || "Nenhum item listado"}`;

      let hubspotSynced = false;
      let contactId: string | undefined;
      let noteId: string | undefined;

      if (activeToken) {
        try {
          // 1. Procurar ou Criar Contato no HubSpot
          const contactSearchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filterGroups: [
                {
                  filters: [
                    {
                      propertyName: "email",
                      operator: "EQ",
                      value: userEmail.trim().toLowerCase(),
                    },
                  ],
                },
              ],
            }),
          });

          const searchData = await contactSearchRes.json();

          if (searchData.results && searchData.results.length > 0) {
            contactId = searchData.results[0].id;
          } else {
            // Criar novo contato
            const names = (userName || "Cliente Integrador").split(" ");
            const firstName = names[0] || "Cliente";
            const lastName = names.slice(1).join(" ") || "Discabos";

            const createContactRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${activeToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: {
                  email: userEmail.trim().toLowerCase(),
                  firstname: firstName,
                  lastname: lastName,
                  hs_lead_status: "OPEN",
                },
              }),
            });
            const createdContact = await createContactRes.json();
            contactId = createdContact?.id;
          }

          // 2. Criar a Nota de Engajamento e associar ao Contato
          if (contactId) {
            const createNoteRes = await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${activeToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: {
                  hs_timestamp: new Date().toISOString(),
                  hs_note_body: noteContent,
                },
                associations: [
                  {
                    to: {
                      id: contactId,
                    },
                    types: [
                      {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 202, // Note to Contact association
                      },
                    ],
                  },
                ],
              }),
            });

            if (createNoteRes.ok) {
              const noteData = await createNoteRes.json();
              noteId = noteData?.id;
              hubspotSynced = true;
            }
          }
        } catch (hubspotErr) {
          console.error("Erro na API oficial do HubSpot:", hubspotErr);
        }
      }

      // Salva no log interno do servidor
      const logEntry = {
        id: `sizing-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userEmail,
        userName,
        projectName,
        summary: sizingResult?.architectureName || "Dimensionamento HDMI",
        bomItemsCount: sizingResult?.bomItems?.length || 0,
        totalEstimatedPrice: sizingResult?.totalEstimatedPrice || 0,
        hubspotSynced,
      };
      sizingLogsHistory.unshift(logEntry);
      if (sizingLogsHistory.length > 100) sizingLogsHistory.pop();

      return res.json({
        success: true,
        message: hubspotSynced
          ? `Nota registrada com sucesso no contato (${userEmail}) no HubSpot CRM!`
          : `Dimensionamento registrado para o usuário ${userEmail}. (Modo Seguro: para sincronização ao vivo no CRM, informe o Token HubSpot no plugin do WordPress)`,
        hubspotSynced,
        contactId,
        noteId,
        loggedAt: formattedDate,
      });
    } catch (error: any) {
      console.error("Erro ao registrar no HubSpot:", error);
      res.status(500).json({
        success: false,
        error: "Falha interna ao processar registro do HubSpot.",
        details: error?.message || String(error),
      });
    }
  });

  // HubSpot Connection Test endpoint
  app.post("/api/hubspot/test-connection", async (req, res) => {
    try {
      const { token } = req.body;
      const activeToken = token || process.env.HUBSPOT_ACCESS_TOKEN;

      if (!activeToken) {
        // MOCK SUCCESS FOR PREVIEW
        return res.json({
          connected: true,
          message: "(Modo Preview) Conexão simulada com sucesso! No ambiente real, insira seu Token.",
        });
      }

      const checkRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: {
          "Authorization": `Bearer ${activeToken}`,
        },
      });

      if (checkRes.ok) {
        return res.json({
          connected: true,
          message: "Conexão com a API do HubSpot autenticada e operacional!",
        });
      } else {
        const errorData = await checkRes.json().catch(() => ({}));
        return res.json({
          connected: false,
          message: errorData?.message || "Token do HubSpot inválido ou expirado.",
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        connected: false,
        message: err?.message || "Erro ao testar conexão com o HubSpot.",
      });
    }
  });

  // AI Consultant / Technical Review endpoint
  app.post("/api/ai-consultant", async (req, res) => {
    try {
      const { projectData, question } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // MOCK AI RESPONSE FOR PREVIEW
        return res.json({
          advice: `**Análise Simulada (Ambiente de Preview)**\n\nOlá! Como a Chave de API do Gemini não foi configurada neste ambiente de teste, esta é uma resposta simulada. \n\n*Para o seu projeto de ${projectData?.sourcesCount || 1} fontes e ${projectData?.displaysCount || 1} telas a ${projectData?.maxDistance || 10}m:*\nRecomendamos o uso das soluções AVLIFE HDBaseT ou cabos de fibra óptica para garantir a integridade do sinal 4K.\n\n*(Instale o plugin em seu WordPress e insira sua API Key para usar a IA Real).*`,
          model: "gemini-preview-mock",
        });
      }

      const prompt = `Você é o Engenheiro Especialista em Áudio e Vídeo Profissional do Grupo Discabos e da marca AVLIFE.
Sua missão é dar parecer técnico detalhado, direto e de alta autoridade para instaladores, integradores A/V e projetistas.

Dados do projeto atual do usuário:
- Número de Fontes HDMI: ${projectData?.sourcesCount || 1} (${projectData?.sourceTypes?.join(", ") || "Fontes padrão"})
- Número de Telas/Displays: ${projectData?.displaysCount || 1} (${projectData?.displayTypes?.join(", ") || "TV/Projetor"})
- Distância Máxima entre Pontos: ${projectData?.maxDistance || 10} metros
- Tipo de Infraestrutura/Tubulação: ${projectData?.infraType || "Conduíte Padrão"}
- Resolução e Taxa Requerida: ${projectData?.resolution || "4K@60Hz HDR"}
- Recursos Especiais Requeridos: ${projectData?.features?.join(", ") || "Nenhum"}
- Equipamento Sugerido: ${projectData?.suggestedEquipment || "A definir"}
- Cabeamento Sugerido: ${projectData?.suggestedCable || "A definir"}

Pergunta / Dúvida do Instalador:
"${question || "Faça uma auditoria técnica e dê as melhores recomendações práticas de instalação para este projeto."}"

Diretrizes de Resposta:
1. Responda em Português do Brasil com linguagem técnica precisa, amigável e focada na prática de instalação.
2. Destaque os diferenciais das soluções Grupo Discabos e AVLIFE (ex: cabos de fibra óptica ativa AOC com SKUs reais, fibra com ponta destacável micro-D para conduítes estreitos, matrizes AVLIFE com EDID ajustável, extensores HDBaseT com PoC e AV Over IP NESC).
3. Aponte armadilhas comuns (ex: atenuação em cabos longos de cobre em 4K 18Gbps, perda de handshake HDCP, switch de rede sem IGMP Snooping para AV over IP).
4. Organize a resposta com tópicos claros, negritos e um checklist rápido para o instalador.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({
        advice: response.text || "Análise concluída com sucesso.",
        model: "gemini-2.5-flash",
      });
    } catch (error: any) {
      console.error("Erro na consulta de IA:", error);
      res.status(500).json({
        error: "Falha ao processar consultoria técnica de IA.",
        details: error?.message || String(error),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Discabos AVLIFE Sizing Server v1.3.0] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
