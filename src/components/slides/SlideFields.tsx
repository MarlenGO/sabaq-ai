"use client";

import type { ReactNode } from "react";
import { limits, type Deck, type TopicPackage } from "@/types/topic-package";
import type { SlideKind } from "@/slides/layout";
import { resolveDeck } from "@/slides/deck";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icons";
import { DeleteButton, MoveButtons } from "@/components/ui/ItemButtons";
import { confirmDelete, fieldClass, moveItem, replaceAt } from "@/components/ui/field";
import { useT } from "@/i18n/client";

// Поля одного слайда в конструкторе. Слайды с содержанием темы (титул,
// определение, факты, примеры, термины) правят сам пакет темы, а заготовки —
// свой раздел в pkg.deck. Раскладка слайда при этом не меняется: только текст.

type Props = { kind: SlideKind; pkg: TopicPackage; onChange: (pkg: TopicPackage) => void };

/** Какой раздел pkg.deck правит слайд-заготовка */
const deckKey: Partial<Record<SlideKind, keyof Deck>> = {
  goals: "goals",
  plan: "plan",
  "text-image": "textImage",
  "big-image": "bigImage",
  compare: "compare",
  numbers: "numbers",
  table: "table",
  chart: "chart",
  think: "think",
  task: "task",
  reflection: "reflection",
  homework: "homework",
};

export function SlideFields({ kind, pkg, onChange }: Props) {
  const t = useT();
  const key = deckKey[kind];
  if (!key) return <ContentFields kind={kind} pkg={pkg} onChange={onChange} />;

  const changed = Boolean(pkg.deck?.[key]);
  const reset = () => {
    if (!window.confirm(t.deck.resetConfirm)) return;
    const deck = { ...pkg.deck };
    delete deck[key];
    onChange({ ...pkg, deck });
  };

  return (
    <div className="flex flex-col gap-5">
      <DeckFields kind={kind} pkg={pkg} onChange={onChange} />
      {changed && (
        <Button variant="plain" className="self-start" onClick={reset}>
          {t.deck.reset}
        </Button>
      )}
    </div>
  );
}

function ContentFields({ kind, pkg, onChange }: Props) {
  const t = useT();
  const set = (patch: Partial<TopicPackage>) => onChange({ ...pkg, ...patch });

  if (kind === "title") {
    return <TextField label={t.editor.topic} value={pkg.topic} onChange={(topic) => set({ topic })} />;
  }

  if (kind === "definition") {
    const formula = pkg.formula;
    return (
      <div className="flex flex-col gap-5">
        <TextField label={t.editor.definition} multiline value={pkg.definition} onChange={(definition) => set({ definition })} />
        {formula && (
          <TextField
            label={t.editor.formula}
            mono
            value={formula.expression}
            onChange={(expression) => set({ formula: { ...formula, expression } })}
          />
        )}
      </div>
    );
  }

  if (kind === "facts") {
    return (
      <ListField
        label={t.deck.facts}
        items={pkg.keyFacts}
        limits={limits.keyFacts}
        itemLabel={t.deck.factN}
        addLabel={t.deck.addFact}
        multiline
        onChange={(keyFacts) => set({ keyFacts })}
      />
    );
  }

  if (kind === "examples") {
    return (
      <ListField
        label={t.deck.kinds.examples}
        items={pkg.examples.map((example) => example.text)}
        limits={limits.examples}
        itemLabel={t.deck.exampleN}
        addLabel={t.deck.addExample}
        multiline
        onChange={(texts) =>
          set({
            // Поиск картинки нужен схеме; для нового примера ищем по теме урока
            examples: texts.map((text, i) => ({ imageQuery: pkg.examples[i]?.imageQuery ?? pkg.topic, text })),
          })
        }
        // При перестановке и удалении imageQuery должен оставаться при своём тексте
        onMove={(from, to) => set({ examples: moveItem(pkg.examples, from, to) })}
        onRemove={(i) => set({ examples: pkg.examples.filter((_, j) => j !== i) })}
      />
    );
  }

  // Термины: пары «термин — пояснение»
  const terms = pkg.terms;
  return (
    <Group label={t.editor.terms}>
      {terms.map((term, i) => (
        <div key={i} className="flex items-start gap-1 rounded-2xl bg-fill/60 p-2 sm:p-3">
          <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
            <input
              className={`${fieldClass} bg-surface font-semibold`}
              value={term.term}
              placeholder={t.editor.term}
              aria-label={t.editor.termN(i + 1)}
              onChange={(e) => set({ terms: replaceAt(terms, i, { ...term, term: e.target.value }) })}
            />
            <input
              className={`${fieldClass} bg-surface`}
              value={term.explanation}
              placeholder={t.editor.termExplanation}
              aria-label={t.editor.termExplanationN(i + 1)}
              onChange={(e) => set({ terms: replaceAt(terms, i, { ...term, explanation: e.target.value }) })}
            />
          </div>
          <MoveButtons index={i} count={terms.length} what={t.editor.termN(i + 1)} onMove={(to) => set({ terms: moveItem(terms, i, to) })} />
          {terms.length > limits.terms[0] && (
            <DeleteButton
              label={t.editor.deleteTerm(term.term)}
              onClick={() =>
                confirmDelete(t.common.confirmDelete(t.editor.termWhat(term.term))) &&
                set({ terms: terms.filter((_, j) => j !== i) })
              }
            />
          )}
        </div>
      ))}
      {terms.length < limits.terms[1] && (
        <AddButton label={t.editor.addTerm} onClick={() => set({ terms: [...terms, { term: "", explanation: "" }] })} />
      )}
    </Group>
  );
}

function DeckFields({ kind, pkg, onChange }: Props) {
  const t = useT();
  const d = resolveDeck(pkg);
  const set = <K extends keyof Deck>(key: K, value: Deck[K]) => onChange({ ...pkg, deck: { ...pkg.deck, [key]: value } });
  const heading = (value: string, save: (title: string) => void) => (
    <TextField label={t.deck.heading} value={value} onChange={save} />
  );
  const lines = (label: string, items: string[], save: (items: string[]) => void) => (
    <ListField label={label} items={items} limits={limits.deckLines} itemLabel={t.deck.pointN} addLabel={t.deck.addPoint} onChange={save} />
  );
  const imageNote = <p className="rounded-xl bg-fill px-4 py-3 text-subhead text-label-2">{t.deck.imageNote}</p>;

  switch (kind) {
    case "goals": {
      const g = d.goals;
      return (
        <div className="flex flex-col gap-5">
          {heading(g.title, (title) => set("goals", { ...g, title }))}
          {g.items.map((item, i) => (
            <Pair
              key={i}
              label={t.deck.goalN(i + 1)}
              first={{ label: t.deck.goalTitle, value: item.title }}
              second={{ label: t.deck.goalBody, value: item.body }}
              onChange={(title, body) => set("goals", { ...g, items: replaceAt(g.items, i, { title, body }) })}
            />
          ))}
        </div>
      );
    }
    case "plan": {
      const p = d.plan;
      return (
        <div className="flex flex-col gap-5">
          {heading(p.title, (title) => set("plan", { ...p, title }))}
          {p.steps.map((step, i) => (
            <Pair
              key={i}
              label={t.deck.stepN(i + 1)}
              first={{ label: t.deck.stepName, value: step.name }}
              second={{ label: t.deck.stepTime, value: step.time }}
              onChange={(name, time) => set("plan", { ...p, steps: replaceAt(p.steps, i, { name, time }) })}
            />
          ))}
        </div>
      );
    }
    case "text-image": {
      const ti = d.textImage;
      return (
        <div className="flex flex-col gap-5">
          {heading(ti.title, (title) => set("textImage", { ...ti, title }))}
          {lines(t.deck.points, ti.bullets, (bullets) => set("textImage", { ...ti, bullets }))}
          {imageNote}
        </div>
      );
    }
    case "big-image":
      return (
        <div className="flex flex-col gap-5">
          <TextField label={t.deck.caption} value={d.bigImage.caption} onChange={(caption) => set("bigImage", { caption })} />
          {imageNote}
        </div>
      );
    case "compare": {
      const c = d.compare;
      return (
        <div className="flex flex-col gap-5">
          {heading(c.title, (title) => set("compare", { ...c, title }))}
          <div className="grid gap-5 md:grid-cols-2">
            {(["left", "right"] as const).map((side) => {
              const linesKey = side === "left" ? "leftLines" : "rightLines";
              return (
                <div key={side} className="flex flex-col gap-3 rounded-2xl bg-fill/60 p-3">
                  <TextField label={t.deck[side]} value={c[side]} onChange={(value) => set("compare", { ...c, [side]: value })} />
                  {lines(t.deck.points, c[linesKey], (items) => set("compare", { ...c, [linesKey]: items }))}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case "numbers": {
      const n = d.numbers;
      return (
        <div className="flex flex-col gap-5">
          {heading(n.title, (title) => set("numbers", { ...n, title }))}
          {n.items.map((item, i) => (
            <Pair
              key={i}
              label={t.deck.numberN(i + 1)}
              first={{ label: t.deck.number, value: item.value }}
              second={{ label: t.deck.numberCaption, value: item.caption }}
              onChange={(value, caption) => set("numbers", { ...n, items: replaceAt(n.items, i, { value, caption }) })}
            />
          ))}
        </div>
      );
    }
    case "table":
      return <TableFields table={d.table} onChange={(table) => set("table", table)} />;
    case "chart":
      return <ChartFields chart={d.chart} onChange={(chart) => set("chart", chart)} />;
    case "think": {
      const th = d.think;
      return (
        <div className="flex flex-col gap-5">
          {heading(th.title, (title) => set("think", { ...th, title }))}
          <TextField label={t.deck.question} multiline value={th.question} onChange={(question) => set("think", { ...th, question })} />
          <TextField label={t.deck.hintLine} value={th.hint} onChange={(hint) => set("think", { ...th, hint })} />
        </div>
      );
    }
    case "task": {
      const tk = d.task;
      return (
        <div className="flex flex-col gap-5">
          {heading(tk.title, (title) => set("task", { ...tk, title }))}
          <TextField label={t.deck.taskName} value={tk.name} onChange={(name) => set("task", { ...tk, name })} />
          {lines(t.deck.taskLines, tk.lines, (items) => set("task", { ...tk, lines: items }))}
          <TextField
            label={t.deck.criteriaTitle}
            value={tk.criteriaTitle}
            onChange={(criteriaTitle) => set("task", { ...tk, criteriaTitle })}
          />
          <Group label={t.deck.criteria}>
            {tk.criteria.map((item, i) => (
              <input
                key={i}
                className={fieldClass}
                value={item}
                aria-label={t.deck.pointN(i + 1)}
                onChange={(e) => set("task", { ...tk, criteria: replaceAt(tk.criteria, i, e.target.value) })}
              />
            ))}
          </Group>
        </div>
      );
    }
    case "reflection": {
      const r = d.reflection;
      return (
        <div className="flex flex-col gap-5">
          {heading(r.title, (title) => set("reflection", { ...r, title }))}
          {r.items.map((item, i) => (
            <TextField
              key={i}
              label={t.deck.phraseN(i + 1)}
              value={item}
              onChange={(value) => set("reflection", { ...r, items: replaceAt(r.items, i, value) })}
            />
          ))}
        </div>
      );
    }
    case "homework": {
      const h = d.homework;
      return (
        <div className="flex flex-col gap-5">
          {heading(h.title, (title) => set("homework", { ...h, title }))}
          {lines(t.deck.homework, h.lines, (items) => set("homework", { ...h, lines: items }))}
          <TextField label={t.deck.thanks} value={h.thanks} onChange={(thanks) => set("homework", { ...h, thanks })} />
        </div>
      );
    }
    default:
      return null;
  }
}

// Таблица: строка заголовков и строки значений; столбцы и строки можно добавлять
function TableFields({ table, onChange }: { table: Deck["table"]; onChange: (table: Deck["table"]) => void }) {
  const t = useT();
  const { columns, rows } = table;
  const setCell = (r: number, c: number, value: string) =>
    onChange({ ...table, rows: replaceAt(rows, r, replaceAt(columns.map((_, i) => rows[r][i] ?? ""), c, value)) });

  return (
    <div className="flex flex-col gap-5">
      <TextField label={t.deck.heading} value={table.title} onChange={(title) => onChange({ ...table, title })} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-separate border-spacing-1.5">
          <thead>
            <tr>
              {columns.map((column, c) => (
                <th key={c} className="align-bottom">
                  <div className="flex items-center gap-0.5">
                    <input
                      className={`${fieldClass} bg-accent/12 px-3 font-semibold`}
                      value={column}
                      aria-label={t.deck.columnN(c + 1)}
                      onChange={(e) => onChange({ ...table, columns: replaceAt(columns, c, e.target.value) })}
                    />
                    {columns.length > limits.tableColumns[0] && (
                      <DeleteButton
                        label={t.deck.deleteColumn(c + 1)}
                        onClick={() =>
                          confirmDelete(t.common.confirmDelete(t.deck.columnWhat(c + 1))) &&
                          onChange({
                            columns: columns.filter((_, i) => i !== c),
                            rows: rows.map((row) => row.filter((_, i) => i !== c)),
                            title: table.title,
                          })
                        }
                      />
                    )}
                  </div>
                </th>
              ))}
              <th className="w-11" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {columns.map((_, c) => (
                  <td key={c}>
                    <input
                      className={`${fieldClass} px-3`}
                      value={row[c] ?? ""}
                      aria-label={`${t.deck.rowN(r + 1)}, ${t.deck.columnN(c + 1)}`}
                      onChange={(e) => setCell(r, c, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  {rows.length > limits.tableRows[0] && (
                    <DeleteButton
                      label={t.deck.deleteRow(r + 1)}
                      onClick={() =>
                        confirmDelete(t.common.confirmDelete(t.deck.rowWhat(r + 1))) &&
                        onChange({ ...table, rows: rows.filter((_, i) => i !== r) })
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.length < limits.tableRows[1] && (
          <AddButton label={t.deck.addRow} onClick={() => onChange({ ...table, rows: [...rows, columns.map(() => "")] })} />
        )}
        {columns.length < limits.tableColumns[1] && (
          <AddButton
            label={t.deck.addColumn}
            onClick={() => onChange({ ...table, columns: [...columns, ""], rows: rows.map((row) => [...row, ""]) })}
          />
        )}
      </div>
    </div>
  );
}

// Диаграмма: подпись и число для каждого столбика
function ChartFields({ chart, onChange }: { chart: Deck["chart"]; onChange: (chart: Deck["chart"]) => void }) {
  const t = useT();
  const { items } = chart;
  return (
    <div className="flex flex-col gap-5">
      <TextField label={t.deck.heading} value={chart.title} onChange={(title) => onChange({ ...chart, title })} />
      <Group label={t.deck.bars}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              className={`${fieldClass} flex-[2]`}
              value={item.label}
              placeholder={t.deck.barLabel}
              aria-label={`${t.deck.barN(i + 1)}: ${t.deck.barLabel}`}
              onChange={(e) => onChange({ ...chart, items: replaceAt(items, i, { ...item, label: e.target.value }) })}
            />
            <input
              className={`${fieldClass} min-w-20 flex-1 tabular-nums`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={item.value}
              placeholder={t.deck.barValue}
              aria-label={`${t.deck.barN(i + 1)}: ${t.deck.barValue}`}
              onChange={(e) =>
                onChange({ ...chart, items: replaceAt(items, i, { ...item, value: Math.max(0, Number(e.target.value) || 0) }) })
              }
            />
            <MoveButtons index={i} count={items.length} what={t.deck.barN(i + 1)} onMove={(to) => onChange({ ...chart, items: moveItem(items, i, to) })} />
            {items.length > limits.chartItems[0] && (
              <DeleteButton
                label={`${t.deck.barN(i + 1)}: ${t.common.delete}`}
                onClick={() => onChange({ ...chart, items: items.filter((_, j) => j !== i) })}
              />
            )}
          </div>
        ))}
        {items.length < limits.chartItems[1] && (
          <AddButton label={t.deck.addBar} onClick={() => onChange({ ...chart, items: [...items, { label: "", value: 0 }] })} />
        )}
      </Group>
    </div>
  );
}

// ——— Простые поля ———

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-subhead font-semibold">{label}</legend>
      {children}
    </fieldset>
  );
}

function TextField(props: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; mono?: boolean }) {
  const { label, value, onChange, multiline, mono } = props;
  return (
    <label className="flex flex-col gap-2">
      <span className="text-subhead font-semibold">{label}</span>
      {multiline ? (
        <textarea className={`${fieldClass} min-h-24 resize-y`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`${fieldClass} ${mono ? "font-mono" : ""}`} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/** Две связанные строки: название + описание, этап + время, число + пояснение */
function Pair(props: {
  label: string;
  first: { label: string; value: string };
  second: { label: string; value: string };
  onChange: (first: string, second: string) => void;
}) {
  const { label, first, second, onChange } = props;
  return (
    <Group label={label}>
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <input
          className={`${fieldClass} font-semibold`}
          value={first.value}
          placeholder={first.label}
          aria-label={`${label}: ${first.label}`}
          onChange={(e) => onChange(e.target.value, second.value)}
        />
        <input
          className={fieldClass}
          value={second.value}
          placeholder={second.label}
          aria-label={`${label}: ${second.label}`}
          onChange={(e) => onChange(first.value, e.target.value)}
        />
      </div>
    </Group>
  );
}

function ListField(props: {
  label: string;
  items: string[];
  limits: readonly [number, number];
  itemLabel: (n: number) => string;
  addLabel: string;
  multiline?: boolean;
  onChange: (items: string[]) => void;
  onMove?: (from: number, to: number) => void;
  onRemove?: (index: number) => void;
}) {
  const { label, items, itemLabel, addLabel, multiline, onChange } = props;
  const [min, max] = props.limits;
  const t = useT();
  const move = props.onMove ?? ((from: number, to: number) => onChange(moveItem(items, from, to)));
  const remove = (i: number) => {
    const value = items[i].trim();
    if (value && !confirmDelete(t.common.confirmDelete(`«${value.length > 40 ? `${value.slice(0, 40)}…` : value}»`))) return;
    if (props.onRemove) props.onRemove(i);
    else onChange(items.filter((_, j) => j !== i));
  };

  return (
    <Group label={label}>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          {multiline ? (
            <textarea
              className={`${fieldClass} min-h-20 resize-y`}
              value={item}
              aria-label={itemLabel(i + 1)}
              onChange={(e) => onChange(replaceAt(items, i, e.target.value))}
            />
          ) : (
            <input
              className={fieldClass}
              value={item}
              aria-label={itemLabel(i + 1)}
              onChange={(e) => onChange(replaceAt(items, i, e.target.value))}
            />
          )}
          <MoveButtons index={i} count={items.length} what={itemLabel(i + 1)} onMove={(to) => move(i, to)} />
          {items.length > min && <DeleteButton label={`${itemLabel(i + 1)}: ${t.common.delete}`} onClick={() => remove(i)} />}
        </div>
      ))}
      {items.length < max && <AddButton label={addLabel} onClick={() => onChange([...items, ""])} />}
    </Group>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="tinted" className="self-start" onClick={onClick}>
      <PlusIcon />
      {label}
    </Button>
  );
}
