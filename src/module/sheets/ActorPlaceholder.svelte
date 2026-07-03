<script lang="ts">
  import { prettify } from "../components/labels.ts";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Props {
    doc: any;
    snap: any;
    app: any;
  }
  let { doc, snap }: Props = $props();
</script>

<div class="ph">
  <div class="eyebrow">{prettify(doc.type)} · GLUniverse</div>
  <input class="name" value={snap.name} onchange={(e) => doc.update({ name: e.currentTarget.value })} />
  <p class="note">
    A dedicated <b>{prettify(doc.type)}</b> sheet is on the way. Core data is already stored and editable
    from the token / prototype data until then.
  </p>
</div>

<style>
  .ph {
    padding: 40px 34px;
    background: var(--gl-parch);
    color: var(--gl-ink);
    font-family: var(--gl-body);
    min-height: 100%;
    box-sizing: border-box;
    border-top: 5px solid var(--gl-blood);
  }
  .eyebrow {
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 10px;
    color: var(--gl-blood);
  }
  .name {
    font-family: var(--gl-serif);
    font-weight: 700;
    font-size: 40px;
    line-height: 1;
    margin: 4px 0 16px;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--gl-ink);
  }
  .name:focus {
    outline: none;
    border-bottom: 1px solid var(--gl-blood);
  }
  .note {
    font-size: 14px;
    color: var(--gl-muted-2);
    max-width: 60ch;
    line-height: 1.6;
  }
</style>
