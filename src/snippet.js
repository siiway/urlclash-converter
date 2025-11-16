// src/snippet.js
// SPDX-License-Identifier: GPL-3.0-or-later
// GitHub: siiway / subconverter-snippet
// Only for education and study use.
// 本工具仅提供 URL 和 Clash Config 的配置文件格式转换，不存储任何信息，不提供任何代理服务，一切使用产生后果由使用者自行承担，SiiWay Team 及开发本工具的成员不负任何责任.

const REPO = 'siiway/subconverter-snippet';
const CORE_URL = `https://raw.githubusercontent.com/${REPO}/main/dist/converter.js`;
const HTML_URL = `https://raw.githubusercontent.com/${REPO}/main/src/frontend.html`;

// 缓存配置：1 分钟
const CACHE_DURATION_SECONDS = 60;
const USE_PATH = true;
const USE_QUERY_STRING = true;
const INCLUDE_HEADERS = [];

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;

        // === 主页：反代 frontend.html + 替换 REPO ===
        if (path === '/' || path === '') {
            const cacheKey = createCacheKey(new Request(HTML_URL, request));
            const cache = caches.default;
            let response = await cache.match(cacheKey);

            if (!response) {
                const resp = await fetch(HTML_URL + '?t=' + Date.now());
                if (!resp.ok) return new Response('HTML load failed', { status: 500 });

                let html = await resp.text();
                // 替换所有非注释中的 repo 地址
                html = html.replace(
                    /https?:\/\/github\.com\/siiway\/subconverter-snippet/g,
                    `https://github.com/${REPO}`
                );
                // 替换 JS 加载路径为本地反代
                html = html.replace(
                    /https?:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\/latest\/converter\.js/g,
                    '/converter.js'
                );

                response = new Response(html, {
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': `s-maxage=${CACHE_DURATION_SECONDS}`,
                        'x-snippets-cache': 'stored',
                    },
                });
                await cache.put(cacheKey, response.clone());
            } else {
                response = new Response(response.body, response);
                response.headers.set('x-snippets-cache', 'hit');
            }

            return response;
        }

        // === 反代 converter.js（1分钟缓存）===
        if (path === '/converter.js') {
            const cacheKey = createCacheKey(new Request(CORE_URL, request));
            const cache = caches.default;
            let response = await cache.match(cacheKey);

            if (!response) {
                const resp = await fetch(CORE_URL + '?t=' + Date.now());
                if (!resp.ok) return new Response('JS load failed', { status: 500 });

                response = new Response(resp.body, {
                    headers: {
                        'Content-Type': 'application/javascript',
                        'Cache-Control': `s-maxage=${CACHE_DURATION_SECONDS}`,
                        'x-snippets-cache': 'stored',
                    },
                });
                await cache.put(cacheKey, response.clone());
            } else {
                response = new Response(response.body, response);
                response.headers.set('x-snippets-cache', 'hit');
            }

            return response;
        }

        // === API: /to-clash ===
        if (path === '/to-clash' && request.method === 'POST') {
            const { links } = await request.json();
            const coreResp = await fetch(CORE_URL + '?t=' + Date.now());
            if (!coreResp.ok) return new Response('Core load failed', { status: 500 });
            const code = await coreResp.text();
            const core = new Function(code + '; return { linkToClash };')();
            return new Response(core.linkToClash(links), {
                headers: { 'Content-Type': 'text/yaml', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // === API: /to-link ===
        if (path === '/to-link' && request.method === 'POST') {
            const yaml = await request.text();
            const coreResp = await fetch(CORE_URL + '?t=' + Date.now());
            if (!coreResp.ok) return new Response('Core load failed', { status: 500 });
            const code = await coreResp.text();
            const core = new Function(code + '; return { clashToLink };')();
            return new Response(core.clashToLink(yaml), {
                headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
            });
        }

        return new Response('404 Not Found', { status: 404 });
    },
};

// === 缓存 Key 生成函数（CF 官方推荐）===
function createCacheKey(request) {
    const url = new URL(request.url);
    const cacheUrl = new URL(url.origin);

    if (USE_PATH) cacheUrl.pathname = url.pathname;
    if (USE_QUERY_STRING) cacheUrl.search = url.search;

    INCLUDE_HEADERS.forEach(header => {
        const value = request.headers.get(header) || '';
        cacheUrl.searchParams.append(header.toLowerCase(), value);
    });

    return new Request(cacheUrl.toString(), { method: 'GET' });
}