/* =========================================================
   admin.js — comportamento da página admin.html
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  DB.semearExemplosSeVazio();

  const vistaLogin = document.getElementById('vista-login');
  const vistaPainel = document.getElementById('vista-painel');

  // ---------- Login / sessão ----------
  const formLogin = document.getElementById('form-login');
  const erroLogin = document.getElementById('erro-login');

  function mostrarPainel() {
    vistaLogin.classList.add('hidden');
    vistaPainel.classList.remove('hidden');
    document.getElementById('rotulo-usuario').textContent =
      (JSON.parse(sessionStorage.getItem('sdac_admin_sessao') || '{}').usuario) || 'delegado';
    renderizarVisaoGeral();
    renderizarLista();
  }

  if (DB.admLogado()) mostrarPainel();

  formLogin.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    if (DB.loginAdmin(usuario, senha)) {
      erroLogin.classList.add('hidden');
      mostrarPainel();
    } else {
      erroLogin.textContent = 'Usuário ou senha inválidos.';
      erroLogin.classList.remove('hidden');
    }
  });

  document.getElementById('btn-sair').addEventListener('click', () => {
    DB.logoutAdmin();
    vistaPainel.classList.add('hidden');
    vistaLogin.classList.remove('hidden');
    formLogin.reset();
  });

  // ---------- Navegação entre seções (sem recarregar página) ----------
  const itensNav = document.querySelectorAll('.admin-nav__item');
  const secaoVisaoGeral = document.getElementById('secao-visao-geral');
  const secaoDenuncias = document.getElementById('secao-denuncias');

  function irParaSecao(nome) {
    itensNav.forEach(i => i.classList.toggle('is-active', i.dataset.secao === nome));
    secaoVisaoGeral.classList.toggle('hidden', nome !== 'visao-geral');
    secaoDenuncias.classList.toggle('hidden', nome !== 'denuncias');
    if (nome === 'denuncias') renderizarLista();
  }
  itensNav.forEach(i => i.addEventListener('click', () => irParaSecao(i.dataset.secao)));
  document.querySelectorAll('[data-ir-para]').forEach(btn =>
    btn.addEventListener('click', () => irParaSecao(btn.dataset.irPara))
  );

  // ---------- Visão geral ----------
  function renderizarVisaoGeral() {
    const stats = DB.estatisticas();
    const grade = document.getElementById('grade-estatisticas');
    grade.innerHTML = `
      <div class="stat-card"><div class="valor">${stats.total}</div><div class="rotulo">Total de denúncias</div></div>
      <div class="stat-card"><div class="valor">${stats.recebida + stats.em_analise}</div><div class="rotulo">Aguardando análise</div></div>
      <div class="stat-card"><div class="valor">${stats.em_investigacao}</div><div class="rotulo">Em investigação</div></div>
      <div class="stat-card destaque"><div class="valor">${stats.urgente}</div><div class="rotulo">Marcadas como urgentes</div></div>
    `;

    const recentes = DB.listarDenuncias().slice(0, 5);
    const alvo = document.getElementById('tabela-recentes');
    if (recentes.length === 0) {
      alvo.innerHTML = `<p class="muted" style="padding:16px 0 0;">Nenhuma denúncia registrada ainda.</p>`;
      return;
    }
    alvo.innerHTML = recentes.map(d => `
      <div class="recente-item">
        <div class="recente-item__info">
          <strong>${DB.CATEGORIAS[d.categoria] || d.categoria}</strong>
          <span>${d.protocolo} · ${DB.formatarData(d.dataRegistro)}</span>
        </div>
        <span class="badge ${DB.STATUS[d.status].badge}">${DB.STATUS[d.status].rotulo}</span>
      </div>
    `).join('');
  }

  // ---------- Lista de denúncias com filtros ----------
  const inputBusca = document.getElementById('filtro-busca');
  const selStatus = document.getElementById('filtro-status');
  const selCategoria = document.getElementById('filtro-categoria');
  const selPrioridade = document.getElementById('filtro-prioridade');
  const listaEl = document.getElementById('lista-denuncias');
  const listaVaziaEl = document.getElementById('lista-vazia');

  // Debounce na busca por texto: evita re-renderizar a cada tecla digitada,
  // reduzindo o número de reflows — otimização de recursos no cliente.
  let timerBusca = null;
  inputBusca.addEventListener('input', () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(renderizarLista, 220);
  });
  [selStatus, selCategoria, selPrioridade].forEach(sel => sel.addEventListener('change', renderizarLista));

  document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
    inputBusca.value = '';
    selStatus.value = '';
    selCategoria.value = '';
    selPrioridade.value = '';
    renderizarLista();
  });

  document.getElementById('btn-exportar-csv').addEventListener('click', () => {
    const termo = inputBusca.value.trim().toLowerCase();
    const filtradas = DB.listarDenuncias().filter(d => {
      if (selStatus.value && d.status !== selStatus.value) return false;
      if (selCategoria.value && d.categoria !== selCategoria.value) return false;
      if (selPrioridade.value && d.prioridadeDeclarada !== selPrioridade.value) return false;
      if (termo && !`${d.protocolo} ${d.local} ${d.descricao}`.toLowerCase().includes(termo)) return false;
      return true;
    });
    const cabecalho = ['Protocolo', 'Categoria', 'Local', 'Data do registro', 'Status', 'Prioridade'];
    const linhas = filtradas.map(d => [
      d.protocolo,
      DB.CATEGORIAS[d.categoria] || d.categoria,
      d.local,
      DB.formatarData(d.dataRegistro),
      DB.STATUS[d.status]?.rotulo || d.status,
      DB.PRIORIDADES[d.prioridadeDeclarada]?.rotulo || d.prioridadeDeclarada
    ]);
    const csv = [cabecalho, ...linhas].map(linha => linha.map(valor => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `denuncias-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  function renderizarLista() {
    const termo = inputBusca.value.trim().toLowerCase();
    const fStatus = selStatus.value;
    const fCategoria = selCategoria.value;
    const fPrioridade = selPrioridade.value;

    const filtradas = DB.listarDenuncias().filter(d => {
      if (fStatus && d.status !== fStatus) return false;
      if (fCategoria && d.categoria !== fCategoria) return false;
      if (fPrioridade && d.prioridadeDeclarada !== fPrioridade) return false;
      if (termo) {
        const alvo = `${d.protocolo} ${d.local} ${d.descricao}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });

    listaVaziaEl.classList.toggle('hidden', filtradas.length !== 0);
    if (filtradas.length === 0) { listaEl.innerHTML = ''; return; }

    const cabecalho = `
      <div class="linha-denuncia linha-denuncia--cabecalho" aria-hidden="true">
        <span>Protocolo</span><span>Ocorrência</span><span>Registrada em</span><span>Status</span><span>Prioridade</span><span></span>
      </div>`;

    // Um único innerHTML para toda a lista (em vez de N inserções DOM) —
    // minimiza reflow/repaint ao trocar de filtro.
    const linhas = filtradas.map(d => `
      <div class="linha-denuncia" data-id="${d.id}" role="button" tabindex="0">
        <span class="linha-denuncia__protocolo">${d.protocolo}</span>
        <span class="linha-denuncia__resumo">
          <span class="linha-denuncia__categoria">${DB.CATEGORIAS[d.categoria] || d.categoria}</span><br>
          <span class="linha-denuncia__local">${escaparHtml(d.local)}</span>
        </span>
        <span class="linha-denuncia__data">${DB.formatarData(d.dataRegistro)}</span>
        <span><span class="badge ${DB.STATUS[d.status].badge}">${DB.STATUS[d.status].rotulo}</span></span>
        <span><span class="badge ${DB.PRIORIDADES[d.prioridadeDeclarada].badge}">${DB.PRIORIDADES[d.prioridadeDeclarada].rotulo}</span></span>
        <span class="linha-denuncia__acao">Ver detalhes</span>
      </div>
    `).join('');

    listaEl.innerHTML = cabecalho + linhas;

    // Delegação de evento: um único listener no contêiner em vez de um
    // por linha, poupando memória à medida que a lista cresce.
  }

  listaEl.addEventListener('click', (ev) => {
    const linha = ev.target.closest('.linha-denuncia:not(.linha-denuncia--cabecalho)');
    if (linha) abrirDetalhe(linha.dataset.id);
  });
  listaEl.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const linha = ev.target.closest('.linha-denuncia:not(.linha-denuncia--cabecalho)');
    if (linha) { ev.preventDefault(); abrirDetalhe(linha.dataset.id); }
  });
  document.getElementById('tabela-recentes').addEventListener('click', (ev) => {
    // Também permite abrir o detalhe a partir da visão geral, se desejado no futuro.
  });

  // ---------- Drawer de detalhes ----------
  const drawer = document.getElementById('drawer-detalhe');
  const drawerCorpo = document.getElementById('drawer-corpo');

  function abrirDetalhe(id) {
    const d = DB.buscarPorId(id);
    if (!d) return;
    document.getElementById('drawer-protocolo').textContent = d.protocolo;
    document.getElementById('drawer-titulo').textContent = DB.CATEGORIAS[d.categoria] || d.categoria;

    const historicoHtml = d.historico.slice().reverse().map(h => `
      <li><time>${DB.formatarData(h.data)}</time><strong>${DB.STATUS[h.status]?.rotulo || h.status}</strong> — ${escaparHtml(h.nota)}</li>
    `).join('');

    drawerCorpo.innerHTML = `
      <div class="detalhe-bloco">
        <h3>Local e data</h3>
        <p class="mt-0">${escaparHtml(d.local)} — ocorrido em ${d.dataOcorrido ? DB.formatarData(d.dataOcorrido).split(' às')[0] : 'data não informada'}</p>
      </div>

      <div class="detalhe-bloco">
        <h3>Descrição do denunciante</h3>
        <p class="mt-0">${escaparHtml(d.descricao)}</p>
      </div>

      ${d.anexoDados ? `
        <div class="detalhe-bloco">
          <h3>Anexo (${escaparHtml(d.anexoNome || 'imagem')})</h3>
          <img class="detalhe-anexo" src="${d.anexoDados}" alt="Imagem anexada à denúncia ${d.protocolo}">
        </div>` : ''}

      <div class="detalhe-bloco">
        <h3>Atualizar status</h3>
        <div class="status-select-row">
          <select id="drawer-status">
            ${Object.entries(DB.STATUS).map(([chave, info]) =>
              `<option value="${chave}" ${chave === d.status ? 'selected' : ''}>${info.rotulo}</option>`
            ).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="drawer-aplicar-status" type="button">Aplicar</button>
        </div>
      </div>

      <div class="detalhe-bloco">
        <h3>Resposta ao denunciante (visível na consulta pública)</h3>
        <textarea id="drawer-resposta-publica" placeholder="Ex.: sua denúncia foi encaminhada à equipe de campo…">${escaparHtml(d.respostaPublica)}</textarea>
      </div>

      <div class="detalhe-bloco">
        <h3>Observação interna (uso exclusivo da delegacia)</h3>
        <textarea id="drawer-observacao-interna" placeholder="Anotações internas, não visíveis ao denunciante.">${escaparHtml(d.observacaoInterna)}</textarea>
      </div>

      <button class="btn btn-primary btn-block" id="drawer-salvar">Salvar respostas e observações</button>

      <div class="detalhe-bloco mt-24">
        <h3>Histórico</h3>
        <ul class="linha-tempo">${historicoHtml}</ul>
      </div>
    `;

    document.getElementById('drawer-aplicar-status').addEventListener('click', () => {
      const novo = document.getElementById('drawer-status').value;
      if (novo === d.status) return;
      DB.atualizarStatus(d.id, novo);
      abrirDetalhe(d.id); // reabre já atualizado, refletindo o novo histórico
      renderizarLista();
      renderizarVisaoGeral();
    });

    document.getElementById('drawer-salvar').addEventListener('click', () => {
      const respostaPublica = document.getElementById('drawer-resposta-publica').value.trim();
      const observacaoInterna = document.getElementById('drawer-observacao-interna').value.trim();
      DB.salvarRespostaEObservacao(d.id, { respostaPublica, observacaoInterna });
      const botao = document.getElementById('drawer-salvar');
      const textoOriginal = botao.textContent;
      botao.textContent = 'Salvo!';
      setTimeout(() => { botao.textContent = textoOriginal; }, 1500);
    });

    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function fecharDetalhe() {
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('drawer-fechar').addEventListener('click', fecharDetalhe);
  document.getElementById('drawer-fundo').addEventListener('click', fecharDetalhe);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !drawer.classList.contains('hidden')) fecharDetalhe();
  });

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  }
});
