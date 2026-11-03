"use client";

import { limits, type Jeopardy, type Language, type QuizQuestion, type TrueFalseStatement } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, PlusIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { confirmDelete, fieldClass, moveItem, replaceAt } from "@/components/ui/field";
import { DeleteButton, MoveButtons } from "@/components/ui/ItemButtons";
import { ImageField } from "./ImageField";
import { useT } from "@/i18n/client";

// Конструкторы игр. Каждый правит свою часть пакета темы:
// QuizEditor — вопросы для «Теста» и «Викторины», TrueFalseEditor — утверждения,
// JeopardyEditor — тақта «Өз ойын».

const letters = ["A", "B", "C", "D"];

// Вариант ответа меняется местами с соседним; отметка «дұрыс» переезжает вместе с ним
function moveOption(q: QuizQuestion, from: number, to: number): Partial<QuizQuestion> {
  const correctIndex = q.correctIndex === from ? to : q.correctIndex === to ? from : q.correctIndex;
  return { options: moveItem(q.options, from, to), correctIndex };
}

export function QuizEditor({ questions, onChange }: { questions: QuizQuestion[]; onChange: (q: QuizQuestion[]) => void }) {
  const t = useT();
  const canRemove = questions.length > limits.quiz[0];
  const canAdd = questions.length < limits.quiz[1];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-subhead text-label-2">
        {t.editor.quizHint}
      </p>
      {questions.map((q, qi) => {
        const set = (patch: Partial<QuizQuestion>) => onChange(replaceAt(questions, qi, { ...q, ...patch }));
        return (
          <Card key={qi} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-subhead font-semibold">{t.editor.questionN(qi + 1)}</span>
              <div className="flex items-center">
                <MoveButtons
                  index={qi}
                  count={questions.length}
                  what={t.editor.questionN(qi + 1)}
                  onMove={(to) => onChange(moveItem(questions, qi, to))}
                />
                {canRemove && (
                  <DeleteButton
                    label={t.editor.deleteQuestion(qi + 1)}
                    onClick={() =>
                      confirmDelete(t.common.confirmDelete(t.editor.questionWhat(qi + 1))) &&
                      onChange(questions.filter((_, i) => i !== qi))
                    }
                  />
                )}
              </div>
            </div>
            <textarea
              className={`${fieldClass} min-h-20 resize-y font-semibold`}
              value={q.question}
              placeholder={t.common.question}
              onChange={(e) => set({ question: e.target.value })}
            />
            <ImageField image={q.image} query={q.question} onChange={(image) => set({ image })} />
            <div role="radiogroup" aria-label={t.editor.correctAnswer} className="flex flex-col gap-2">
              {q.options.map((option, oi) => {
                const isCorrect = oi === q.correctIndex;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isCorrect}
                      aria-label={t.editor.correctLetter(letters[oi])}
                      title={t.editor.correctAnswer}
                      onClick={() => set({ correctIndex: oi })}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-subhead font-bold transition ${
                        isCorrect ? "border-green bg-green text-white" : "border-separator text-label-2 hover:border-green"
                      }`}
                    >
                      {isCorrect ? <CheckIcon /> : letters[oi]}
                    </button>
                    <input
                      className={fieldClass}
                      value={option}
                      placeholder={t.editor.option(letters[oi])}
                      onChange={(e) => set({ options: replaceAt(q.options, oi, e.target.value) })}
                    />
                    <MoveButtons
                      index={oi}
                      count={q.options.length}
                      what={t.editor.option(letters[oi])}
                      onMove={(to) => set(moveOption(q, oi, to))}
                    />
                  </div>
                );
              })}
            </div>
            <input
              className={`${fieldClass} text-subhead`}
              value={q.explanation ?? ""}
              placeholder={t.common.explanationOptional}
              onChange={(e) => set({ explanation: e.target.value })}
            />
          </Card>
        );
      })}
      {canAdd && (
        <Button
          variant="tinted"
          className="self-start"
          onClick={() => onChange([...questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }])}
        >
          <PlusIcon />
          {t.editor.addQuestion}
        </Button>
      )}
    </div>
  );
}

export function TrueFalseEditor({
  items,
  language,
  onChange,
}: {
  items: TrueFalseStatement[];
  language: Language;
  onChange: (items: TrueFalseStatement[]) => void;
}) {
  const t = useT();
  // «Шын / Жалған» — на языке урока, а не сайта: ученики видят их на экране
  const [yes, no] = language === "kk" ? ["Шын", "Жалған"] : ["Правда", "Ложь"];
  const canRemove = items.length > limits.trueFalse[0];
  const canAdd = items.length < limits.trueFalse[1];

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => {
        const set = (patch: Partial<TrueFalseStatement>) => onChange(replaceAt(items, i, { ...item, ...patch }));
        return (
          <Card key={i} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-subhead font-semibold">{t.editor.statementN(i + 1)}</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <MoveButtons
                  index={i}
                  count={items.length}
                  what={t.editor.statementN(i + 1)}
                  onMove={(to) => onChange(moveItem(items, i, to))}
                />
                <SegmentedControl
                  ariaLabel={t.common.answer}
                  value={item.isTrue ? "yes" : "no"}
                  onChange={(v) => set({ isTrue: v === "yes" })}
                  options={[
                    { value: "yes", label: yes },
                    { value: "no", label: no },
                  ]}
                />
                {canRemove && (
                  <DeleteButton
                    label={t.editor.deleteStatement(i + 1)}
                    onClick={() =>
                      confirmDelete(t.common.confirmDelete(t.editor.statementWhat(i + 1))) &&
                      onChange(items.filter((_, j) => j !== i))
                    }
                  />
                )}
              </div>
            </div>
            <textarea
              className={`${fieldClass} min-h-20 resize-y`}
              value={item.statement}
              placeholder={t.editor.statement}
              onChange={(e) => set({ statement: e.target.value })}
            />
            <input
              className={`${fieldClass} text-subhead`}
              value={item.explanation ?? ""}
              placeholder={t.common.explanationOptional}
              onChange={(e) => set({ explanation: e.target.value })}
            />
          </Card>
        );
      })}
      {canAdd && (
        <Button
          variant="tinted"
          className="self-start"
          onClick={() => onChange([...items, { statement: "", isTrue: true }])}
        >
          <PlusIcon />
          {t.editor.addStatement}
        </Button>
      )}
    </div>
  );
}

export function JeopardyEditor({ jeopardy, onChange }: { jeopardy: Jeopardy; onChange: (j: Jeopardy) => void }) {
  const t = useT();
  const { categories } = jeopardy;
  const canRemove = categories.length > limits.jeopardy[0];
  const canAdd = categories.length < limits.jeopardy[1];
  const emptyCategory = { title: "", questions: [0, 1, 2, 3, 4].map(() => ({ question: "", answer: "" })) };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-subhead text-label-2">{t.editor.jeopardyHint}</p>
      {categories.map((category, ci) => {
        const setCategory = (patch: Partial<Jeopardy["categories"][number]>) =>
          onChange({ categories: replaceAt(categories, ci, { ...category, ...patch }) });
        return (
          <Card key={ci} className="flex flex-col gap-3 p-4">
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-footnote font-medium text-label-2">{t.editor.categoryN(ci + 1)}</span>
                <input
                  className={`${fieldClass} font-semibold`}
                  value={category.title}
                  placeholder={t.editor.categoryName}
                  onChange={(e) => setCategory({ title: e.target.value })}
                />
              </label>
              <MoveButtons
                index={ci}
                count={categories.length}
                what={t.editor.categoryN(ci + 1)}
                onMove={(to) => onChange({ categories: moveItem(categories, ci, to) })}
              />
              {canRemove && (
                <DeleteButton
                  label={t.editor.deleteCategory(ci + 1)}
                  onClick={() =>
                    confirmDelete(t.common.confirmDelete(t.editor.categoryWhat(ci + 1))) &&
                    onChange({ categories: categories.filter((_, i) => i !== ci) })
                  }
                />
              )}
            </div>
            {category.questions.map((q, qi) => (
              <div key={qi} className="flex items-start gap-2">
                <span className="mt-2 flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-accent text-footnote font-bold text-white">
                  {(qi + 1) * 100}
                </span>
                <ImageField
                  compact
                  image={q.image}
                  query={q.answer || q.question}
                  onChange={(image) => setCategory({ questions: replaceAt(category.questions, qi, { ...q, image }) })}
                />
                <div className="grid flex-1 gap-2 sm:grid-cols-[2fr_1fr]">
                  <input
                    className={fieldClass}
                    value={q.question}
                    placeholder={t.common.question}
                    onChange={(e) =>
                      setCategory({ questions: replaceAt(category.questions, qi, { ...q, question: e.target.value }) })
                    }
                  />
                  <input
                    className={`${fieldClass} font-semibold`}
                    value={q.answer}
                    placeholder={t.common.answer}
                    onChange={(e) =>
                      setCategory({ questions: replaceAt(category.questions, qi, { ...q, answer: e.target.value }) })
                    }
                  />
                </div>
              </div>
            ))}
          </Card>
        );
      })}
      {canAdd && (
        <Button
          variant="tinted"
          className="self-start"
          onClick={() => onChange({ categories: [...categories, emptyCategory] })}
        >
          <PlusIcon />
          {t.editor.addCategory}
        </Button>
      )}
    </div>
  );
}
