import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Moon } from "lucide-react";
import { Panel, Field, NumberField, Toggle, SaveButton, useConfigForm } from "../components/shared";
import { useDashboard } from "../components/shell";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
export const Route = createFileRoute("/schedule")({ component: Schedule });
function Schedule() {
  const f = useConfigForm();
  const { snapshot: s } = useDashboard();
  const c = f.config;
  const n = c.night;
  const l = c.listen;
  const setListen = (patch: Partial<typeof l>) => f.set("listen", { ...l, ...patch });
  const setNight = (patch: Partial<typeof n>) => f.set("night", { ...n, ...patch });
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void f.save({ night: n, listen: l });
        }}
      >
        {f.controls}
        {s?.settings.issues
          .filter((i) => i.code === "LEGACY_SCHEDULE")
          .map((i) => (
            <div key={i.code} className="notice warning">
              {i.message}
            </div>
          ))}
        <Panel
          title="她什么时候醒来"
          description="每个窗口内随机安排醒来的机会；结束早于开始时，跨到次日。"
          action={<Moon size={19} className="blue" />}
        >
          <div className="window-head">
            <span>开始时间</span>
            <span>结束时间</span>
            <span>醒来次数</span>
            <span />
          </div>
          {n.windows.map((w, i) => (
            <div className="window-row" key={i}>
              <Input
                aria-label={`窗口 ${i + 1} 开始时间`}
                placeholder="20:00"
                value={w.start}
                onChange={(e) =>
                  setNight({
                    windows: n.windows.map((a, j) =>
                      j === i ? { ...a, start: e.target.value } : a,
                    ),
                  })
                }
              />
              <Input
                aria-label={`窗口 ${i + 1} 结束时间`}
                placeholder="24:00"
                value={w.end}
                onChange={(e) =>
                  setNight({
                    windows: n.windows.map((a, j) => (j === i ? { ...a, end: e.target.value } : a)),
                  })
                }
              />
              <Input
                aria-label={`窗口 ${i + 1} 醒来次数`}
                type="number"
                min={0}
                max={12}
                required
                value={w.wakes}
                onChange={(e) =>
                  setNight({
                    windows: n.windows.map((a, j) =>
                      j === i ? { ...a, wakes: e.target.valueAsNumber } : a,
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`删除窗口 ${i + 1}`}
                disabled={n.windows.length === 1}
                onClick={() => setNight({ windows: n.windows.filter((_, j) => j !== i) })}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <div className="window-footer">
            <Button
              type="button"
              variant="outline"
              disabled={n.windows.length >= 12}
              onClick={() =>
                setNight({ windows: [...n.windows, { start: "20:00", end: "24:00", wakes: 1 }] })
              }
            >
              <Plus size={15} />
              添加时段
            </Button>
            <span>
              每日最多{" "}
              {Math.min(
                12,
                n.windows.reduce((a, w) => a + w.wakes, 0),
              )}{" "}
              次 · 按窗口次数合计，上限 12
            </span>
          </div>
          <div className="form-grid three divider">
            <NumberField
              label="休息概率"
              hint="0–0.95；跳过本次看视频的概率"
              value={n.skipChance}
              min={0}
              max={0.95}
              step={0.05}
              onChange={(v) => setNight({ skipChance: v })}
            />
            <NumberField
              label="最短间隔（分钟）"
              value={n.minGapMin}
              min={1}
              max={1440}
              onChange={(v) => setNight({ minGapMin: v })}
            />
            <NumberField
              label="每次最多看几个视频"
              value={n.maxVideos}
              min={1}
              max={20}
              onChange={(v) => setNight({ maxVideos: v })}
            />
          </div>
        </Panel>
        <Panel title="评论监听" description="自动发现评论后生成回复草稿，等待你批准。">
          <Toggle label="监听评论" value={l.comment} onChange={(v) => setListen({ comment: v })} />
          <Toggle
            label="只监听主人的评论"
            value={l.onlyOwner ?? false}
            onChange={(v) => setListen({ onlyOwner: v })}
          />
          <Toggle
            label="全天监听评论"
            hint="关闭时跟随作息窗口"
            value={l.allDay}
            onChange={(v) => setListen({ allDay: v })}
          />
          <Toggle
            label="限制同一人重复回复"
            value={l.oncePerPerson}
            onChange={(v) => setListen({ oncePerPerson: v })}
          />
          <div className="form-grid divider">
            <Field label="评论范围">
              <select
                value={l.scope}
                onChange={(e) => setListen({ scope: e.target.value as typeof l.scope })}
              >
                <option value="both">回复与 @ 提及</option>
                <option value="reply">仅回复</option>
              </select>
            </Field>
            <NumberField
              label="轮询间隔（秒）"
              min={15}
              max={86400}
              value={l.commentIntervalSec}
              onChange={(v) => setListen({ commentIntervalSec: v })}
            />
          </div>
        </Panel>
        <Panel
          title="私信与直播"
          description="私信监听独立于作息窗口，直播使用独立房间和回复范围。"
        >
          <Toggle label="监听私信" value={l.dm} onChange={(v) => setListen({ dm: v })} />
          <NumberField
            label="私信轮询间隔（秒）"
            value={l.dmIntervalSec}
            min={15}
            max={86400}
            onChange={(v) => setListen({ dmIntervalSec: v })}
          />
          <Toggle label="监听直播" value={l.live} onChange={(v) => setListen({ live: v })} />
          <div className="form-grid">
            <Field label="直播间 ID">
              <Input
                inputMode="numeric"
                value={l.liveRoom}
                onChange={(e) => setListen({ liveRoom: e.target.value })}
              />
            </Field>
            <Field label="直播回复范围">
              <select
                value={l.liveScope}
                onChange={(e) => setListen({ liveScope: e.target.value as typeof l.liveScope })}
              >
                <option value="owner">仅主人</option>
                <option value="mention">被提及</option>
              </select>
            </Field>
          </div>
          <p className="field-note">
            轮询失败时指数退避，最长等待为基础间隔与 900 秒中的较大值；空收件箱不算失败。
          </p>
          <div className="form-footer">
            <span>保存后由原版更新调度计划</span>
            <SaveButton busy={f.busy} />
          </div>
        </Panel>
      </form>
    </>
  );
}
