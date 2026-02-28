import {
  Switch,
  SwitchOnChangeData,
  Text,
  tokens,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";

interface EngineSwitcherProps {
  usePyYaml: boolean;
  pyLoading: boolean;
  onChange: (checked: boolean) => void;
}

export function EngineSwitcher({
  usePyYaml,
  pyLoading,
  onChange,
}: EngineSwitcherProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: tokens.colorNeutralBackground3,
        padding: "12px 16px",
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        marginBottom: "16px",
        fontSize: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: usePyYaml ? "#16a34a" : "#71717a",
            boxShadow: usePyYaml ? "0 0 10px rgba(22,163,74,0.6)" : "none",
            transition: "all 0.3s ease",
            flexShrink: 0,
          }}
        />
        <div>
          <Text weight="semibold" block>
            {usePyYaml ? t("pyYamlEngine") : t("jsYamlEngine")}
          </Text>
          <Text size={200} style={{ opacity: 0.8 }}>
            {usePyYaml ? t("pyYamlDesc") : t("jsYamlDesc")}
            {pyLoading && <> · {t("switchingEngine")}</>}
          </Text>
        </div>
      </div>

      <Switch
        checked={usePyYaml}
        onChange={(_ev, data: SwitchOnChangeData) => onChange(data.checked)}
        label={
          <Text weight="medium">
            {usePyYaml ? t("usingPyYaml") : t("usingJsYaml")}
          </Text>
        }
      />
    </div>
  );
}
