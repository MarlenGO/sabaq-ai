import {
  Award,
  BookOpen,
  Brain,
  CircleCheck,
  CircleQuestionMark,
  Heart,
  House,
  ImagePlus,
  Lightbulb,
  NotebookPen,
  Puzzle,
  Rocket,
  Scale,
  Star,
  Target,
  Flag,
  GraduationCap,
  Handshake,
  MessagesSquare,
  Quote,
  School,
  Smile,
  Trophy,
  Users,
} from "lucide-static";

// Иконки для слайдов из Lucide (лицензия ISC — можно свободно использовать).
// Lucide отдаёт SVG-строку с цветом currentColor; мы подставляем цвет шаблона.
// В превью SVG показывается как есть, а в PPTX превращается в PNG:
// его открывают и старые версии PowerPoint в школах.

const icons = {
  book: BookOpen,
  brain: Brain,
  check: CircleCheck,
  question: CircleQuestionMark,
  heart: Heart,
  house: House,
  image: ImagePlus,
  lightbulb: Lightbulb,
  notebook: NotebookPen,
  puzzle: Puzzle,
  rocket: Rocket,
  scale: Scale,
  star: Star,
  target: Target,
  award: Award,
  flag: Flag,
  graduation: GraduationCap,
  handshake: Handshake,
  messages: MessagesSquare,
  quote: Quote,
  school: School,
  smile: Smile,
  trophy: Trophy,
  users: Users,
};

export type IconName = keyof typeof icons;

export const ICON_PX = 256;

/** SVG иконки нужного цвета (hex без «#») и размера */
export function iconSvg(name: IconName, color: string, size = ICON_PX) {
  return icons[name]
    .replace(/<!--[\s\S]*?-->/, "")
    .replace(/stroke="currentColor"/, `stroke="#${color}"`)
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .trim();
}

export const iconDataUrl = (name: IconName, color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg(name, color))}`;

/** Превращает SVG в PNG: «image/png;base64,…» — формат, который ждёт pptxgenjs */
export type Rasterize = (svg: string) => Promise<string>;

export const rasterizeInBrowser: Rasterize = async (svg) => {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ICON_PX;
  canvas.getContext("2d")?.drawImage(img, 0, 0, ICON_PX, ICON_PX);
  return canvas.toDataURL("image/png").replace(/^data:/, "");
};
