import './fire-training.css'

type Scenario = {
  title: string
  description: string
  video: string
}

const scenario: Scenario = {
  title: 'House is on fire — stationary camera view',
  description:
    'Seed 866492833 · stationary viewpoint · first deployed scenario for immersive fire training.',
  video: '/training-assets/house-on-fire-stationary.mp4',
}

const video = document.querySelector<HTMLVideoElement>('#training-video')
const title = document.querySelector<HTMLElement>('#scenario-title')

if (!video || !title) {
  throw new Error('Fire training page failed to initialize')
}

title.textContent = `${scenario.title} — ${scenario.description}`
video.src = scenario.video
video.setAttribute('aria-label', scenario.title)
video.load()
