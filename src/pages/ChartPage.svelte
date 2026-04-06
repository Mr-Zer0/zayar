<script>
  import Preview from '../lib/Preview.svelte'
  import Editor from '../lib/Editor.svelte'

  let { code, onchange } = $props()

  let editorWidth = $state(380)
  let dragging = false
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
    // handle is left of editor, so dragging left increases width
    editorWidth = Math.max(200, Math.min(800, startWidth + (startX - e.clientX)))
  }

  function onDragEnd() {
    dragging = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', onDragEnd)
  }
</script>

<div class="flex h-screen w-full overflow-hidden" class:select-none={dragging}>
  <Preview {code} />
  <div
    class="w-1 shrink-0 bg-slate-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize transition-colors"
    role="separator"
    aria-orientation="vertical"
    onmousedown={onDragStart}
  ></div>
  <div style="width: {editorWidth}px" class="shrink-0 flex flex-col overflow-hidden">
    <Editor {code} {onchange} />
  </div>
</div>
