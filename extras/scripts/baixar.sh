#!/bin/bash
# Baixa um vídeo/live/clipe (YouTube, Twitch, Kick, TikTok...) para cortar, guardando quem é o autor (para o crédito).
#   extras/scripts/baixar.sh <link> [trecho] [nome]
#     trecho: opcional, só uma parte de live longa, ex.: 01:20:00-01:26:30  (não baixa as 6 h inteiras)
#     nome:   opcional, nome da pasta (padrão: id do vídeo)
# Saída: ~/GTA6_trabalho/downloads/<nome>/video.mp4 + autor.json (fora do git E fora do iCloud).
# REGRA: só baixar de fonte que autoriza cortes (print da autorização em autorizacao.png na mesma pasta),
#        ou gameplay do próprio criador. Nunca vazamento nem reupload sem permissão.
set -euo pipefail
LINK="${1:?uso: baixar.sh <link> [trecho hh:mm:ss-hh:mm:ss] [nome]}"
TRECHO="${2:-}"
ID="$(yt-dlp --no-warnings --print id --skip-download "$LINK" | head -1)"
NOME="${3:-$ID}"
DEST="${GTA6_TRABALHO:-$HOME/GTA6_trabalho}/downloads/$NOME"   # FORA do iCloud (Documentos sincroniza e trava o Mac)
mkdir -p "$DEST"

# quem é o autor (para o crédito na tela e na legenda) — sem baixar nada ainda
yt-dlp --no-warnings --skip-download --print-to-file \
  '{"titulo": %(title)j, "autor": %(uploader)j, "canal": %(channel_url)j, "link": %(webpage_url)j, "data": %(upload_date)j, "duracao_s": %(duration)j}' \
  "$DEST/autor.json" "$LINK"

ARGS=(-S "vcodec:h264,res:1080,fps"   # H.264: o Remotion trava buscando quadro em AV1
      -f "bv*+ba/b" --merge-output-format mp4 --no-playlist -o "$DEST/video.%(ext)s")
if [ -n "$TRECHO" ]; then
  ARGS+=(--download-sections "*$TRECHO" --force-keyframes-at-cuts)
fi
yt-dlp "${ARGS[@]}" "$LINK"
echo "ok: $DEST/video.mp4"
cat "$DEST/autor.json"
[ -f "$DEST/autorizacao.png" ] || echo "ATENÇÃO: falta o print da autorização em $DEST/autorizacao.png"
