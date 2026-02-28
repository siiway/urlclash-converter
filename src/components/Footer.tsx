import {
  Link,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  footer: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "24px",
    textAlign: "center",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
  },
});

export function Footer() {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <div>
          <Text>{t("github")}</Text>
          <Link
            href="https://github.com/siiway/urlclash-converter"
            target="_blank"
            rel="noopener noreferrer"
          >
            siiway/urlclash-converter
          </Link>
        </div>
        <Text size={200} style={{ opacity: 0.8 }}>
          {t("madeWith")}
          <Link
            href="https://github.com/siiway/urlclash-converter/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            {t("license")}
          </Link>
        </Text>
      </div>
    </footer>
  );
}
