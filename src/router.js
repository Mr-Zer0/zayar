export function parseRoute(pathname) {
  const chartMatch = pathname.match(/^\/project\/([^/]+)\/chart\/([^/]+)$/)
  if (chartMatch) return { projectId: chartMatch[1], chartId: chartMatch[2] }
  const projectMatch = pathname.match(/^\/project\/([^/]+)$/)
  if (projectMatch) return { projectId: projectMatch[1], chartId: null }
  return { projectId: null, chartId: null }
}

export function navigate(path) {
  if (window.location.pathname !== path) history.pushState(null, '', path)
}
