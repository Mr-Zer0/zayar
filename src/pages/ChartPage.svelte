<script>
  import Preview from '../lib/Preview.svelte'
  import Editor from '../lib/Editor.svelte'
  import { exportSVG, exportPNG } from '../preview.js'

  let { code, onchange, projectName = '', chartName = '', onrenamechart = () => {}, ongoback = () => {}, ongohome = () => {} } = $props()

  let syntaxError = $state('')
  let previewContainer = $state(null)
  let copied = $state(false)
  let editingName = $state(false)
  let draftName = $state('')
  let nameInput = $state(null)

  function startRename() {
    draftName = chartName
    editingName = true
    // focus after the input renders
    setTimeout(() => nameInput?.select(), 0)
  }

  function commitRename() {
    editingName = false
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== chartName) onrenamechart(trimmed)
  }

  function cancelRename() {
    editingName = false
  }

  function onNameKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitRename() }
    if (e.key === 'Escape') cancelRename()
  }

  let editorVisible = $state(true)
  let editorWidth = $state(380)
  let dragging = $state(false)
  let startX = 0
  let startWidth = 0

  function onDragStart(e) {
    dragging = true
    startX = e.clientX
    startWidth = editorWidth
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', onDragEnd)
  }

  function onDrag(e) {
    if (!dragging) return
    editorWidth = Math.max(200, Math.min(800, startWidth + (startX - e.clientX)))
  }

  function onDragEnd() {
    dragging = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', onDragEnd)
  }

  function handleExportSVG() { exportSVG(previewContainer) }
  function handleExportPNG() { exportPNG(previewContainer) }

  function handleShare() {
    const hash = btoa(encodeURIComponent(code))
    const url = window.location.origin + '/#' + hash
    navigator.clipboard.writeText(url).then(() => {
      copied = true
      setTimeout(() => copied = false, 2000)
    })
  }
</script>

<div class="flex flex-col h-screen w-full overflow-hidden">
  <!-- Topbar -->
  <header class="h-12 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-2">
    <nav class="flex items-center gap-1.5 text-sm flex-1 min-w-0">
      <button onclick={ongohome} class="text-blue-600 font-semibold hover:underline shrink-0">Zayar</button>
      <span class="text-slate-300 shrink-0">/</span>
      <button onclick={ongoback} class="text-slate-500 hover:text-slate-800 truncate max-w-[180px]">{projectName}</button>
      <span class="text-slate-300 shrink-0">/</span>
      {#if editingName}
        <input
          bind:this={nameInput}
          bind:value={draftName}
          onblur={commitRename}
          onkeydown={onNameKeydown}
          class="text-sm font-medium text-slate-800 bg-white border border-blue-400 rounded px-1.5 py-0.5 outline-none max-w-[220px]"
        />
      {:else}
        <button
          onclick={startRename}
          title="Click to rename"
          class="text-slate-800 font-medium truncate max-w-[220px] hover:text-blue-600 transition-colors"
        >{chartName}</button>
      {/if}
    </nav>
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        onclick={() => editorVisible = !editorVisible}
        title="{editorVisible ? 'Hide' : 'Show'} editor"
        class="h-7 px-2.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
      >{editorVisible ? 'Hide editor' : 'Show editor'}</button>
      <button
        onclick={handleExportSVG}
        class="h-7 px-2.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
      >Export SVG</button>
      <button
        onclick={handleExportPNG}
        class="h-7 px-2.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
      >Export PNG</button>
      <button
        onclick={handleShare}
        class="h-7 px-2.5 text-xs font-medium rounded-md transition-colors {copied ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'}"
      >{copied ? 'Copied!' : 'Share'}</button>
    </div>
  </header>

  <!-- Main content -->
  <div class="flex flex-1 overflow-hidden" class:select-none={dragging}>
    <Preview {code} bind:containerEl={previewContainer} onerror={(e) => syntaxError = e} />
    {#if editorVisible}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-1 shrink-0 bg-slate-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize transition-colors"
        role="separator"
        aria-orientation="vertical"
        onmousedown={onDragStart}
      ></div>
      <div style="width: {editorWidth}px" class="shrink-0 flex flex-col overflow-hidden">
        <Editor {code} {onchange} error={syntaxError} />
      </div>
    {/if}
  </div>
</div>
