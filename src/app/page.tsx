import { Suspense, type ReactNode } from "react";
import { RecentLessons } from "@/components/RecentLessons";
import { TopicForm } from "@/components/TopicForm";
import { ExampleWorkbench } from "@/components/example/ExampleWorkbench";
import { Card } from "@/components/ui/Card";
import { CheckIcon, GameIcon, MicIcon, MoonIcon, SlidesIcon, SparkleIcon, TextSizeIcon } from "@/components/ui/Icons";
import { mockPackages } from "@/data/mock-packages";
import { getT } from "@/i18n/server";
import type { Messages } from "@/i18n/kk";

// Иконки по порядку пунктов из словаря (home.steps, home.comforts)
const stepIcons = [
  { icon: <SparkleIcon />, tint: "bg-accent" },
  { icon: <SlidesIcon />, tint: "bg-indigo" },
  { icon: <GameIcon />, tint: "bg-purple" },
];
const comfortIcons = [<TextSizeIcon key="size" />, <MoonIcon key="moon" />, <MicIcon key="mic" />, <CheckIcon key="check" />];

export default async function Home() {
  const t = await getT();
  return (
    <main className="flex-1 pb-24">
      <Hero t={t} />

      <div className="mx-auto w-full max-w-3xl px-4">
        <TopicForm />

        <Suspense>
          <RecentLessons />
        </Suspense>

        <Section title={t.home.howTitle}>
          <ol className="grid gap-3 sm:grid-cols-3">
            {t.home.steps.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full p-5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${stepIcons[i].tint}`}>
                      {stepIcons[i].icon}
                    </span>
                    <span className="text-title2 font-bold text-label-3">{i + 1}</span>
                  </div>
                  <p className="mt-4 text-body font-semibold">{step.title}</p>
                  <p className="mt-1 text-subhead text-label-2">{step.text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="example"
          title={t.home.exampleTitle}
          subtitle={t.home.exampleSubtitle}
        >
          <ExampleWorkbench initial={mockPackages[0]} />
        </Section>

        <Section title={t.home.comfortTitle}>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.home.comforts.map((item, i) => (
              <Card key={item.title} className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green/15 text-green">
                  {comfortIcons[i]}
                </span>
                <div>
                  <p className="text-body font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-subhead text-label-2">{item.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Hero({ t }: { t: Messages }) {
  return (
    <section className="relative overflow-hidden">
      {/* Мягкие цветные пятна на фоне, как обои macOS. Маска плавно гасит их к низу,
          иначе край секции режет пятна ровной линией прямо по карточке формы */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mask-b-from-40% mask-b-to-100%">
        <div className="absolute -left-24 top-0 h-80 w-80 animate-[float_14s_ease-in-out_infinite] rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-20 top-10 h-96 w-96 animate-[float_18s_ease-in-out_infinite_reverse] rounded-full bg-purple/20 blur-3xl" />
        <div className="absolute left-1/3 top-32 h-72 w-72 animate-[float_16s_ease-in-out_infinite] rounded-full bg-teal/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3.5 py-1.5 text-footnote font-medium text-label-2 shadow-card backdrop-blur">
          <SparkleIcon className="text-orange" />
          {t.home.badge}
        </span>
        <h1 className="mt-6 text-large font-bold tracking-tight sm:text-display">
          {t.home.title}{" "}
          <span className="bg-linear-to-r from-accent via-indigo to-purple bg-clip-text text-transparent">
            {t.home.titleAccent}
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-body text-label-2 sm:text-title3">
          {t.home.lead}
        </p>
      </div>
    </section>
  );
}

function Section(props: { id?: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section id={props.id} className="mt-16 scroll-mt-20">
      <h2 className="text-title1 font-bold tracking-tight">{props.title}</h2>
      {props.subtitle && <p className="mt-1.5 text-subhead text-label-2">{props.subtitle}</p>}
      <div className="mt-5">{props.children}</div>
    </section>
  );
}
