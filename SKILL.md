---
name: maquina-clipes
description: Cria cortes verticais de vídeos de conversa, streamer ou podcast, com transcrição local, duas imagens encostadas, legendas Poppins e identidade de perfil personalizável. Use para cortar, legendar ou revisar esse formato; inclui o preset brasilnews1231.
---

# Máquina de clipes

Execute a edição localmente. Responda em português. O pacote funciona em Codex e Claude Code com acesso a arquivos e terminal; não pressupõe contas conectadas ou instalação global.

## Identidade e preparação

Leia [a identidade](references/identidade.md). Use o perfil fornecido ou a personalização que o usuário pedir. Não imponha a marca brasilnews1231 aos amigos que quiserem seus próprios perfis.

`SKILL` nos exemplos representa a pasta que contém este arquivo; use o caminho real, com aspas. Execute a partir da pasta de trabalho escolhida pelo usuário:

```sh
node "SKILL/scripts/setup.mjs" --check
node "SKILL/scripts/setup.mjs" --init
```

O primeiro comando apenas inspeciona. O segundo prepara `.maquina-clipes/` nessa pasta, sem downloads. `--home CAMINHO` escolhe outra pasta de dados. O comando informa o caminho do motor.

Quando faltarem dependências, explique o que será baixado e obtenha autorização para downloads. Só então execute:

```sh
node "SKILL/scripts/setup.mjs" --install --allow-downloads
```

Node 22+, FFmpeg completo e ffprobe são necessários. yt-dlp só é necessário para links; sem ele, trabalhe com arquivos. Remotion, Chrome e o modelo Whisper são instalados no motor local. O preset já acompanha fonte, logo e efeitos; não requer ElevenLabs ou API de imagens.

Para outro perfil, sem downloads:

```sh
node "SKILL/scripts/setup.mjs" --profile "nome-do-perfil" --logo "caminho/logo.png"
```

## Montar os cortes

1. Reutilize o trabalho atual em uma revisão. Para um trabalho novo, obtenha a gravação e o vídeo de baixo. Preserve as entradas. Não baixe links, arquivos ou modelos sem autorização específica; não use cookies de navegador sem pedido.
2. Prepare `cortes/assunto/work/source.mp4` e `bottom.mp4`, por cópia dos arquivos locais. O nome `.mp4` pode conter outro codec; o motor prepara cópias H.264 para renderizar.
3. Execute `node "MOTOR/scripts/transcribe.mjs" "work/source.mp4" "work" pt`. Leia a fala com `node "MOTOR/scripts/transcript-text.mjs" "work"`.
4. Escolha os trechos pelo conteúdo, usando [ganchos.md](references/ganchos.md). Normalmente 3–5 cortes de 20–60 s, se houver material; respeite a quantidade e a duração pedidas. Cada corte deve ter começo compreensível e conclusão. Não invente falas nem transforme opiniões em fatos.
5. Grave `work/cuts.json` conforme [o formato](references/fluxo.md). Veja quadros do início, meio e fim para ajustar `focus` ou `crop`; rostos inteiros, sem logo ou legenda sobre eles. Imagens extras usam arquivos locais em `images[].file`. Não há busca nem download automático.
6. Rode `node "MOTOR/scripts/build.mjs" "work" "revisao-01" --prepare-only`. Confira as propostas de remoção de letterbox em `work/media.json`; essa medição não autoriza cortar conteúdo. Corrija `bottomCrop` ou use `false` para desativar quando necessário.
7. Renderize com o mesmo comando sem `--prepare-only`. Uma revisão usa nova pasta de saída. O motor recusa substituir um MP4 existente, usa temporários no disco do trabalho e limita o cache para reduzir falta de memória.

## Conferência e entrega

Olhe a folha de quadros de **cada** vídeo, além das prévias em tamanho real. Confira a união das imagens, Poppins, margem de leitura e rosto livre. Verifique a sincronização contra a fala e ouça o resultado quando houver reprodução disponível. Diferencie o que foi visto, medido e ouvido; sinalize escuta pendente.

Os MP4s saem em 1080×1920, 30 fps, H.264/AAC, com props editáveis e relatório técnico. Entregue os caminhos certos; se o usuário pedir os arquivos na pasta principal de cortes, copie as versões com sufixo de revisão e preserve as anteriores.

Se pedirem **legenda para o post**, escreva uma por corte: gancho coerente, contexto curto e pergunta natural. No corte sobre uma previsão ou rumor, atribua a opinião ao falante. Isso é separado das legendas de fala no vídeo.

Não publique conteúdo nem envie mensagens por conta própria. Este pacote não concede acesso a GitHub, redes sociais ou contas dos amigos.
