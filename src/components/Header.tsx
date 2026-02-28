import {
  Button,
  Title1,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  WeatherMoonRegular,
  WeatherSunnyRegular,
  LocalLanguageRegular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  header: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: "24px",
    boxShadow: tokens.shadow8,
    display: "flex",
    justifyContent: "center",
  },
  headerContent: {
    maxWidth: "1200px",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitleArea: {
    display: "flex",
    flexDirection: "column",
  },
  themeButton: {
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    ":active": {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
  },
});

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export function Header({ isDark, toggleTheme }: HeaderProps) {
  const styles = useStyles();
  const { t, i18n } = useTranslation();

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerTitleArea}>
          <Title1>{t("title")}</Title1>
          <Text>{t("subtitle")}</Text>
        </div>
        <div>
          <Button
            appearance="subtle"
            icon={<LocalLanguageRegular />}
            className={styles.themeButton}
            aria-label={t("language")}
            onClick={() =>
              i18n.changeLanguage(i18n.language.startsWith("zh") ? "en" : "zh")
            }
          />
          <Button
            appearance="subtle"
            icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
            onClick={toggleTheme}
            className={styles.themeButton}
            aria-label={t("themeToggle")}
          />
        </div>
      </div>
    </div>
  );
}
