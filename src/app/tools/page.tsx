import { Suspense } from "react";
import { getT } from "@/i18n/server";
import { Tools } from "@/components/tools/Tools";

// «Құралдар»: опыты PhET, справочник по физике, конвертер. ?tab=reference — сразу справочник
export default async function ToolsPage({ searchParams }: PageProps<"/tools">) {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8">
      <title>{t.tools.title}</title>
      <h1 className="text-large font-bold tracking-tight">{t.tools.title}</h1>
      <p className="mt-1 text-subhead text-label-2">{t.tools.subtitle}</p>
      <div className="mt-6">
        <Suspense>
          <ToolsWithTab searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function ToolsWithTab({ searchParams }: { searchParams: PageProps<"/tools">["searchParams"] }) {
  const { tab } = await searchParams;
  return <Tools initialTab={tab === "reference" || tab === "convert" ? tab : "phet"} />;
}
