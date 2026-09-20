document.addEventListener('DOMContentLoaded', async () => {
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
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const modoOnline = Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
  const cliente = modoOnline ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;

  function lerLista(chave) { try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch { return []; } }
  function escapar(texto) { const div = document.createElement('div'); div.textContent = texto ?? ''; return div.innerHTML; }
  function formatarData(iso) { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
  function lerImagem(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo || !arquivo.type.startsWith('image/')) return reject('Selecione uma foto válida.');
      if (arquivo.size > LIMITE_IMAGEM) return reject('A foto deve ter no máximo 1,5 MB.');
      const leitor = new FileReader(); leitor.onload = () => resolve(leitor.result); leitor.onerror = () => reject('Não foi possível ler a foto.'); leitor.readAsDataURL(arquivo);
    });
  }
  async function carregarPublicacoes() {
    if (!modoOnline) return lerLista(CHAVE_MURAL);
    const { data, error } = await cliente.from('missing_person_posts').select('*').order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar o mural online.');
    return data.map(item => ({ ...item, foto: item.photo_url, criadoEm: item.created_at, nome: item.name, cidade: item.city, ultimoContato: item.last_contact, caracteristicas: item.characteristics, contato: item.contact }));
  }
  async function carregarMensagens() {
    if (!modoOnline) return lerLista(CHAVE_CHAT);
    const { data, error } = await cliente.from('missing_person_messages').select('*').order('created_at', { ascending: true }).limit(100);
    if (error) throw new Error('Não foi possível carregar o chat online.');
    return data.map(item => ({ nome: item.sender_name, mensagem: item.message, criadoEm: item.created_at }));
  }
  async function renderizarMural() {
    const termo = buscaMural.value.trim().toLowerCase();
    try {
      const publicacoes = (await carregarPublicacoes()).filter(item => `${item.nome} ${item.cidade}`.toLowerCase().includes(termo));
      muralVazio.classList.toggle('hidden', publicacoes.length > 0);
      listaMural.innerHTML = publicacoes.map(item => `<article class="mural-card"><img src="${escapar(item.foto)}" alt="Foto de ${escapar(item.nome)}"><div class="mural-card__body"><div class="mural-card__top"><h3>${escapar(item.nome)}</h3><span>${escapar(item.cidade)}</span></div><p><strong>Último contato:</strong> ${escapar(item.ultimoContato)}</p><p>${escapar(item.caracteristicas)}</p><div class="mural-card__contact"><strong>Informações:</strong> ${escapar(item.contato)}</div><small>Publicado em ${formatarData(item.criadoEm)}</small></div></article>`).join('');
    } catch (error) { muralVazio.textContent = error.message; muralVazio.classList.remove('hidden'); }
  }
  async function renderizarChat() {
    try {
      const mensagens = (await carregarMensagens()).slice(-40);
      listaChat.innerHTML = mensagens.length ? mensagens.map(item => `<div class="chat-message"><div><strong>${escapar(item.nome || 'Anônimo')}</strong><small>${formatarData(item.criadoEm)}</small></div><p>${escapar(item.mensagem)}</p></div>`).join('') : '<p class="muted">Ainda não há mensagens. Compartilhe apenas informações confirmadas.</p>';
      listaChat.scrollTop = listaChat.scrollHeight;
    } catch (error) { listaChat.innerHTML = `<p class="alert alert-error">${escapar(error.message)}</p>`; }
  }
  formMural.addEventListener('submit', async event => {
    event.preventDefault(); erroMural.classList.add('hidden');
    try {
      const arquivo = campoFoto.files[0]; const foto = await lerImagem(arquivo);
      const nome = document.getElementById('desaparecido-nome').value.trim();
      const idade = document.getElementById('desaparecido-idade').value.trim();
      const cidade = document.getElementById('desaparecido-cidade').value.trim();
      const ultimoContato = document.getElementById('desaparecido-data').value.trim();
      const caracteristicas = document.getElementById('desaparecido-caracteristicas').value.trim();
      const contato = document.getElementById('desaparecido-contato').value.trim();
      if (modoOnline) {
        const caminho = `${crypto.randomUUID()}.${arquivo.name.split('.').pop().toLowerCase()}`;
        const upload = await cliente.storage.from('missing-photos').upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
        if (upload.error) throw new Error('Não foi possível enviar a foto.');
        const url = cliente.storage.from('missing-photos').getPublicUrl(caminho).data.publicUrl;
        const { error } = await cliente.from('missing_person_posts').insert({ name: nome, age: idade, city: cidade, last_contact: ultimoContato, characteristics: caracteristicas, contact: contato, photo_url: url });
        if (error) throw new Error('Não foi possível publicar o caso.');
      } else {
        const publicacoes = lerLista(CHAVE_MURAL); publicacoes.unshift({ id: crypto.randomUUID(), nome, idade, cidade, ultimoContato, caracteristicas, contato, foto, criadoEm: new Date().toISOString() }); localStorage.setItem(CHAVE_MURAL, JSON.stringify(publicacoes));
      }
      formMural.reset(); await renderizarMural();
    } catch (error) { erroMural.textContent = error.message || error; erroMural.classList.remove('hidden'); }
  });
  buscaMural.addEventListener('input', renderizarMural);
  formChat.addEventListener('submit', async event => {
    event.preventDefault();
    const nome = document.getElementById('chat-nome').value.trim() || 'Anônimo'; const campoMensagem = document.getElementById('chat-mensagem'); const mensagem = campoMensagem.value.trim(); if (!mensagem) return;
    try {
      if (modoOnline) { const { error } = await cliente.from('missing_person_messages').insert({ sender_name: nome, message: mensagem }); if (error) throw new Error('Não foi possível enviar a mensagem.'); }
      else { const mensagens = lerLista(CHAVE_CHAT); mensagens.push({ nome, mensagem, criadoEm: new Date().toISOString() }); localStorage.setItem(CHAVE_CHAT, JSON.stringify(mensagens.slice(-100))); }
      campoMensagem.value = ''; await renderizarChat();
    } catch (error) { listaChat.insertAdjacentHTML('afterbegin', `<p class="alert alert-error">${escapar(error.message)}</p>`); }
  });
  if (modoOnline) cliente.channel('missing-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missing_person_messages' }, renderizarChat).subscribe();
  await renderizarMural(); await renderizarChat();
});
