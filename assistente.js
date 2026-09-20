document.addEventListener('DOMContentLoaded', () => {
  const respostas = [
    { termos: ['emergência', 'perigo', 'agora', '190'], texto: 'Se houver perigo imediato, vá para um local seguro e ligue para 190. O assistente não substitui atendimento de emergência.' },
    { termos: ['mulher', 'abuso', 'violência', 'ameaça', '180'], texto: 'Para orientação e apoio à mulher, ligue 180. Em emergência, ligue 190. Você também pode abrir a área de informações e serviços.' },
    { termos: ['desaparecida', 'desaparecido', 'sumiu', 'mural'], texto: 'Acesse Pessoas desaparecidas para consultar procedimentos, publicar um caso ou compartilhar uma informação no chat comunitário.' },
    { termos: ['denúncia', 'denuncia', 'registrar', 'protocolo'], texto: 'Use Registrar denúncia. O formulário não exige nome, e-mail ou telefone e gera um protocolo para consulta posterior.' },
    { termos: ['privacidade', 'seguro', 'sigilo', 'anônimo', 'anonimo'], texto: 'Use um dispositivo e uma conexão seguros. O protótipo não coleta IP; ainda assim, o histórico do navegador pode permanecer.' },
    { termos: ['falsa', 'falsas', 'verdade', 'trotes'], texto: 'Envie apenas informações verdadeiras e objetivas. Comunicações deliberadamente falsas podem prejudicar pessoas e ser encaminhadas às autoridades para esclarecimento.' }
  ];
  const markup = `<button class="assistente-toggle" id="assistente-abrir" type="button" aria-expanded="false" aria-controls="assistente-painel">Guia de orientação</button><section class="assistente-painel hidden" id="assistente-painel" role="dialog" aria-label="Guia de orientação"><header class="assistente-cabecalho"><div><strong>Guia de orientação</strong><small>Respostas informativas e canais oficiais</small></div><button class="assistente-fechar" id="assistente-fechar" type="button" aria-label="Fechar guia">×</button></header><div class="assistente-mensagens" id="assistente-mensagens" aria-live="polite"></div><div class="assistente-aviso">Não envie nomes, endereços, documentos ou detalhes que possam colocar alguém em risco.</div><div class="assistente-acoes"><button class="assistente-acao" data-pergunta="Estou em perigo agora">Emergência</button><button class="assistente-acao" data-pergunta="Preciso de apoio para uma mulher">Apoio à mulher</button><button class="assistente-acao" data-pergunta="Quero registrar uma denúncia">Registrar</button><button class="assistente-acao" data-pergunta="Quero saber sobre desaparecidos">Desaparecidos</button></div><form class="assistente-form" id="assistente-form"><input id="assistente-input" maxlength="240" autocomplete="off" placeholder="Digite uma dúvida"><button type="submit">Enviar</button></form></section>`;
  document.body.insertAdjacentHTML('beforeend', markup);
  const abrir = document.getElementById('assistente-abrir');
  const painel = document.getElementById('assistente-painel');
  const mensagens = document.getElementById('assistente-mensagens');
  const input = document.getElementById('assistente-input');
  const adicionar = (texto, tipo = 'bot') => { const item = document.createElement('div'); item.className = `assistente-msg assistente-msg--${tipo}`; item.textContent = texto; mensagens.appendChild(item); mensagens.scrollTop = mensagens.scrollHeight; };
  const responder = pergunta => { const normalizada = pergunta.toLowerCase(); const encontrada = respostas.find(item => item.termos.some(termo => normalizada.includes(termo))); adicionar(encontrada?.texto || 'Posso orientar sobre emergência, apoio à mulher, denúncias, pessoas desaparecidas e privacidade. Escolha uma opção ou escreva uma dúvida mais específica.'); };
  const abrirPainel = () => { painel.classList.remove('hidden'); abrir.setAttribute('aria-expanded', 'true'); input.focus(); if (!mensagens.children.length) adicionar('Olá. Posso ajudar a encontrar informações e canais oficiais. Em emergência, ligue 190.'); };
  const fecharPainel = () => { painel.classList.add('hidden'); abrir.setAttribute('aria-expanded', 'false'); };
  abrir.addEventListener('click', () => painel.classList.contains('hidden') ? abrirPainel() : fecharPainel());
  document.getElementById('assistente-fechar').addEventListener('click', fecharPainel);
  document.querySelectorAll('.assistente-acao').forEach(botao => botao.addEventListener('click', () => { const pergunta = botao.dataset.pergunta; adicionar(pergunta, 'usuario'); responder(pergunta); }));
  document.getElementById('assistente-form').addEventListener('submit', event => { event.preventDefault(); const pergunta = input.value.trim(); if (!pergunta) return; adicionar(pergunta, 'usuario'); responder(pergunta); input.value = ''; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') fecharPainel(); });
});
