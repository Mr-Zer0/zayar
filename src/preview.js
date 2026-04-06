import mermaid from 'mermaid'

let currentTheme = 'default'

export function initMermaid() {
  mermaid.initialize({ startOnLoad: false, theme: currentTheme, securityLevel: 'loose' })
}

export async function renderMermaid(code, theme) {
  if (theme && theme !== currentTheme) {
    currentTheme = theme
    mermaid.initialize({ startOnLoad: false, theme: currentTheme, securityLevel: 'loose' })
  }
  try {
    const id = 'mermaid-' + Date.now()
    const { svg } = await mermaid.render(id, code)
    const viewBoxMatch = svg.match(/viewBox="([^"]*)"/)
    let naturalWidth = null, naturalHeight = null
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].trim().split(/[\s,]+/)
      naturalWidth = parseFloat(parts[2])
      naturalHeight = parseFloat(parts[3])
    }
    return { svg, naturalWidth, naturalHeight, error: null }
  } catch (err) {
    return { svg: null, error: err.message || 'Mermaid parse error' }
  }
}

export function exportSVG(containerEl) {
  const svg = containerEl?.querySelector('svg')
  if (!svg) return
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
  downloadBlob(blob, 'chart.svg')
}

export function exportPNG(containerEl) {
  const svg = containerEl?.querySelector('svg')
  if (!svg) return
  const scale = 2
  const width = svg.getBoundingClientRect().width || 800
  const height = svg.getBoundingClientRect().height || 600
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const svgData = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  img.onload = () => {
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    canvas.toBlob((pngBlob) => downloadBlob(pngBlob, 'chart.png'), 'image/png')
  }
  img.src = url
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
