import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useDashboard } from "../components/shell";
import { Panel, Field, Message, SaveButton, useConfigForm } from "../components/shared";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { api } from "../lib/api";
export const Route = createFileRoute("/persona")({ component: Persona });
const split = (text: string) =>
  text
    .split(/[,，\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
function ListInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join("\n"));
  useEffect(() => {
    setText((current) =>
      JSON.stringify(split(current)) === JSON.stringify(value) ? current : value.join("\n"),
    );
  }, [value]);
  return (
    <Textarea
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(split(e.target.value));
      }}
    />
  );
}
function Persona() {
  const f = useConfigForm();
  const { snapshot: s, refresh } = useDashboard();
  const [text, setText] = useState(s!.persona.text);
  const [version, setVersion] = useState(s!.persona.version);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const c = f.config;
  const saveText = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.savePersona({ version, text });
      const next = await refresh();
      setVersion(next.persona.version);
      setSuccess("人设正文已保存，下一次唤醒时生效。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {f.controls}
      <div className="persona-layout">
        <Panel title="人设文档" className="persona-document">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void f.save({ persona: c.persona });
            }}
          >
            <div className="form-grid three">
              <Field label="角色名称">
                <Input
                  value={c.persona.name}
                  onChange={(e) => f.set("persona", { ...c.persona, name: e.target.value })}
                />
              </Field>
              <Field label="对用户的称呼">
                <Input
                  value={c.persona.ownerTitle}
                  onChange={(e) => f.set("persona", { ...c.persona, ownerTitle: e.target.value })}
                />
              </Field>
              <Field label="自我称呼">
                <Input
                  value={c.persona.selfClaim}
                  onChange={(e) => f.set("persona", { ...c.persona, selfClaim: e.target.value })}
                />
              </Field>
            </div>
            <div className="identity-save">
              <SaveButton busy={f.busy} label="保存称呼" />
            </div>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveText();
            }}
          >
            <Message error={error} success={success} />
            <Field label="人设内容（Markdown）">
              <Textarea
                aria-label="人设正文"
                className="persona-editor"
                value={text}
                maxLength={20000}
                onChange={(e) => {
                  setText(e.target.value);
                  setSuccess("");
                }}
              />
            </Field>
            <div className="editor-count">{text.length} / 20000</div>
            <div className="form-footer">
              <span>最多保存 20000 字，每次注入前 3000 字。</span>
              <SaveButton busy={busy} label="保存人设正文" />
            </div>
          </form>
        </Panel>
        <div className="persona-side">
          <Panel title="话题偏好" className="persona-preferences">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void f.save({ preferences: c.preferences });
              }}
            >
              <div className="form-grid">
                <Field label="喜欢的话题（每行一个）">
                  <ListInput
                    value={c.preferences.like}
                    onChange={(v) => f.set("preferences", { ...c.preferences, like: v })}
                  />
                </Field>
                <Field label="不喜欢的话题（每行一个）">
                  <ListInput
                    value={c.preferences.dislike}
                    onChange={(v) => f.set("preferences", { ...c.preferences, dislike: v })}
                  />
                </Field>
              </div>
              <details className="keywords-details">
                <summary>相关关键词</summary>
                <Field label="相关关键词（每行一个）">
                  <ListInput
                    value={c.preferences.keywords ?? []}
                    onChange={(v) => f.set("preferences", { ...c.preferences, keywords: v })}
                  />
                </Field>
              </details>
              <div className="form-footer">
                <SaveButton busy={f.busy} label="保存话题偏好" />
              </div>
            </form>
          </Panel>
          <details className="aliases-panel">
            <summary>
              常用别名
              <ChevronRight size={18} />
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void f.save({ aliases: c.aliases });
              }}
            >
              <Field label="别人叫她什么" hint="每行一个别名，或用逗号分隔。">
                <ListInput value={c.aliases} onChange={(v) => f.set("aliases", v)} />
              </Field>
              <div className="form-footer">
                <SaveButton busy={f.busy} label="保存别名" />
              </div>
            </form>
          </details>
        </div>
      </div>
    </>
  );
}
