# Sistema WAKANDA — deploy na Cloudflare (grátis)

## Sobre a estrutura (atualizado)

A Cloudflare unificou "Pages" e "Workers": conexões novas via Git agora usam o
comando `wrangler deploy`, no formato "Worker com assets estáticos". Por isso
este projeto usa:

- `public/index.html` — a página que todo mundo acessa.
- `src/worker.js` — um único Worker que serve os arquivos estáticos **e**
  responde a API `/api/state` (GET/POST), usando o banco D1 como
  armazenamento compartilhado.
- `wrangler.toml` — configuração do projeto (nome, banco D1, pasta de
  assets). Esse arquivo já resolve tudo sozinho — não precisa configurar
  "Build output directory" nem bindings pelo painel, como em versões
  anteriores.

Nada disso custa nada dentro dos limites gratuitos da Cloudflare.

## Passo a passo — tudo pelo navegador, via GitHub

### Passo 1 — Criar um repositório no GitHub

Entre em https://github.com, faça login (ou crie uma conta grátis) e clique em **New repository**. Dê um nome, por exemplo `wakanda-guild`. Pode deixar como privado.

### Passo 2 — Criar o banco de dados D1

No painel da Cloudflare (https://dash.cloudflare.com), vá em **Storage & Databases → D1 → Create database**. Nome: `wakanda-guild-db`.

Depois de criado, copie o **Database ID** que aparece na página do banco (algo como `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

Ainda nessa página, abra a aba **Console** e cole o conteúdo do arquivo `migrations/0001_init.sql`, e rode. Isso cria a tabela que guarda os dados da guild.

### Passo 3 — Editar o wrangler.toml com o ID do banco

Abra o arquivo `wrangler.toml` deste projeto e troque `COLE_AQUI_O_ID_DO_BANCO` pelo Database ID que você copiou no passo 2.

### Passo 4 — Subir os arquivos pro GitHub

No repositório criado no passo 1, clique em **uploading an existing file** e arraste todo o conteúdo deste projeto (`public/`, `src/`, `migrations/`, `wrangler.toml`). Faça o commit.

### Passo 5 — Conectar o repositório à Cloudflare

Vá em **Workers & Pages → Create → Import a repository** (ou **Connect to Git**, dependendo da versão do painel). Autorize o acesso ao GitHub e escolha o repositório `wakanda-guild`.

A Cloudflare vai detectar o `wrangler.toml` automaticamente e configurar o build sozinha — não precisa preencher "Build output directory" nem nada parecido. Clique em **Save and Deploy**.

Ao final, você recebe uma URL tipo `https://wakanda-guild.<seu-usuário>.workers.dev` (ou similar).

### Passo 6 (opcional) — Configurar o Cloudflare Access

Com o site no ar, isso protege o acesso por login (e-mail ou Google/Discord), grátis até 50 usuários:

1. No painel da Cloudflare, ative a seção **Zero Trust** (primeira vez pede um "nome de time" — é só um identificador interno).
2. Escolha o método de login. O mais simples é **One-time PIN**: a pessoa digita o e-mail, recebe um código de 6 dígitos, digita o código, entra.
3. Crie uma **Application** apontando para a URL do seu site.
4. Crie a política de acesso com a lista de e-mails autorizados.
5. Salve — o site já fica atrás do login.

Para adicionar/remover pessoas depois, é só voltar nessa política e editar a lista de e-mails — não precisa redeploy, não precisa mexer em código.

## Fluxo de manutenção (ajustes futuros na aplicação)

Sempre que você quiser um ajuste no app:

1. Você pede o ajuste.
2. Você recebe o(s) arquivo(s) atualizado(s) (`public/index.html` e/ou `src/worker.js`).
3. Você substitui esse(s) arquivo(s) no GitHub (botão de editar/upload direto no site do GitHub, sem terminal).
4. A Cloudflare detecta a mudança e publica sozinha em ~1 minuto.

## Alternativa: via terminal (Wrangler)

```bash
npm install -g wrangler
wrangler login
wrangler d1 create wakanda-guild-db
# cole o database_id retornado no wrangler.toml
wrangler d1 execute wakanda-guild-db --remote --file=./migrations/0001_init.sql
wrangler deploy
```

## O que mudou em relação à versão de dentro do Claude

- Os dados agora ficam no banco D1 (compartilhado de verdade), não mais presos à sua conta do Claude.
- O app atualiza sozinho a cada ~12 segundos para pegar o que outras pessoas salvaram (sem atrapalhar quem estiver digitando), e tem um botão **"Atualizar"** para forçar isso na hora.
- O envio automático da planilha para o Google Drive (que dependia de um recurso exclusivo de dentro do Claude) foi removido — o botão **"Exportar para Excel"** baixa o arquivo normalmente, e o botão **"Abrir pasta do Drive"** leva direto pra pasta pra você arrastar o arquivo.
- Agora que o site tem um domínio fixo, dá pra implementar um envio automático *de verdade* pro Google Drive via OAuth, se você quiser — isso não era possível dentro do artefato do Claude.
