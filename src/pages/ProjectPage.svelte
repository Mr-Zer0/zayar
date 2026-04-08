<script>
  import Sidebar from '../lib/Sidebar.svelte'
  import ConfirmModal from '../lib/ConfirmModal.svelte'
  import { formatDate } from '../utils.js'

  let {
    // sidebar
    projects, allCharts, currentProjectId,
    onGoHome, onNewProject, onSelectProject, onSelectChart, onSignOut,
    // content
    project, charts, onNewChart, onOpenChart, onDeleteChart, onDeleteProject, onUpdateProject,
  } = $props()

  let showDeleteProject = $state(false)
  let chartToDelete = $state(null)

  function editField(el, fallback, onSave) {
    el.contentEditable = 'true'
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)

    const onKeyDown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur() }
      if (e.key === 'Escape') { el.textContent = fallback; el.blur() }
    }
    const finish = () => {
      el.contentEditable = 'false'
      el.removeEventListener('keydown', onKeyDown)
      const value = el.textContent.trim() || fallback
      el.textContent = value
      onSave(value)
    }
    el.addEventListener('blur', finish, { once: true })
    el.addEventListener('keydown', onKeyDown)
  }
</script>

<div class="flex h-screen">
  <Sidebar
    {projects}
    {allCharts}
    {currentProjectId}
    {onSelectProject}
    {onSelectChart}
    {onSignOut}
    {onGoHome}
    {onNewProject}
  />

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
        onclick={() => showDeleteProject = true}
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
        class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 ease-out bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-500 hover:to-indigo-500 hover:shadow active:scale-95 gap-1.5"
        onclick={onNewChart}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        New chart
      </button>
    </div>

    {#if charts.length === 0}
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <div class="bg-indigo-50 text-indigo-400 rounded-full p-4 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-700 mb-1">Create your first chart</h3>
        <p class="text-slate-500 text-sm mb-6 max-w-sm">Get started by creating a new chart to visualize your data beautifully.</p>
        <button
          class="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 ease-out bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-500 hover:to-indigo-500 hover:shadow active:scale-95 gap-1.5"
          onclick={onNewChart}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New chart
        </button>
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
              <div class="mb-3">
                <span class="text-[15px] font-semibold text-slate-800 leading-snug break-words">{chart.name}</span>
              </div>
              {#if date}
                <p class="text-[12px] text-slate-400">Updated {date}</p>
              {/if}
            </button>
            <button
              class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
              onclick={() => chartToDelete = chart}
              title="Delete chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if showDeleteProject}
  <ConfirmModal
    title="Delete project"
    message="<strong>&ldquo;{project.name}&rdquo;</strong> and all its charts will be permanently deleted."
    confirmLabel="Delete project"
    onConfirm={() => { showDeleteProject = false; onDeleteProject(project.id) }}
    onCancel={() => showDeleteProject = false}
  />
{/if}

{#if chartToDelete}
  <ConfirmModal
    title="Delete chart"
    message="<strong>&ldquo;{chartToDelete.name}&rdquo;</strong> will be permanently deleted."
    confirmLabel="Delete chart"
    onConfirm={() => { onDeleteChart(chartToDelete.id); chartToDelete = null }}
    onCancel={() => chartToDelete = null}
  />
{/if}
