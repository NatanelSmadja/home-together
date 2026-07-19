import { registerSW } from 'virtual:pwa-register'

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined
let updateAvailable = false

export function registerPwa() {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateAvailable = true
      window.dispatchEvent(new CustomEvent('home-together-update', { detail: { available: true } }))
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('home-together-offline-ready'))
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      window.setInterval(() => registration.update(), 60 * 60 * 1000)
    }
  })
}

export function isPwaUpdateAvailable() {
  return updateAvailable
}

export async function forceAppUpdate() {
  const registration = await navigator.serviceWorker?.getRegistration()
  await registration?.update()

  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  if (updateServiceWorker) {
    await updateServiceWorker(true)
    return
  }

  window.location.reload()
}
