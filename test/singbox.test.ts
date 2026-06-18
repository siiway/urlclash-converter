// SPDX-License-Identifier: GPL-3.0
// sing-box 转换模块的轻量往返测试，运行: `bun test`
import { test, expect, describe } from "bun:test";
import { linkToSingbox, singboxToLink, isSingboxConfig } from "../src/singbox";

function outboundsOf(jsonText: string): any[] {
  return JSON.parse(jsonText).outbounds;
}

// 取单条链接 -> sing-box outbound
function toOutbound(link: string): any {
  const r = linkToSingbox([link]);
  expect(r.success).toBe(true);
  const obs = outboundsOf(r.data);
  expect(obs.length).toBe(1);
  return obs[0];
}

describe("linkToSingbox: 协议映射", () => {
  test("shadowsocks", () => {
    const o = toOutbound("ss://YWVzLTI1Ni1nY206cGFzcw@1.2.3.4:8388#SS");
    expect(o.type).toBe("shadowsocks");
    expect(o.server).toBe("1.2.3.4");
    expect(o.server_port).toBe(8388);
    expect(o.method).toBe("aes-256-gcm");
    expect(o.password).toBe("pass");
  });

  test("vmess: cipher 重命名 + ws transport + tls", () => {
    // scy=chacha20-ietf-poly1305, net=ws, tls
    const link =
      "vmess://eyJ2IjoiMiIsInBzIjoiVk0iLCJhZGQiOiJleC5jb20iLCJwb3J0IjoiNDQzIiwiaWQiOiJ1dWlkIiwiYWlkIjoiMCIsInNjeSI6ImNoYWNoYTIwLWlldGYtcG9seTEzMDUiLCJuZXQiOiJ3cyIsImhvc3QiOiJleC5jb20iLCJwYXRoIjoiL3AiLCJ0bHMiOiJ0bHMifQ==";
    const o = toOutbound(link);
    expect(o.type).toBe("vmess");
    expect(o.security).toBe("chacha20-poly1305");
    expect(o.transport.type).toBe("ws");
    expect(o.transport.path).toBe("/p");
    expect(o.tls.enabled).toBe(true);
  });

  test("vless: reality + flow + grpc (short_id 为字符串)", () => {
    const o = toOutbound(
      "vless://uuid@h.com:443?type=grpc&security=reality&sni=t.com&pbk=PK&sid=ab&fp=chrome&flow=xtls-rprx-vision#VLESS",
    );
    expect(o.type).toBe("vless");
    expect(o.flow).toBe("xtls-rprx-vision");
    expect(o.tls.reality.enabled).toBe(true);
    expect(o.tls.reality.public_key).toBe("PK");
    expect(o.tls.reality.short_id).toBe("ab");
    expect(o.transport.type).toBe("grpc");
    // 空 service_name 不应出现
    expect("service_name" in o.transport).toBe(false);
  });

  test("trojan", () => {
    const o = toOutbound("trojan://pw@t.com:443?sni=t.com#TJ");
    expect(o.type).toBe("trojan");
    expect(o.password).toBe("pw");
    expect(o.tls.server_name).toBe("t.com");
  });

  test("hysteria2: obfs 对象形态", () => {
    const o = toOutbound("hysteria2://pw@h.com:443?sni=h.com&obfs=salamander&obfs-password=op&insecure=1#HY2");
    expect(o.type).toBe("hysteria2");
    expect(o.obfs.type).toBe("salamander");
    expect(o.obfs.password).toBe("op");
    expect(o.tls.insecure).toBe(true);
  });

  test("tuic", () => {
    const o = toOutbound("tuic://u:p@t.com:443?sni=t.com#TUIC");
    expect(o.type).toBe("tuic");
    expect(o.uuid).toBe("u");
    expect(o.password).toBe("p");
  });

  test("anytls", () => {
    const o = toOutbound("anytls://pw@a.com:443?sni=a.com#ATLS");
    expect(o.type).toBe("anytls");
    expect(o.password).toBe("pw");
  });

  test("socks5: 不写 version 字段", () => {
    const o = toOutbound("socks5://user:pass@s.com:1080#SK");
    expect(o.type).toBe("socks");
    expect("version" in o).toBe(false);
    expect(o.username).toBe("user");
  });

  test("非法端口的链接被跳过", () => {
    const r = linkToSingbox(["ss://YWVzLTI1Ni1nY206cGFzcw@1.2.3.4:0#bad"]);
    expect(r.success).toBe(false);
  });
});

describe("singboxToLink: 反向解析", () => {
  test("完整配置过滤非代理 outbound", () => {
    const cfg = JSON.stringify({
      outbounds: [
        { type: "selector", tag: "sel", outbounds: ["ss"] },
        {
          type: "shadowsocks",
          tag: "ss",
          server: "1.2.3.4",
          server_port: 8388,
          method: "aes-256-gcm",
          password: "pass",
        },
        { type: "direct", tag: "direct" },
        { type: "block", tag: "block" },
      ],
    });
    const r = singboxToLink(cfg);
    expect(r.success).toBe(true);
    expect(r.data.split("\n").length).toBe(1);
    expect(r.data.startsWith("ss://")).toBe(true);
  });

  test("非法 JSON 返回失败", () => {
    expect(singboxToLink("not json").success).toBe(false);
  });
});

describe("链接 -> sing-box -> 链接 往返", () => {
  const links = [
    "ss://YWVzLTI1Ni1nY206cGFzcw@1.2.3.4:8388#SS",
    "trojan://pw@t.com:443?sni=t.com#TJ",
    "hysteria2://pw@h.com:443?sni=h.com&obfs=salamander&obfs-password=op&insecure=1#HY2",
    "tuic://u:p@t.com:443?sni=t.com#TUIC",
  ];
  for (const link of links) {
    const proto = link.split("://")[0];
    test(`保持 ${proto} 关键信息`, () => {
      const sb = linkToSingbox([link]);
      const back = singboxToLink(sb.data);
      expect(back.success).toBe(true);
      expect(back.data.startsWith(`${proto}://`)).toBe(true);
    });
  }
});

describe("isSingboxConfig", () => {
  test("合法 JSON 判为 sing-box", () => {
    expect(isSingboxConfig('{"outbounds":[]}')).toBe(true);
    expect(isSingboxConfig("  \n[ {} ]")).toBe(true);
  });
  test("flow-style YAML / 普通 YAML 不误判", () => {
    expect(isSingboxConfig("{proxies: [a, b]}")).toBe(false);
    expect(isSingboxConfig("proxies:\n  - name: a")).toBe(false);
    expect(isSingboxConfig("")).toBe(false);
  });
});
