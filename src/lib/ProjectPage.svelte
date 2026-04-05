<script>
  let { project, charts, onNewChart, onOpenChart, onDeleteChart, onDeleteProject, onUpdateProject } = $props()

  function formatDate(timestamp) {
    if (!timestamp) return null
    try {
      return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return null
    }
  }

  function editField(el, fallback, onSave) {
    el.contentEditable = 'true'
    el.focus()
    // move cursor to end
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)

    const finish = () => {
      el.contentEditable = 'false'
      const value = el.textContent.trim() || fallback
      el.textContent = value
      onSave(value)
    }
    el.addEventListener('blur', finish, { once: true })
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur() }
      if (e.key === 'Escape') { el.textContent = fallback; el.blur() }
    }, { once: true })
  }
</script>

<div class="flex-1 overflow-auto p-8 bg-slate-50">
  <!-- Project header -->
  <div class="flex items-start justify-between gap-4 mb-8">
    <div class="flex-1 min-w-0">
      <h1
        class="text-2xl font-bold text-slate-800 cursor-text rounded px-1 -mx-1 hover:bg-slate-200/60 transition-colors outline-none"
        title="Click to edit name"
        onclick={(e) => editField(e.currentTarget, project.name, (name) => onUpdateProject({ ...project, name }))}
      >{project.name}</h1>
      <p
        class="mt-1 text-sm text-slate-500 cursor-text rounded px-1 -mx-1 hover:bg-slate-200/60 transition-colors outline-none min-h-[1.5rem]"
        title="Click to edit description"
        onclick={(e) => editField(e.currentTarget, project.description || '', (description) => onUpdateProject({ ...project, description }))}
      >{project.description || 'Add a description...'}</p>
    </div>
    <button
      class="shrink-0 text-sm text-red-500 hover:text-red-600 font-medium"
      onclick={() => onDeleteProject(project.id)}
    >Delete project</button>
  </div>

  <!-- Charts section -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">Charts</h2>
    <button
      class="bg-blue-600 border-blue-600 text-white hover:bg-blue-700 text-sm"
      onclick={onNewChart}
    >+ New chart</button>
  </div>

  {#if charts.length === 0}
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <p class="text-slate-400 text-sm mb-4">No charts yet.</p>
      <button
        class="bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
        onclick={onNewChart}
      >+ New chart</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each charts as chart (chart.id)}
        {@const date = formatDate(chart.updatedAt)}
        <div class="group relative bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-sm transition-all">
          <button
            class="w-full text-left"
            onclick={() => onOpenChart(chart.id)}
          >
            <div class="flex items-start justify-between gap-2 mb-3">
              <span class="text-[15px] font-semibold text-slate-800 leading-snug break-words">{chart.name}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            {#if date}
              <p class="text-[12px] text-slate-400">Updated {date}</p>
            {/if}
          </button>
          <button
            class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-lg leading-none transition-opacity"
            onclick={() => onDeleteChart(chart.id)}
            title="Delete chart"
          >×</button>
        </div>
      {/each}
    </div>
  {/if}
</div>
