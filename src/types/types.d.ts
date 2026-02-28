// SPDX-License-Identifier: GPL-3.0
// Original: https://github.com/clash-verge-rev/clash-verge-rev/blob/dev/src/types/types.d.ts
// GitHub: https://github.com/siiway/urlclash-converter
// 本工具仅提供 URL 和 Clash Config 的配置文件格式转换，不存储任何信息，不提供任何代理服务，一切使用产生后果由使用者自行承担，SiiWay Team 及开发本工具的成员不负任何责任.

// base
interface IProxyBaseConfig {
  tfo?: boolean;
  mptcp?: boolean;
  "interface-name"?: string;
  "routing-mark"?: number;
  "ip-version"?: "dual" | "ipv4" | "ipv6" | "ipv4-prefer" | "ipv6-prefer";
  "dialer-proxy"?: string;
}
// direct
interface IProxyDirectConfig extends IProxyBaseConfig {
  name: string;
  type: "direct";
}
// dns
interface IProxyDnsConfig extends IProxyBaseConfig {
  name: string;
  type: "dns";
}
// http
interface IProxyHttpConfig extends IProxyBaseConfig {
  name: string;
  type: "http";
  server?: string;
  port?: number;
  username?: string;
  password?: string;
  tls?: boolean;
  sni?: string;
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  headers?: {
    [key: string]: string;
  };
}
// socks5
interface IProxySocks5Config extends IProxyBaseConfig {
  name: string;
  type: "socks5";
  server?: string;
  port?: number;
  username?: string;
  password?: string;
  tls?: boolean;
  udp?: boolean;
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
}
// ssh
interface IProxySshConfig extends IProxyBaseConfig {
  name: string;
  type: "ssh";
  server?: string;
  port?: number;
  username?: string;
  password?: string;
  "private-key"?: string;
  "private-key-passphrase"?: string;
  "host-key"?: string;
  "host-key-algorithms"?: string;
}
// trojan
interface IProxyTrojanConfig extends IProxyBaseConfig {
  name: string;
  type: "trojan";
  server?: string;
  port?: number;
  password?: string;
  alpn?: string[];
  sni?: string;
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  udp?: boolean;
  network?: NetworkType;
  "reality-opts"?: RealityOptions;
  "grpc-opts"?: GrpcOptions;
  "ws-opts"?: WsOptions;
  "ss-opts"?: {
    enabled?: boolean;
    method?: string;
    password?: string;
  };
  "client-fingerprint"?: ClientFingerprint;
}
// tuic
interface IProxyTuicConfig extends IProxyBaseConfig {
  name: string;
  type: "tuic";
  server?: string;
  port?: number;
  token?: string;
  uuid?: string;
  password?: string;
  ip?: string;
  "heartbeat-interval"?: number;
  alpn?: string[];
  "reduce-rtt"?: boolean;
  "request-timeout"?: number;
  "udp-relay-mode"?: string;
  "congestion-controller"?: string;
  "disable-sni"?: boolean;
  "max-udp-relay-packet-size"?: number;
  "fast-open"?: boolean;
  "max-open-streams"?: number;
  cwnd?: number;
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  ca?: string;
  "ca-str"?: string;
  "recv-window-conn"?: number;
  "recv-window"?: number;
  "disable-mtu-discovery"?: boolean;
  "max-datagram-frame-size"?: number;
  sni?: string;
  "udp-over-stream"?: boolean;
  "udp-over-stream-version"?: number;
}
// vless
interface IProxyVlessConfig extends IProxyBaseConfig {
  name: string;
  type: "vless";
  server?: string;
  port?: number;
  uuid?: string;
  flow?: string;
  tls?: boolean;
  alpn?: string[];
  udp?: boolean;
  "packet-addr"?: boolean;
  xudp?: boolean;
  "packet-encoding"?: string;
  network?: NetworkType;
  "reality-opts"?: RealityOptions;
  "http-opts"?: HttpOptions;
  "h2-opts"?: H2Options;
  "grpc-opts"?: GrpcOptions;
  "ws-opts"?: WsOptions;
  "ws-path"?: string;
  "ws-headers"?: {
    [key: string]: string;
  };
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  servername?: string;
  "client-fingerprint"?: ClientFingerprint;
  smux?: boolean;
}
// vmess
interface IProxyVmessConfig extends IProxyBaseConfig {
  name: string;
  type: "vmess";
  server?: string;
  port?: number;
  uuid?: string;
  alterId?: number;
  cipher?: CipherType;
  udp?: boolean;
  network?: NetworkType;
  tls?: boolean;
  alpn?: string[];
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  servername?: string;
  "reality-opts"?: RealityOptions;
  "http-opts"?: HttpOptions;
  "h2-opts"?: H2Options;
  "grpc-opts"?: GrpcOptions;
  "ws-opts"?: WsOptions;
  "packet-addr"?: boolean;
  xudp?: boolean;
  "packet-encoding"?: string;
  "global-padding"?: boolean;
  "authenticated-length"?: boolean;
  "client-fingerprint"?: ClientFingerprint;
  smux?: boolean;
}
interface WireGuardPeerOptions {
  server?: string;
  port?: number;
  "public-key"?: string;
  "pre-shared-key"?: string;
  reserved?: number[];
  "allowed-ips"?: string[];
}
// wireguard
interface IProxyWireguardConfig extends IProxyBaseConfig, WireGuardPeerOptions {
  name: string;
  type: "wireguard";
  ip?: string;
  ipv6?: string;
  "private-key"?: string;
  workers?: number;
  mtu?: number;
  udp?: boolean;
  "persistent-keepalive"?: number;
  peers?: WireGuardPeerOptions[];
  "remote-dns-resolve"?: boolean;
  dns?: string[];
  "refresh-server-ip-interval"?: number;
}
// hysteria
interface IProxyHysteriaConfig extends IProxyBaseConfig {
  name: string;
  type: "hysteria";
  server?: string;
  port?: number;
  ports?: string;
  protocol?: string;
  "obfs-protocol"?: string;
  up?: string;
  "up-speed"?: number;
  down?: string;
  "down-speed"?: number;
  auth?: string;
  "auth-str"?: string;
  obfs?: string;
  sni?: string;
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  alpn?: string[];
  ca?: string;
  "ca-str"?: string;
  "recv-window-conn"?: number;
  "recv-window"?: number;
  "disable-mtu-discovery"?: boolean;
  "fast-open"?: boolean;
  "hop-interval"?: number;
}
// hysteria2
interface IProxyHysteria2Config extends IProxyBaseConfig {
  name: string;
  type: "hysteria2";
  server?: string;
  port?: number;
  ports?: string;
  "hop-interval"?: number;
  protocol?: string;
  "obfs-protocol"?: string;
  up?: string;
  down?: string;
  password?: string;
  obfs?: string;
  "obfs-password"?: string;
  sni?: string;
  "skip-cert-verify"?: boolean;
  fingerprint?: string;
  alpn?: string[];
  ca?: string;
  "ca-str"?: string;
  cwnd?: number;
  "udp-mtu"?: number;
}
// shadowsocks
interface IProxyShadowsocksConfig extends IProxyBaseConfig {
  name: string;
  type: "ss";
  server?: string;
  port?: number;
  password?: string;
  cipher?: CipherType;
  udp?: boolean;
  plugin?: "obfs" | "v2ray-plugin" | "shadow-tls" | "restls";
  "plugin-opts"?: {
    mode?: string;
    host?: string;
    password?: string;
    path?: string;
    tls?: string;
    fingerprint?: string;
    headers?: {
      [key: string]: string;
    };
    "skip-cert-verify"?: boolean;
    version?: number;
    mux?: boolean;
    "v2ray-http-upgrade"?: boolean;
    "v2ray-http-upgrade-fast-open"?: boolean;
    "version-hint"?: string;
    "restls-script"?: string;
  };
  "udp-over-tcp"?: boolean;
  "udp-over-tcp-version"?: number;
  "client-fingerprint"?: ClientFingerprint;
  smux?: boolean;
}
// shadowsocksR
interface IProxyshadowsocksRConfig extends IProxyBaseConfig {
  name: string;
  type: "ssr";
  server?: string;
  port?: number;
  password?: string;
  cipher?: CipherType;
  obfs?: string;
  "obfs-param"?: string;
  protocol?: string;
  "protocol-param"?: string;
  udp?: boolean;
}
// sing-mux
interface IProxySmuxConfig {
  smux?: {
    enabled?: boolean;
    protocol?: "smux" | "yamux" | "h2mux";
    "max-connections"?: number;
    "min-streams"?: number;
    "max-streams"?: number;
    padding?: boolean;
    statistic?: boolean;
    "only-tcp"?: boolean;
    "brutal-opts"?: {
      enabled?: boolean;
      up?: string;
      down?: string;
    };
  };
}
// snell
interface IProxySnellConfig extends IProxyBaseConfig {
  name: string;
  type: "snell";
  server?: string;
  port?: number;
  psk?: string;
  udp?: boolean;
  version?: number;
}
interface IProxyConfig
  extends
    IProxyBaseConfig,
    IProxyDirectConfig,
    IProxyDnsConfig,
    IProxyHttpConfig,
    IProxySocks5Config,
    IProxySshConfig,
    IProxyTrojanConfig,
    IProxyTuicConfig,
    IProxyVlessConfig,
    IProxyVmessConfig,
    IProxyWireguardConfig,
    IProxyHysteriaConfig,
    IProxyHysteria2Config,
    IProxyShadowsocksConfig,
    IProxyshadowsocksRConfig,
    IProxySmuxConfig,
    IProxySnellConfig {
  type:
    | "ss"
    | "ssr"
    | "direct"
    | "dns"
    | "snell"
    | "http"
    | "trojan"
    | "hysteria"
    | "hysteria2"
    | "tuic"
    | "wireguard"
    | "ssh"
    | "socks5"
    | "vmess"
    | "vless";
  reality?: RealityOptions;
}

type ClientFingerprint =
  | "chrome"
  | "firefox"
  | "safari"
  | "iOS"
  | "android"
  | "edge"
  | "360"
  | "qq"
  | "random";
type NetworkType = "ws" | "http" | "h2" | "grpc" | "tcp";
interface WsOptions {
  path?: string;
  headers?: {
    [key: string]: string;
  };
  "max-early-data"?: number;
  "early-data-header-name"?: string;
  "v2ray-http-upgrade"?: boolean;
  "v2ray-http-upgrade-fast-open"?: boolean;
}
interface GrpcOptions {
  "grpc-service-name"?: string;
}
interface RealityOptions {
  "public-key"?: string;
  "short-id"?: string;
  "spider-x"?: string;
  "mldsa65-verify"?: string;
  ech?: string;
}

type ClashOutputMode = "proxies" | "payload" | "none";
interface ConvertResult {
  success: boolean;
  data: string; // 成功时是节点列表或 YAML，失败时是错误说明（以 # 开头）
}
