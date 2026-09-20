const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const orientacao = `Voce e um guia de orientacao de um prototipo brasileiro. Responda em portugues do Brasil, com frases curtas e acolhedoras. Nao substitua policia, saude, assistencia juridica ou emergencia. Em perigo imediato, oriente ligar 190. Para apoio a mulher, informe 180. Para desaparecidos, oriente registrar imediatamente na Policia Civil e nao esperar 24 horas. Nunca peca nome completo, endereco, documentos, senha, telefone ou detalhes que coloquem alguem em risco. Nao prometa anonimato absoluto. Nao invente leis, protocolos, investigacoes ou servicos. Se a pergunta estiver fora de seguranca, denuncias, apoio a mulher ou desaparecidos, diga que pode orientar apenas nesses temas.`;

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), { status: 405, headers });
  try {
    const body = await request.json();
    const pergunta = String(body.pergunta || '').trim().slice(0, 500);
    if (!pergunta) return new Response(JSON.stringify({ error: 'Pergunta vazia' }), { status: 400, headers });
    const chave = Deno.env.get('OPENAI_API_KEY');
    if (!chave) return new Response(JSON.stringify({ error: 'IA nao configurada' }), { status: 503, headers });
    const resposta = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
      body: JSON.stringify({ model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini', temperature: 0.2, max_tokens: 220, messages: [{ role: 'system', content: orientacao }, { role: 'user', content: pergunta }] })
    });
    if (!resposta.ok) return new Response(JSON.stringify({ error: 'Falha no provedor de IA' }), { status: 502, headers });
    const dados = await resposta.json();
    return new Response(JSON.stringify({ resposta: dados.choices?.[0]?.message?.content || 'Nao consegui responder agora.' }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Requisicao invalida' }), { status: 400, headers });
  }
});