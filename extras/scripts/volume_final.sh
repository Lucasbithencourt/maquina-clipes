#!/bin/bash
# Leva a mistura final (voz + efeitos juntos, mantendo a diferença entre eles) a ≈ −14 LUFS, com limitador em
# −1,5 dBFS para o pico. Só mexe no áudio: a imagem é copiada sem regravar.
#   extras/scripts/volume_final.sh <video.mp4>     (substitui o arquivo; o original vira <video>.antes_volume.mp4)
set -euo pipefail
V="$1"; ALVO=-14
I=$(ffmpeg -hide_banner -nostats -i "$V" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
GANHO=$(python3 -c "print(round($ALVO - ($I), 2))")
mv "$V" "${V%.mp4}.antes_volume.mp4"
ffmpeg -v error -y -i "${V%.mp4}.antes_volume.mp4" -c:v copy \
  -af "volume=${GANHO}dB,alimiter=limit=0.841:level=disabled" -c:a aac -b:a 192k -movflags +faststart "$V"
ffmpeg -hide_banner -nostats -i "$V" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | sed "s#^ *#$(basename "$V"): #"
rm -f "${V%.mp4}.antes_volume.mp4"
