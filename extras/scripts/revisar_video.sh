#!/bin/bash
# Revisa o NOSSO vídeo pronto antes de mandar ao criador (regra de 17/11): divide em quadros a 30 fps e confere tudo.
#   extras/scripts/revisar_video.sh <video.mp4> [segundos_dos_hooks separados por vírgula]
# Gera ao lado do vídeo, em <video>_revisao/:
#   cenas.png / visao.png / relatorio.json  (todos os quadros a 30 fps: trocas de cena, 6 quadros por segundo)
#   hooks.png                               (quadros 0,5 s / 1,8 s / 3,3 s depois de cada hook)
#   checagem.txt                            (quadro preto, congelado, volume integrado e pico)
set -euo pipefail
V="$1"; HOOKS="${2:-}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
OUT="${V%.mp4}_revisao"; mkdir -p "$OUT"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
python3 "$AQUI/assistir_30fps.py" "$V" 0 "$DUR" "$OUT" > /dev/null
{
  echo "duração: $DUR s"
  echo "quadros pretos: $(ffmpeg -hide_banner -i "$V" -vf blackdetect=d=0.2 -an -f null - 2>&1 | grep -c black_start || true)"
  echo "trechos congelados (>1,5 s): $(ffmpeg -hide_banner -i "$V" -vf freezedetect=d=1.5 -an -f null - 2>&1 | grep -c freeze_start || true)"
  ffmpeg -hide_banner -nostats -i "$V" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | sed 's/^ */volume /'
  echo "meta: integrado ≈ −14 LUFS, pico ≤ −1 dBFS"
} > "$OUT/checagem.txt"
if [ -n "$HOOKS" ]; then
  i=0
  for h in ${HOOKS//,/ }; do
    for d in 0.5 1.8 3.3; do
      t=$(python3 -c "print($h+$d)")
      ffmpeg -v error -y -ss "$t" -i "$V" -frames:v 1 -vf scale=270:480 "$OUT/h_$(printf %02d $i).png"; i=$((i+1))
    done
  done
  python3 - "$OUT" <<'EOF'
import glob, sys
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/h_*.png'))
W = Image.new('RGB', (270 * 3, 480 * ((len(fs) + 2) // 3)))
for k, f in enumerate(fs):
    W.paste(Image.open(f), ((k % 3) * 270, (k // 3) * 480))
W.save(sys.argv[1] + '/hooks.png')
EOF
  rm -f "$OUT"/h_*.png
fi
rm -rf "$OUT/q"
cat "$OUT/checagem.txt"
echo "revisão em: $OUT"
