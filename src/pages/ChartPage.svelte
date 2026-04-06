<script>
  import Preview from '../lib/Preview.svelte'
  import Editor from '../lib/Editor.svelte'

  let { code, theme, onchange, onThemeSwitch } = $props()
</script>

<div class="flex h-screen">
  <Preview {code} {theme} {onThemeSwitch} />
  <Editor {code} {onchange} />
</div>
