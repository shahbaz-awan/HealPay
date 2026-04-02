import { FallbackProps } from 'react-error-boundary'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import Button from '@/components/ui/Button'

export function GlobalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h2>
          <p className="text-slate-600 mb-6 font-medium">We encountered an unexpected error while processing your request.</p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-8 text-left border border-slate-100 overflow-auto max-h-32">
            <p className="text-xs font-mono text-red-600 break-words">{error instanceof Error ? error.message : String(error)}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={resetErrorBoundary} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full sm:w-auto text-slate-700 bg-white border-slate-200 hover:bg-slate-50">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
