import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view'
import { EditorState, Transaction } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

// Mermaid stream tokenizer
const mermaidLanguage = StreamLanguage.define({
  token(stream) {
    // Comments
    if (stream.match('%%')) { stream.skipToEnd(); return 'comment' }

    // Strings in quotes (node labels like ["text"] or arrow labels)
    if (stream.peek() === '"') {
      stream.next()
      while (!stream.eol() && stream.peek() !== '"') stream.next()
      if (!stream.eol()) stream.next()
      return 'string'
    }

    // Diagram-type keywords (must appear at start of line typically)
    if (stream.match(/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|timeline|block|xychart-beta|sankey-beta|requirementDiagram|C4Context)\b/)) {
      return 'keyword'
    }

    // Structural keywords
    if (stream.match(/^(subgraph|end|note|loop|alt|else|opt|par|and|rect|title|accTitle|accDescr|section|direction)\b/)) {
      return 'keyword'
    }

    // Direction values
    if (stream.match(/^(TD|LR|BT|RL|TB)\b/)) return 'atom'

    // Arrows
    if (stream.match(/(-{1,3}>|={2,3}>|-{1,3}x|-{1,3}o|<-{1,3}>|<={2,3}>|\.{1,2}-+>?|~{3})/)) return 'operator'
    if (stream.match('---') || stream.match('--')) return 'operator'

    // Node shape brackets — highlight content as string
    if (stream.match(/\[["']?[^\]]*["']?\]/)) return 'string'
    if (stream.match(/\(["']?[^)]*["']?\)/)) return 'string'
    if (stream.match(/\{["']?[^}]*["']?\}/)) return 'string'
    if (stream.match(/>"[^"]*"]/)) return 'string'
    if (stream.match(/\(\(["']?[^)]*["']?\)\)/)) return 'string'

    // Identifiers / node IDs
    if (stream.match(/[A-Za-z_][\w$]*/)) return 'variableName'

    // Numbers
    if (stream.match(/\d+/)) return 'number'

    stream.next()
    return null
  }
})

export function createEditor(container, initialCode, onChange) {
  const view = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        mermaidLanguage,
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.updateListener.of((update) => {
          const isRemote = update.transactions.some(t => t.annotation(Transaction.remote))
          if (update.docChanged && !isRemote) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px' },
        }),
      ],
    }),
    parent: container,
  })
  return view
}

// Programmatically replace editor content without triggering onChange.
export function setEditorCode(view, code) {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: code },
    annotations: Transaction.remote.of(true),
  })
}
