import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ErrorBoundary } from 'react-error-boundary'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useEffect } from 'react'
import AppRoutes from './routes'
import { GlobalErrorFallback } from '@/components/layout/GlobalErrorFallback'

if (NProgress && typeof NProgress.configure === 'function') {
  NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.15 })
}

function RouterTracker() {
  const location = useLocation()
  
  useEffect(() => {
    NProgress.start()
    const timer = setTimeout(() => NProgress.done(), 150)
    return () => {
      clearTimeout(timer)
      NProgress.done()
    }
  }, [location.pathname])

  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
        <Router>
          <RouterTracker />
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App

