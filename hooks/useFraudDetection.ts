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
        fonts: getAvailableFonts()
      }

      const hash = btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
      
      setFingerprint({
        fingerprint: hash,
        screenResolution: data.screen,
        timezone: data.timezone,
        language: data.language,
        platform: data.platform
      })
    }

    generateFingerprint()
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
    
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  } catch {
    return 'webgl-error'
  }
}

function getAvailableFonts(): string {
  const fonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Georgia', 'Verdana']
  return fonts.filter(font => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    
    ctx.font = `12px ${font}, monospace`
    const width1 = ctx.measureText('test').width
    
    ctx.font = '12px monospace'
    const width2 = ctx.measureText('test').width
    
    return width1 !== width2
  }).join(',')
}
