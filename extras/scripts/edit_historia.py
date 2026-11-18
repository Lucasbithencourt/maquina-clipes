# EDIT "versão história" (molde de serie_gta6/REFERENCIAS.md): 16:9 no meio do 9:16, gancho escrito na faixa de cima,
# marca na faixa de baixo, diálogo em PT encaixado nas cenas (planos de 2–4 s), virada com tingimento magenta (nunca
# branco), cortes rápidos na batida (0,5 s = 120 BPM) e assinatura do perfil em neon com glitch no fim.
# SEM MÚSICA no arquivo: a música entra pelo app do TikTok na hora de postar (evita reivindicação).
#   python3 extras/scripts/edit_historia.py <pasta_com_roteiro.json>   (requer Python 3 + Pillow)  → <nome>_base.mp4 na mesma pasta
import json, os, random, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PASTA = os.path.abspath(sys.argv[1])
R = json.load(open(os.path.join(PASTA, 'roteiro.json')))
W, H, VY, VH, FPS = 1080, 1920, 656, 608, 30
SKILL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FONTE = os.environ.get('FONTE_EDIT', os.path.join(SKILL, 'assets', 'identidade', 'fontes', 'Poppins-SemiBold.ttf'))
AVATAR = os.environ.get('FOTO_PERFIL') or os.path.join(SKILL, 'assets', 'identidade', 'perfil.jpg')   # FOTO_PERFIL=foto do perfil do amigo
ROSA, BRANCO = (255, 122, 198), (255, 255, 255)
tmp = tempfile.mkdtemp(prefix='edit-')
f = lambda t: ImageFont.truetype(FONTE, t)

# ---------- segmentos (história + ação) e falas com tempo
segs, falas, t = [], [], 0.0
for s in R['historia']:
    dur = s['dur'] / s['vel']
    segs.append((R['fontes'][s['src']], s['ini'], s['dur'], s['vel']))
    if 'falas' in s:
        for quem, txt, a, b in s['falas']:
            falas.append((quem, txt, t + a, t + b))
    else:
        falas.append((s['quem'], s['fala'], t + 0.15, t + dur - 0.1))
    t += dur
T_VIRADA = t
for src, ini in R['acao']:
    segs.append((R['fontes'][src], ini, R['acao_passo'], 1.0))
    t += R['acao_passo']
T_MAIN = t
T_SIG = R['assinatura_s']

# ---------- PNGs fixos: gancho (faixa de cima) e marca (faixa de baixo)
def quebra(txt, fonte, larg):
    linhas, atual = [], ''
    for p in txt.split():
        teste = (atual + ' ' + p).strip()
        if ImageDraw.Draw(Image.new('RGB', (1, 1))).textlength(teste, font=fonte) > larg and atual:
            linhas.append(atual); atual = p
        else:
            atual = teste
    return linhas + [atual]
topo = Image.new('RGBA', (W, VY), (0, 0, 0, 0)); d = ImageDraw.Draw(topo)
fg = f(72); ls = quebra(R['gancho'], fg, 980); lh = 90
y0 = 390 - len(ls) * lh // 2                     # bloco centrado em y≈390 (abaixo da barra do TikTok)
DESTAQUE = (244, 223, 136)                       # amarelo da identidade (maquina-clipes, #F4DF88)
for i, l in enumerate(ls):
    x = (W - d.textlength(l, font=fg)) / 2
    for k, p_ in enumerate(l.split(' ')):
        cor = DESTAQUE if p_.upper().strip('.,!?') in ('GTA', '6', 'VI') else BRANCO
        d.text((x, y0 + i * lh), p_, font=fg, fill=cor, stroke_width=4, stroke_fill=(0, 0, 0))
        x += d.textlength(p_ + ' ', font=fg)
topo.save(os.path.join(tmp, 'topo.png'))
marca = Image.new('RGBA', (W, 140), (0, 0, 0, 0)); dm = ImageDraw.Draw(marca)
av = Image.open(AVATAR).convert('RGB').resize((96, 96)); mk = Image.new('L', (96, 96), 0); ImageDraw.Draw(mk).ellipse((0, 0, 95, 95), fill=255)
fm = f(40); nome = R['perfil']; wn = dm.textlength(nome, font=fm); x0 = (W - (96 + 20 + wn)) / 2
marca.paste(av, (int(x0), 22), mk); dm.text((x0 + 116, 46), nome, font=fm, fill=BRANCO)
marca.save(os.path.join(tmp, 'marca.png'))

# ---------- assinatura em neon rosa com glitch (quadros PNG, 1080×1920)
os.makedirs(os.path.join(tmp, 'sig'))
rnd = random.Random(3); fs = f(118); txt = R['perfil']
base = Image.new('RGBA', (W, H), (0, 0, 0, 0)); db = ImageDraw.Draw(base)
wt = db.textlength(txt, font=fs); db.text(((W - wt) / 2, H / 2 - 80), txt, font=fs, fill=(255, 150, 215, 255))
brilho = base.filter(ImageFilter.GaussianBlur(18))
for q in range(int(T_SIG * FPS)):
    k = q / (T_SIG * FPS)
    im = Image.new('RGB', (W, H), (4, 2, 8))
    liga = 0.25 if rnd.random() < 0.08 else 1.0                                  # piscada de neon
    if k > 0.75: liga *= max(0.0, 1 - (k - 0.75) / 0.25)                         # apaga no fim (vai pro preto)
    camada = Image.alpha_composite(brilho, base)
    camada.putalpha(camada.getchannel('A').point(lambda a: int(a * liga)))
    if k > 0.6 and rnd.random() < 0.5:                                           # glitch: fatias deslocadas
        for _ in range(4):
            y = rnd.randint(int(H / 2 - 90), int(H / 2 + 40)); h = rnd.randint(6, 20); dx = rnd.randint(-40, 40)
            fatia = camada.crop((0, y, W, y + h)); camada.paste((0, 0, 0, 0), (0, y, W, y + h)); camada.paste(fatia, (dx, y))
    im.paste(camada, (0, 0), camada)
    im.save(os.path.join(tmp, 'sig', f's_{q:04d}.png'))

# ---------- legenda do diálogo (ASS): Poppins com brilho; ela em rosa, ele em branco
def ts(s): return f'{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}'
ass = ['[Script Info]', 'ScriptType: v4.00+', f'PlayResX: {W}', f'PlayResY: {H}', '', '[V4+ Styles]',
       'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
       'Style: F,Poppins SemiBold,66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,1,0,1,3,0,5,40,40,0,1',
       '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
for quem, txt_, a, b in falas:
    cor = '&HC67AFF&' if quem == 'ela' else '&HFFFFFF&'
    pos = f'\\pos({W // 2},{VY + VH + 80})'   # logo abaixo do vídeo: legível e sem cobrir rosto
    ass.append(f'Dialogue: 0,{ts(a)},{ts(b)},F,,0,0,0,,{{{pos}\\blur6\\3c{cor}\\c{cor}\\alpha&H40&\\fad(80,80)}}{txt_}')   # brilho
    ass.append(f'Dialogue: 1,{ts(a)},{ts(b)},F,,0,0,0,,{{{pos}\\bord2\\3c&H000000&\\c{cor}\\fad(80,80)}}{txt_}')
open(os.path.join(tmp, 'dialogo.ass'), 'w').write('\n'.join(ass) + '\n')

# ---------- ffmpeg: segmentos → 1080×608 → tela 9:16 → textos → virada magenta → + assinatura
cmd = ['ffmpeg', '-v', 'error', '-y']
for src, ini, dur, vel in segs:
    cmd += ['-ss', str(ini), '-t', str(dur), '-i', os.path.join(PASTA, src)]
n = len(segs)
cmd += ['-loop', '1', '-i', os.path.join(tmp, 'topo.png'), '-loop', '1', '-i', os.path.join(tmp, 'marca.png'),
        '-framerate', str(FPS), '-i', os.path.join(tmp, 'sig', 's_%04d.png'),
        '-f', 'lavfi', '-i', f'anullsrc=r=48000:cl=stereo:d={T_MAIN + T_SIG:.3f}']
fc = []
for i, (_, _, _, vel) in enumerate(segs):
    fc.append(f'[{i}:v]setpts=(PTS-STARTPTS)/{vel},fps={FPS},scale={W}:{VH}:force_original_aspect_ratio=increase,crop={W}:{VH},setsar=1,'
              f'eq=saturation=1.22:contrast=1.05[s{i}]')
fc.append(''.join(f'[s{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=0[mid]')
fc.append(f'color=c=black:s={W}x{H}:r={FPS}:d={T_MAIN:.3f}[bg]')
fc.append(f'[bg][mid]overlay=0:{VY}:shortest=1[a1]')
fc.append(f'[a1][{n}:v]overlay=0:0:shortest=1[a2]')
fc.append(f'[a2][{n + 1}:v]overlay=0:{H - 300}:shortest=1[a3]')
fc.append(f"[a3]ass={os.path.join(tmp, 'dialogo.ass')}:fontsdir={os.path.dirname(FONTE)}[a4]")
fc.append(f"[a4]drawbox=x=0:y={VY}:w={W}:h={VH}:color=0xD12BD6@0.55:t=fill:enable='between(t,{T_VIRADA - 0.07:.2f},{T_VIRADA + 0.1:.2f})',format=yuv420p[main]")
fc.append(f'[{n + 2}:v]format=yuv420p[sig]')
fc.append('[main][sig]concat=n=2:v=1:a=0[v]')
saida = os.path.join(PASTA, R['nome'] + '_base.mp4')
cmd += ['-filter_complex', ';'.join(fc), '-map', '[v]', '-map', f'{n + 3}:a', '-t', f'{T_MAIN + T_SIG:.3f}',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', str(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', saida]
subprocess.run(cmd, check=True)
json.dump({'virada_s': round(T_VIRADA, 2), 'fim_acao_s': round(T_MAIN, 2), 'total_s': round(T_MAIN + T_SIG, 2),
           'falas': [(q, x, round(a, 2), round(b, 2)) for q, x, a, b in falas]}, open(os.path.join(PASTA, 'tempos.json'), 'w'), ensure_ascii=False, indent=1)
print('ok', saida, f'virada {T_VIRADA:.1f} s, total {T_MAIN + T_SIG:.1f} s')
