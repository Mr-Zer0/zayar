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
  <header class="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
    <nav class="flex items-center gap-2 text-sm flex-1 min-w-0">
      <button onclick={ongohome} class="flex items-center gap-2 text-slate-800 font-bold hover:opacity-80 transition-opacity shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-600">
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
        </svg>
        Zayar
      </button>
      <span class="text-slate-300 mx-0.5 shrink-0">/</span>
      <button onclick={ongoback} class="text-slate-500 font-medium hover:text-blue-600 hover:bg-slate-50 px-2 py-1 rounded truncate max-w-[180px] transition-colors">{projectName}</button>
      <span class="text-slate-300 mx-0.5 shrink-0">/</span>
      {#if editingName}
        <input
          bind:this={nameInput}
          bind:value={draftName}
          onblur={commitRename}
          onkeydown={onNameKeydown}
          class="text-sm font-semibold text-slate-800 bg-white border border-blue-500 ring-2 ring-blue-500/20 rounded-md px-2 py-1 outline-none w-auto max-w-[220px]"
        />
      {:else}
        <div class="group flex items-center relative">
          <button
            onclick={startRename}
            title="Click to rename"
            class="text-slate-800 font-semibold truncate max-w-[220px] hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >{chartName}</button>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 absolute -right-4 transition-opacity pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l12.683-12.683z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L22.25 4.625" />
          </svg>
        </div>
      {/if}
    </nav>
    
    <div class="flex items-center gap-2.5 shrink-0 ml-4">
      <button
        onclick={() => editorVisible = !editorVisible}
        title="{editorVisible ? 'Hide' : 'Show'} editor"
        class="h-8 px-3 flex items-center gap-1.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-slate-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
        {editorVisible ? 'Hide Editor' : 'Show Editor'}
      </button>

      <div class="h-5 w-px bg-slate-200 mx-1"></div>

      <div class="flex items-center gap-1.5">
        <button
          onclick={handleExportSVG}
          title="Export as SVG"
          class="h-8 px-3 flex items-center gap-1.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          SVG
        </button>
        <button
          onclick={handleExportPNG}
          title="Export as PNG"
          class="h-8 px-3 flex items-center gap-1.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          PNG
        </button>
      </div>

      <button
        onclick={handleShare}
        class="h-8 ml-1 px-4 flex items-center gap-1.5 text-[13px] font-semibold text-white rounded-lg transition-all ease-out shadow-[0_1px_2px_rgba(0,0,0,0.05)] {copied ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-md hover:-translate-y-[0.5px] active:translate-y-0 active:scale-95'}"
      >
        {#if copied}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        {:else}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 opacity-90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        {/if}
        {copied ? 'Copied Link!' : 'Share Chart'}
      </button>
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
