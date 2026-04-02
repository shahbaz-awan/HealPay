import { useState, useEffect } from 'react'
import * as JoyrideModule from 'react-joyride'
import { Step } from 'react-joyride'

const Joyride = (JoyrideModule as any).default || JoyrideModule
import { useAuthStore } from '@/store/authStore'

export function DashboardTour() {
  const [run, setRun] = useState(false)
  const { user } = useAuthStore()

  const steps: Step[] = [
    {
      target: 'body',
      content: 'Welcome to the HealPay Dashboard! Let us show you around.',
      placement: 'center',
    },
    {
      target: '.tour-sidebar',
      content: 'Navigate between your primary tools here, from encounters to billing queues.',
    },
    {
      target: '.tour-search',
      content: 'Instantly find patients, claims, or appointments using the global search (Ctrl+K).',
    },
    {
      target: '.tour-theme',
      content: 'Working late? Toggle dark mode to protect your eyes during long shifts.',
    }
  ]

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`tour-seen-${user?.id}`)
    if (!hasSeenTour && user) {
      setTimeout(() => setRun(true), 1500) // Delay to let the UI settle
    }
  }, [user])

  const handleJoyrideCallback = (data: any) => {
    const { status } = data
    if (['finished', 'skipped'].includes(status)) {
      setRun(false)
      localStorage.setItem(`tour-seen-${user?.id}`, 'true')
    }
  }

  if (!user) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
          zIndex: 10000,
        }
      }}
    />
  )
}
