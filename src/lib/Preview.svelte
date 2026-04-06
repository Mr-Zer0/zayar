<script>
  import { untrack } from 'svelte'
  import { renderMermaid, exportSVG, exportPNG } from '../preview.js'

  let { code, theme = 'default', readonly = false, onThemeSwitch = () => {} } = $props()

  let containerEl = null
  let svgHtml = $state('')
  let error = $state('')
  let prevTheme = untrack(() => theme)

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

<section class="flex flex-col {readonly ? '' : 'border-r border-slate-200'} overflow-hidden bg-white">
  <div bind:this={containerEl} class="preview-container flex-1 overflow-auto p-4 flex items-start justify-center">
    {@html svgHtml}
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
      <div class="flex gap-1.5">
        <button onclick={() => exportSVG(containerEl)}>Export SVG</button>
        <button onclick={() => exportPNG(containerEl)}>Export PNG</button>
      </div>
    </div>
  {/if}
</section>
