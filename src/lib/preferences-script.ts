// Отдельный файл без React-хуков: его импортирует серверный layout.

export const THEME_KEY = "sabaq-theme";
export const TEXT_SIZE_KEY = "sabaq-text-size";

// Выполняется в <head> до отрисовки страницы, чтобы не было «вспышки»
// светлой темы у того, кто выбрал тёмную. Заодно ставит <html lang="ru">,
// если сайт переключён на русский (cookie sabaq-lang).
export const preferencesScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")d.dataset.theme=t;var s=localStorage.getItem("${TEXT_SIZE_KEY}");if(s==="l"||s==="xl")d.dataset.textSize=s;if(/(^|; )sabaq-lang=ru/.test(document.cookie))d.lang="ru";}catch(e){}})();`;
