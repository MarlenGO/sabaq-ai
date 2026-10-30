import { Suspense, type ReactNode } from "react";
import { RecentLessons } from "@/components/RecentLessons";
import { TopicForm } from "@/components/TopicForm";
import { ExampleWorkbench } from "@/components/example/ExampleWorkbench";
import { Card } from "@/components/ui/Card";
import { CheckIcon, GameIcon, MicIcon, MoonIcon, SlidesIcon, SparkleIcon, TextSizeIcon } from "@/components/ui/Icons";
import { mockPackages } from "@/data/mock-packages";

const steps = [
  { icon: <SparkleIcon />, tint: "bg-accent", title: "Тақырыпты жазыңыз", text: "Немесе микрофонды басып, дауыспен айтыңыз" },
  { icon: <SlidesIcon />, tint: "bg-indigo", title: "Дайынын алыңыз", text: "10–20 секундта слайдтар мен ойын дайын болады" },
  { icon: <GameIcon />, tint: "bg-purple", title: "Түзетіп, сабаққа", text: "Қажет болса өзгертіп, PowerPoint-ке жүктеңіз" },
];

const comforts = [
  { icon: <TextSizeIcon />, title: "Үлкен әріптер", text: "Жоғарыдағы «А А А» батырмасымен бүкіл сайтты үлкейтіңіз" },
  { icon: <MoonIcon />, title: "Қараңғы режим", text: "Кешке жұмыс істегенде көзге жайлы" },
  { icon: <MicIcon />, title: "Дауыспен енгізу", text: "Тақырыпты теруге болмаса — айтып беріңіз" },
  { icon: <CheckIcon />, title: "Ештеңе жоғалмайды", text: "Жазғаныңыз автоматты түрде сақталады" },
];

export default function Home() {
  return (
    <main className="flex-1 pb-24">
      <Hero />

      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="-mt-4">
          <TopicForm />
        </div>

        <Suspense>
          <RecentLessons />
        </Suspense>

        <Section title="Қалай жұмыс істейді?">
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full p-5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${step.tint}`}>
                      {step.icon}
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
          title="Мысалды қарап шығыңыз"
          subtitle="«Конструктор» бөлімінде мәтінді өзгертіп көріңіз — слайдтар бірден жаңарады."
        >
          <ExampleWorkbench initial={mockPackages[0]} />
        </Section>

        <Section title="Ыңғайлы болу үшін">
          <div className="grid gap-3 sm:grid-cols-2">
            {comforts.map((item) => (
              <Card key={item.title} className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green/15 text-green">
                  {item.icon}
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

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Мягкие цветные пятна на фоне, как обои macOS */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 animate-[float_14s_ease-in-out_infinite] rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-20 top-10 h-96 w-96 animate-[float_18s_ease-in-out_infinite_reverse] rounded-full bg-purple/20 blur-3xl" />
        <div className="absolute left-1/3 top-48 h-72 w-72 animate-[float_16s_ease-in-out_infinite] rounded-full bg-teal/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3.5 py-1.5 text-footnote font-medium text-label-2 shadow-card backdrop-blur">
          <SparkleIcon className="text-orange" />
          Мұғалімдерге арналған көмекші
        </span>
        <h1 className="mt-6 text-large font-bold tracking-tight sm:text-display">
          Сабаққа презентация мен ойын{" "}
          <span className="bg-linear-to-r from-accent via-indigo to-purple bg-clip-text text-transparent">
            бірнеше минутта
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-body text-label-2 sm:text-title3">
          Тақырыпты жазыңыз — слайдтар мен викторина өзі құрастырылады. Қазақша және орысша.
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
