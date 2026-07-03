<script lang="ts">
  /* Hover-revealed edit / delete controls for an embedded-item row. */
  interface Props {
    onedit?: () => void;
    ondelete?: () => void;
  }
  let { onedit, ondelete }: Props = $props();
</script>

<span class="ctrls">
  <button class="ic" title="Edit" aria-label="Edit" onclick={(e) => (e.stopPropagation(), onedit?.())}>
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path
        d="M11.5 1.5 14.5 4.5 5 14H2v-3z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  <button class="ic del" title="Delete" aria-label="Delete" onclick={(e) => (e.stopPropagation(), ondelete?.())}>
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path
        d="M3 4h10M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</span>

<style>
  .ctrls {
    display: inline-flex;
    gap: 3px;
    opacity: 0;
    transition: opacity 0.12s;
    flex: none;
  }
  :global(.gl-row:hover) .ctrls,
  :global(.gl-hoverable:hover) .ctrls,
  .ctrls:focus-within {
    opacity: 1;
  }
  .ic {
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--gl-line);
    background: var(--gl-parch);
    color: var(--gl-muted-2);
    cursor: pointer;
    padding: 0;
    border-radius: 3px;
  }
  .ic:hover {
    color: var(--gl-ink);
    border-color: var(--gl-ink);
  }
  .ic.del:hover {
    color: var(--gl-blood-bright);
    border-color: var(--gl-blood);
  }
  .ic:focus-visible {
    outline: 2px solid var(--gl-blood);
    outline-offset: 1px;
  }
</style>
