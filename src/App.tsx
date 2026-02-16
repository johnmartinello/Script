import { useProjectStore } from '@/renderer/store/projectStore'
import { AppShell } from '@/renderer/components/AppShell'
import { StartScreen } from '@/renderer/components/StartScreen'

function App() {
  const project = useProjectStore((s) => s.project)
  if (!project) return <StartScreen />
  return <AppShell />
}

export default App
