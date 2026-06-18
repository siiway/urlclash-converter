// SPDX-License-Identifier: GPL-3.0
// GitHub: https://github.com/siiway/urlclash-converter
// 本工具仅提供 URL 和 Clash / sing-box Config 的配置文件格式转换，不存储任何信息，不提供任何代理服务，一切使用产生后果由使用者自行承担，SiiWay Team 及开发本工具的成员不负任何责任.
//
// sing-box outbound <-> 内部节点（Clash 风格）互转。
// 参考文档: https://sing-box.sagernet.org/configuration/outbound/
// 注意: sing-box 不支持 ssr，wireguard 在新版本中为 endpoint，故这两者不参与转换。

import parseUri, { generateUri, tryDecodeBase64SubscriptionLinks } from "./converter";
import { punycodeDomain } from "./utils";

// Clash 协议名 -> sing-box outbound type
const CLASH_TO_SINGBOX_TYPE: Record<string, string> = {
  ss: "shadowsocks",
  vmess: "vmess",
  vless: "vless",
  trojan: "trojan",
  hysteria: "hysteria",
  hysteria2: "hysteria2",
  tuic: "tuic",
  anytls: "anytls",
  http: "http",
  socks5: "socks",
};

// sing-box outbound type -> Clash 协议名
const SINGBOX_TO_CLASH_TYPE: Record<string, string> = {
  shadowsocks: "ss",
  vmess: "vmess",
  vless: "vless",
  trojan: "trojan",
  hysteria: "hysteria",
  hysteria2: "hysteria2",
  tuic: "tuic",
  anytls: "anytls",
  http: "http",
  socks: "socks5",
};

// sing-box 中非代理类 outbound，转链接时跳过
const NON_PROXY_TYPES = new Set([
  "direct",
  "block",
  "dns",
  "selector",
  "urltest",
  "tor",
  "ssh",
  "shadowtls",
  "naive",
  "wireguard",
]);

// ====================== 工具函数 ======================

// 深度清理 undefined / null / 空字符串 / 空对象 / 空数组（保留 0 / false）
function clean(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(clean).filter((v) => v !== undefined && v !== null && v !== "");
  }
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const cv = clean(v);
      if (cv === undefined || cv === null || cv === "") continue;
      if (Array.isArray(cv) && cv.length === 0) continue;
      if (typeof cv === "object" && !Array.isArray(cv) && Object.keys(cv).length === 0) continue;
      out[k] = cv;
    }
    return out;
  }
  return obj;
}

// "100 Mbps" / "100" / 100 -> 100（Mbps 数值）
function parseMbps(value: any): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  const m = String(value).match(/\d+/);
  return m ? parseInt(m[0], 10) : undefined;
}

// "30s" -> 30；30 -> 30
function parseDurationSeconds(value: any): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  const m = String(value).match(/\d+/);
  return m ? parseInt(m[0], 10) : undefined;
}

// Clash client-fingerprint -> sing-box uTLS fingerprint
function toUtlsFingerprint(fp: string): string {
  return fp === "iOS" ? "ios" : fp;
}

// sing-box vmess security <-> Clash cipher（命名差异：chacha20-ietf-poly1305 vs chacha20-poly1305）
function clashCipherToVmessSecurity(cipher: string | undefined): string {
  switch (cipher) {
    case "none":
    case "zero":
    case "auto":
    case "aes-128-gcm":
      return cipher;
    case "chacha20-ietf-poly1305":
      return "chacha20-poly1305";
    default:
      return "auto";
  }
}

function vmessSecurityToClashCipher(security: string | undefined): string {
  switch (security) {
    case "chacha20-poly1305":
      return "chacha20-ietf-poly1305";
    case "none":
    case "zero":
    case "auto":
    case "aes-128-gcm":
      return security;
    default:
      return "auto";
  }
}

// ====================== Clash 节点 -> sing-box TLS ======================
function buildSingboxTls(node: any, serverName?: string): any {
  const tls: any = { enabled: true };
  const sni = serverName || node.servername || node.sni;
  if (sni) tls.server_name = sni;
  if (node["skip-cert-verify"]) tls.insecure = true;
  if (Array.isArray(node.alpn) && node.alpn.length) tls.alpn = node.alpn;

  const fp = node["client-fingerprint"] || node.fingerprint;
  if (fp) tls.utls = { enabled: true, fingerprint: toUtlsFingerprint(fp) };

  const ro = node["reality-opts"];
  if (ro) {
    const reality: any = { enabled: true };
    if (ro["public-key"]) reality.public_key = ro["public-key"];
    if (ro["short-id"] !== undefined && ro["short-id"] !== null) reality.short_id = String(ro["short-id"]);
    tls.reality = reality;
  }
  return tls;
}

// ====================== Clash 节点 -> sing-box transport ======================
function buildSingboxTransport(node: any): any | undefined {
  const net = node.network;
  if (!net || net === "tcp") return undefined;

  if (net === "ws") {
    const ws = node["ws-opts"] || {};
    if (ws["v2ray-http-upgrade"]) {
      const t: any = { type: "httpupgrade" };
      if (ws.path) t.path = ws.path;
      const host = ws.headers?.Host;
      if (host) t.host = host;
      return t;
    }
    const t: any = { type: "ws" };
    if (ws.path) t.path = ws.path;
    if (ws.headers && Object.keys(ws.headers).length) t.headers = ws.headers;
    if (ws["max-early-data"]) t.max_early_data = ws["max-early-data"];
    if (ws["early-data-header-name"]) t.early_data_header_name = ws["early-data-header-name"];
    return t;
  }

  if (net === "grpc") {
    const g = node["grpc-opts"] || {};
    return { type: "grpc", service_name: g["grpc-service-name"] || "" };
  }

  if (net === "h2") {
    const h = node["h2-opts"] || {};
    const t: any = { type: "http" };
    if (h.host) t.host = Array.isArray(h.host) ? h.host : [h.host];
    if (h.path) t.path = h.path;
    return t;
  }

  if (net === "http") {
    const h = node["http-opts"] || {};
    const t: any = { type: "http" };
    const host = h.headers?.Host;
    if (host) t.host = Array.isArray(host) ? host : [host];
    if (h.path) t.path = Array.isArray(h.path) ? h.path[0] : h.path;
    if (h.method) t.method = h.method;
    return t;
  }

  return undefined;
}

// SIP003 plugin_opts 字符串生成 / 解析
function buildPluginOpts(node: any): string {
  const o = node["plugin-opts"] || {};
  if (node.plugin === "obfs") {
    const parts = [`obfs=${o.mode || "http"}`];
    if (o.host) parts.push(`obfs-host=${o.host}`);
    return parts.join(";");
  }
  // v2ray-plugin
  const parts: string[] = [`mode=${o.mode || "websocket"}`];
  if (o.tls) parts.push("tls");
  if (o.host) parts.push(`host=${o.host}`);
  if (o.path) parts.push(`path=${o.path}`);
  return parts.join(";");
}

function parsePluginOpts(str: string | undefined, kind: "obfs" | "v2ray"): any {
  const opts: any = {};
  if (!str) return opts;
  for (const part of str.split(";")) {
    const [k, v] = part.split("=");
    if (!k) continue;
    if (kind === "obfs") {
      if (k === "obfs") opts.mode = v;
      else if (k === "obfs-host") opts.host = v;
    } else {
      if (k === "mode") opts.mode = v;
      else if (k === "host") opts.host = v;
      else if (k === "path") opts.path = v;
      else if (k === "tls") opts.tls = true;
    }
  }
  return opts;
}

// ====================== Clash 节点 -> sing-box outbound ======================
function clashNodeToSingbox(node: any): any | null {
  const type = CLASH_TO_SINGBOX_TYPE[node.type];
  if (!type) return null; // ssr / wireguard 等不受 sing-box 支持，跳过

  const out: any = {
    type,
    tag: node.name || `${node.type} ${node.server}:${node.port}`,
    server: node.server ? punycodeDomain(node.server) : node.server,
    server_port: Number(node.port) || node.port,
  };

  switch (node.type) {
    case "ss": {
      out.method = node.cipher || "aes-256-gcm";
      out.password = node.password || "";
      if (node.plugin === "obfs") {
        out.plugin = "obfs-local";
        out.plugin_opts = buildPluginOpts(node);
      } else if (node.plugin === "v2ray-plugin") {
        out.plugin = "v2ray-plugin";
        out.plugin_opts = buildPluginOpts(node);
      }
      break;
    }
    case "vmess": {
      out.uuid = node.uuid;
      out.security = clashCipherToVmessSecurity(node.cipher);
      out.alter_id = node.alterId || 0;
      if (node.tls) out.tls = buildSingboxTls(node, node.servername);
      const tr = buildSingboxTransport(node);
      if (tr) out.transport = tr;
      break;
    }
    case "vless": {
      out.uuid = node.uuid;
      if (node.flow) out.flow = "xtls-rprx-vision"; // sing-box 仅支持该值
      if (node.tls || node["reality-opts"]) out.tls = buildSingboxTls(node, node.servername);
      const tr = buildSingboxTransport(node);
      if (tr) out.transport = tr;
      break;
    }
    case "trojan": {
      out.password = node.password || "";
      out.tls = buildSingboxTls(node, node.sni || node.servername);
      const tr = buildSingboxTransport(node);
      if (tr) out.transport = tr;
      break;
    }
    case "hysteria2": {
      out.password = node.password || "";
      const up = parseMbps(node.up);
      const down = parseMbps(node.down);
      if (up) out.up_mbps = up;
      if (down) out.down_mbps = down;
      if (node.obfs) {
        out.obfs = { type: node.obfs };
        if (node["obfs-password"]) out.obfs.password = node["obfs-password"];
      }
      out.tls = buildSingboxTls(node, node.sni || node.servername);
      break;
    }
    case "hysteria": {
      const up = parseMbps(node.up);
      const down = parseMbps(node.down);
      if (up) out.up_mbps = up;
      if (down) out.down_mbps = down;
      if (node["auth-str"]) out.auth_str = node["auth-str"];
      if (node.auth) out.auth = node.auth;
      if (node.obfs) out.obfs = node.obfs;
      out.tls = buildSingboxTls(node, node.sni || node.servername);
      break;
    }
    case "tuic": {
      out.uuid = node.uuid;
      if (node.password) out.password = node.password;
      if (node["congestion-controller"]) out.congestion_control = node["congestion-controller"];
      if (node["udp-relay-mode"]) out.udp_relay_mode = node["udp-relay-mode"];
      out.tls = buildSingboxTls(node, node.sni || node.servername);
      if (node["disable-sni"]) out.tls.disable_sni = true;
      break;
    }
    case "anytls": {
      out.password = node.password || "";
      if (node["idle-session-check-interval"])
        out.idle_session_check_interval = `${parseDurationSeconds(node["idle-session-check-interval"])}s`;
      if (node["idle-session-timeout"])
        out.idle_session_timeout = `${parseDurationSeconds(node["idle-session-timeout"])}s`;
      if (node["min-idle-session"] !== undefined && node["min-idle-session"] !== null)
        out.min_idle_session = Number(node["min-idle-session"]);
      out.tls = buildSingboxTls(node, node.sni || node.servername);
      break;
    }
    case "http": {
      if (node.username) out.username = node.username;
      if (node.password) out.password = node.password;
      if (node.tls) out.tls = buildSingboxTls(node, node.sni || node.servername);
      break;
    }
    case "socks5": {
      out.version = "5";
      if (node.username) out.username = node.username;
      if (node.password) out.password = node.password;
      break;
    }
    default:
      return null;
  }

  return clean(out);
}

// ====================== sing-box TLS -> Clash 节点 ======================
function applyTlsToNode(node: any, tls: any, snField: "servername" | "sni"): void {
  if (!tls || tls.enabled === false) return;
  node.tls = true;
  if (tls.server_name) node[snField] = tls.server_name;
  if (tls.insecure) node["skip-cert-verify"] = true;
  if (tls.disable_sni) node["disable-sni"] = true;
  if (tls.alpn) node.alpn = Array.isArray(tls.alpn) ? tls.alpn : [tls.alpn];
  if (tls.utls?.fingerprint) node["client-fingerprint"] = tls.utls.fingerprint;
  if (tls.reality?.enabled) {
    const reality: any = {};
    if (tls.reality.public_key) reality["public-key"] = tls.reality.public_key;
    if (tls.reality.short_id !== undefined && tls.reality.short_id !== null)
      reality["short-id"] = String(tls.reality.short_id);
    node["reality-opts"] = reality;
  }
}

// ====================== sing-box transport -> Clash 节点 ======================
function applyTransportToNode(node: any, transport: any): void {
  if (!transport || !transport.type) return;
  switch (transport.type) {
    case "ws": {
      node.network = "ws";
      const ws: any = {};
      if (transport.path) ws.path = transport.path;
      if (transport.headers) ws.headers = transport.headers;
      if (transport.max_early_data) ws["max-early-data"] = transport.max_early_data;
      if (transport.early_data_header_name) ws["early-data-header-name"] = transport.early_data_header_name;
      node["ws-opts"] = ws;
      break;
    }
    case "httpupgrade": {
      node.network = "ws";
      const ws: any = { "v2ray-http-upgrade": true };
      if (transport.path) ws.path = transport.path;
      if (transport.host) ws.headers = { Host: transport.host };
      node["ws-opts"] = ws;
      break;
    }
    case "grpc": {
      node.network = "grpc";
      node["grpc-opts"] = { "grpc-service-name": transport.service_name || "" };
      break;
    }
    case "http": {
      node.network = "http";
      const http: any = {};
      if (transport.host) http.headers = { Host: Array.isArray(transport.host) ? transport.host : [transport.host] };
      if (transport.path) http.path = transport.path;
      if (transport.method) http.method = transport.method;
      node["http-opts"] = http;
      break;
    }
    default:
      break;
  }
}

// ====================== sing-box outbound -> Clash 节点 ======================
function singboxToClashNode(out: any): any | null {
  if (!out || typeof out !== "object") return null;
  const type = SINGBOX_TO_CLASH_TYPE[out.type];
  if (!type) return null;

  const node: any = {
    name: out.tag || `${out.type} ${out.server}:${out.server_port}`,
    type,
    server: out.server,
    port: Number(out.server_port) || out.server_port,
  };

  switch (out.type) {
    case "shadowsocks": {
      node.cipher = out.method;
      node.password = out.password;
      if (out.plugin === "obfs-local") {
        node.plugin = "obfs";
        node["plugin-opts"] = parsePluginOpts(out.plugin_opts, "obfs");
      } else if (out.plugin === "v2ray-plugin") {
        node.plugin = "v2ray-plugin";
        node["plugin-opts"] = parsePluginOpts(out.plugin_opts, "v2ray");
      }
      break;
    }
    case "vmess": {
      node.uuid = out.uuid;
      node.alterId = out.alter_id || 0;
      node.cipher = vmessSecurityToClashCipher(out.security);
      applyTlsToNode(node, out.tls, "servername");
      applyTransportToNode(node, out.transport);
      break;
    }
    case "vless": {
      node.uuid = out.uuid;
      if (out.flow) node.flow = out.flow;
      applyTlsToNode(node, out.tls, "servername");
      applyTransportToNode(node, out.transport);
      break;
    }
    case "trojan": {
      node.password = out.password;
      applyTlsToNode(node, out.tls, "sni");
      applyTransportToNode(node, out.transport);
      break;
    }
    case "hysteria2": {
      node.password = out.password;
      if (out.obfs?.type) {
        node.obfs = out.obfs.type;
        if (out.obfs.password) node["obfs-password"] = out.obfs.password;
      }
      if (out.up_mbps) node.up = String(out.up_mbps);
      if (out.down_mbps) node.down = String(out.down_mbps);
      applyTlsToNode(node, out.tls, "sni");
      break;
    }
    case "hysteria": {
      if (out.auth_str) node["auth-str"] = out.auth_str;
      if (out.auth) node.auth = out.auth;
      if (out.obfs) node.obfs = out.obfs;
      if (out.up_mbps) node.up = String(out.up_mbps);
      if (out.down_mbps) node.down = String(out.down_mbps);
      applyTlsToNode(node, out.tls, "sni");
      break;
    }
    case "tuic": {
      node.uuid = out.uuid;
      if (out.password) node.password = out.password;
      if (out.congestion_control) node["congestion-controller"] = out.congestion_control;
      if (out.udp_relay_mode) node["udp-relay-mode"] = out.udp_relay_mode;
      applyTlsToNode(node, out.tls, "sni");
      break;
    }
    case "anytls": {
      node.password = out.password;
      if (out.idle_session_check_interval)
        node["idle-session-check-interval"] = parseDurationSeconds(out.idle_session_check_interval);
      if (out.idle_session_timeout)
        node["idle-session-timeout"] = parseDurationSeconds(out.idle_session_timeout);
      if (out.min_idle_session !== undefined && out.min_idle_session !== null)
        node["min-idle-session"] = Number(out.min_idle_session);
      applyTlsToNode(node, out.tls, "sni");
      break;
    }
    case "http": {
      if (out.username) node.username = out.username;
      if (out.password) node.password = out.password;
      if (out.tls?.enabled) applyTlsToNode(node, out.tls, "sni");
      break;
    }
    case "socks": {
      if (out.username) node.username = out.username;
      if (out.password) node.password = out.password;
      break;
    }
    default:
      return null;
  }

  return node;
}

// ====================== 正向：链接 -> sing-box 配置 ======================
function parseLinksToNodes(links: string[]): any[] {
  return links
    .map((link) => {
      try {
        return parseUri(link.trim());
      } catch (e) {
        console.error(e);
        return null;
      }
    })
    .filter((node): node is any => Boolean(node));
}

export function linkToSingbox(links: string[]): ConvertResult {
  let nodes = parseLinksToNodes(links);

  if (nodes.length === 0) {
    const decoded = tryDecodeBase64SubscriptionLinks(links);
    if (decoded) nodes = parseLinksToNodes(decoded);
  }

  const outbounds = nodes.map(clashNodeToSingbox).filter(Boolean);

  if (outbounds.length === 0) {
    return {
      success: false,
      data: "// 无有效节点 (请检查链接格式，或该协议不被 sing-box 支持)\n// No valid node (check link format, or protocol unsupported by sing-box)",
    };
  }

  return {
    success: true,
    data: JSON.stringify({ outbounds }, null, 2),
  };
}

// ====================== 反向：sing-box 配置 -> 链接 ======================
export function singboxToLink(jsonText: string): ConvertResult {
  let config: any;
  try {
    config = JSON.parse(jsonText);
  } catch (e: any) {
    return {
      success: false,
      data: `# sing-box JSON 解析失败: ${e.message || e}\n# sing-box JSON parse failed: ${e.message || e}`,
    };
  }

  let outbounds: any[] = [];
  if (Array.isArray(config)) {
    outbounds = config;
  } else if (Array.isArray(config?.outbounds)) {
    outbounds = config.outbounds;
  } else if (config?.type) {
    outbounds = [config];
  }

  const proxies = outbounds.filter((o) => o && typeof o === "object" && o.type && !NON_PROXY_TYPES.has(o.type));

  const links = proxies
    .map(singboxToClashNode)
    .filter(Boolean)
    .map((node) => generateUri(node))
    .filter(Boolean);

  if (links.length === 0) {
    return {
      success: false,
      data: "# 未检测到任何受支持的 sing-box 节点\n# No supported sing-box outbound found",
    };
  }

  return {
    success: true,
    data: links.join("\n"),
  };
}

// 检测配置文本是 sing-box (JSON) 还是 Clash (YAML)
export function isSingboxConfig(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}
