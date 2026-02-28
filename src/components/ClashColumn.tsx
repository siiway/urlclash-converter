import { useState } from "react";
import {
  Button,
  Textarea,
  Title3,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  ClipboardPasteRegular,
  CopyRegular,
  ArrowRightRegular,
  FolderOpenRegular,
  GlobeRegular,
  ArrowDownloadRegular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useIoActions } from "../hooks/useIoActions";
import { UrlBar } from "./UrlBar";

const useStyles = makeStyles({
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controls: {
    display: "flex",
    gap: "8px",
  },
  ioControls: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  textarea: {
    height: "400px",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontFamily: "monospace",
  },
  actionButton: {
    marginTop: "8px",
  },
});

interface ClashColumnProps {
  value: string;
  onChange: (v: string) => void;
  onConvert: () => void;
}

export function ClashColumn({ value, onChange, onConvert }: ClashColumnProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const {
    handleCopy,
    handlePaste,
    handleLoadFile,
    handleFetchUrl,
    handleDownload,
  } = useIoActions();

  const [copyText, setCopyText] = useState(t("copy"));
  const [pasteText, setPasteText] = useState(t("paste"));
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <Title3>{t("clashConfig")}</Title3>
        <div className={styles.controls}>
          <Button
            icon={<ClipboardPasteRegular />}
            onClick={() => handlePaste(onChange, setPasteText)}
          >
            {pasteText}
          </Button>
          <Button
            icon={<CopyRegular />}
            appearance="primary"
            onClick={() => handleCopy(value, setCopyText)}
          >
            {copyText}
          </Button>
        </div>
      </div>

      <div className={styles.ioControls}>
        <Button
          size="small"
          appearance="subtle"
          icon={<FolderOpenRegular />}
          onClick={() => handleLoadFile(onChange)}
        >
          {t("loadFile")}
        </Button>
        <Button
          size="small"
          appearance="subtle"
          icon={<GlobeRegular />}
          onClick={() => setShowUrl((v) => !v)}
        >
          {t("loadUrl")}
        </Button>
        <Button
          size="small"
          appearance="subtle"
          icon={<ArrowDownloadRegular />}
          disabled={!value.trim()}
          onClick={() => handleDownload(value, "clash-config.yaml")}
        >
          {t("download")}
        </Button>
      </div>

      {showUrl && (
        <UrlBar
          url={url}
          setUrl={setUrl}
          fetching={fetching}
          onFetch={() =>
            handleFetchUrl(url, onChange, setFetching, setShowUrl, setUrl)
          }
          onCancel={() => {
            setShowUrl(false);
            setUrl("");
          }}
        />
      )}

      <Textarea
        className={styles.textarea}
        value={value}
        onChange={(e, data) => onChange(data.value)}
        placeholder={t("clashPlaceholder")}
        resize="none"
      />

      <Button
        className={styles.actionButton}
        appearance="primary"
        size="large"
        icon={<ArrowRightRegular />}
        iconPosition="after"
        onClick={onConvert}
      >
        {t("clashToLink")}
      </Button>
    </div>
  );
}
