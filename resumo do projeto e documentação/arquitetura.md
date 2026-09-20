# Arquitetura e códigos utilizados

## Fluxo geral

```text
Navegador
  |
  | HTML + CSS + JavaScript
  |
  +--> localStorage/sessionStorage
  |      modo protótipo local
  |
  +--> Supabase
         PostgreSQL: casos e mensagens
         Storage: fotos
         Realtime: chat
```

## Arquivos principais

### `index.html`

Página inicial. Possui hero, chamadas para ação, menus, etapas do fluxo, privacidade e acesso às áreas públicas.

### `style.css`

Base visual compartilhada. Define:

- Cores institucionais.
- Tipografia.
- Botões.
- Campos de formulário.
- Cards.
- Badges.
- Menus superiores.
- Responsividade geral.

### `home.css`

Estilos do hero, cards de perfil, etapas e orientações da página inicial.

### `denunciante.html` e `denunciante.js`

Formulário público, validação, contador de caracteres, geração de protocolo, cópia do protocolo e consulta de andamento.

### `storage.js`

Camada central de dados do protótipo de denúncias. Contém categorias, status, prioridades, CRUD local, estatísticas e sessão de demonstração.

### `admin.html`, `admin.js` e `admin.css`

Painel protegido por login de demonstração. Inclui visão geral, filtros, submenu de denúncias, drawer de detalhes, atualização de status, respostas, observações e exportação CSV.

### `mulheres.html`

Página de orientação com contatos de emergência e recomendações de segurança.

### `desaparecidos.html` e `desaparecidos.js`

Página de procedimentos, mural de pessoas desaparecidas e chat. Detecta se o Supabase está configurado:

- Configurado: usa banco, Storage e Realtime.
- Não configurado: usa `localStorage` como fallback.

### `orientacoes.css`

Estilos compartilhados pelas páginas de orientação, mural, cards, contatos e chat.

### `supabase-config.js`

Arquivo de configuração pública. Contém apenas URL e chave `anon`.

Como a chave `sb_publishable_` é pública por definição, ela pode ser usada no
frontend quando as tabelas estiverem protegidas por RLS. Senhas e chaves de
servidor não devem aparecer neste arquivo.

### `supabase-schema.sql`

Código SQL que cria as tabelas, políticas de Row Level Security, bucket de fotos e publicação Realtime.

## Tabelas online

### `missing_person_posts`

| Campo | Uso |
|---|---|
| `id` | Identificador UUID |
| `name` | Nome da pessoa |
| `age` | Idade informada |
| `city` | Cidade ou UF |
| `last_contact` | Último contato |
| `characteristics` | Características e roupas |
| `contact` | Contato autorizado |
| `photo_url` | URL pública da foto |
| `created_at` | Data da publicação |

### `missing_person_messages`

| Campo | Uso |
|---|---|
| `id` | Identificador da mensagem |
| `sender_name` | Nome ou Anônimo |
| `message` | Texto da mensagem |
| `created_at` | Data da mensagem |

## Segurança aplicada no frontend

- Escape de HTML nas mensagens e publicações.
- Limite de foto de 1,5 MB.
- Restrição de imagem no input.
- Limite de 500 caracteres no chat.
- Uso de `rel="noopener"` em links externos.
- Nenhuma chave `service_role` no cliente.
- A chave da OpenAI fica somente como segredo da Edge Function.
- `.env.local` é ignorado pelo Git.

## Segurança necessária antes de produção

- Autenticação de usuários.
- Moderação antes de publicar.
- CAPTCHA ou rate limiting.
- Remoção de metadados das imagens.
- Proteção de telefone e consentimento verificável.
- Auditoria e backups.
- Políticas de exclusão e correção de dados conforme LGPD.

## Testes de integração executados

Com a configuração local preenchida, foram consultados:

```text
GET /rest/v1/missing_person_posts?select=*&limit=1 -> HTTP 200
GET /rest/v1/missing_person_messages?select=*&limit=1 -> HTTP 200
```

O resultado confirmou que a URL, a chave pública, as tabelas, os `GRANT`s e
as políticas RLS estavam compatíveis com o acesso do papel `anon`.
