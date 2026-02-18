import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodidePromise: Promise<any> | null = null;
let isPyodideLoading = false;

export async function getPyodide() {
  if (pyodidePromise) return pyodidePromise;
  if (isPyodideLoading) {
    // 防止重复加载
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (pyodidePromise) {
          clearInterval(check);
          resolve(pyodidePromise);
        }
      }, 100);
    });
  }

  isPyodideLoading = true;
  console.log("Pyodide 加载中（首次约 2-5 秒）...");

  try {
    const py = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });

    // 步骤1: 加载 micropip（Pyodide 内置）
    await py.loadPackage("micropip");
    const micropip = py.pyimport("micropip");

    // 步骤2: 用自定义镜像安装 PyYAML（加速下载）
    console.log("通过镜像安装 PyYAML...");
    await micropip.install("PyYAML", {
      index_url: "https://pypi-mirror.siiway.top/pypi/simple/", // 你的自定义镜像
      trusted_host: "pypi-mirror.siiway.top", // 避免 SSL 警告
    });

    console.log("PyYAML 安装完成！");

    pyodidePromise = Promise.resolve(py);
    isPyodideLoading = false;
    return py;
  } catch (err: any) {
    console.error("Pyodide + PyYAML 加载失败:", err);
    isPyodideLoading = false;
    throw new Error(`PyYAML 加载失败：${err.message}`);
  }
}

/** 解析 YAML（使用 PyYAML，100% 兼容） */
export async function parsePyYaml(yamlText: string): Promise<any> {
  try {
    const py = await getPyodide();

    // Strip control chars except tab (\x09), LF (\x0A), CR (\x0D) — newlines are required for YAML structure
    const safeText = yamlText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

    // Pass YAML via globals.set to avoid string-interpolation injection issues
    py.globals.set("_yaml_input", safeText);
    const result = await py.runPythonAsync(`
import yaml
yaml.safe_load(_yaml_input) or {}
`);

    return result?.toJs({ dict_converter: Object.fromEntries }) || {};
  } catch (err: any) {
    console.error("PyYAML 解析错误:", err);
    throw err;
  }
}
