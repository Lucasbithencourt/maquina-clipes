# Hooks, edits e revisão (perfil de GTA 6)

Padrões aprovados pelo dono do perfil em 17/11/2026. Valem para todos que editam para a mesma página, para manter a mesma identidade.

## Hooks de engajamento (minimalistas)
- **No máximo 2 por vídeo:**
  - **seguir** aos ~3 s: pílula pequena com foto, nome e "Seguir" → "Seguindo ✓";
  - **1 pergunta de comentário** perto do fim: etiqueta "💬 pergunta", ligada ao assunto do vídeo.
- Cada um dura ~2,5 s, com som baixo (pop/clique) e some no lugar.
- Mais que isso polui: o dono do perfil recusou a versão com 4 hooks grandes.

```sh
npm install --prefix ".maquina-clipes/extras" playwright-core@1.63.0   # uma vez, na pasta de trabalho; precisa do Google Chrome
node "SKILL/extras/scripts/hooks.mjs" corte.mp4 corte_final.mp4 --nome "BRASIL NEWS" \
     --hooks "seguir@3,comentar@14|Você sai ou fica no GTA?" --logo foto_do_perfil.jpg --topo 600 [--home .maquina-clipes]
```

- **`--topo`**:
  - nos cortes metade/metade use `600` (peito: fica livre do rosto, da marca e da legenda);
  - no edit 16:9 use `1395` (faixa de baixo).
- **Volume:** os sons ficam ~12 dB abaixo da voz, medido. No fim, o vídeo inteiro vai a −14 LUFS com pico ≤ −1,5 dBFS (`volume_final.sh`).
  - Se o arquivo não tem voz (edit com música pelo app), o volume não é mexido.

## Edit "versão história" (formato que viralizou nas referências)
- **Tela:**
  - 16:9 no meio do 9:16;
  - **gancho escrito na faixa de cima**, com "GTA 6" em `#F4DF88`;
  - foto e nome do perfil na faixa de baixo.
- **Primeira metade:** **diálogo nosso, em português**, encaixado nas cenas.
  - Logo abaixo do vídeo, Poppins 66; fala dela em rosa, dele em branco.
  - Nunca em cima do rosto.
  - Conferir que o personagem certo aparece de frente no **meio** da fala.
- **Virada:** tingimento magenta, **nunca flash branco**.
- **Segunda metade:** cortes de 0,5 s (120 BPM) na ação.
- **Fim:** assinatura do perfil em neon rosa com glitch (~3 s), indo para o preto.
- **Sem música no arquivo:** a música entra **pelo app do TikTok na hora de postar**, o que evita reivindicação.
- O roteiro fica num `roteiro.json` (gancho, falas com fonte/início/duração/velocidade, cenas de ação).

```sh
FOTO_PERFIL=foto_do_perfil.jpg python3 "SKILL/extras/scripts/edit_historia.py" pasta_do_edit   # requer Python 3 + Pillow
```

## Revisão antes de entregar (obrigatória)
```sh
"SKILL/extras/scripts/revisar_video.sh" video.mp4 3,14
```
- Divide o vídeo em quadros a **30 fps**: folha das trocas de cena, folha com 6 quadros por segundo e os quadros de cada hook.
- Confere quadro preto, trecho congelado, volume integrado e pico.
- **Olhar as folhas, corrigir o que aparecer e só então entregar.**
- Para estudar uma referência, use `extras/scripts/assistir_30fps.py video inicio fim pasta`. Ela analisa todos os quadros a 30 fps.

## Regras que não mudam
- **Fontes de vídeo:**
  - gameplay próprio;
  - streamer que autoriza cortes (guardar o print);
  - criador com permissão por escrito.
- **Nunca:**
  - montar edição para enganar o detector (espelhar, acelerar, mudar tom);
  - repostar sem permissão;
  - usar áudio de trailer ou rádio do jogo;
  - usar vazamento.
- **Trailer oficial:** a Take-Two já derrubou edits com o trailer. Usar só em teste ou em trecho curto com comentário, e avisar o risco.
- **Teste:** arquivos com `TESTE_NAO_POSTAR` no nome.
- **Pastas:** vídeo pesado fora de pasta sincronizada (iCloud, OneDrive). Baixar em H.264 (`extras/scripts/baixar.sh` já faz isso).
- **Ninguém posta pelo agente:** quem posta é o dono do perfil.
