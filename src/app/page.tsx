import { TopicForm } from "@/components/TopicForm";
import { Card, ListGroup, ListRow } from "@/components/ui/Card";
import { mockPackages } from "@/data/mock-packages";

export default function Home() {
  const example = mockPackages[0];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20">
      <section className="pb-8 pt-14 text-center sm:pt-20">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight sm:text-[48px]">
          Сабаққа дайын презентация
          <br />
          мен ойын — бірнеше минутта
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[17px] text-label-2 sm:text-[19px]">
          Тақырып пен сыныпты жазыңыз — слайдтар мен викторина өзі құрастырылады.
        </p>
      </section>

      <TopicForm />

      {/* Временный блок: показывает, что моковый пакет темы читается. Уберём на этапе 3. */}
      <section className="mt-12 flex flex-col gap-6">
        <div className="px-1">
          <h2 className="text-[22px] font-bold tracking-tight">Мысал: тақырып пакеті</h2>
          <p className="mt-1 text-[15px] text-label-2">
            {example.topic} · {example.grade}-сынып
          </p>
        </div>

        <Card className="p-5">
          <p className="text-[17px] leading-relaxed">{example.definition}</p>
          {example.formula && (
            <p className="mt-4 rounded-xl bg-fill px-4 py-3 text-center font-mono text-[19px]">
              {example.formula.expression}
            </p>
          )}
        </Card>

        <ListGroup title="Терминдер">
          {example.terms.map((t) => (
            <ListRow key={t.term} title={t.term} detail={t.explanation} />
          ))}
        </ListGroup>

        <ListGroup title="Ойындарға дайын">
          <ListRow title="Викторина" detail={`${example.quiz.length} сұрақ`} />
          <ListRow title="Шын немесе жалған" detail={`${example.trueFalse.length} тұжырым`} />
          <ListRow title="Жұбын тап" detail={`${example.terms.length} жұп`} />
        </ListGroup>
      </section>
    </main>
  );
}
