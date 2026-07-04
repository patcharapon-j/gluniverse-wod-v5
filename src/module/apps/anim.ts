/**
 * Micro-animation helpers shared by the sheet components.
 *
 * `pulse` is a Svelte action that briefly applies the global `.gl-pulse`
 * class whenever the tracked value changes, so numeric readouts (Humanity,
 * Blood Potency, pool previews…) visibly acknowledge an edit without any
 * per-component keyframe boilerplate. The keyframes live in
 * `styles/gluniverse-wod.css` because the class is applied at runtime and
 * must escape Svelte's style scoping.
 */

const PULSE_MS = 500;

export function pulse(node: HTMLElement, value: unknown) {
  let current = value;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    update(next: unknown) {
      if (next === current) return;
      current = next;
      node.classList.remove("gl-pulse");
      void node.offsetWidth; // restart the animation if it is mid-flight
      node.classList.add("gl-pulse");
      clearTimeout(timer);
      timer = setTimeout(() => node.classList.remove("gl-pulse"), PULSE_MS);
    },
    destroy() {
      clearTimeout(timer);
    },
  };
}
