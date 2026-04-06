<script>
  import { untrack } from 'svelte'
  import { renderMermaid, exportSVG, exportPNG } from '../preview.js'

  let { code, theme = 'default', readonly = false, onThemeSwitch = () => {} } = $props()

  let containerEl = null
  let svgHtml = $state('')
  let error = $state('')
  let prevTheme = untrack(() => theme)
  let zoom = $state(1)

  const ZOOM_STEP = 0.25
  const ZOOM_MIN = 0.25
  const ZOOM_MAX = 4

  function zoomIn() { zoom = Math.min(+(zoom + ZOOM_STEP).toFixed(2), ZOOM_MAX) }
  function zoomOut() { zoom = Math.max(+(zoom - ZOOM_STEP).toFixed(2), ZOOM_MIN) }
  function resetZoom() { zoom = 1 }

  function handleWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    e.deltaY < 0 ? zoomIn() : zoomOut()
  }

  $effect(() => {
    const currentCode = code
    const currentTheme = theme
    const isThemeChange = currentTheme !== prevTheme
    prevTheme = currentTheme
    const delay = (isThemeChange || readonly) ? 0 : 300
    const timeout = setTimeout(async () => {
      const result = await renderMermaid(currentCode, currentTheme)
      if (result.svg) {
        svgHtml = result.svg
        error = ''
      } else {
        error = result.error || ''
      }
    }, delay)
    return () => clearTimeout(timeout)
  })
</script>

<section class="flex-1 min-w-0 flex flex-col {readonly ? '' : 'border-r border-slate-200'} overflow-hidden bg-white">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={containerEl}
    class="preview-container flex-1 overflow-auto p-4 flex items-start justify-center"
    onwheel={handleWheel}
  >
    <div style="zoom: {zoom}">
      {@html svgHtml}
    </div>
  </div>

  {#if error}
    <div class="bg-red-500 text-white text-xs px-3 py-1.5 whitespace-pre-wrap break-all">{error}</div>
  {/if}

  {#if !readonly}
    <div class="bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center gap-2 shrink-0">
      <div class="flex gap-1.5">
        {#each ['default', 'forest', 'dark', 'neutral'] as t (t)}
          <button
            class="theme-btn {theme === t ? 'active' : ''}"
            onclick={() => onThemeSwitch(t)}
          >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        {/each}
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-0.5">
          <button onclick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <button onclick={resetZoom} class="w-12 text-xs tabular-nums" title="Reset zoom">{Math.round(zoom * 100)}%</button>
          <button onclick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        <div class="flex gap-1.5">
          <button onclick={() => exportSVG(containerEl)}>Export SVG</button>
          <button onclick={() => exportPNG(containerEl)}>Export PNG</button>
        </div>
      </div>
    </div>
  {/if}
</section>
