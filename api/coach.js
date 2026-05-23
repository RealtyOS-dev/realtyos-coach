// api/coach.js — RealtyOS Coach API
// Stack: Vercel Serverless Function + Anthropic SDK
// Usa CommonJS consistente (sin mezcla con ES Modules)

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt separado para activar prompt caching
// (se cachea en Anthropic → ahorra ~60% del costo de tokens)
const SYSTEM_PROMPT = `Sos Rex, el coach de RealtyOS.
Sos el mejor mentor que un agente inmobiliario independiente de América Latina puede tener.
Tenés 20 años de experiencia en el mercado inmobiliario latinoamericano.
Tu estilo es directo, cálido y motivador — sin ser falso ni exagerado.
Hablás de vos a vos, en español rioplatense.
Siempre terminás con UNA acción concreta y específica para hacer hoy.
Máximo 3 oraciones. Sin emojis excesivos. Sin rodeos.
Nunca repetís el mismo consejo dos veces seguidas.`;

module.exports = async function handler(req, res) {
  // CORS headers (necesarios para llamadas desde Base44 o Lovable)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request de CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { agente, deals, metricas, trigger } = req.body;

  // Validación básica
  if (!agente) {
    return res.status(400).json({ error: "Falta el contexto del agente" });
  }

  // Construir contexto del agente para el coach
  const contextoAgente = `
AGENTE: ${agente.nombre || "Agente"}
META MENSUAL: ${agente.meta || "No definida"}
DEALS ACTIVOS: ${JSON.stringify(deals || [], null, 2)}
MÉTRICAS DE LA SEMANA: ${JSON.stringify(metricas || {}, null, 2)}
SITUACIÓN ACTUAL: ${trigger || "Revisión general del día"}
  `.trim();

  try {
    const message = await client.messages.create({
      model: model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // ← Prompt caching activado
        },
      ],
      messages: [
        {
          role: "user",
          content: contextoAgente,
        },
      ],
    });

    return res.status(200).json({
      coaching: message.content[0].text,
      tokens_usados: message.usage, // útil para monitorear costos
    });

  } catch (error) {
    console.error("Error en coach API:", error.message);
    return res.status(500).json({
      error: "Error generando coaching",
      detalle: error.message,
    });
  }
};
