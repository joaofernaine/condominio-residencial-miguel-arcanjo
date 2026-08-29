# Test Plan — trocar favicon

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

- [x] `public/favicon.ico` não é mais o coração do Lovable — extrair a imagem
      embutida no `.ico` (formato PNG dentro do ICO) e confirmar visualmente
      que é o "M" dourado sobre fundo azul-marinho, igual a `icon-192.png`.

  Script Python usado (parseia ICONDIR de 6 bytes + ICONDIRENTRY de 16 bytes,
  extrai o PNG embutido a partir do `imageOffset`, e compara byte a byte com
  `public/icon-192.png`):

  ```python
  import struct

  ICO_PATH = r"public/favicon.ico"
  OUT_PATH = r".../extracted_favicon.png"

  with open(ICO_PATH, "rb") as f:
      data = f.read()

  print(f"Total .ico file size: {len(data)} bytes")

  reserved, img_type, count = struct.unpack("<HHH", data[0:6])
  print(f"ICONDIR: reserved={reserved}, type={img_type} (1=icon), count={count}")

  offset = 6
  for i in range(count):
      entry = data[offset:offset+16]
      width, height, colorCount, reservedB, planes, bitCount, bytesInRes, imageOffset = struct.unpack("<BBBBHHII", entry)
      w = width if width != 0 else 256
      h = height if height != 0 else 256
      print(f"ICONDIRENTRY[{i}]: width={w}, height={h}, colorCount={colorCount}, planes={planes}, bitCount={bitCount}, bytesInRes={bytesInRes}, imageOffset={imageOffset}")
      offset += 16
      img_data = data[imageOffset:imageOffset+bytesInRes]
      print(f"  Extracted image data length: {len(img_data)} bytes (expected {bytesInRes})")
      print(f"  First 8 bytes (magic): {img_data[:8]!r}")
      is_png = img_data[:8] == b'\x89PNG\r\n\x1a\n'
      print(f"  Is PNG signature: {is_png}")
      if is_png:
          with open(OUT_PATH, "wb") as out:
              out.write(img_data)
          print(f"  Wrote extracted PNG to: {OUT_PATH}")

  with open(r"public/icon-192.png", "rb") as f:
      icon192_data = f.read()
  print(f"\npublic/icon-192.png size: {len(icon192_data)} bytes")
  print(f"Embedded PNG == icon-192.png bytes? {img_data == icon192_data}")
  ```

  Saída crua (rodado com `python parse_ico.py` a partir da raiz do repo):

  ```
  Total .ico file size: 14834 bytes
  ICONDIR: reserved=0, type=1 (1=icon), count=1
  ICONDIRENTRY[0]: width=192, height=192, colorCount=0, planes=1, bitCount=32, bytesInRes=14812, imageOffset=22
    Extracted image data length: 14812 bytes (expected 14812)
    First 8 bytes (magic): b'\x89PNG\r\n\x1a\n'
    Is PNG signature: True
    Wrote extracted PNG to: <scratchpad>/extracted_favicon.png

  public/icon-192.png size: 14812 bytes
  Embedded PNG == icon-192.png bytes? True
  ```

  Conferido: `14834 (favicon.ico total) - 22 (6 bytes ICONDIR + 16 bytes
  ICONDIRENTRY) = 14812`, exatamente o tamanho de `icon-192.png`, e os bytes
  extraídos são idênticos byte a byte ao PNG do repo (o `.ico` embrulha o
  `icon-192.png` sem recodificação).

  Inspeção visual (Read na imagem `extracted_favicon.png`): a imagem mostra
  um monograma estilizado da letra "M" em dourado/amarelo sobre um fundo
  quadrado arredondado azul-marinho escuro (gradiente sutil de azul escuro
  para quase preto). Não há nenhum coração, nem cores laranja/vermelho —
  **não é mais o ícone padrão do Lovable**. Corresponde à descrição esperada
  do ícone do condomínio.

- [x] Rodar o app localmente (`bun run dev` ou equivalente — ver
      `docs/projeto/ambiente.md`), abrir no Playwright, e verificar via
      `browser_evaluate` ou request direto que `GET /favicon.ico` retorna o
      novo arquivo (comparar tamanho/hash com o `public/favicon.ico` do
      repo, não com o antigo).

  Observação: neste ambiente de QA o binário `bun` não está no PATH (nem em
  `~/.bun/bin`, nem em nenhum diretório de `$env:Path`) — `bun run dev`
  falhou com `command not found` / `O termo 'bun' não é reconhecido`.
  `node_modules/` já estava instalado (via bun, pelo implementador) e o
  `package.json` mostra que `dev` é só um alias para `vite dev`
  (`"dev": "vite dev"`), então rodei o servidor real equivalente via
  `node_modules\.bin\vite.cmd dev`, sem mockar nada — é o mesmo Vite dev
  server que `bun run dev` chamaria.

  Log de subida do servidor (`vite dev`):

  ```
  13:20:59 [vite] (client) Re-optimizing dependencies because lockfile has changed

    VITE v8.1.4  ready in 2295 ms

    ➜  Local:   http://localhost:8080/
    ➜  Network: http://192.168.0.100:8080/
  ```

  Subiu na porta padrão 8080 (livre, sem precisar de fallback).

  Request real (`curl -sD -`) para `http://localhost:8080/favicon.ico`:

  ```
  HTTP/1.1 200 OK
  Vary: Origin
  Content-Length: 14834
  Content-Type: image/x-icon
  Last-Modified: Sat, 29 Aug 2026 16:18:55 GMT
  ETag: W/"14834-1788020335896"
  Cache-Control: no-cache
  Date: Sat, 29 Aug 2026 16:21:09 GMT
  Connection: keep-alive
  Keep-Alive: timeout=5
  ```

  `Content-Length: 14834` bate exatamente com o tamanho de `public/favicon.ico`
  no repo (14834 bytes) — não é o tamanho antigo do arquivo do Lovable
  (~20KB).

  Verificação adicional (mais forte que só o tamanho): baixei o corpo da
  resposta para um arquivo e comparei o MD5 com o `public/favicon.ico` do
  repo:

  ```
  $ ls -la public/favicon.ico downloaded_favicon.ico
  -rw-r--r-- ... 14834 Aug 29 13:21 downloaded_favicon.ico
  -rw-r--r-- ... 14834 Aug 29 13:18 public/favicon.ico

  $ md5sum public/favicon.ico downloaded_favicon.ico
  12c3042485a5155a5c48320cd2e80024 *public/favicon.ico
  12c3042485a5155a5c48320cd2e80024 *downloaded_favicon.ico
  ```

  MD5 idêntico — o servidor está servindo exatamente o `public/favicon.ico`
  atual (novo ícone), não um arquivo antigo em cache.

  Encerramento do dev server ao final (kill do processo `vite.cmd`/node e
  confirmação de que a porta caiu):

  ```
  Killed PID 18400 and children
  Server down (expected): O tempo limite da operação foi atingido.
  ```
