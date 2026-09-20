/* =========================================================
   storage.js — Camada de dados do protótipo.
   Único ponto de leitura/escrita no localStorage, usado tanto
   pelo perfil Denunciante quanto pelo Administrador. Centralizar
   aqui evita chaves duplicadas e leituras/escritas redundantes
   (otimização de recursos: uma única serialização por operação).
   ========================================================= */

const DB = (() => {
  const CHAVE_DENUNCIAS = 'sdac_denuncias_v1';
  const CHAVE_SEQUENCIA = 'sdac_sequencia_v1';
  const CHAVE_SESSAO_ADM = 'sdac_admin_sessao';

  const CATEGORIAS = {
    furto: 'Furto',
    roubo: 'Roubo',
    violencia_domestica: 'Violência doméstica',
    trafico: 'Tráfico de drogas',
    vandalismo: 'Vandalismo / dano ao patrimônio',
    ameaca: 'Ameaça',
    outro: 'Outro'
  };

  const STATUS = {
    recebida: { rotulo: 'Recebida', badge: 'badge-recebida' },
    em_analise: { rotulo: 'Em análise', badge: 'badge-analise' },
    em_investigacao: { rotulo: 'Em investigação', badge: 'badge-investigacao' },
    concluida: { rotulo: 'Concluída', badge: 'badge-concluida' },
    arquivada: { rotulo: 'Arquivada', badge: 'badge-arquivada' }
  };

  const PRIORIDADES = {
    baixa: { rotulo: 'Baixa', badge: 'badge-prio-baixa' },
    media: { rotulo: 'Média', badge: 'badge-prio-media' },
    alta: { rotulo: 'Alta', badge: 'badge-prio-alta' },
    urgente: { rotulo: 'Urgente', badge: 'badge-prio-urgente' }
  };

  // Cache em memória: evita reler e reserializar o localStorage
  // a cada chamada dentro da mesma sessão de página.
  let cache = null;

  function _carregar() {
    if (cache) return cache;
    try {
      const bruto = localStorage.getItem(CHAVE_DENUNCIAS);
      cache = bruto ? JSON.parse(bruto) : [];
    } catch (e) {
      console.error('Falha ao ler denúncias do armazenamento local:', e);
      cache = [];
    }
    return cache;
  }

  function _persistir() {
    try {
      localStorage.setItem(CHAVE_DENUNCIAS, JSON.stringify(cache));
      return true;
    } catch (e) {
      console.error('Falha ao gravar denúncias no armazenamento local:', e);
      return false;
    }
  }

  function _proximoNumero() {
    let n = parseInt(localStorage.getItem(CHAVE_SEQUENCIA) || '0', 10);
    n += 1;
    localStorage.setItem(CHAVE_SEQUENCIA, String(n));
    return n;
  }

  function gerarProtocolo() {
    const ano = new Date().getFullYear();
    const n = _proximoNumero();
    return `DEN-${ano}-${String(n).padStart(5, '0')}`;
  }

  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function criarDenuncia(dados) {
    const lista = _carregar();
    const agora = new Date().toISOString();
    const registro = {
      id: (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2)),
      protocolo: gerarProtocolo(),
      categoria: dados.categoria,
      local: dados.local,
      dataOcorrido: dados.dataOcorrido || null,
      descricao: dados.descricao,
      prioridadeDeclarada: dados.prioridade || 'media',
      anexoNome: dados.anexoNome || null,
      anexoDados: dados.anexoDados || null,
      status: 'recebida',
      respostaPublica: '',
      observacaoInterna: '',
      dataRegistro: agora,
      atualizadoEm: agora,
      historico: [
        { data: agora, status: 'recebida', nota: 'Denúncia registrada pelo sistema.' }
      ]
    };
    lista.unshift(registro);
    _persistir();
    return registro;
  }

  function listarDenuncias() {
    // Retorna cópia rasa ordenada da mais recente para a mais antiga,
    // para que quem chamar não possa corromper o cache interno.
    return _carregar().slice();
  }

  function buscarPorProtocolo(protocolo) {
    if (!protocolo) return null;
    const alvo = protocolo.trim().toUpperCase();
    return _carregar().find(d => d.protocolo.toUpperCase() === alvo) || null;
  }

  function buscarPorId(id) {
    return _carregar().find(d => d.id === id) || null;
  }

  function atualizarStatus(id, novoStatus, nota) {
    const registro = buscarPorId(id);
    if (!registro) return null;
    registro.status = novoStatus;
    registro.atualizadoEm = new Date().toISOString();
    registro.historico.push({
      data: registro.atualizadoEm,
      status: novoStatus,
      nota: nota || `Status atualizado para "${STATUS[novoStatus]?.rotulo || novoStatus}".`
    });
    _persistir();
    return registro;
  }

  function salvarRespostaEObservacao(id, { respostaPublica, observacaoInterna }) {
    const registro = buscarPorId(id);
    if (!registro) return null;
    if (respostaPublica !== undefined) registro.respostaPublica = respostaPublica;
    if (observacaoInterna !== undefined) registro.observacaoInterna = observacaoInterna;
    registro.atualizadoEm = new Date().toISOString();
    _persistir();
    return registro;
  }

  function estatisticas() {
    const lista = _carregar();
    const base = { total: lista.length, recebida: 0, em_analise: 0, em_investigacao: 0, concluida: 0, arquivada: 0, urgente: 0 };
    for (const d of lista) {
      base[d.status] = (base[d.status] || 0) + 1;
      if (d.prioridadeDeclarada === 'urgente') base.urgente += 1;
    }
    return base;
  }

  // --- Sessão simples do administrador (apenas para fins de protótipo) ---
  function loginAdmin(usuario, senha) {
    const CREDENCIAL = { usuario: 'delegado', senha: 'delegacia123' };
    if (usuario === CREDENCIAL.usuario && senha === CREDENCIAL.senha) {
      sessionStorage.setItem(CHAVE_SESSAO_ADM, JSON.stringify({ usuario, entrou: Date.now() }));
      return true;
    }
    return false;
  }

  function admLogado() {
    return !!sessionStorage.getItem(CHAVE_SESSAO_ADM);
  }

  function logoutAdmin() {
    sessionStorage.removeItem(CHAVE_SESSAO_ADM);
  }

  // Popula alguns registros de exemplo somente na primeira execução,
  // para que o protótipo já possa ser demonstrado sem cadastro manual.
  function semearExemplosSeVazio() {
    const lista = _carregar();
    if (lista.length > 0) return;
    const exemplos = [
      { categoria: 'furto', local: 'Rua das Acácias, 210 — Centro', dataOcorrido: '2026-09-10', descricao: 'Furto de bicicleta deixada na área comum do prédio durante a noite.', prioridade: 'baixa' },
      { categoria: 'vandalismo', local: 'Praça Sete de Setembro', dataOcorrido: '2026-09-12', descricao: 'Pichação e dano ao mobiliário público na praça, próximo ao coreto.', prioridade: 'media' },
      { categoria: 'ameaca', local: 'Av. Brasil, 1450 — Jardim Europa', dataOcorrido: '2026-09-14', descricao: 'Vizinho tem feito ameaças verbais recorrentes durante discussões sobre estacionamento.', prioridade: 'alta' }
    ];
    exemplos.forEach(e => criarDenuncia(e));
    // A primeira fica "em investigação" para ilustrar o fluxo no painel.
    const lista2 = _carregar();
    if (lista2[1]) atualizarStatus(lista2[1].id, 'em_investigacao', 'Encaminhada à equipe de campo para verificação local.');
  }

  return {
    CATEGORIAS, STATUS, PRIORIDADES,
    criarDenuncia, listarDenuncias, buscarPorProtocolo, buscarPorId,
    atualizarStatus, salvarRespostaEObservacao, estatisticas,
    formatarData, loginAdmin, admLogado, logoutAdmin, semearExemplosSeVazio
  };
})();
