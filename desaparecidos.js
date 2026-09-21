document.addEventListener('DOMContentLoaded', async () => {
  const CHAVE_MURAL = 'sdac_mural_desaparecidos_v1';
  const CHAVE_CHAT = 'sdac_chat_desaparecidos_v1';
  const CHAVE_MINHAS_PUBLICACOES = 'sdac_minhas_publicacoes_v1';
  const LIMITE_IMAGEM = 5 * 1024 * 1024;
  const formMural = document.getElementById('form-desaparecido');
  const erroMural = document.getElementById('erro-mural');
  const campoFoto = document.getElementById('desaparecido-foto');
  const statusFotosMural = document.getElementById('mural-fotos-status');
  const listaMural = document.getElementById('lista-desaparecidos');
  const muralVazio = document.getElementById('mural-vazio');
  const listaEncontrados = document.getElementById('lista-encontrados');
  const muralEncontradosVazio = document.getElementById('mural-encontrados-vazio');
  const buscaMural = document.getElementById('busca-mural');
  const botaoMinhasPublicacoes = document.getElementById('mostrar-minhas-publicacoes');
  const formEdicao = document.getElementById('form-edicao-post');
  const painelEdicao = document.getElementById('painel-edicao');
  const campoNomeEdicao = document.getElementById('edicao-nome');
  const campoIdadeEdicao = document.getElementById('edicao-idade');
  const campoCidadeEdicao = document.getElementById('edicao-cidade');
  const campoUltimoContatoEdicao = document.getElementById('edicao-ultimo-contato');
  const campoCaracteristicasEdicao = document.getElementById('edicao-caracteristicas');
  const campoContatoEdicao = document.getElementById('edicao-contato');
  const campoFotosEdicao = document.getElementById('edicao-fotos');
  const campoStatusEdicao = document.getElementById('edicao-status');
  const campoIdEdicao = document.getElementById('edicao-post-id');
  const galeriaEdicao = document.getElementById('edicao-galeria');
  const feedbackEdicao = document.getElementById('feedback-edicao');
  const formChat = document.getElementById('form-chat');
  const listaChat = document.getElementById('lista-chat');
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const modoOnline = Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
  const cliente = modoOnline ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
  let fotosEmEdicao = [];
  let mostrarSomenteMinhas = false;
  const termosBloqueadosForum = ['porn', 'sexo', 'nude', 'nudez', 'pelado', 'pelada', 'putaria', 'estupro', 'matar', 'assassinar'];

  function lerLista(chave) { try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch { return []; } }
  function salvarLista(chave, itens) { localStorage.setItem(chave, JSON.stringify(itens)); }
  function minhasPublicacoes() { return new Set(lerLista(CHAVE_MINHAS_PUBLICACOES).map(String)); }
  function registrarMinhaPublicacao(id) {
    const ids = [...new Set([...lerLista(CHAVE_MINHAS_PUBLICACOES).map(String), String(id)])];
    salvarLista(CHAVE_MINHAS_PUBLICACOES, ids);
  }
  function escapar(texto) { const div = document.createElement('div'); div.textContent = texto ?? ''; return div.innerHTML; }
  function formatarData(iso) { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
  function exibirFeedbackEdicao(mensagem, tipo = 'sucesso') {
    feedbackEdicao.textContent = mensagem;
    feedbackEdicao.className = `mural-edicao__feedback mural-edicao__feedback--${tipo}`;
  }
  function limparFeedbackEdicao() { feedbackEdicao.textContent = ''; feedbackEdicao.className = 'mural-edicao__feedback hidden'; }
  function erroDePermissao(acao) {
    return new Error(`Não foi possível ${acao}. No Supabase, abra o SQL Editor e execute o arquivo supabase-schema.sql para liberar edição e exclusão.`);
  }
  function mensagemPermitidaNoForum(mensagem) {
    const texto = mensagem.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return !termosBloqueadosForum.some(termo => texto.includes(termo));
  }
  function renderizarGaleriaEdicao() {
    galeriaEdicao.innerHTML = fotosEmEdicao.length
      ? fotosEmEdicao.map((foto, index) => `<div class="mural-edicao__photo"><img src="${escapar(foto)}" alt="Foto ${index + 1} da publicação"><button type="button" data-remover-foto="${index}" aria-label="Remover foto ${index + 1}">Remover</button></div>`).join('')
      : '<p class="mural-edicao__gallery-empty">Nenhuma foto selecionada. Adicione ao menos uma imagem antes de salvar.</p>';
  }
  function caminhoDaFotoNoStorage(url) {
    try {
      const marcador = '/object/public/missing-photos/';
      const indice = url.indexOf(marcador);
      return indice >= 0 ? decodeURIComponent(url.slice(indice + marcador.length)) : null;
    } catch { return null; }
  }
  async function removerFotosDoStorage(urls) {
    if (!modoOnline || !urls.length) return;
    const caminhos = urls.map(caminhoDaFotoNoStorage).filter(Boolean);
    if (caminhos.length) await cliente.storage.from('missing-photos').remove(caminhos);
  }
  function normalizarPublicacao(item) {
    const galeria = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [];
    const fotoPrincipal = item.photo_url || item.foto || galeria[0] || '';
    const status = item.status || 'desaparecida';
    return {
      ...item,
      id: item.id,
      nome: item.name || item.nome,
      idade: item.age || item.idade,
      cidade: item.city || item.cidade,
      ultimoContato: item.last_contact || item.ultimoContato,
      caracteristicas: item.characteristics || item.caracteristicas,
      contato: item.contact || item.contato,
      foto: fotoPrincipal,
      gallery: galeria.length ? galeria : [fotoPrincipal].filter(Boolean),
      status,
      criadoEm: item.created_at || item.criadoEm
    };
  }
  function atualizarStatusFotosMural() {
    const quantidade = campoFoto.files?.length || 0;
    statusFotosMural.textContent = quantidade ? `${quantidade} ${quantidade === 1 ? 'imagem selecionada' : 'imagens selecionadas'}.` : 'A primeira será a foto de capa do alerta.';
  }
  function lerImagem(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo) return reject('Selecione uma foto válida.');
      if (!arquivo.type || !arquivo.type.startsWith('image/')) return reject('Selecione um arquivo de imagem válido.');
      if (arquivo.size > LIMITE_IMAGEM) return reject('A foto deve ter no máximo 5 MB.');
      const leitor = new FileReader(); leitor.onload = () => resolve(leitor.result); leitor.onerror = () => reject('Não foi possível ler a foto.'); leitor.readAsDataURL(arquivo);
    });
  }
  async function processarArquivos(arquivos) {
    const listaArquivos = Array.from(arquivos || []).filter(Boolean);
    if (!listaArquivos.length) return [];

    if (modoOnline) {
      const urls = [];
      for (const arquivo of listaArquivos.slice(0, 4)) {
        if (!arquivo.type || !arquivo.type.startsWith('image/')) {
          throw new Error('Selecione apenas imagens válidas.');
        }
        if (arquivo.size > LIMITE_IMAGEM) {
          throw new Error('Cada imagem deve ter no máximo 5 MB.');
        }
        const extensao = (arquivo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const caminho = `publicacoes/${Date.now()}-${crypto.randomUUID()}.${extensao || 'jpg'}`;
        const { error: uploadError } = await cliente.storage.from('missing-photos').upload(caminho, arquivo, {
          contentType: arquivo.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
        if (uploadError) throw new Error('Não foi possível enviar uma das fotos ao armazenamento do Supabase.');
        const publicUrl = cliente.storage.from('missing-photos').getPublicUrl(caminho).data.publicUrl;
        if (publicUrl) urls.push(publicUrl);
      }
      return urls;
    }

    const resultados = [];
    for (const arquivo of listaArquivos.slice(0, 4)) {
      resultados.push(await lerImagem(arquivo));
    }
    return resultados;
  }
  async function carregarPublicacoes() {
    if (!modoOnline) return lerLista(CHAVE_MURAL).map(normalizarPublicacao);
    const { data, error } = await cliente.from('missing_person_posts').select('*').order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar o mural online.');
    return data.map(normalizarPublicacao);
  }
  async function carregarMensagens() {
    if (!modoOnline) return lerLista(CHAVE_CHAT);
    const { data, error } = await cliente.from('missing_person_messages').select('*').order('created_at', { ascending: true }).limit(100);
    if (error) throw new Error('Não foi possível carregar o chat online.');
    return data.map(item => ({ nome: item.sender_name, mensagem: item.message, criadoEm: item.created_at }));
  }
  function renderizarCard(publicacao, modoCompacto = false) {
    const fotos = (publicacao.gallery && publicacao.gallery.length ? publicacao.gallery : [publicacao.foto]).filter(Boolean);
    const principal = fotos[0] || '';
    const statusTexto = publicacao.status === 'encontrada' ? 'Encontrado' : 'Desaparecido';
    const badgeClass = publicacao.status === 'encontrada' ? 'mural-badge mural-badge--found' : 'mural-badge';
    const detalhesExtras = fotos.length > 1 ? `<div class="mural-card__gallery">${fotos.slice(0, 3).map(foto => `<img src="${escapar(foto)}" alt="Foto adicional de ${escapar(publicacao.nome)}">`).join('')}</div>` : '';
    return `<article class="mural-card mural-card--enter">${principal ? `<img src="${escapar(principal)}" alt="Foto de ${escapar(publicacao.nome)}">` : '<div class="mural-card__sem-foto">Sem foto</div>'}<div class="mural-card__body"><div class="mural-card__top"><div><p class="mural-card__label">Pessoa ${publicacao.status === 'encontrada' ? 'localizada' : 'desaparecida'}</p><h3>${escapar(publicacao.nome)}</h3></div><span class="mural-card__location">${escapar(publicacao.cidade)}</span></div><div class="mural-card__badges"><span class="${badgeClass}">${statusTexto}</span>${publicacao.idade ? `<span class="mural-badge mural-badge--neutral">${escapar(publicacao.idade)}</span>` : ''}</div><div class="mural-card__facts"><p><strong>Último contato</strong><span>${escapar(publicacao.ultimoContato)}</span></p><p><strong>Características</strong><span>${escapar(publicacao.caracteristicas)}</span></p></div><div class="mural-card__contact"><strong>Canal autorizado</strong><span>${escapar(publicacao.contato)}</span></div>${detalhesExtras}<div class="mural-card__actions">${modoCompacto ? '' : `<button type="button" class="mural-card__action" data-action="editar" data-id="${publicacao.id}">Editar dados</button><button type="button" class="mural-card__action mural-card__action--secondary" data-action="encontrado" data-id="${publicacao.id}">Marcar encontrada</button><button type="button" class="mural-card__action mural-card__action--danger" data-action="excluir" data-id="${publicacao.id}">Excluir</button>`}</div><small>Publicado em ${formatarData(publicacao.criadoEm)}</small></div></article>`;
  }
  async function renderizarMural() {
    if (!listaMural || !muralVazio) return;
    const termo = buscaMural?.value.trim().toLowerCase() || '';
    try {
      const meusIds = minhasPublicacoes();
      const publicacoes = (await carregarPublicacoes()).filter(item => item.status !== 'encontrada' && `${item.nome} ${item.cidade}`.toLowerCase().includes(termo) && (!mostrarSomenteMinhas || meusIds.has(String(item.id))));
      muralVazio.classList.toggle('hidden', publicacoes.length > 0);
      listaMural.innerHTML = publicacoes.length ? publicacoes.map(item => renderizarCard(item, false)).join('') : '';
      listaMural.querySelectorAll('.mural-card--enter').forEach((card, index) => {
        card.style.animationDelay = `${index * 60}ms`;
      });
    } catch (error) { muralVazio.textContent = error.message; muralVazio.classList.remove('hidden'); }
  }
  async function renderizarEncontrados() {
    if (!listaEncontrados || !muralEncontradosVazio) return;
    try {
      const publicacoes = (await carregarPublicacoes()).filter(item => item.status === 'encontrada');
      muralEncontradosVazio.classList.toggle('hidden', publicacoes.length > 0);
      listaEncontrados.innerHTML = publicacoes.length ? publicacoes.map(item => renderizarCard(item, true)).join('') : '';
      listaEncontrados.querySelectorAll('.mural-card--enter').forEach((card, index) => {
        card.style.animationDelay = `${index * 60}ms`;
      });
    } catch (error) { muralEncontradosVazio.textContent = error.message; muralEncontradosVazio.classList.remove('hidden'); }
  }
  async function renderizarChat() {
    if (!listaChat) return;
    try {
      const mensagens = (await carregarMensagens()).slice(-40);
      listaChat.innerHTML = mensagens.length ? mensagens.map(item => `<div class="chat-message"><div><strong>${escapar(item.nome || 'Anônimo')}</strong><small>${formatarData(item.criadoEm)}</small></div><p>${escapar(item.mensagem)}</p></div>`).join('') : '<p class="muted">Ainda não há mensagens. Compartilhe apenas informações confirmadas.</p>';
      listaChat.scrollTop = listaChat.scrollHeight;
    } catch (error) { listaChat.innerHTML = `<p class="alert alert-error">${escapar(error.message)}</p>`; }
  }
  async function atualizarPost(postId, status, galerias, dadosExtras = {}) {
    const publicacoes = await carregarPublicacoes();
    const indice = publicacoes.findIndex(item => String(item.id) === String(postId));
    if (indice === -1) throw new Error('Publicação não encontrada para atualizar.');

    const itemAtual = publicacoes[indice];
    const fotos = (galerias && galerias.length ? galerias : itemAtual.gallery || [itemAtual.foto]).filter(Boolean);
    const fotoPrincipal = fotos[0] || itemAtual.foto;
    const registroAtualizado = {
      ...itemAtual,
      ...dadosExtras,
      status,
      gallery: fotos.slice(0, 4),
      foto: fotoPrincipal,
      photo_url: fotoPrincipal,
      nome: dadosExtras.nome || itemAtual.nome,
      idade: dadosExtras.idade ?? itemAtual.idade,
      cidade: dadosExtras.cidade || itemAtual.cidade,
      ultimoContato: dadosExtras.ultimoContato || itemAtual.ultimoContato,
      caracteristicas: dadosExtras.caracteristicas || itemAtual.caracteristicas,
      contato: dadosExtras.contato || itemAtual.contato,
      name: dadosExtras.name || itemAtual.name || itemAtual.nome,
      age: dadosExtras.age ?? itemAtual.age ?? itemAtual.idade,
      city: dadosExtras.city || itemAtual.city || itemAtual.cidade,
      last_contact: dadosExtras.last_contact || itemAtual.last_contact || itemAtual.ultimoContato,
      characteristics: dadosExtras.characteristics || itemAtual.characteristics || itemAtual.caracteristicas,
      contact: dadosExtras.contact || itemAtual.contact || itemAtual.contato
    };

    if (modoOnline) {
      const payload = {
        name: registroAtualizado.name,
        age: registroAtualizado.age,
        city: registroAtualizado.city,
        last_contact: registroAtualizado.last_contact,
        characteristics: registroAtualizado.characteristics,
        contact: registroAtualizado.contact,
        photo_url: fotoPrincipal,
        gallery: fotos.slice(0, 4),
        status
      };
      const { data, error } = await cliente.from('missing_person_posts').update(payload).eq('id', postId).select('id');
      if (error) throw new Error(`Não foi possível atualizar o caso no Supabase: ${error.message}`);
      if (!data?.length) throw erroDePermissao('atualizar esta publicação');
      const fotosAntigas = (itemAtual.gallery || [itemAtual.foto]).filter(Boolean);
      await removerFotosDoStorage(fotosAntigas.filter(foto => !fotos.includes(foto)));
    } else {
      publicacoes[indice] = registroAtualizado;
      salvarLista(CHAVE_MURAL, publicacoes);
    }

    await renderizarMural();
    await renderizarEncontrados();
    return registroAtualizado;
  }

  async function excluirPost(postId) {
    if (modoOnline) {
      const publicacao = (await carregarPublicacoes()).find(item => String(item.id) === String(postId));
      const { data, error } = await cliente.from('missing_person_posts').delete().eq('id', postId).select('id');
      if (error) throw new Error(`Não foi possível excluir a publicação: ${error.message}`);
      if (!data?.length) throw erroDePermissao('excluir esta publicação');
      await removerFotosDoStorage((publicacao?.gallery || [publicacao?.foto]).filter(Boolean));
      return;
    }

    const publicacoes = lerLista(CHAVE_MURAL).filter(item => String(item.id) !== String(postId));
    salvarLista(CHAVE_MURAL, publicacoes);
  }
  formMural.addEventListener('submit', async event => {
    event.preventDefault(); erroMural.classList.add('hidden');
    try {
      const arquivos = Array.from(campoFoto.files || []).filter(Boolean);
      if (!arquivos.length) throw new Error('Selecione uma foto recente.');
      if (arquivos.length > 4) throw new Error('Selecione no máximo 4 imagens para a publicação.');
      const fotos = await processarArquivos(arquivos);
      if (!fotos.length) throw new Error('Selecione ao menos uma foto válida.');
      const nome = document.getElementById('desaparecido-nome').value.trim();
      const idade = document.getElementById('desaparecido-idade').value.trim();
      const cidade = document.getElementById('desaparecido-cidade').value.trim();
      const ultimoContato = document.getElementById('desaparecido-data').value.trim();
      const caracteristicas = document.getElementById('desaparecido-caracteristicas').value.trim();
      const contato = document.getElementById('desaparecido-contato').value.trim();

      const item = {
        id: crypto.randomUUID(),
        name: nome,
        age: idade,
        city: cidade,
        last_contact: ultimoContato,
        characteristics: caracteristicas,
        contact: contato,
        photo_url: fotos[0],
        gallery: fotos.slice(0, 4),
        status: 'desaparecida',
        created_at: new Date().toISOString()
      };

      if (modoOnline) {
        const { error } = await cliente.from('missing_person_posts').insert(item);
        if (error) throw new Error('Não foi possível publicar o caso.');
      } else {
        const publicacoes = lerLista(CHAVE_MURAL);
        publicacoes.unshift(normalizarPublicacao(item));
        salvarLista(CHAVE_MURAL, publicacoes);
      }
      registrarMinhaPublicacao(item.id);
      formMural.reset(); atualizarStatusFotosMural(); await renderizarMural(); await renderizarEncontrados();
      if (document.body.classList.contains('pagina-desaparecidos') && !document.body.classList.contains('pagina-mural')) window.location.href = 'mural.html#mural-buscas';
    } catch (error) { erroMural.textContent = error.message || error; erroMural.classList.remove('hidden'); }
  });

  function abrirEditor(post) {
    limparFeedbackEdicao();
    campoIdEdicao.value = post.id;
    campoNomeEdicao.value = post.nome || '';
    campoIdadeEdicao.value = post.idade || '';
    campoCidadeEdicao.value = post.cidade || '';
    campoUltimoContatoEdicao.value = post.ultimoContato || '';
    campoCaracteristicasEdicao.value = post.caracteristicas || '';
    campoContatoEdicao.value = post.contato || '';
    campoStatusEdicao.value = post.status || 'desaparecida';
    campoFotosEdicao.value = '';
    fotosEmEdicao = (post.gallery && post.gallery.length ? post.gallery : [post.foto]).filter(Boolean).slice(0, 4);
    renderizarGaleriaEdicao();
    painelEdicao.classList.remove('hidden');
    painelEdicao.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', async event => {
    const botao = event.target.closest('[data-action]');
    if (!botao) return;
    const { action, id } = botao.dataset;
    if (action === 'editar') {
      const publicacoes = await carregarPublicacoes();
      const post = publicacoes.find(item => String(item.id) === String(id));
      if (!post) return;
      abrirEditor(post);
      return;
    }
    if (action === 'encontrado') {
      try {
        await atualizarPost(id, 'encontrada', null);
      } catch (error) {
        erroMural.textContent = error.message || error;
        erroMural.classList.remove('hidden');
      }
      return;
    }
    if (action === 'excluir') {
      const confirmar = window.confirm('Tem certeza que deseja excluir esta publicação?');
      if (!confirmar) return;
      try {
        await excluirPost(id);
        await renderizarMural();
        await renderizarEncontrados();
      } catch (error) {
        erroMural.textContent = error.message || error;
        erroMural.classList.remove('hidden');
      }
    }
  });
  document.addEventListener('click', event => {
    const botaoFechar = event.target.closest('[data-fechar-edicao]');
    if (!botaoFechar) return;
    painelEdicao.classList.add('hidden');
    formEdicao.reset();
  });
  document.addEventListener('click', event => {
    const botao = event.target.closest('[data-remover-foto]');
    if (!botao) return;
    fotosEmEdicao.splice(Number(botao.dataset.removerFoto), 1);
    renderizarGaleriaEdicao();
  });
  document.querySelector('[data-excluir-post]')?.addEventListener('click', async () => {
    const postId = campoIdEdicao.value;
    if (!postId) return;
    const confirmar = window.confirm('Deseja remover esta publicação do mural?');
    if (!confirmar) return;
    try {
      await excluirPost(postId);
      exibirFeedbackEdicao('Publicação excluída com sucesso.');
      formEdicao.reset();
      painelEdicao.classList.add('hidden');
      await renderizarMural();
      await renderizarEncontrados();
    } catch (error) {
      erroMural.textContent = error.message || error;
      erroMural.classList.remove('hidden');
    }
  });
  formEdicao.addEventListener('submit', async event => {
    event.preventDefault();
    const postId = campoIdEdicao.value;
    if (!postId) return;
    limparFeedbackEdicao();
    try {
      const arquivos = Array.from(campoFotosEdicao.files || []).filter(Boolean);
      if (arquivos.length > 4) throw new Error('Selecione no máximo 4 imagens por atualização.');
      const novasFotos = arquivos.length ? await processarArquivos(arquivos) : [];
      const fotosCombinadas = [...novasFotos, ...fotosEmEdicao].filter(Boolean).slice(0, 4);
      if (!fotosCombinadas.length) throw new Error('Mantenha ou adicione ao menos uma foto antes de salvar.');
      const proximoStatus = campoStatusEdicao.value || 'desaparecida';
      const dadosExtras = {
        nome: campoNomeEdicao.value.trim(),
        idade: campoIdadeEdicao.value.trim(),
        cidade: campoCidadeEdicao.value.trim(),
        ultimoContato: campoUltimoContatoEdicao.value.trim(),
        caracteristicas: campoCaracteristicasEdicao.value.trim(),
        contato: campoContatoEdicao.value.trim(),
        name: campoNomeEdicao.value.trim(),
        age: campoIdadeEdicao.value.trim(),
        city: campoCidadeEdicao.value.trim(),
        last_contact: campoUltimoContatoEdicao.value.trim(),
        characteristics: campoCaracteristicasEdicao.value.trim(),
        contact: campoContatoEdicao.value.trim()
      };
      await atualizarPost(postId, proximoStatus, fotosCombinadas, dadosExtras);
      exibirFeedbackEdicao('Alterações salvas com sucesso.');
      formEdicao.reset();
      painelEdicao.classList.add('hidden');
    } catch (error) {
      erroMural.textContent = error.message || error;
      erroMural.classList.remove('hidden');
    }
  });
  campoFoto.addEventListener('change', atualizarStatusFotosMural);
  botaoMinhasPublicacoes?.addEventListener('click', async () => {
    mostrarSomenteMinhas = !mostrarSomenteMinhas;
    botaoMinhasPublicacoes.setAttribute('aria-pressed', String(mostrarSomenteMinhas));
    botaoMinhasPublicacoes.textContent = mostrarSomenteMinhas ? 'Ver todas as publicações' : 'Minhas publicações';
    await renderizarMural();
  });
  buscaMural?.addEventListener('input', renderizarMural);
  formChat?.addEventListener('submit', async event => {
    event.preventDefault();
    const nome = document.getElementById('chat-nome').value.trim() || 'Anônimo'; const campoMensagem = document.getElementById('chat-mensagem'); const mensagem = campoMensagem.value.trim(); if (!mensagem) return;
    if (!mensagemPermitidaNoForum(mensagem)) { listaChat.insertAdjacentHTML('afterbegin', '<p class="alert alert-error">Esta mensagem não segue as regras do fórum. Não envie conteúdo explícito, ameaças ou informações que exponham pessoas.</p>'); return; }
    try {
      if (modoOnline) { const { error } = await cliente.from('missing_person_messages').insert({ sender_name: nome, message: mensagem }); if (error) throw new Error('Não foi possível enviar a mensagem.'); }
      else { const mensagens = lerLista(CHAVE_CHAT); mensagens.push({ nome, mensagem, criadoEm: new Date().toISOString() }); salvarLista(CHAVE_CHAT, mensagens.slice(-100)); }
      campoMensagem.value = ''; await renderizarChat();
    } catch (error) { listaChat.insertAdjacentHTML('afterbegin', `<p class="alert alert-error">${escapar(error.message)}</p>`); }
  });
  if (modoOnline && listaChat) cliente.channel('missing-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missing_person_messages' }, renderizarChat).subscribe();
  if (document.body.classList.contains('pagina-mural')) document.addEventListener('pointermove', event => {
    document.body.style.setProperty('--mural-pointer-x', `${(event.clientX / window.innerWidth) * 100}%`);
    document.body.style.setProperty('--mural-pointer-y', `${(event.clientY / window.innerHeight) * 100}%`);
  }, { passive: true });
  await renderizarMural();
  await renderizarEncontrados();
  await renderizarChat();
});
