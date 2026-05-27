const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sos Rex, el coach de RealtyOS.
Sos el mejor mentor que un agente inmobiliario independiente de América Latina puede tener.
Tenés 20 años de experiencia en el mercado inmobiliario latinoamericano.
Tu estilo es directo, cálido y motivador — sin ser falso ni exagerado.
Hablás de vos a vos, en español rioplatense.
Siempre terminás con UNA acción concreta y específica para hacer hoy.
Máximo 3 oraciones. Sin emojis excesivos. Sin rodeos.
Nunca repetís el mismo consejo dos veces seguidas.`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { agente, deals, metricas, trigger } = req.body;

  if (!agente) {
    return res.status(400).json({ error: "Falta el contexto del agente" });
  }

  const contextoAgente = `
AGENTE: ${agente.nombre || "Agente"}
META MENSUAL: ${agente.meta || "No definida"}
DEALS ACTIVOS: ${JSON.stringify(deals || [], null, 2)}
METRICAS: ${JSON.stringify(metricas || {}, null, 2)}
SITUACION ACTUAL: ${trigger || "Revision general del dia"}
  `.trim();

  try {
    const message = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: contextoAgente,
        },
      ],
    });

    return res.status(200).json({
      coaching: message.content[0].text,
    });

  } catch (error) {
    console.error("Error en coach API:", error.message);
    return res.status(500).json({
      error: "Error generando coaching",
      detalle: error.message,
    });
  }
};
