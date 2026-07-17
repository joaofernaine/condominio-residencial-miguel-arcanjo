import * as React from "react";

/**
 * Anima a entrada de um elemento quando ele cruza a viewport (scroll-reveal).
 *
 * Localiza o elemento por `id` (via `document.getElementById`) em vez de um
 * `ref` de React: o dev-tooling deste projeto (componentTagger) reescreve o
 * atributo `ref` de todo elemento JSX para instrumentação, o que engole
 * qualquer ref próprio antes de ele alcançar o DOM. Buscar por id evita essa
 * colisão e é o mesmo padrão já usado em `useScrollSpy`.
 *
 * Retorna o `id` a aplicar no elemento e a classe CSS de estado.
 * Respeita `prefers-reduced-motion`: quando ativo, o elemento já nasce visível.
 */
export function useReveal(options?: { delay?: number; threshold?: number }) {
  const id = React.useId();
  const [visible, setVisible] = React.useState(false);
  const delay = options?.delay ?? 0;
  const threshold = options?.threshold ?? 0.15;

  React.useEffect(() => {
    const node = document.getElementById(id);
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, threshold]);

  return {
    id,
    className: visible ? "reveal reveal-in" : "reveal",
    style: { "--reveal-delay": `${delay}ms` } as React.CSSProperties,
  };
}
