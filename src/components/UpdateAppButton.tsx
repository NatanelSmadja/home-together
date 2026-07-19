import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { forceAppUpdate, isPwaUpdateAvailable } from '../pwa'

export function UpdateAppButton() {
  const [updating, setUpdating] = useState(false)
  const [available, setAvailable] = useState(isPwaUpdateAvailable())
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handle = () => setAvailable(true)
    window.addEventListener('home-together-update', handle)
    return () => window.removeEventListener('home-together-update', handle)
  }, [])

  async function update() {
    setUpdating(true)
    setMessage('בודק עדכון…')

    try {
      await forceAppUpdate()
      window.setTimeout(() => {
        setMessage('האפליקציה מעודכנת')
        setUpdating(false)
        setAvailable(false)
      }, 800)
    } catch {
      setMessage('לא הצלחנו לעדכן כרגע')
      setUpdating(false)
    }
  }

  return (
    <button className={`secondary-button compact update-app-button ${available ? 'has-update' : ''}`} onClick={update} disabled={updating}>
      <RefreshCw size={17} className={updating ? 'spin' : ''} />
      {available ? 'יש עדכון' : 'עדכון אפליקציה'}
      {message && <span className="button-toast">{message}</span>}
    </button>
  )
}
