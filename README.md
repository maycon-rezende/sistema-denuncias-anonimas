# Sistema de Denúncias Anônimas — Protótipo Web

Protótipo de sistema web para registro, acompanhamento e gerenciamento de
denúncias anônimas, com dois perfis de acesso: **Denunciante** e
**Administrador da Delegacia**. Construído em HTML5, CSS3 e JavaScript puro
(sem frameworks ou backend), com persistência local via `localStorage`.

## Como executar

Abra `index.html` diretamente no navegador (duplo clique) ou sirva a pasta
com qualquer servidor estático — por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Não há dependência de servidor, banco de dados ou instalação: todo o estado
fica salvo no navegador do usuário.

**Login de demonstração do Administrador:** usuário `delegado`, senha `delegacia123`
(definidos em `storage.js`, função `loginAdmin`).

## Estrutura de arquivos

```
sistema-denuncias/
│
├── index.html              Página inicial: apresentação e escolha de perfil
├── denunciante.html         Perfil Denunciante: nova denúncia + consulta
├── admin.html                Perfil Administrador: login + painel
│
├── style.css                Base global: tokens de design, reset,
│                            tipografia, botões, formulários e badges
│                            (compartilhado pelas três páginas)
├── home.css                 Estilos exclusivos de index.html
├── denunciante.css          Estilos exclusivos de denunciante.html
├── admin.css                Estilos exclusivos de admin.html
├── storage.js               Camada de dados única (localStorage):
│                            CRUD de denúncias, geração de protocolo,
│                            estatísticas e sessão do administrador.
│                            Usada pelos dois perfis — evita duplicar
│                            regras de negócio.
├── denunciante.js           Comportamento de denunciante.html
└── admin.js                 Comportamento de admin.html
│
└── README.md                 Este documento
```

### Por que essa organização

- **HTML, CSS e JS totalmente separados**, um arquivo por responsabilidade,
  sem estilo ou script embutido nas páginas.
- **`style.css` centraliza os tokens** (cores, tipografia, espaçamento) e os
  componentes reaproveitados (botões, campos, badges de status), enquanto
  cada página tem um CSS próprio só com o que é exclusivo dela — evita
  repetição de regras e mantém os arquivos pequenos.
- **`storage.js` é a única porta de entrada para os dados.** Denunciante e
  Administrador leem e gravam pelas mesmas funções, então a estrutura de uma
  denúncia (campos, status possíveis, categorias) é definida em um só lugar.

## Modelo de dados de uma denúncia

```js
{
  id, protocolo,                 // identificador público, ex.: DEN-2026-00001
  categoria, local, dataOcorrido, descricao,
  prioridadeDeclarada,           // baixa | media | alta | urgente
  anexoNome, anexoDados,         // imagem opcional (base64)
  status,                        // recebida | em_analise | em_investigacao | concluida | arquivada
  respostaPublica,                // visível ao denunciante na consulta
  observacaoInterna,              // uso exclusivo da delegacia
  historico: [{ data, status, nota }],
  dataRegistro, atualizadoEm
}
```

## Funcionalidades — Perfil Denunciante (`denunciante.html`)

- **Registrar denúncia sem identificação:** formulário não coleta nome,
  e-mail, telefone ou qualquer dado pessoal.
- Campos: categoria, local, data aproximada, descrição (mín. 20 caracteres),
  nível de urgência percebido e anexo opcional de imagem.
- **Geração automática de protocolo** (`DEN-AAAA-NNNNN`) exibido apenas uma
  vez, na confirmação — é a única chave de acesso à denúncia.
- **Consulta pública por protocolo:** status atual, linha do tempo de
  atualizações e eventual resposta oficial da delegacia, sem exigir login.
- Aviso de encaminhamento ao **190** para casos de risco imediato.
- Validação de formulário e mensagens de erro claras.

## Funcionalidades — Perfil Administrador (`admin.html`)

- **Login restrito** por usuário e senha (sessão mantida em `sessionStorage`,
  encerrada ao clicar em "Sair" ou fechar a aba).
- **Visão geral:** cartões com total de denúncias, aguardando análise, em
  investigação e marcadas como urgentes, além das últimas denúncias recebidas.
- **Listagem de denúncias** com filtros combináveis por texto (protocolo,
  local ou palavra-chave), status, categoria e prioridade.
- **Painel de detalhes** (drawer lateral) por denúncia, com:
  - descrição completa, local, data e anexo, quando houver;
  - **atualização de status** com registro automático no histórico;
  - campo de **resposta pública** (aparece para o denunciante na consulta);
  - campo de **observação interna** (visível somente à equipe).
- Histórico completo de mudanças de status por denúncia.

## Otimização de recursos

- **Sem frameworks:** JavaScript puro, sem bibliotecas externas — menor peso
  de download e menos código a interpretar.
- **Cache em memória em `storage.js`:** a lista de denúncias é lida do
  `localStorage` uma vez por carregamento de página e mantida em uma
  variável interna, evitando `JSON.parse` repetido a cada operação.
- **Renderização em lote:** a lista de denúncias e o histórico são montados
  como uma única string HTML e inseridos de uma vez (`innerHTML`), em vez de
  criar elementos um a um — reduz reflow/repaint no navegador.
- **Delegação de eventos:** um único `click`/`keydown` no contêiner da lista
  trata todas as linhas, em vez de um listener por item — menor uso de
  memória à medida que o volume de denúncias cresce.
- **Debounce na busca textual:** a filtragem só é recalculada ~220&nbsp;ms
  após o usuário parar de digitar, evitando refiltrar a cada tecla.
- **CSS compartilhado via variáveis** (`:root`), evitando duplicação de
  valores de cor/espaçamento entre os três arquivos de estilo.
- **Anexos limitados a 1,5&nbsp;MB** e restritos a imagens, para não
  sobrecarregar o `localStorage` (que tem limite por origem no navegador).

## Limitações do protótipo (fora do escopo acadêmico)

- Os dados residem apenas no navegador local (`localStorage`); não há
  backend, banco de dados real nem múltiplos dispositivos sincronizados.
- A autenticação do administrador é fixa no código, apenas para demonstração
  — um sistema real exigiria backend com senhas com hash, HTTPS e controle
  de sessão adequado.
- Não há criptografia de anexos nem remoção automática de metadados de
  imagens (recomendável em um sistema de produção para reforçar o anonimato).
