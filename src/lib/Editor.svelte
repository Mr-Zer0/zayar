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
  <div bind:this={container} class="flex-1 overflow-hidden"></div>
  {#if error}
    <div class="shrink-0 bg-red-50 border-t border-red-200 px-3 py-2 text-xs text-red-600 font-mono whitespace-pre-wrap break-all max-h-28 overflow-auto">
      {error}
    </div>
  {/if}
</section>
