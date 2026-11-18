# Máquina de clipes + identidade de perfil

Skill para **Codex e Claude Code**, com motor local de cortes verticais e preset do **@brasilnews1231**. O nome e a logo podem ser trocados.

O formato acompanha a revisão de 17/11/2026: Poppins Semibold de 60 px, contorno fino, palavra ativa em amarelo suave, marca pequena na imagem de baixo e duas imagens encostadas, sem faixa central.

**[Baixar a skill completa](https://github.com/Lucasbithencourt/maquina-clipes/releases/latest/download/maquina-clipes.skill)** · [Versões e arquivo ZIP](https://github.com/Lucasbithencourt/maquina-clipes/releases)

## Instalar a skill

Clone ou copie este repositório inteiro para uma destas pastas:

- Codex: `~/.codex/skills/maquina-clipes`
- Claude Code, só no projeto: `.claude/skills/maquina-clipes`
- Claude Code, todos os projetos: `~/.claude/skills/maquina-clipes`

O arquivo `maquina-clipes.skill` distribuído junto é um ZIP com a pasta completa. Descompacte-o na pasta de skills correspondente. Abrir o ZIP sozinho não instala Node, FFmpeg ou os modelos. O pacote precisa de um agente com terminal e arquivos locais; não promete renderização no chat web.

## Preparar o computador

É necessário Node 22+ e FFmpeg/ffprobe completos. yt-dlp é opcional para receber links. Na pasta em que você vai editar, peça ao agente:

> Use $maquina-clipes. Confira a instalação sem baixar nada. Quero preparar a máquina para editar meus vídeos com meu próprio nome e logo.

Ou rode, substituindo `CAMINHO-DA-SKILL`:

```sh
node "CAMINHO-DA-SKILL/scripts/setup.mjs" --check
node "CAMINHO-DA-SKILL/scripts/setup.mjs" --init
```

Depois de autorizar os downloads de dependências, Chrome e modelo Whisper:

```sh
node "CAMINHO-DA-SKILL/scripts/setup.mjs" --install --allow-downloads
```

Os dados ficam em `.maquina-clipes/` na pasta atual. `--home CAMINHO` muda esse local. Nenhum vídeo é enviado para transcrever: Whisper roda no computador.

## Usar a identidade de outro perfil

```sh
node "CAMINHO-DA-SKILL/scripts/setup.mjs" --profile "meu-perfil" --logo "minha-logo.png"
```

O preset original continua intacto dentro da skill. A personalização fica nos dados locais e não entra no Git. Veja [identidade](references/identidade.md) e [formato dos cortes](references/fluxo.md).

## Primeiro pedido

> Use $maquina-clipes para fazer quatro cortes deste vídeo. Use esta segunda gravação embaixo. Mantenha meu rosto livre, legenda Poppins menor e os dois vídeos encostados. Quero MP4s e uma legenda de publicação para cada corte.

O motor prepara cópias de trabalho H.264, propõe a retirada de barras pretas constantes, limita cache e usa temporários no mesmo disco do trabalho. Toda retirada de borda deve ser conferida. Os originais ficam preservados.

## Hooks, edits e revisão (extras do perfil GTA 6)

A pasta `extras/` traz:
- os **hooks minimalistas** (seguir + 1 pergunta, com som medido e volume final em −14 LUFS);
- o **edit "versão história"** (16:9 com gancho escrito, diálogo em PT, cortes na batida e assinatura neon; a música entra pelo app);
- a **revisão a 30 fps**, obrigatória antes de entregar.

Veja [references/hooks-e-edits.md](references/hooks-e-edits.md). Requer, uma vez na pasta de trabalho, `npm install --prefix ".maquina-clipes/extras" playwright-core@1.63.0`, além do Google Chrome e do Python 3 com Pillow.

## Origem e licenças

Adaptado de [pedroxcardoso/maquina-cortes-gta](https://github.com/pedroxcardoso/maquina-cortes-gta), commit `4381b0c`, sob MIT. A fonte Poppins acompanha sua licença OFL. Consulte [THIRD_PARTY.md](THIRD_PARTY.md). A licença do código não transfere direitos sobre logos, jogos ou vídeos usados como entrada. Remotion mantém seus próprios termos de licença; este pacote não concede uma licença comercial do Remotion.

Este repositório contém skill, código, fonte e identidade. Não inclui gravações, cortes de terceiros, modelos, credenciais ou materiais da agência.
