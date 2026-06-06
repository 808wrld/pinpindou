import { ErrorBoundary } from './ErrorBoundary'
import { Layout } from './Layout'
import { Router } from './Router'

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Router />
      </Layout>
    </ErrorBoundary>
  )
}
