import { useTranslation } from "react-i18next";

export function useIoActions() {
  const { t } = useTranslation();

  const handleCopy = async (
    text: string,
    buttonSetter: (text: string) => void,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      buttonSetter(t("copied"));
      setTimeout(() => buttonSetter(t("copy")), 800);
    } catch {
      alert(t("copy-failed"));
    }
  };

  const handlePaste = async (
    setter: (val: string) => void,
    buttonSetter: (text: string) => void,
  ) => {
    try {
      const text = await navigator.clipboard.readText();
      setter(text);
      buttonSetter(t("pasted"));
      setTimeout(() => buttonSetter(t("paste")), 800);
    } catch {
      alert(t("paste-failed"));
    }
  };

  const handleLoadFile = (setter: (val: string) => void) => {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = ".yaml,.yml,.txt,.conf,.list";
    el.onchange = () => {
      const file = el.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsText(file, "utf-8");
    };
    el.click();
  };

  const handleFetchUrl = async (
    url: string,
    setter: (val: string) => void,
    setFetching: (v: boolean) => void,
    setShow: (v: boolean) => void,
    setUrl: (v: string) => void,
  ) => {
    if (!url.trim()) return;
    setFetching(true);
    try {
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setter(await res.text());
      setShow(false);
      setUrl("");
    } catch (err: any) {
      alert(`${t("fetchFailed")}: ${err.message || err}`);
    } finally {
      setFetching(false);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    if (!content.trim()) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    handleCopy,
    handlePaste,
    handleLoadFile,
    handleFetchUrl,
    handleDownload,
  };
}
