# Identidade do perfil

Preset incluído: **brasilnews1231**. Os valores estão em `assets/identidade/perfil.json`; a logo é `perfil.jpg` e a fonte é distribuída com o pacote.

| Elemento | Padrão |
|---|---|
| Quadro | 1080×1920, 30 fps |
| Imagens | Metade de cima: conversa; metade de baixo: apoio; encostadas em y=960 |
| Faixa central | Nenhuma; sem gradiente preto artificial |
| Legenda | Poppins Semibold 600, 60 px, caixa alta; até três palavras |
| Contorno | Preto, 3 px, sombra leve |
| Palavra ativa | Amarelo suave `#F4DF88`; outras em branco |
| Posição | Na união das imagens, centralizada e estável |
| Marca | Logo circular de 60 px e nome em Poppins 28 px |
| Posição da marca | Na imagem inferior: y=1115, margem direita de 150 px |
| Efeitos | Baixos; whoosh apenas em viradas marcadas, sem repetir em todo corte |

O rosto dos participantes fica livre. A legenda não ganha saltos ou pop a cada palavra. Se um quadro ou a interface da plataforma exigir ajuste, confira a composição antes de exportar.

Uma barra já gravada no vídeo de baixo é diferente da antiga faixa do layout. O motor mede letterbox e registra a sugestão em `media.json`; confirme que o recorte tira só barras, sem conteúdo.

Para os amigos: troque nome e logo com `setup.mjs --profile ... --logo ...`. O arquivo local `config.json` permite ajustar `captionSize` e `activeColor`. A fonte acompanha a skill; não dependa de fonte instalada no sistema.
