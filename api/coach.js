import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { agente, deals, metricas, trigger } = req.body;

  const contexto = `
Agente: ${agente?.nombre || "Agente"}
Meta mensual: ${agente?.meta || "No definida"}
Deals activos: ${JSON.stringify(deals || [])}
Métricas de la semana: ${JSON.stringify(metricas || {})}
Situación actual: ${trigger || "Revisión general"}
  `;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: contexto,
        },
      ],
      system: `Sos el coach de RealtyOS, el mejor mentor que un agente inmobiliario independiente de América Latina puede tener. 
Tu nombre es Rex. Tenés 20 años de experiencia en el mercado inmobiliario latinoamericano.
Tu estilo es directo, cálido y motivador sin ser falso. Hablás de vos a vos.
Siempre terminás con UNA acción concreta y específica para hacer hoy.
Máximo 3 oraciones. Sin emojis excesivos. Sin vueltas.`,
    });

    return res.status(200).json({
      coaching: message.content[0].text,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
