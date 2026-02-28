import { Button, Input, makeStyles } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  urlBar: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  urlInput: {
    flex: 1,
    minWidth: 0,
  },
});

interface UrlBarProps {
  url: string;
  setUrl: (v: string) => void;
  onFetch: () => void;
  onCancel: () => void;
  fetching: boolean;
}

export function UrlBar({
  url,
  setUrl,
  onFetch,
  onCancel,
  fetching,
}: UrlBarProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.urlBar}>
      <Input
        className={styles.urlInput}
        placeholder={t("urlPlaceholder")}
        value={url}
        onChange={(_, d) => setUrl(d.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !fetching) onFetch();
        }}
      />
      <Button
        appearance="primary"
        size="small"
        disabled={fetching || !url.trim()}
        onClick={onFetch}
      >
        {fetching ? t("fetching") : t("fetchUrl")}
      </Button>
      <Button
        appearance="subtle"
        size="small"
        icon={<DismissRegular />}
        aria-label={t("cancel")}
        onClick={onCancel}
      />
    </div>
  );
}
