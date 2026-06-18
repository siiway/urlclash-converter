import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { linkToClash, clashToLink } from "./converter";
import { linkToSingbox, singboxToLink, isSingboxConfig } from "./singbox";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ClashColumn } from "./components/ClashColumn";
import { LinksColumn } from "./components/LinksColumn";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    transition: "background-color 0.3s ease, color 0.3s ease",
  },
  main: {
    flex: 1,
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    padding: "32px 24px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

function AppContent({
  isDark,
  toggleTheme,
}: {
  isDark: boolean;
  toggleTheme: () => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [clashInput, setClashInput] = useState("");
  const [linksInput, setLinksInput] = useState("");
  const [configType, setConfigType] = useState<"clash" | "singbox">("clash");

  useEffect(() => {
    document.title = t("title");
  }, [t]);

  // 配置框内容变化时即时探测类型，使 UI（标签/占位符/控件）与实际内容同步，
  // 而非等到点击转换按钮才更新；空内容时保留当前（用户手动选择的）类型。
  const handleClashChange = (v: string) => {
    setClashInput(v);
    if (v.trim()) setConfigType(isSingboxConfig(v) ? "singbox" : "clash");
  };

  const convertToLinks = async () => {
    // config -> link：通过 JSON / YAML 自动判定配置类型
    if (isSingboxConfig(clashInput)) {
      setConfigType("singbox");
      const result = singboxToLink(clashInput);
      setLinksInput(result.data);
    } else {
      setConfigType("clash");
      const result = await clashToLink(clashInput);
      setLinksInput(result.data);
    }
  };

  const convertToClash = (outputMode: string) => {
    const links = linksInput.split("\n").filter((line) => line.trim() !== "");
    const result =
      configType === "singbox" ? linkToSingbox(links) : linkToClash(links, outputMode as any);
    setClashInput(result.data);
  };

  return (
    <div className={styles.container}>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <div className={styles.main}>
        <ClashColumn
          value={clashInput}
          onChange={handleClashChange}
          onConvert={convertToLinks}
          configType={configType}
          onConfigTypeChange={setConfigType}
        />
        <LinksColumn
          value={linksInput}
          onChange={setLinksInput}
          clashValue={clashInput}
          onConvert={convertToClash}
          configType={configType}
        />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  const systemPrefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDark, setIsDark] = useState(systemPrefersDark);

  return (
    <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
      <AppContent isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
    </FluentProvider>
  );
}
