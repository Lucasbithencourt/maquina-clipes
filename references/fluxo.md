# Arquivos e formato

Exemplo de organização dentro da pasta escolhida para edição:

```text
.maquina-clipes/          motor, identidade personalizada e modelo
cortes/assunto/work/      source.mp4, bottom.mp4, captions.json, silences.json, meta.json, cuts.json
cortes/assunto/revisao-01/ MP4s, conferência e props
```

`source.mp4` e `bottom.mp4` são cópias das entradas. O motor usa `work/public/` para cópias H.264 e `work/temporarios/` para seu próprio cache. Não apague nem sobrescreva as entradas.

```json
{
  "autoCropBottom": true,
  "clips": [
    {
      "id": "01-assunto",
      "start": 12.4,
      "end": 45.0,
      "focus": {"x": 50, "y": 35},
      "bottomStart": 8,
      "turns": [],
      "images": []
    }
  ]
}
```

- `id`: letras minúsculas, números e hífens; deve ser único.
- `start` e `end`: segundos na gravação de origem.
- `focus`: enquadramento em porcentagem. Para uma câmera pequena dentro de uma live, use `crop: {"x": 100, "y": 80, "w": 400, "h": 356}` em pixels da origem.
- `ritmo: "normal"`: remove pausas sem criar quebras adicionais. `cutEvery` controla as quebras, com padrão próximo de 2,8 s. Preserve falas e ressalvas.
- `turns`: viradas reais de assunto em segundos da origem. Som e flash são opcionais nessas viradas.
- `images`: arquivos locais, por exemplo `{"file":"foto.png","at":25,"dur":2}`. Sem pesquisa nem download automático.
- `autoCropBottom`: mede em três pontos e só propõe letterbox simétrico e constante. Confira o resultado.
- `bottomCrop`: recorte explícito em pixels, por exemplo `{"x":0,"y":60,"w":1920,"h":960}`. Esse exemplo não é um recorte universal. `bottomCrop: false` desativa qualquer retirada de bordas.

`captions.json` contém palavras com `text`, `startMs` e `endMs`. `silences.json` contém pares `start`/`end` em segundos. Corrija nomes e palavras na transcrição antes de montar. As props guardam o remapeamento para a nova linha do tempo.

O build entrega folhas de seis quadros por vídeo e faz decodificação completa dos MP4s para detectar erro de arquivo. Isso não substitui olhar os quadros nem ouvir o áudio.

Se faltar espaço ou memória, mantenha `render.concurrency: 1`, cache de 64 MB e temporários no disco do trabalho. Se o Chrome não estiver instalado, pare e peça a instalação autorizada; o build não deve baixar um navegador em silêncio.
