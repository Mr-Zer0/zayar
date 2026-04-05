import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

function projectsRef(uid) {
  return collection(db, 'users', uid, 'projects')
}

function chartsRef(uid, projectId) {
  return collection(db, 'users', uid, 'projects', projectId, 'charts')
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function subscribeProjects(uid, onChange) {
  const q = query(projectsRef(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(projects)
  })
}

export async function saveProject(uid, project) {
  const ref = doc(projectsRef(uid), project.id)
  const data = { ...project, updatedAt: serverTimestamp() }
  if (!data.createdAt) data.createdAt = serverTimestamp()
  await setDoc(ref, data, { merge: true })
}

export async function deleteProject(uid, projectId) {
  await deleteDoc(doc(projectsRef(uid), projectId))
}

// ── Charts ────────────────────────────────────────────────────────────────────

export function subscribeCharts(uid, projectId, onChange) {
  const q = query(chartsRef(uid, projectId), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const charts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(charts)
  })
}

export async function saveChart(uid, projectId, chart) {
  const ref = doc(chartsRef(uid, projectId), chart.id)
  const data = { ...chart, updatedAt: serverTimestamp() }
  if (!data.createdAt) data.createdAt = serverTimestamp()
  await setDoc(ref, data, { merge: true })
}

export async function deleteChart(uid, projectId, chartId) {
  await deleteDoc(doc(chartsRef(uid, projectId), chartId))
}

// ── Migration ─────────────────────────────────────────────────────────────────

// Moves legacy flat charts (users/{uid}/charts/{chartId}) into a
// "My Charts" project under the nested structure, then deletes the originals.
export async function migrateFlatCharts(uid) {
  const flatRef = collection(db, 'users', uid, 'charts')
  const snap = await getDocs(flatRef)
  if (snap.empty) return

  const projectId = crypto.randomUUID()
  await setDoc(doc(projectsRef(uid), projectId), {
    id: projectId,
    name: 'My Charts',
    description: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  for (const d of snap.docs) {
    const chart = { id: d.id, ...d.data() }
    await setDoc(doc(chartsRef(uid, projectId), chart.id), {
      ...chart,
      updatedAt: serverTimestamp(),
    })
    await deleteDoc(d.ref)
  }
}
