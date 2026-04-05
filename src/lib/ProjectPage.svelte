<script>
  let { project, charts, onNewChart, onOpenChart, onDeleteChart, onDeleteProject, onUpdateProject } = $props()

  let showDeleteConfirm = $state(false)

  function portal(el) {
    document.body.appendChild(el)
    return { destroy() { el.remove() } }
  }

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
      <div
        class="text-2xl font-bold text-slate-800 cursor-text rounded px-1 -mx-1 hover:bg-slate-200/60 transition-colors outline-none"
        role="button"
        tabindex="0"
        title="Click to edit name"
        onclick={(e) => editField(e.currentTarget, project.name, (name) => onUpdateProject({ ...project, name }))}
        onkeydown={(e) => { if (e.key === 'Enter') editField(e.currentTarget, project.name, (name) => onUpdateProject({ ...project, name })) }}
      >{project.name}</div>
      <div
        class="mt-1 text-sm text-slate-500 cursor-text rounded px-1 -mx-1 hover:bg-slate-200/60 transition-colors outline-none min-h-[1.5rem]"
        role="button"
        tabindex="0"
        title="Click to edit description"
        onclick={(e) => editField(e.currentTarget, project.description || '', (description) => onUpdateProject({ ...project, description }))}
        onkeydown={(e) => { if (e.key === 'Enter') editField(e.currentTarget, project.description || '', (description) => onUpdateProject({ ...project, description })) }}
      >{project.description || 'Add a description...'}</div>
    </div>
    <button
      class="shrink-0 flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
      onclick={() => showDeleteConfirm = true}
      title="Delete project"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
      Delete
    </button>
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

{#if showDeleteConfirm}
  <!-- Confirmation modal -->
  <div use:portal class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    role="presentation"
    onclick={() => showDeleteConfirm = false}
    onkeydown={(e) => { if (e.key === 'Escape') showDeleteConfirm = false }}
  >
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex items-center gap-3 mb-4">
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-red-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <div>
          <h3 class="text-base font-semibold text-slate-800">Delete project</h3>
          <p class="text-sm text-slate-500 mt-0.5">This cannot be undone.</p>
        </div>
      </div>
      <p class="text-sm text-slate-600 mb-6">
        <strong>"{project.name}"</strong> and all its charts will be permanently deleted.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          onclick={() => showDeleteConfirm = false}
        >Cancel</button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          onclick={() => { showDeleteConfirm = false; onDeleteProject(project.id) }}
        >Delete project</button>
      </div>
    </div>
  </div>
{/if}
