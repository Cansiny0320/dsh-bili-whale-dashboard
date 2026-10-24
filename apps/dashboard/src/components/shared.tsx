import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import type { Config, ConfigPatch } from "@whale/core/schema";
import { api } from "../lib/api";
import { useDashboard } from "./shell";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Panel({
  title,
  description,
  children,
  className = "",
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        required
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      />
    </Field>
  );
}
export function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <div>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </div>
      <Switch aria-label={label} checked={value} onCheckedChange={onChange} />
    </label>
  );
}
export function Message({ error, success }: { error?: string; success?: string }) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="notice success" role="status">
          <Check size={16} />
          {success}
        </div>
      )}
    </>
  );
}
export function useConfigForm() {
  const { snapshot, refresh } = useDashboard();
  const [config, setConfig] = useState<Config>(() => structuredClone(snapshot!.settings.config));
  const [version, setVersion] = useState(snapshot!.settings.version);
  const baseline = useRef(snapshot!.settings.config);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const set = <K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setSuccess("");
  };
  const save = async (patch: ConfigPatch) => {
    const submitted = structuredClone(config);
    const original = baseline.current;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.saveSettings({ version, patch, acknowledgeDefaults: ack });
      const s = await refresh();
      setVersion(s.settings.version);
      setConfig((current) => {
        const next = structuredClone(s.settings.config);
        for (const key of Object.keys(current)) {
          const editedDuringSave = JSON.stringify(current[key]) !== JSON.stringify(submitted[key]);
          const unsavedGroup =
            !Object.hasOwn(patch, key) &&
            JSON.stringify(current[key]) !== JSON.stringify(original[key]);
          if (editedDuringSave || unsavedGroup) next[key] = current[key];
        }
        return next;
      });
      baseline.current = s.settings.config;
      setSuccess("已保存，下次执行时使用这些设置。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };
  const reload = () => {
    baseline.current = snapshot!.settings.config;
    setConfig(structuredClone(snapshot!.settings.config));
    setVersion(snapshot!.settings.version);
    setError("");
    setSuccess("");
  };
  const controls = (
    <>
      <Message error={error} success={success} />
      {snapshot!.settings.issues.some((i) => i.code === "DEFAULTS_DIFFER") && (
        <div className="notice warning">
          <label>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />{" "}
            原版默认值存在差异。我确认写入：评论监听{config.listen.comment ? "开" : "关"}、私信监听
            {config.listen.dm ? "开" : "关"}、同人限制{config.listen.oncePerPerson ? "开" : "关"}。
          </label>
        </div>
      )}
      {snapshot!.settings.version !== version && (
        <div className="notice warning">
          配置版本已变化。
          <Button variant="outline" type="button" onClick={reload}>
            载入最新配置（放弃本页编辑）
          </Button>
        </div>
      )}
    </>
  );
  return { config, set, save, busy, controls };
}
export function SaveButton({ busy, label = "保存设置" }: { busy: boolean; label?: string }) {
  return (
    <Button type="submit" disabled={busy}>
      <Save size={16} />
      {busy ? "正在保存…" : label}
    </Button>
  );
}
export function dateTime(at: string) {
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? at
    : d.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}
