# "Assiste" um trecho de vídeo de referência quadro a quadro, a 30 fps (regra do criador, 17/11/2026).
#   python3 ferramentas/gta6/assistir_30fps.py <video> <inicio_s> <fim_s> <pasta_saida>
# Extrai TODOS os quadros a 30 fps e mede, em cada um, a diferença para o anterior:
#   - troca de cena (diferença grande e repentina) → lista com o segundo exato;
#   - movimento médio por segundo (parado × agitado).
# Gera para revisão:
#   cenas.png    → o 1º quadro de cada cena (todas as trocas);
#   visao.png    → 6 quadros por segundo de todo o trecho (a cada 5 quadros);
#   relatorio.json → cenas, duração de cada plano, movimento por segundo.
import json, os, subprocess, sys
from PIL import Image, ImageChops, ImageDraw, ImageStat

VIDEO, INI, FIM, SAI = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
os.makedirs(os.path.join(SAI, 'q'), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(INI), '-t', str(FIM - INI), '-i', VIDEO,
                '-vf', 'fps=30,scale=192:-2', '-q:v', '4', os.path.join(SAI, 'q', '%05d.jpg')], check=True)
arqs = sorted(os.listdir(os.path.join(SAI, 'q')))
qs = [os.path.join(SAI, 'q', a) for a in arqs]

difs, ant = [0.0], Image.open(qs[0]).convert('L')
for q in qs[1:]:
    im = Image.open(q).convert('L')
    difs.append(ImageStat.Stat(ImageChops.difference(im, ant)).mean[0])
    ant = im

# troca de cena: diferença bem acima da média local (e acima de um mínimo absoluto)
cenas = [0]
for i in range(1, len(difs)):
    viz = difs[max(1, i - 15):i] + difs[i + 1:i + 16]
    media = sum(viz) / max(1, len(viz))
    if difs[i] > 18 and difs[i] > 3.5 * media and i - cenas[-1] > 6:
        cenas.append(i)
planos = [((cenas[k + 1] if k + 1 < len(cenas) else len(qs)) - c) / 30 for k, c in enumerate(cenas)]
mov = [round(sum(difs[s * 30:(s + 1) * 30]) / max(1, len(difs[s * 30:(s + 1) * 30])), 2) for s in range(len(qs) // 30 + 1)]


def folha(idx, nome, rotulo):
    th = Image.open(qs[0]); w, h = th.size
    col = 8; lin = (len(idx) + col - 1) // col
    W = Image.new('RGB', (col * w, lin * (h + 14)), (0, 0, 0))
    d = ImageDraw.Draw(W)
    for k, i in enumerate(idx):
        x, y = (k % col) * w, (k // col) * (h + 14)
        W.paste(Image.open(qs[i]), (x, y))
        d.text((x + 2, y + h), rotulo(i), fill=(255, 210, 63))
    W.save(os.path.join(SAI, nome))


folha(cenas, 'cenas.png', lambda i: f'{INI + i / 30:.2f}s')
folha(list(range(0, len(qs), 5)), 'visao.png', lambda i: f'{INI + i / 30:.1f}')
rel = {'video': VIDEO, 'inicio': INI, 'fim': FIM, 'quadros_analisados': len(qs),
       'cenas_s': [round(INI + c / 30, 2) for c in cenas], 'duracao_planos_s': [round(p, 2) for p in planos],
       'plano_medio_s': round(sum(planos) / len(planos), 2), 'movimento_por_segundo': mov}
json.dump(rel, open(os.path.join(SAI, 'relatorio.json'), 'w'), indent=1)
print(json.dumps({k: rel[k] for k in ('quadros_analisados', 'cenas_s', 'plano_medio_s')}))
