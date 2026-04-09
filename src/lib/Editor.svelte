<script>
  import { onMount, onDestroy } from 'svelte'
  import { createEditor, setEditorCode } from '../editor.js'

  let { code, error = '', onchange = () => {} } = $props()

  let container = null
  let editorView = null

  onMount(() => {
    editorView = createEditor(container, code, onchange)
  })

  onDestroy(() => {
    editorView?.destroy()
  })

  $effect(() => {
    if (editorView && code !== editorView.state.doc.toString()) {
      setEditorCode(editorView, code)
    }
  })
</script>

<section class="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
  <div class="shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white">
    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editor</span>
    <a href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors">
      Syntax Docs
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  </div>
  <div bind:this={container} class="flex-1 overflow-hidden"></div>
  {#if error}
    <div class="shrink-0 bg-red-50 border-t border-red-200 px-3 py-2 text-xs text-red-600 font-mono whitespace-pre-wrap break-all max-h-28 overflow-auto">
      {error}
    </div>
  {/if}
</section>
