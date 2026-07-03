<script lang="ts">
  /* A framed, diorama-style character portrait. In edit mode the frame is a
     button that opens the FilePicker; in play mode it's a static plate. */
  interface Props {
    img: string;
    name?: string;
    editable?: boolean;
    onedit?: () => void;
  }
  let { img, name = "", editable = false, onedit }: Props = $props();
</script>

{#if editable}
  <button class="gl-portrait edit" title="Change portrait" onclick={() => onedit?.()} aria-label="Change portrait">
    <img src={img} alt={name} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")} />
    <span class="scrim">Change</span>
  </button>
{:else}
  <div class="gl-portrait">
    <img src={img} alt={name} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")} />
  </div>
{/if}

<style>
  .gl-portrait {
    position: relative;
    width: 128px;
    height: 168px;
    flex: none;
    padding: 0;
    border: none;
    background:
      linear-gradient(180deg, transparent 55%, color-mix(in srgb, var(--gl-stage) 30%, transparent)),
      var(--gl-parch-raise);
    box-shadow:
      0 1px 0 var(--gl-parch-raise),
      0 0 0 1px var(--gl-line),
      0 8px 18px -8px color-mix(in srgb, var(--gl-stage) 60%, transparent);
    overflow: hidden;
    border-radius: 2px;
    outline: 3px solid var(--gl-parch);
    outline-offset: -1px;
  }
  .gl-portrait::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid color-mix(in srgb, var(--gl-blood) 55%, transparent);
    pointer-events: none;
  }
  .gl-portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .gl-portrait.edit {
    cursor: pointer;
  }
  .scrim {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    text-align: center;
    font-family: var(--gl-cond);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    color: var(--gl-parch);
    background: color-mix(in srgb, var(--gl-blood) 85%, transparent);
    padding: 3px 0;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .gl-portrait.edit:hover .scrim {
    opacity: 1;
  }
  .gl-portrait.edit:focus-visible {
    outline: 3px solid var(--gl-blood);
  }
</style>
