# urlclash-converter

Clash <-> Link 订阅转换工具

## 使用

在 GitHub Pages 托管的在线网页, 打开即用:

**https://convert.siiway.top**

## 这是用来干什么的?

就一个功能: **Clash 配置** 和 **节点分享链接** 互转

比如这是 Clash 配置:

```yaml
# 已脱敏
proxies:
- name: 这是名字
  type: vless
  server: 这是服务器
  port: 11451
  uuid: 这是UUID
  network: tcp
  tls: true
  skip-cert-verify: false
  servername: www.example-servername-cannot-use.com
  client-fingerprint: chrome
  flow: xtls-rprx-vision
  reality-opts:
    public-key: 这是PubKey
```

可以用本工具一键转为分享链接:

```url
vless://这是UUID@这是服务器:11451?type=tcp&encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.example-servername-cannot-use.com&fp=chrome&pbk=%E8%BF%99%E6%98%AFPubKey#%E8%BF%99%E6%98%AF%E5%90%8D%E5%AD%97
```

当然, 你也可以将分享链接转换回 Clash 配置 (支持 `proxies:` / `payload:` / 无前缀三种输出格式).

## 支持的协议

| 协议类型     | Clash 写法 | 订阅链接格式          | 备注（*可能不完整*支持特性）                |
| ------------ | ---------- | --------------------- | ------------------------------------------- |
| Shadowsocks  | ss         | ss://                 | AEAD 全加密、plugin、obfs                   |
| ShadowsocksR | ssr        | ssr://                | 完整 SSR 参数                               |
| VMess        | vmess      | vmess://              | AEAD、WebSocket、HTTP/2、gRPC、QUIC         |
| VLESS        | vless      | vless://              | XTLS、Vision、REALITY（含 spx / pqv / ech） |
| Trojan       | trojan     | trojan://             | Trojan-Go / Trojan 全兼容                   |
| Trojan-Go    | trojan     | trojan://             | 与 Trojan 完全互通                          |
| Hysteria2    | hysteria2  | hysteria2:// / hy2:// | 完整 obfs + alpn                            |
| Hysteria     | hysteria   | hysteria:// / hy://   | 老版本 Hysteria                             |
| TUIC v5      | tuic       | tuic://               | congestion control、alpn                    |
| WireGuard    | wireguard  | wg:// / wireguard://  | 完整配置                                    |
| HTTP(S)      | http       | http:// / https://    | 基础 HTTP 代理                              |
| SOCKS5       | socks5     | socks5://             | 支持认证                                    |

> 本项目的 Clash 配置示例以 Meta (Mihomo) 核心分支为准.

## 特点

- 支持多种协议的分享链接和 Clash 配置互转
- 支持中文等特殊字符
- 纯本地处理, 数据不上传不保存

## 自部署

1. Fork 本项目
2. 到仓库 Settings -> Pages 启用 Pages 功能 (`Source` 选择 `GitHub Actions`)
3. 到 Actions 启用并手动触发 `Deploy to GitHub Pages` 工作流
4. *(可选) 到 Settings -> Pages 配置自定义域名*

## End

Code powered by Grok, under GPL-3.0 License.

本工具仅提供 URL 和 Clash Config 的配置文件格式转换，不存储任何信息，不提供任何代理服务，一切使用产生后果由使用者自行承担，SiiWay Team 及开发本工具的成员 **不负任何责任**.

由于各协议分享链接的规范和实现参差不齐, 如果使用过程中出现问题 / 输出与你的预期不符, 请 **[提交 Issue](https://github.com/siiway/urlclash-converter/issues/new)** 方便我们修复.

本项目参考使用了 Clash Verge 的订阅链接转换逻辑, 在此感谢.

## Ref

- Clash Verge `uri-parser.ts` *([`src/converter.ts`](./src/converter.ts) 参考)*: https://github.com/clash-verge-rev/clash-verge-rev/blob/44adf5597546ae2b3c7e3e25418c419760eba7a3/src/utils/uri-parser.ts
- Clash Verge `tyoes.d.ts` *([`src/types/types.d.ts`](./src/types/types.d.ts) 参考)*: https://github.com/clash-verge-rev/clash-verge-rev/blob/44adf5597546ae2b3c7e3e25418c419760eba7a3/src/types/types.d.ts#L341-L777
- Clash Meta (Mihomo) 配置文件示例: https://github.com/MetaCubeX/mihomo/blob/140d892ccf309280d08bb0a487c7f5a6d663c5c5/docs/config.yaml#L348-L1064
- Vless 分享链接提案: https://github.com/XTLS/Xray-core/discussions/716
- Hysteria2 URL Scheme: https://v2.hysteria.network/zh/docs/developers/URI-Scheme/
- Tailwind CSS (cdnjs): https://cdnjs.com/libraries/tailwindcss-browser

<details><summary>为什么放弃 Snippet</summary>

Cloudflare Docs:
- Snippets 限制: https://developers.cloudflare.com/rules/snippets/#limits
- 何时使用 Snippets / Workers: https://developers.cloudflare.com/rules/snippets/when-to-use/#conclusion
- 禁用的函数: https://developers.cloudflare.com/workers/runtime-apis/web-standards/#javascript-standards

如有 API 需求, 可自行提取 src/ 下 TypeScript 文件使用; 如大家都有需求会考虑支持本地运行 API

</details>

如有需要, 所有者可 [联系我们](https://siiway.org/t/c) 删除其上提到的链接.
