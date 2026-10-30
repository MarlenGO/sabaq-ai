"use client";

import { limits, type Jeopardy, type Language, type QuizQuestion, type TrueFalseStatement } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, PlusIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { confirmDelete, fieldClass } from "@/components/ui/field";
import { DeleteButton } from "@/components/slides/PackageEditor";

// Конструкторы игр. Каждый правит свою часть пакета темы:
// QuizEditor — вопросы для «Теста» и «Викторины», TrueFalseEditor — утверждения,
// JeopardyEditor — тақта «Өз ойын».

function replaceAt<T>(list: T[], index: number, item: T) {
  return list.map((x, i) => (i === index ? item : x));
}

const letters = ["A", "B", "C", "D"];

export function QuizEditor({ questions, onChange }: { questions: QuizQuestion[]; onChange: (q: QuizQuestion[]) => void }) {
  const canRemove = questions.length > limits.quiz[0];
  const canAdd = questions.length < limits.quiz[1];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-subhead text-label-2">
        Бұл сұрақтар «Тест» пен «Викторинада» бірдей. Дұрыс жауапты сол жақтағы дөңгелекпен белгілеңіз.
      </p>
      {questions.map((q, qi) => {
        const set = (patch: Partial<QuizQuestion>) => onChange(replaceAt(questions, qi, { ...q, ...patch }));
        return (
          <Card key={qi} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-subhead font-semibold">{qi + 1}-сұрақ</span>
              {canRemove && (
                <DeleteButton
                  label={`${qi + 1}-сұрақты өшіру`}
                  onClick={() => confirmDelete(`${qi + 1}-сұрақты`) && onChange(questions.filter((_, i) => i !== qi))}
                />
              )}
            </div>
            <textarea
              className={`${fieldClass} min-h-20 resize-y font-semibold`}
              value={q.question}
              placeholder="Сұрақ"
              onChange={(e) => set({ question: e.target.value })}
            />
            <div role="radiogroup" aria-label="Дұрыс жауап" className="flex flex-col gap-2">
              {q.options.map((option, oi) => {
                const isCorrect = oi === q.correctIndex;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isCorrect}
                      aria-label={`${letters[oi]} — дұрыс жауап`}
                      title="Дұрыс жауап"
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
                      placeholder={`${letters[oi]} нұсқасы`}
                      onChange={(e) => set({ options: replaceAt(q.options, oi, e.target.value) })}
                    />
                  </div>
                );
              })}
            </div>
            <input
              className={`${fieldClass} text-subhead`}
              value={q.explanation ?? ""}
              placeholder="Түсіндірме (міндетті емес)"
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
          Сұрақ қосу
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
              <span className="text-subhead font-semibold">{i + 1}-тұжырым</span>
              <div className="flex items-center gap-2">
                <SegmentedControl
                  ariaLabel="Жауабы"
                  value={item.isTrue ? "yes" : "no"}
                  onChange={(v) => set({ isTrue: v === "yes" })}
                  options={[
                    { value: "yes", label: yes },
                    { value: "no", label: no },
                  ]}
                />
                {canRemove && (
                  <DeleteButton
                    label={`${i + 1}-тұжырымды өшіру`}
                    onClick={() => confirmDelete(`${i + 1}-тұжырымды`) && onChange(items.filter((_, j) => j !== i))}
                  />
                )}
              </div>
            </div>
            <textarea
              className={`${fieldClass} min-h-20 resize-y`}
              value={item.statement}
              placeholder="Тұжырым"
              onChange={(e) => set({ statement: e.target.value })}
            />
            <input
              className={`${fieldClass} text-subhead`}
              value={item.explanation ?? ""}
              placeholder="Түсіндірме (міндетті емес)"
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
          Тұжырым қосу
        </Button>
      )}
    </div>
  );
}

export function JeopardyEditor({ jeopardy, onChange }: { jeopardy: Jeopardy; onChange: (j: Jeopardy) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {jeopardy.categories.map((category, ci) => {
        const setCategory = (patch: Partial<Jeopardy["categories"][number]>) =>
          onChange({ categories: replaceAt(jeopardy.categories, ci, { ...category, ...patch }) });
        return (
          <Card key={ci} className="flex flex-col gap-3 p-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-footnote font-medium text-label-2">{ci + 1}-тақырып</span>
              <input
                className={`${fieldClass} font-semibold`}
                value={category.title}
                onChange={(e) => setCategory({ title: e.target.value })}
              />
            </label>
            {category.questions.map((q, qi) => (
              <div key={qi} className="flex items-start gap-2">
                <span className="mt-2 flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-accent text-footnote font-bold text-white">
                  {(qi + 1) * 100}
                </span>
                <div className="grid flex-1 gap-2 sm:grid-cols-[2fr_1fr]">
                  <input
                    className={fieldClass}
                    value={q.question}
                    placeholder="Сұрақ"
                    onChange={(e) =>
                      setCategory({ questions: replaceAt(category.questions, qi, { ...q, question: e.target.value }) })
                    }
                  />
                  <input
                    className={`${fieldClass} font-semibold`}
                    value={q.answer}
                    placeholder="Жауабы"
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
    </div>
  );
}
