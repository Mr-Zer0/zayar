import mermaid from 'mermaid'

let currentTheme = 'default'
let lastCode = ''

export function initMermaid() {
  mermaid.initialize({ startOnLoad: false, theme: currentTheme, securityLevel: 'loose' })
}

export async function renderPreview(code, theme) {
  if (theme && theme !== currentTheme) {
    currentTheme = theme
    mermaid.initialize({ startOnLoad: false, theme: currentTheme, securityLevel: 'loose' })
  }
  lastCode = code
  const container = document.getElementById('preview-container')
  const errorBar = document.getElementById('preview-error')
  if (!container) return

  try {
    const id = 'mermaid-' + Date.now()
    const { svg } = await mermaid.render(id, code)
    container.innerHTML = svg
    if (errorBar) {
      errorBar.textContent = ''
      errorBar.style.display = 'none'
    }
  } catch (err) {
    if (errorBar) {
      errorBar.textContent = err.message || 'Mermaid parse error'
      errorBar.style.display = 'block'
    }
    // Keep previous render visible — do not clear container
  }
}

export function setTheme(theme) {
  currentTheme = theme
  if (lastCode) renderPreview(lastCode, theme)
}

export function exportSVG() {
  const svg = document.querySelector('#preview-container svg')
  if (!svg) return
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
  downloadBlob(blob, 'chart.svg')
}

export function exportPNG() {
  const svg = document.querySelector('#preview-container svg')
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
