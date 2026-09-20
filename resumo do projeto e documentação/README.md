# Sistema de Denúncias Anônimas

## Resumo

Este projeto é um protótipo web responsivo para:

- Registrar denúncias sem cadastro.
- Gerar um protocolo para acompanhamento.
- Consultar o andamento de uma denúncia.
- Permitir que a equipe da delegacia analise ocorrências.
- Orientar mulheres em situação de violência ou abuso.
- Orientar famílias e comunidades sobre pessoas desaparecidas.
- Publicar fotos e informações de pessoas desaparecidas.
- Compartilhar mensagens em um chat comunitário.

> O sistema começou como um site estático. O mural e o chat possuem fallback local e podem usar Supabase para compartilhar dados entre dispositivos.

## Tecnologias utilizadas

- HTML5: estrutura das páginas.
- CSS3: identidade visual, responsividade, formulários, cards e menus.
- JavaScript puro: interações e regras de negócio no navegador.
- `localStorage`: armazenamento local do protótipo.
- `sessionStorage`: sessão temporária do administrador.
- Supabase: banco PostgreSQL, Storage para fotos e Realtime para o chat.
- Git e GitHub: controle de versão e publicação do código.
- GitHub Pages: hospedagem do site estático.

## Páginas publicadas

- Página inicial: `index.html`
- Registro e consulta de denúncia: `denunciante.html`
- Painel administrativo: `admin.html`
- Proteção à mulher: `mulheres.html`
- Pessoas desaparecidas: `desaparecidos.html`
- Página de erro: `404.html`

## Acesso publicado

- Site: https://maycon-rezende.github.io/sistema-denuncias-anonimas/
- Repositório: https://github.com/maycon-rezende/sistema-denuncias-anonimas

## Organização desta pasta

- `README.md`: visão geral e inventário do projeto.
- `passo-a-passo.md`: histórico de implementação e execução.
- `arquitetura.md`: funcionamento técnico dos módulos.
- `supabase-schema.sql`: código do banco, permissões e Storage.
- `supabase-config.example.js`: modelo seguro de configuração pública.
- `../supabase/functions/assistente/index.ts`: função segura que conecta o guia a uma IA.
- `../supabase/functions/README.md`: configuração e publicação da função de IA.

## Aviso de segurança

O projeto ainda é um protótipo acadêmico. Para produção, é necessário adicionar autenticação real, moderação, limitação de requisições, auditoria, proteção de dados pessoais, backups e revisão das políticas do Supabase.

## Assistente com IA

O guia virtual funciona localmente mesmo sem IA. Para ativar respostas
generativas, publique a Edge Function em `supabase/functions/assistente` e
configure `OPENAI_API_KEY` como segredo no Supabase. A chave nunca deve ser
colocada no JavaScript do navegador ou no GitHub. O frontend mantém fallback
local caso a função esteja indisponível.
