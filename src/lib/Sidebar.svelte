<script>
  let {
    projects,
    charts,
    currentProjectId,
    currentChartId,
    onToggleProject,
    onNewChart,
    onDeleteChart,
    onDeleteProject,
    onOpenChart,
    onRenameProject,
    onRenameChart,
    onSignOut,
    onGoHome,
  } = $props()

  function handleRename(item, el, defaultName, onSave) {
    if (!item) return
    el.contentEditable = 'true'
    el.focus()
    const finish = () => {
      el.contentEditable = 'false'
      const name = el.textContent.trim() || defaultName
      el.textContent = name
      onSave(name)
    }
    el.addEventListener('blur', finish, { once: true })
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur() }
    }, { once: true })
  }
</script>

<aside class="w-[260px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
  <!-- App name -->
  <div class="shrink-0 px-5 h-12 flex items-center border-b border-slate-200">
    <span class="text-lg font-bold text-blue-600">Zayar</span>
  </div>

  <!-- Home nav item -->
  <div class="shrink-0 border-b border-slate-200">
    <button
      class="flex items-center gap-2.5 w-full px-5 py-3 text-[13px] font-semibold cursor-pointer {!currentProjectId ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'}"
      onclick={onGoHome}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-[18px] shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      Home
    </button>
  </div>

  <ul class="flex-1 overflow-y-auto py-2 list-none">
    {#each projects as project (project.id)}
      {@const isExpanded = project.id === currentProjectId}
      <li class="border-l-[3px] border-l-transparent">
        <div
          class="project-header flex items-center px-5 py-2 cursor-pointer gap-1.5 hover:bg-slate-100"
          onclick={(e) => {
            if (e.target.classList.contains('project-delete-btn')) return
            onToggleProject(project.id)
          }}
        >
          <span class="text-[10px] text-gray-500 shrink-0 w-3">{isExpanded ? '▼' : '▶'}</span>
          <span
            class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold"
            ondblclick={(e) => {
              e.stopPropagation()
              handleRename(project, e.currentTarget, 'Untitled project', (name) => onRenameProject(project.id, name))
            }}
          >{project.name}</span>
          <button
            class="project-delete-btn text-gray-500 cursor-pointer text-base leading-none opacity-0 hover:text-red-500"
            onclick={(e) => { e.stopPropagation(); onDeleteProject(project.id) }}
            title="Delete project"
          >×</button>
        </div>

        {#if isExpanded}
          <ul class="list-none">
            {#each charts as chart (chart.id)}
              <li class="chart-item flex items-center py-1.5 pl-7 pr-3 cursor-pointer gap-1.5 hover:bg-slate-100 border-l-[3px] border-l-transparent {chart.id === currentChartId ? 'active' : ''}">
                <span
                  class="chart-name flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]"
                  onclick={() => onOpenChart(chart.id)}
                  ondblclick={(e) => handleRename(chart, e.currentTarget, 'Untitled chart', (name) => onRenameChart(chart.id, name))}
                >{chart.name}</span>
                <button
                  class="chart-delete-btn text-gray-500 cursor-pointer text-base leading-none opacity-0 hover:text-red-500"
                  onclick={() => onDeleteChart(chart.id)}
                  title="Delete"
                >×</button>
              </li>
            {/each}
            <li class="py-1 pl-7 pr-3 pb-2">
              <button class="new-chart-btn-inline text-blue-600 text-xs cursor-pointer rounded hover:bg-slate-100" onclick={onNewChart}>+ New chart</button>
            </li>
          </ul>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="shrink-0">
    <button
      class="flex items-center gap-3 px-8 py-3 mb-3 cursor-pointer text-slate-700 font-semibold"
      onclick={onSignOut}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-slate-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
      </svg>
      Log out
    </button>
  </div>
</aside>
