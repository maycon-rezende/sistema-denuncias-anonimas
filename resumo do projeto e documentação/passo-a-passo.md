# Passo a passo do projeto

## 1. Estrutura inicial

O projeto foi feito sem framework, usando arquivos separados:

1. `index.html` apresenta o sistema.
2. `denunciante.html` contém registro e consulta.
3. `admin.html` contém login e painel.
4. Os arquivos `.css` controlam a aparência de cada área.
5. Os arquivos `.js` controlam o comportamento.
6. `storage.js` centraliza o armazenamento das denúncias.

## 2. Sistema de denúncias

### Registro

1. A pessoa acessa `denunciante.html`.
2. Escolhe uma categoria.
3. Informa local e data aproximada.
4. Descreve o ocorrido.
5. Escolhe a prioridade.
6. Opcionalmente envia uma imagem.
7. O JavaScript valida os campos.
8. `storage.js` cria um protocolo no formato `DEN-ANO-NUMERO`.
9. A denúncia é salva no armazenamento configurado.
10. O protocolo é exibido na confirmação.

### Consulta

1. A pessoa informa o protocolo.
2. `buscarPorProtocolo()` procura a ocorrência.
3. O status e o histórico são exibidos.
4. O texto é escapado antes de entrar no HTML.

## 3. Painel administrativo

1. O administrador informa usuário e senha.
2. A sessão de demonstração é guardada no `sessionStorage`.
3. O painel mostra estatísticas.
4. A lista permite buscar por protocolo, local ou descrição.
5. Filtros permitem selecionar status, categoria e prioridade.
6. O submenu de denúncias aplica filtros prontos.
7. O drawer mostra os detalhes da ocorrência.
8. O administrador pode atualizar status.
9. Pode registrar uma resposta pública.
10. Pode registrar uma observação interna.
11. A lista filtrada pode ser exportada para CSV.

## 4. Identidade visual

1. `style.css` recebeu tokens de cor institucionais.
2. Azul-marinho representa a instituição.
3. Azul aço representa ações e links.
4. Dourado representa destaque e autoridade.
5. Vermelho é reservado para urgência e erro.
6. `home.css` estiliza a página inicial.
7. `denunciante.css` estiliza o fluxo público.
8. `admin.css` estiliza o painel e seus submenus.
9. `orientacoes.css` estiliza as páginas de orientação.
10. Media queries adaptam as páginas para celulares, tablets e monitores.

## 5. Menus e páginas de orientação

Foram adicionados menus para:

- Proteção à mulher.
- Pessoas desaparecidas.
- Como funciona.
- Orientações.
- Privacidade.
- Acesso da delegacia.

A página `mulheres.html` reúne orientações, canais de emergência e serviços de apoio.

A página `desaparecidos.html` reúne procedimentos, acompanhamento, mural e chat.

## 6. Mural de pessoas desaparecidas

O formulário coleta:

- Nome.
- Idade.
- Cidade ou estado.
- Último contato.
- Características e roupas.
- Telefone autorizado.
- Foto recente.

A foto é validada por tipo e tamanho. O texto é escapado na renderização para evitar que conteúdo enviado seja interpretado como HTML.

## 7. Chat comunitário

1. A pessoa informa nome ou usa participação anônima.
2. Escreve uma mensagem de até 500 caracteres.
3. A mensagem é exibida com data e hora.
4. No modo local, fica no `localStorage`.
5. No modo Supabase, fica no banco e pode ser recebido em tempo real.

O chat não deve ser usado para divulgar acusações, documentos, endereços ou localização em tempo real.

## 8. Integração com Supabase

1. Criar um projeto no Supabase.
2. Abrir o SQL Editor.
3. Executar `supabase-schema.sql`.
4. O script cria tabelas, políticas e o bucket de fotos.
5. Copiar a URL e a chave pública `anon`.
6. Preencher `supabase-config.js` na raiz do projeto.
7. Recarregar `desaparecidos.html`.
8. O script detecta a configuração e muda para o modo online.
9. Fotos são enviadas ao Storage.
10. Casos são salvos em `missing_person_posts`.
11. Mensagens são salvas em `missing_person_messages`.
12. O Supabase Realtime atualiza o chat.

Nunca colocar a chave `service_role` no site.

## 9. GitHub e Pages

1. O projeto recebeu um repositório Git próprio.
2. Foi criado o commit inicial.
3. O repositório público foi criado no GitHub.
4. A branch principal é `main`.
5. O código foi enviado com `git push origin main`.
6. O GitHub Pages foi configurado para a raiz da branch `main`.
7. Cada novo commit enviado pode gerar uma nova publicação.

## 10. Validações executadas

- Verificação de erros do editor.
- `node --check admin.js`.
- `node --check desaparecidos.js`.
- `git diff --check`.
- Conferência do status do GitHub Pages.

## 11. Configuração pública do Supabase

1. No Supabase, abrir **Configurações > Chaves API**.
2. Copiar a **Chave publicável**, usando o botão de copiar.
3. Colar somente a chave pública em `supabase-config.js`, no campo `anonKey`.
4. Usar no campo `url` somente a URL base até `.co`, sem `/rest/v1/`.
5. Testar as tabelas pelo endpoint REST.
6. Confirmar HTTP 200 para `missing_person_posts` e `missing_person_messages`.
7. Publicar o arquivo porque a chave `sb_publishable_` é própria para uso no navegador.

Nunca publicar senha de banco, `service_role`, `secret` ou `OPENAI_API_KEY`.

## 12. Publicação final

Para publicar uma atualização:

```powershell
git status --short --branch
git diff --check
git add arquivo1 arquivo2
git commit -m "descricao da alteracao"
git push origin main
gh api "repos/maycon-rezende/sistema-denuncias-anonimas/pages" --jq "{status,html_url}"
```

O GitHub Pages publica a raiz da branch `main`. Depois do push, o status pode
ficar `building` por alguns instantes antes de mudar para `built`.

## 13. Fluxo seguro para o assistente de IA

1. O site carrega primeiro o assistente local, sem enviar conversas.
2. Se o Supabase estiver configurado, o frontend chama a Edge Function.
3. A Edge Function recebe uma pergunta limitada a 500 caracteres.
4. A chave da IA fica como segredo no Supabase.
5. A função aplica instruções de segurança e responde em português.
6. Se a função falhar, o frontend usa as respostas locais.

Comandos de publicação da função:

```powershell
supabase secrets set OPENAI_API_KEY=sua-chave
supabase secrets set OPENAI_MODEL=gpt-4o-mini
supabase functions deploy assistente
```
