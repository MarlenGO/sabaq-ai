"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { docKinds, type DocKind, type MyDocumentItem } from "@/types/documents";
import { subjectSchema } from "@/types/topic-package";
import { docIcon, docPath } from "@/data/catalog";
import { dateTimeOf } from "@/lib/dates";
import { useT } from "@/i18n/client";
import { Card } from "@/components/ui/Card";
import { confirmDelete, fieldClass } from "@/components/ui/field";
import { SearchIcon, TrashIcon, XIcon } from "@/components/ui/Icons";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { subjectColors } from "@/components/home/SubjectBadge";

// Список «Менің құжаттарым»: поиск по теме, фильтр по виду (и по предмету из адреса
// ?subject=physics — ссылка со страницы предмета), строка открывает документ, корзина удаляет.
type Filter = "all" | DocKind;

export function MyDocuments({ initial }: { initial: MyDocumentItem[] }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [documents, setDocuments] = useState(initial);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const show = params.get("show");
  const filter: Filter = docKinds.some((k) => k === show) ? (show as DocKind) : "all";
  const subjectParam = subjectSchema.safeParse(params.get("subject"));
  const subject = subjectParam.success ? subjectParam.data : null;
  const setParams = (next: { show?: Filter; subject?: string | null }) => {
    const search = new URLSearchParams();
    const s = next.show ?? filter;
    const subj = next.subject === undefined ? subject : next.subject;
    if (s !== "all") search.set("show", s);
    if (subj) search.set("subject", subj);
    router.replace(search.size ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  // Страница остаётся в памяти (Activity): при каждом показе и возврате на вкладку перечитываем,
  // чтобы только что созданный документ сразу был в списке
  const opened = useRef(false);
  useEffect(() => {
    const reload = async () => {
      if (document.visibilityState !== "visible") return;
      const response = await fetch("/api/documents").catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && Array.isArray(data?.documents)) setDocuments(data.documents);
    };
    if (opened.current) reload();
    opened.current = true;
    document.addEventListener("visibilitychange", reload);
    return () => document.removeEventListener("visibilitychange", reload);
  }, []);

  const remove = async (doc: MyDocumentItem) => {
    if (!confirmDelete(t.myDocs.confirmDelete(`${t.docs.kinds[doc.kind].name} — ${doc.topic}`))) return;
    const response = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      setDocuments((list) => list.filter((d) => d.id !== doc.id));
      setNotice(t.myDocs.deleted);
    } else setNotice(t.form.netError);
  };

  const q = query.trim().toLowerCase();
  const visible = documents.filter(
    (d) => (filter === "all" || d.kind === filter) && (!subject || d.subject === subject) && (!q || d.topic.toLowerCase().includes(q)),
  );
  const filters: Filter[] = ["all", ...docKinds];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-3" />
          <input
            className={`${fieldClass} pl-12`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.myDocs.search}
            aria-label={t.myDocs.search}
          />
        </div>
        <div role="radiogroup" aria-label={t.myDocs.kind} className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setParams({ show: f })}
              className={`h-11 rounded-full px-4 text-callout font-semibold transition ${
                filter === f ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
              }`}
            >
              {f === "all" ? t.myDocs.allKinds : t.docs.kinds[f].name}
            </button>
          ))}
        </div>
        {subject && (
          <div>
            <button
              type="button"
              onClick={() => setParams({ subject: null })}
              title={t.myDocs.allSubjects}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent/12 pl-4 pr-3 text-callout font-semibold text-accent hover:bg-accent/20"
            >
              {t.myDocs.subject}: {t.subjects[subject]}
              <XIcon className="size-4" />
              <span className="sr-only">{t.myDocs.allSubjects}</span>
            </button>
          </div>
        )}
      </div>

      {notice && (
        <p role="status" className="rounded-2xl bg-accent/10 px-4 py-3 text-subhead text-accent">
          {notice}
        </p>
      )}

      {visible.length === 0 ? (
        <Card className="p-8 text-center text-body text-label-2">
          {documents.length === 0 ? (
            <>
              {t.myDocs.empty}{" "}
              <Link href="/" className="font-semibold text-accent">
                {t.myDocs.toSubjects}
              </Link>
            </>
          ) : (
            t.myDocs.nothing
          )}
        </Card>
      ) : (
        <Card className="divide-y divide-separator overflow-hidden">
          {visible.map((doc) => (
            <div key={doc.id} className="flex items-center pr-2">
              <Link
                href={`/subject/${doc.subject}/${docPath(doc.kind)}?doc=${doc.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 transition hover:bg-fill/60"
              >
                <span style={subjectColors(doc.subject)} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--tile) text-(--ink)">
                  <LucideIcon svg={docIcon[doc.kind]} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold">{doc.topic}</p>
                  <p className="truncate text-footnote text-label-2">
                    {t.docs.kinds[doc.kind].name} · {t.subjects[doc.subject]} · {t.common.grade(doc.grade)}
                  </p>
                  <p className="truncate text-footnote text-label-3">{t.myDocs.changed(dateTimeOf(doc.updatedAt))}</p>
                </div>
                <span className="shrink-0 text-subhead font-semibold text-accent">{t.common.open}</span>
              </Link>
              <button
                type="button"
                onClick={() => remove(doc)}
                aria-label={`${t.myDocs.remove}: ${doc.topic}`}
                title={t.myDocs.remove}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red transition hover:bg-red/10"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
