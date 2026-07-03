import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import './panorama.css'

const panoramaUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg'

const viewer = new Viewer({
  container: 'viewer',
  panorama: panoramaUrl,
  caption: 'Photo Sphere Viewer demo',
  description:
    '<strong>Deployment check:</strong> this demo is running from a standalone Vite page with the core Photo Sphere Viewer package.',
  defaultYaw: '145deg',
  defaultPitch: '-8deg',
  defaultZoomLvl: 18,
  mousewheelCtrlKey: false,
  touchmoveTwoFingers: false,
  navbar: ['zoom', 'move', 'description', 'caption', 'fullscreen'],
  loadingTxt: 'Loading 360 panorama…',
})

window.addEventListener('beforeunload', () => {
  viewer.destroy()
})
