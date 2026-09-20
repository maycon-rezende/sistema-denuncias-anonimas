document.addEventListener('DOMContentLoaded', () => {
  const CHAVE_MURAL = 'sdac_mural_desaparecidos_v1';
  const CHAVE_CHAT = 'sdac_chat_desaparecidos_v1';
  const LIMITE_IMAGEM = 1.5 * 1024 * 1024;
  const formMural = document.getElementById('form-desaparecido');
  const erroMural = document.getElementById('erro-mural');
  const campoFoto = document.getElementById('desaparecido-foto');
  const listaMural = document.getElementById('lista-desaparecidos');
  const muralVazio = document.getElementById('mural-vazio');
  const buscaMural = document.getElementById('busca-mural');
  const formChat = document.getElementById('form-chat');
  const listaChat = document.getElementById('lista-chat');

  function lerLista(chave) {
    try { return JSON.parse(localStorage.getItem(chave) || '[]'); }
    catch { return []; }
  }
  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  }
  function lerImagem(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo || !arquivo.type.startsWith('image/')) return reject('Selecione uma foto válida.');
      if (arquivo.size > LIMITE_IMAGEM) return reject('A foto deve ter no máximo 1,5 MB.');
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject('Não foi possível ler a foto.');
      leitor.readAsDataURL(arquivo);
    });
  }
  function formatarData(iso) { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }

  function renderizarMural() {
    const termo = buscaMural.value.trim().toLowerCase();
    const publicacoes = lerLista(CHAVE_MURAL).filter(item => `${item.nome} ${item.cidade}`.toLowerCase().includes(termo));
    muralVazio.classList.toggle('hidden', publicacoes.length > 0);
    listaMural.innerHTML = publicacoes.map(item => `
      <article class="mural-card">
        <img src="${item.foto}" alt="Foto de ${escapar(item.nome)}">
        <div class="mural-card__body">
          <div class="mural-card__top"><h3>${escapar(item.nome)}</h3><span>${escapar(item.cidade)}</span></div>
          <p><strong>Último contato:</strong> ${escapar(item.ultimoContato)}</p>
          <p>${escapar(item.caracteristicas)}</p>
          <div class="mural-card__contact"><strong>Informações:</strong> ${escapar(item.contato)}</div>
          <small>Publicado em ${formatarData(item.criadoEm)}</small>
        </div>
      </article>`).join('');
  }

  formMural.addEventListener('submit', async event => {
    event.preventDefault();
    erroMural.classList.add('hidden');
    try {
      const foto = await lerImagem(campoFoto.files[0]);
      const publicacao = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        nome: document.getElementById('desaparecido-nome').value.trim(),
        idade: document.getElementById('desaparecido-idade').value.trim(),
        cidade: document.getElementById('desaparecido-cidade').value.trim(),
        ultimoContato: document.getElementById('desaparecido-data').value.trim(),
        caracteristicas: document.getElementById('desaparecido-caracteristicas').value.trim(),
        contato: document.getElementById('desaparecido-contato').value.trim(),
        foto,
        criadoEm: new Date().toISOString()
      };
      const publicacoes = lerLista(CHAVE_MURAL);
      publicacoes.unshift(publicacao);
      localStorage.setItem(CHAVE_MURAL, JSON.stringify(publicacoes));
      formMural.reset();
      renderizarMural();
    } catch (mensagem) {
      erroMural.textContent = mensagem;
      erroMural.classList.remove('hidden');
    }
  });
  buscaMural.addEventListener('input', renderizarMural);

  function renderizarChat() {
    const mensagens = lerLista(CHAVE_CHAT).slice(-40);
    listaChat.innerHTML = mensagens.length ? mensagens.map(item => `
      <div class="chat-message"><div><strong>${escapar(item.nome || 'Anônimo')}</strong><small>${formatarData(item.criadoEm)}</small></div><p>${escapar(item.mensagem)}</p></div>`).join('') : '<p class="muted">Ainda não há mensagens. Compartilhe apenas informações confirmadas.</p>';
    listaChat.scrollTop = listaChat.scrollHeight;
  }
  formChat.addEventListener('submit', event => {
    event.preventDefault();
    const nome = document.getElementById('chat-nome').value.trim() || 'Anônimo';
    const campoMensagem = document.getElementById('chat-mensagem');
    const mensagem = campoMensagem.value.trim();
    if (!mensagem) return;
    const mensagens = lerLista(CHAVE_CHAT);
    mensagens.push({ nome, mensagem, criadoEm: new Date().toISOString() });
    localStorage.setItem(CHAVE_CHAT, JSON.stringify(mensagens.slice(-100)));
    campoMensagem.value = '';
    renderizarChat();
  });
  renderizarMural();
  renderizarChat();
});
