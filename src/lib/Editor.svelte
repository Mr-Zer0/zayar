<script>
  import { onMount, onDestroy } from 'svelte'
  import { createEditor, setEditorCode } from '../editor.js'

  let { code, onchange = () => {} } = $props()

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
</section>
