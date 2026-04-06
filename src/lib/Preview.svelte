<script>
  import { untrack } from 'svelte'
  import { renderMermaid } from '../preview.js'

  let { code, readonly = false, onerror = () => {} } = $props()

  const theme = 'default'

  let svgHtml = $state('')
  let naturalWidth = $state(null)
  let naturalHeight = $state(null)
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

  let scaledSvg = $derived(
    svgHtml && naturalWidth && naturalHeight
      ? svgHtml.replace(/<svg([^>]*)>/, (_, attrs) => {
          const clean = attrs
            .replace(/\s*width="[^"]*"/, '')
            .replace(/\s*height="[^"]*"/, '')
            .replace(/max-width\s*:\s*[^;"]*;?\s*/, '')
          return `<svg${clean} width="${Math.round(naturalWidth * zoom)}" height="${Math.round(naturalHeight * zoom)}">`
        })
      : svgHtml
  )

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
        naturalWidth = result.naturalWidth
        naturalHeight = result.naturalHeight
        error = ''
        onerror('')
      } else {
        error = result.error || ''
        onerror(error)
      }
    }, delay)
    return () => clearTimeout(timeout)
  })
</script>

<section class="relative flex-1 min-w-0 flex flex-col {readonly ? '' : 'border-r border-slate-200'} overflow-hidden bg-white">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="preview-container flex-1 overflow-auto p-4 flex items-start justify-center"
    onwheel={handleWheel}
  >
    <div style="flex-shrink: 0;">
      {@html scaledSvg}
    </div>
  </div>

  {#if !readonly}
    <div class="absolute bottom-6 right-6 flex flex-col gap-1">
      <button
        onclick={zoomIn}
        disabled={zoom >= ZOOM_MAX}
        title="Zoom in"
        class="size-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <button
        onclick={resetZoom}
        title="Reset zoom"
        class="size-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 text-[10px] tabular-nums transition-colors"
      >{Math.round(zoom * 100)}%</button>
      <button
        onclick={zoomOut}
        disabled={zoom <= ZOOM_MIN}
        title="Zoom out"
        class="size-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
        </svg>
      </button>
    </div>
  {/if}
</section>
