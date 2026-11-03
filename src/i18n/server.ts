import { cookies } from "next/headers";
import { LOCALE_COOKIE, messages, toLocale } from "./locale";

// Для серверных компонентов и API: язык из cookie запроса.
// cookies() делает страницу динамической, поэтому вызывать внутри <Suspense>.
export async function getLocale() {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getT() {
  return messages[await getLocale()];
}
