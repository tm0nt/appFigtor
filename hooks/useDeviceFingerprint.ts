import { useEffect, useState } from 'react'

interface DeviceFingerprint {
  fingerprint: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
}

export function useDeviceFingerprint(): DeviceFingerprint | null {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null)

  useEffect(() => {
    const generateFingerprint = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.textBaseline = 'top'
          ctx.font = '14px Arial'
          ctx.fillText('Device fingerprint', 2, 2)
        }

        const data = {
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          canvasFingerprint: canvas.toDataURL(),
          webgl: getWebGLFingerprint(),
          fonts: getAvailableFonts(),
          memory: (navigator as any).deviceMemory || 'unknown',
          cores: navigator.hardwareConcurrency || 'unknown',
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || 'unknown'
        }

        const hash = btoa(JSON.stringify(data))
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 32)
        
        setFingerprint({
          fingerprint: hash,
          screenResolution: data.screen,
          timezone: data.timezone,
          language: data.language,
          platform: data.platform
        })
      } catch (error) {
        console.error('Erro gerando fingerprint:', error)
        // Fallback simples
        const fallbackData = {
          screen: `${screen.width}x${screen.height}`,
          timezone: 'unknown',
          language: navigator.language || 'unknown',
          platform: navigator.platform || 'unknown',
          userAgent: navigator.userAgent || 'unknown'
        }
        
        const fallbackHash = btoa(JSON.stringify(fallbackData))
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 32)
          
        setFingerprint({
          fingerprint: fallbackHash,
          screenResolution: fallbackData.screen,
          timezone: fallbackData.timezone,
          language: fallbackData.language,
          platform: fallbackData.platform
        })
      }
    }

    // Aguardar carregamento completo
    if (document.readyState === 'complete') {
      generateFingerprint()
    } else {
      window.addEventListener('load', generateFingerprint)
      return () => window.removeEventListener('load', generateFingerprint)
    }
  }, [])

  return fingerprint
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return 'no-webgl'
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return 'no-debug-info'
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    
    return `${vendor}-${renderer}`.substring(0, 50)
  } catch {
    return 'webgl-error'
  }
}

function getAvailableFonts(): string {
  const fonts = [
    'Arial', 'Times', 'Courier', 'Helvetica', 'Georgia', 'Verdana',
    'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
  ]
  
  try {
    return fonts.filter(font => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      
      ctx.font = `12px ${font}, monospace`
      const width1 = ctx.measureText('mmmmmmmmmmlli').width
      
      ctx.font = '12px monospace'
      const width2 = ctx.measureText('mmmmmmmmmmlli').width
      
      return width1 !== width2
    }).join(',')
  } catch {
    return 'font-detection-error'
  }
}

// Hook para detectar se o dispositivo mudou
export function useDeviceChange(currentFingerprint: string | null) {
  const [hasChanged, setHasChanged] = useState(false)
  
  useEffect(() => {
    if (!currentFingerprint) return
    
    const storedFingerprint = localStorage.getItem('device_fingerprint')
    
    if (storedFingerprint && storedFingerprint !== currentFingerprint) {
      setHasChanged(true)
    } else if (!storedFingerprint) {
      localStorage.setItem('device_fingerprint', currentFingerprint)
    }
  }, [currentFingerprint])
  
  return hasChanged
}