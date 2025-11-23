npx esbuild src/converter.ts \
    --bundle \
    --format=esm \
    --platform=browser \
    --target=es2022 \
    --minify \
    --sourcemap=inline \
    --outfile=dist/converter.bundle.js \
    --banner:js="// SPDX-License-Identifier: GPL-3.0 - Build: local - Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC') - Repo: https://github.com/siiway/urlclash-converter"
cp dist/* src/
echo Access: http://localhost:12345/frontend.html
python3 -m http.server 12345 -d ./src/ -b localhost