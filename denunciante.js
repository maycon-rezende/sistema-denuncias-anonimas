/* =========================================================
   denunciante.js — comportamento da página denunciante.html
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  DB.semearExemplosSeVazio();

  // ---------- Alternância de abas ----------
  const tabNova = document.getElementById('tab-nova');
  const tabConsulta = document.getElementById('tab-consulta');
  const painelNova = document.getElementById('painel-nova');
  const painelConsulta = document.getElementById('painel-consulta');

  function ativarAba(aba) {
    const ehNova = aba === 'nova';
    tabNova.classList.toggle('is-active', ehNova);
    tabConsulta.classList.toggle('is-active', !ehNova);
    tabNova.setAttribute('aria-selected', String(ehNova));
    tabConsulta.setAttribute('aria-selected', String(!ehNova));
    painelNova.classList.toggle('hidden', !ehNova);
    painelConsulta.classList.toggle('hidden', ehNova);
  }
  tabNova.addEventListener('click', () => ativarAba('nova'));
  tabConsulta.addEventListener('click', () => ativarAba('consulta'));
  if (window.location.hash === '#painel-consulta') ativarAba('consulta');

  // ---------- Envio de nova denúncia ----------
  const form = document.getElementById('form-denuncia');
  const vistaFormulario = document.getElementById('vista-formulario');
  const vistaConfirmacao = document.getElementById('vista-confirmacao');
  const erroBox = document.getElementById('erro-formulario');
  const campoAnexo = document.getElementById('anexo');

  const LIMITE_ANEXO_BYTES = 1.5 * 1024 * 1024;

  function lerAnexoComoBase64(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo) return resolve(null);
      if (!arquivo.type.startsWith('image/')) return reject('O anexo precisa ser uma imagem.');
      if (arquivo.size > LIMITE_ANEXO_BYTES) return reject('A imagem excede o limite de 1,5 MB.');
      const leitor = new FileReader();
      leitor.onload = () => resolve({ nome: arquivo.name, dados: leitor.result });
      leitor.onerror = () => reject('Não foi possível ler o arquivo anexado.');
      leitor.readAsDataURL(arquivo);
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    erroBox.classList.add('hidden');

    const dados = new FormData(form);
    const descricao = (dados.get('descricao') || '').trim();
    const local = (dados.get('local') || '').trim();
    const categoria = dados.get('categoria');

    if (!categoria || !local || descricao.length < 20) {
      erroBox.textContent = 'Verifique os campos obrigatórios: categoria, local e uma descrição com ao menos 20 caracteres.';
      erroBox.classList.remove('hidden');
      erroBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    let anexo = null;
    try {
      anexo = await lerAnexoComoBase64(campoAnexo.files[0]);
    } catch (mensagem) {
      erroBox.textContent = mensagem;
      erroBox.classList.remove('hidden');
      return;
    }

    const registro = DB.criarDenuncia({
      categoria,
      local,
      dataOcorrido: dados.get('dataOcorrido'),
      descricao,
      prioridade: dados.get('prioridade') || 'media',
      anexoNome: anexo?.nome || null,
      anexoDados: anexo?.dados || null
    });

    document.getElementById('protocolo-gerado').textContent = registro.protocolo;
    vistaFormulario.classList.add('hidden');
    vistaConfirmacao.classList.remove('hidden');
    vistaConfirmacao.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('btn-copiar-protocolo').addEventListener('click', async (ev) => {
    const texto = document.getElementById('protocolo-gerado').textContent;
    try {
      await navigator.clipboard.writeText(texto);
      ev.target.textContent = 'Copiado!';
      setTimeout(() => { ev.target.textContent = 'Copiar protocolo'; }, 1800);
    } catch {
      alert('Não foi possível copiar automaticamente. Copie manualmente: ' + texto);
    }
  });

  document.getElementById('btn-nova-denuncia').addEventListener('click', () => {
    form.reset();
    vistaConfirmacao.classList.add('hidden');
    vistaFormulario.classList.remove('hidden');
  });

  // ---------- Consulta por protocolo ----------
  const formConsulta = document.getElementById('form-consulta');
  const resultado = document.getElementById('resultado-consulta');

  formConsulta.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const termo = document.getElementById('protocolo-busca').value.trim();
    if (!termo) return;

    const registro = DB.buscarPorProtocolo(termo);
    if (!registro) {
      resultado.innerHTML = `<div class="alert alert-error" role="alert">Nenhuma denúncia encontrada para o protocolo informado. Verifique se digitou corretamente.</div>`;
      return;
    }
    renderizarResultado(registro);
  });

  function renderizarResultado(d) {
    const statusInfo = DB.STATUS[d.status];
    const categoriaRotulo = DB.CATEGORIAS[d.categoria] || d.categoria;

    const historicoHtml = d.historico.slice().reverse().map(h => `
      <li>
        <time>${DB.formatarData(h.data)}</time>
        <strong>${DB.STATUS[h.status]?.rotulo || h.status}</strong> — ${escaparHtml(h.nota)}
      </li>
    `).join('');

    resultado.innerHTML = `
      <div class="consulta-cabecalho">
        <div>
          <h2>${categoriaRotulo}</h2>
          <div class="consulta-meta">Protocolo ${d.protocolo} · registrada em ${DB.formatarData(d.dataRegistro)}</div>
        </div>
        <span class="badge ${statusInfo.badge}">${statusInfo.rotulo}</span>
      </div>
      <p>${escaparHtml(d.descricao)}</p>
      ${d.respostaPublica ? `
        <div class="resposta-oficial">
          <strong>Retorno da delegacia</strong>
          ${escaparHtml(d.respostaPublica)}
        </div>` : ''}
      <ul class="linha-tempo">${historicoHtml}</ul>
    `;
  }

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  }
});
