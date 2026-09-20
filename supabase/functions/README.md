# Assistente com IA

## Configuração

1. Instale o Supabase CLI.
2. Faça login e vincule o projeto.
3. Configure o segredo sem colocá-lo no frontend:

```bash
supabase secrets set OPENAI_API_KEY=sua-chave
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

4. Publique a função:

```bash
supabase functions deploy assistente
```

Quando `supabase-config.js` tiver URL e `anonKey`, o assistente usará a função. Se a função não estiver publicada ou falhar, o site volta automaticamente às respostas guiadas locais.

Nunca coloque `OPENAI_API_KEY` em `assistente.js`, `supabase-config.js` ou no GitHub.