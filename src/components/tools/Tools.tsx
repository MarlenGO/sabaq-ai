"use client";

import { useMemo, useRef, useState } from "react";
import {
  constants,
  conversions,
  sections,
  simulationImage,
  simulations,
  simulationUrl,
  unitGroups,
  type Simulation,
} from "@/data/physics";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ExpandIcon, SearchIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { fieldClass } from "@/components/ui/field";
import { useLocale, useT } from "@/i18n/client";

// «Құралдар» — инструменты учителя физики: виртуальные опыты PhET,
// справочник (формулы, постоянные, перевод единиц) и конвертер файлов.

type Tab = "phet" | "reference" | "convert";

export function Tools({ initialTab }: { initialTab: Tab }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        size="lg"
        ariaLabel={t.tools.title}
        value={tab}
        onChange={setTab}
        options={[
          { value: "phet", label: t.tools.phet },
          { value: "reference", label: t.tools.reference },
          { value: "convert", label: t.tools.convert },
        ]}
      />
      {tab === "phet" && <Phet />}
      {tab === "reference" && <Reference />}
      {tab === "convert" && <Convert />}
    </div>
  );
}

// ——— Опыты PhET ———

function Phet() {
  const t = useT();
  const language = useLocale();
  const [section, setSection] = useState("all");
  const [open, setOpen] = useState<Simulation | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  if (open) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="plain" onClick={() => setOpen(null)} className="-ml-3">
            <ArrowLeftIcon />
            {t.tools.allSims}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="tinted" onClick={() => frame.current?.requestFullscreen?.()}>
              <ExpandIcon />
              {t.games_ui.fullscreen}
            </Button>
            <a href={simulationUrl(open.id, language)} target="_blank" rel="noopener noreferrer" className={buttonClass("tinted")}>
              {t.tools.newTab}
            </a>
          </div>
        </div>
        <h2 className="text-title2 font-bold">{open.name[language]}</h2>
        <div ref={frame} className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-card">
          <iframe
            src={simulationUrl(open.id, language)}
            title={open.name[language]}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
        <p className="text-footnote text-label-2">{t.tools.phetCredit}</p>
      </div>
    );
  }

  const shown = section === "all" ? simulations : simulations.filter((s) => s.section === section);
  const used = sections.filter((sec) => simulations.some((s) => s.section === sec.id));
  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-label-2">{t.tools.phetIntro}</p>
      <div role="radiogroup" aria-label={t.tools.section} className="flex flex-wrap gap-2">
        {[{ id: "all", name: { kk: t.tools.all, ru: t.tools.all } }, ...used].map((sec) => (
          <button
            key={sec.id}
            type="button"
            role="radio"
            aria-checked={section === sec.id}
            onClick={() => setSection(sec.id)}
            className={`h-10 rounded-full px-4 text-subhead font-semibold transition ${
              section === sec.id ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
            }`}
          >
            {sec.name[language]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((sim) => (
          <button key={sim.id} type="button" onClick={() => setOpen(sim)} className="group text-left">
            <Card className="h-full overflow-hidden transition group-hover:ring-2 group-hover:ring-accent/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- превью с сайта PhET */}
              <img src={simulationImage(sim.id)} alt="" loading="lazy" className="aspect-[1.6] w-full bg-fill object-cover" />
              <div className="p-4">
                <p className="text-body font-semibold">{sim.name[language]}</p>
                <p className="mt-0.5 text-footnote text-label-2">{t.tools.grades(sim.grades)}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

// ——— Справочник ———

function Reference() {
  const t = useT();
  const language = useLocale();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const found = useMemo(
    () =>
      sections
        .map((sec) => ({
          ...sec,
          formulas: needle
            ? sec.formulas.filter((f) =>
                [f.expr, f.name.kk, f.name.ru, ...f.vars.flatMap((v) => [v.name.kk, v.name.ru])].some((text) =>
                  text.toLowerCase().includes(needle),
                ),
              )
            : sec.formulas,
        }))
        .filter((sec) => sec.formulas.length > 0),
    [needle],
  );

  return (
    <div className="flex flex-col gap-8">
      <UnitConverter />

      <section className="flex flex-col gap-4">
        <h2 className="text-title2 font-bold">{t.tools.formulas}</h2>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-2" />
          <input
            className={`${fieldClass} pl-12`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.tools.searchFormula}
            aria-label={t.tools.searchFormula}
          />
        </div>
        {found.length === 0 && <p className="text-body text-label-2">{t.tools.nothing}</p>}
        {found.map((sec) => (
          <div key={sec.id} className="flex flex-col gap-3">
            <h3 className="text-title3 font-semibold">
              {sec.name[language]} <span className="text-subhead font-normal text-label-2">· {t.tools.grades(sec.grades)}</span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {sec.formulas.map((formula) => (
                <Card key={formula.expr} className="flex flex-col gap-2 p-4">
                  <p className="text-footnote font-semibold uppercase tracking-wide text-label-2">{formula.name[language]}</p>
                  <p className="font-serif text-title2 font-semibold text-accent">{formula.expr}</p>
                  <ul className="flex flex-col gap-0.5 text-subhead">
                    {formula.vars.map((variable) => (
                      <li key={variable.symbol + variable.unit}>
                        <b className="font-serif">{variable.symbol}</b> — {variable.name[language]}
                        {variable.unit !== "—" && <span className="text-label-2">, {variable.unit}</span>}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-title2 font-bold">{t.tools.constants}</h2>
        <Card className="divide-y divide-separator">
          {constants.map((c) => (
            <div key={c.name.ru} className="flex items-baseline gap-4 px-4 py-3">
              <b className="w-14 shrink-0 font-serif text-title3 text-accent">{c.symbol}</b>
              <span className="flex-1 text-body">{c.name[language]}</span>
              <span className="shrink-0 text-right text-body font-semibold tabular-nums">{c.value}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

/** Перевод единиц: число, «из» и «в» — ответ сразу, крупно */
function UnitConverter() {
  const t = useT();
  const language = useLocale();
  const [groupId, setGroupId] = useState(unitGroups[0].id);
  const group = unitGroups.find((g) => g.id === groupId) ?? unitGroups[0];
  const [from, setFrom] = useState(group.units[1].id);
  const [to, setTo] = useState(group.units[0].id);
  const [value, setValue] = useState("1");

  const unitFrom = group.units.find((u) => u.id === from) ?? group.units[0];
  const unitTo = group.units.find((u) => u.id === to) ?? group.units[0];
  const number = Number(value.replace(",", "."));
  const result = Number.isFinite(number) ? (number * unitFrom.toSi) / unitTo.toSi : NaN;

  const pickGroup = (id: string) => {
    const next = unitGroups.find((g) => g.id === id) ?? unitGroups[0];
    setGroupId(id);
    setFrom(next.units[1].id);
    setTo(next.units[0].id);
  };

  const select = `${fieldClass} cursor-pointer`;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title2 font-bold">{t.tools.units}</h2>
      <Card className="flex flex-col gap-4 p-5">
        <div role="radiogroup" aria-label={t.tools.units} className="flex flex-wrap gap-2">
          {unitGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={g.id === groupId}
              onClick={() => pickGroup(g.id)}
              className={`h-10 rounded-full px-4 text-subhead font-semibold transition ${
                g.id === groupId ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
              }`}
            >
              {g.name[language]}
            </button>
          ))}
        </div>
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
          <input
            className={`${fieldClass} text-title3 font-semibold tabular-nums`}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={t.tools.value}
          />
          <select className={select} value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t.tools.from}>
            {group.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <span className="text-center text-title3 text-label-2">→</span>
          <select className={select} value={to} onChange={(e) => setTo(e.target.value)} aria-label={t.tools.to}>
            {group.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <p className="rounded-2xl bg-accent/10 px-5 py-4 text-title2 font-bold tabular-nums text-accent">
          {Number.isFinite(result) ? `${formatNumber(result)} ${unitTo.label}` : "—"}
        </p>
      </Card>
    </section>
  );
}

/** Красиво: 0,2778 или 3,6·10⁶ — без длинных хвостов */
function formatNumber(value: number) {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e-3 && abs < 1e7) return String(Number(value.toPrecision(6))).replace(".", ",");
  const [mantissa, exponent] = value.toExponential(4).split("e");
  const superscript = exponent.replace("+", "").replace(/[-0-9]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);
  return `${String(Number(mantissa)).replace(".", ",")}·10${superscript}`;
}

// ——— Конвертер ———

function Convert() {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-label-2">{t.tools.convertIntro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {conversions.map((c) => (
          <a
            key={c.url}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 rounded-2xl bg-surface p-5 shadow-card transition hover:ring-2 hover:ring-accent/40"
          >
            <span className="text-title3 font-semibold">
              {c.from} <span className="text-label-2">→</span> {c.to}
            </span>
            <span className="text-subhead font-semibold text-accent">{t.tools.open}</span>
          </a>
        ))}
      </div>
      <p className="rounded-2xl bg-orange/12 px-4 py-3 text-subhead">{t.tools.privacy}</p>
    </div>
  );
}
