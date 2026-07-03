import 'aframe'
import './immersive-training.css'

const sceneOrder = ['bravo', 'doorway', 'interior']
const sceneIndex = Object.fromEntries(sceneOrder.map((sceneId, index) => [sceneId, index]))
const strategyCopy = {
  offensive:
    'Offensive selected. Push to confine the garage fire early, but keep door control and interior tenability in view at every step.',
  defensive:
    'Defensive selected. Slow the tempo, read extension risk, and protect egress before committing farther inside.',
}
const scenes = {
  bravo: {
    id: 'bravo',
    name: 'BRAVO side size-up',
    sky: '#bravo-panorama',
    skyRotation: '0 -92 0',
    summary:
      'Start on the Bravo side. Read smoke showing from the structure and decide how conditions on this flank affect your first move.',
    question: 'From the Bravo side, what should drive your first tactical move?',
    choices: [
      {
        label: 'Read extension, identify flow-path risk, and communicate how Bravo conditions shape the next advance.',
        feedback:
          'Strong. Bravo is giving you information about extension and potential air-track problems before the front-door push.',
      },
      {
        label: 'Commit everyone straight to entry without using Bravo conditions to update the plan.',
        feedback:
          'Too narrow. The whole point of the Bravo stop is to improve the plan before crews stack on the doorway.',
      },
    ],
    hotspots: [
      {
        id: 'bravo-observe',
        label: 'Observe smoke conditions',
        position: '-2.8 0.35 -3.7',
        message:
          'Watch the smoke volume and pressure off the Bravo side. This is your last exterior chance to refine the plan before the doorway.',
      },
      {
        id: 'bravo-to-doorway',
        label: 'Advance to doorway',
        position: '2.6 0.18 -3.8',
        target: 'doorway',
      },
    ],
  },
  doorway: {
    id: 'doorway',
    name: 'Doorway control',
    sky: '#doorway-panorama',
    skyRotation: '0 -102 0',
    summary:
      'You are at the doorway. Control the opening, read the threshold, and decide how your declared strategy changes the pace of entry.',
    question: 'At the doorway, what is the highest-value action right now?',
    choices: [
      {
        label: 'Control the door, coordinate the line, and manage the opening so conditions do not worsen before the push.',
        feedback:
          'Exactly. The doorway is a control point, not just a portal. Your strategy still has to respect flow path and coordination.',
      },
      {
        label: 'Leave the opening uncontrolled because speed matters more than threshold discipline.',
        feedback:
          'Poor threshold management. A rushed opening can make the interior worse before crews gain control.',
      },
    ],
    hotspots: [
      {
        id: 'doorway-hold',
        label: 'Check threshold conditions',
        position: '-2.2 0.15 -3.9',
        message:
          'Read visibility, heat, and how quickly the opening is changing the interior. This is where your declared strategy becomes real.',
      },
      {
        id: 'doorway-to-interior',
        label: 'Advance interior',
        position: '1.5 0.06 -4.2',
        target: 'interior',
      },
    ],
  },
  interior: {
    id: 'interior',
    name: 'Interior decision point',
    sky: '#interior-panorama',
    skyRotation: '0 -88 0',
    summary:
      'Inside the structure, maintain orientation, tenability awareness, and a clear objective. This is where commitment pressure peaks.',
    question: 'Once inside, what should govern the next decision?',
    choices: [
      {
        label: 'Keep re-evaluating heat, visibility, orientation, and whether the path still supports rescue or confinement goals.',
        feedback:
          'Correct. Interior progress should stay tied to conditions, not momentum for its own sake.',
      },
      {
        label: 'Continue deeper automatically because crews have already crossed the threshold.',
        feedback:
          'That is the trap. Interior commitment never overrides changing conditions and survivability.',
      },
    ],
    hotspots: [
      {
        id: 'interior-hold',
        label: 'Hold and reassess',
        position: '2.5 0.3 -3.6',
        message:
          'Use this pause to decide whether your offensive or defensive posture still matches what the interior is telling you.',
      },
      {
        id: 'interior-reset',
        label: 'Restart scenario',
        position: '-1.8 0.12 4.1',
        action: 'reset',
      },
    ],
  },
}

const app = document.querySelector('#app')
const welcomeOverlay = document.querySelector('#welcome-overlay')
const startButton = document.querySelector('#start-button')
const phaseTitle = document.querySelector('#phase-title')
const phaseCopy = document.querySelector('#phase-copy')
const primaryActions = document.querySelector('#primary-actions')
const briefingCard = document.querySelector('#briefing-card')
const briefingInstruction = document.querySelector('#briefing-instruction')
const briefingVideo = document.querySelector('#briefing-video')
const strategyCard = document.querySelector('#strategy-card')
const strategyOptions = document.querySelector('#strategy-options')
const strategyFeedback = document.querySelector('#strategy-feedback')
const sceneCard = document.querySelector('#scene-card')
const sceneTitle = document.querySelector('#scene-title')
const sceneSummary = document.querySelector('#scene-summary')
const sceneButtons = document.querySelector('#scene-buttons')
const checkpointCard = document.querySelector('#checkpoint-card')
const decisionQuestion = document.querySelector('#decision-question')
const decisionOptions = document.querySelector('#decision-options')
const decisionFeedback = document.querySelector('#decision-feedback')
const timeline = document.querySelector('#timeline')
const sky = document.querySelector('#training-sky')
const hotspotLayer = document.querySelector('#hotspot-layer')
const sceneEl = document.querySelector('a-scene')

if (
  !app ||
  !welcomeOverlay ||
  !startButton ||
  !phaseTitle ||
  !phaseCopy ||
  !primaryActions ||
  !briefingCard ||
  !briefingInstruction ||
  !briefingVideo ||
  !strategyCard ||
  !strategyOptions ||
  !strategyFeedback ||
  !sceneCard ||
  !sceneTitle ||
  !sceneSummary ||
  !sceneButtons ||
  !checkpointCard ||
  !decisionQuestion ||
  !decisionOptions ||
  !decisionFeedback ||
  !timeline ||
  !sky ||
  !hotspotLayer ||
  !sceneEl
) {
  throw new Error('Immersive training page failed to initialize')
}

const state = {
  phase: 'welcome',
  strategy: '',
  currentSceneId: 'bravo',
  furthestSceneIndex: 0,
}

function setDecisionFeedback(message) {
  decisionFeedback.textContent = message
}

function setStrategyFeedback(message) {
  strategyFeedback.textContent = message
}

function syncSceneViewport() {
  const targetHeight = window.innerWidth <= 1080 ? Math.max(window.innerHeight * 0.68, 420) : Math.max(window.innerHeight - 72, 640)

  sceneEl.style.width = '100%'
  sceneEl.style.height = `${Math.round(targetHeight)}px`

  if (typeof sceneEl.resize === 'function') {
    sceneEl.resize()
  }
}

function updateTimeline() {
  const phaseRank = {welcome: 0, briefing: 1, strategy: 2, scene: 3}
  const currentRank = phaseRank[state.phase]

  timeline.querySelectorAll('li').forEach((item) => {
    const itemRank = phaseRank[item.dataset.step]
    item.classList.toggle('is-active', itemRank === currentRank)
    item.classList.toggle('is-complete', itemRank < currentRank)
  })
}

function setPhase(phase) {
  state.phase = phase
  app.dataset.phase = phase
  welcomeOverlay.hidden = phase !== 'welcome'
  strategyCard.hidden = !['strategy', 'scene'].includes(phase)
  sceneCard.hidden = phase !== 'scene'
  checkpointCard.hidden = phase !== 'scene'
  updateTimeline()
  renderPrimaryActions()
  renderSceneButtons()
  renderHotspots()
}

function getScene(sceneId = state.currentSceneId) {
  return scenes[sceneId]
}

function goToScene(sceneId) {
  const targetIndex = sceneIndex[sceneId]
  if (targetIndex > state.furthestSceneIndex) return

  state.currentSceneId = sceneId
  state.furthestSceneIndex = Math.max(state.furthestSceneIndex, targetIndex)
  renderScene()
}

function handleHotspot(hotspot) {
  if (hotspot.target) {
    const targetIndex = sceneIndex[hotspot.target]
    if (targetIndex === sceneIndex[state.currentSceneId] + 1) {
      state.furthestSceneIndex = Math.max(state.furthestSceneIndex, targetIndex)
    }
    goToScene(hotspot.target)
    return
  }

  if (hotspot.action === 'reset') {
    resetScenario()
    return
  }

  if (hotspot.message) {
    setDecisionFeedback(hotspot.message)
  }
}

function createHotspot(hotspot) {
  const entity = document.createElement('a-entity')
  entity.setAttribute('class', 'clickable')
  entity.setAttribute('position', hotspot.position)
  entity.setAttribute('geometry', 'primitive: ring; radiusInner: 0.12; radiusOuter: 0.19')
  entity.setAttribute('material', 'color: #fb923c; shader: flat; opacity: 0.92')
  entity.setAttribute('animation__pulse', 'property: scale; dir: alternate; dur: 900; easing: easeInOutSine; loop: true; to: 1.18 1.18 1.18')

  const label = document.createElement('a-text')
  label.setAttribute('value', hotspot.label)
  label.setAttribute('align', 'center')
  label.setAttribute('color', '#ffffff')
  label.setAttribute('width', '3')
  label.setAttribute('position', '0 0.34 0')
  label.setAttribute('look-at', '[camera]')
  entity.appendChild(label)

  entity.addEventListener('click', () => handleHotspot(hotspot))
  return entity
}

function renderHotspots() {
  hotspotLayer.replaceChildren()
  if (state.phase !== 'scene') return

  getScene().hotspots.forEach((hotspot) => {
    hotspotLayer.appendChild(createHotspot(hotspot))
  })
}

function renderDecisionChoices(scene) {
  decisionOptions.replaceChildren()

  scene.choices.forEach((choice) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'choice-button'
    button.textContent = choice.label
    button.addEventListener('click', () => setDecisionFeedback(choice.feedback))
    decisionOptions.appendChild(button)
  })
}

function renderSceneButtons() {
  sceneButtons.replaceChildren()
  if (state.phase !== 'scene') return

  sceneOrder.forEach((sceneId) => {
    const scene = scenes[sceneId]
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `scene-button${sceneId === state.currentSceneId ? ' is-active' : ''}`
    button.disabled = sceneIndex[sceneId] > state.furthestSceneIndex
    button.textContent = scene.name
    button.addEventListener('click', () => goToScene(sceneId))
    sceneButtons.appendChild(button)
  })
}

function renderScene() {
  const scene = getScene()

  sky.setAttribute('src', scene.sky)
  sky.setAttribute('rotation', scene.skyRotation)
  sceneTitle.textContent = scene.name
  sceneSummary.textContent = scene.summary
  decisionQuestion.textContent = scene.question
  setDecisionFeedback('Choose a decision response or use the orange hotspots inside the panorama to keep moving.')
  renderDecisionChoices(scene)
  renderSceneButtons()
  renderHotspots()
}

function renderPrimaryActions() {
  primaryActions.replaceChildren()

  if (state.phase === 'welcome') {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'button button-primary'
    button.textContent = 'Start scenario'
    button.addEventListener('click', startScenario)
    primaryActions.appendChild(button)
    phaseTitle.textContent = 'Welcome screen'
    phaseCopy.textContent = 'Start the run, watch the garage-fire briefing, then commit to offensive or defensive strategy before entry.'
    return
  }

  if (state.phase === 'briefing') {
    phaseTitle.textContent = 'Watch the briefing'
    phaseCopy.textContent = 'The 360 scene is live behind the controls. Finish the initial garage-fire video to unlock the strategy decision.'
    return
  }

  if (state.phase === 'strategy') {
    phaseTitle.textContent = 'Declare your strategy'
    phaseCopy.textContent = 'Choose offensive or defensive posture. That locks in the tone of the Bravo-to-interior run.'
    return
  }

  phaseTitle.textContent = 'Move the scenario'
  phaseCopy.textContent = `${state.strategy ? `${state.strategy[0].toUpperCase()}${state.strategy.slice(1)} strategy declared.` : 'Strategy pending.'} Use hotspots or scene buttons to move Bravo → doorway → interior.`

  const resetButton = document.createElement('button')
  resetButton.type = 'button'
  resetButton.className = 'button'
  resetButton.textContent = 'Restart scenario'
  resetButton.addEventListener('click', resetScenario)
  primaryActions.appendChild(resetButton)
}

function renderStrategyOptions() {
  strategyOptions.replaceChildren()

  ;['offensive', 'defensive'].forEach((strategy) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'choice-button'
    button.textContent = strategy === 'offensive' ? 'Offensive' : 'Defensive'
    button.addEventListener('click', () => {
      state.strategy = strategy
      state.furthestSceneIndex = 0
      setStrategyFeedback(strategyCopy[strategy])
      setPhase('scene')
      goToScene('bravo')
    })
    strategyOptions.appendChild(button)
  })
}

function startScenario() {
  state.currentSceneId = 'bravo'
  renderScene()
  setPhase('briefing')
  briefingInstruction.textContent = 'Watch the initial garage-fire brief. Strategy selection unlocks automatically when the clip ends.'
  setStrategyFeedback('Awaiting video completion…')
  briefingVideo.currentTime = 0
  const playAttempt = briefingVideo.play()
  if (playAttempt?.catch) {
    playAttempt.catch(() => {
      briefingInstruction.textContent = 'Press play on the garage-fire brief. When it finishes, the strategy gate will unlock.'
    })
  }
}

function handleBriefingComplete() {
  if (state.phase !== 'briefing') return
  setPhase('strategy')
  briefingInstruction.textContent = 'Briefing complete. Declare offensive or defensive strategy to enter the Bravo-side scenario.'
  setStrategyFeedback('Choose a strategy to enter BRAVO.')
}

function resetScenario() {
  state.phase = 'welcome'
  state.strategy = ''
  state.currentSceneId = 'bravo'
  state.furthestSceneIndex = 0
  briefingVideo.pause()
  briefingVideo.currentTime = 0
  setStrategyFeedback('Awaiting video completion…')
  setDecisionFeedback('Choose a decision response or use the orange hotspots inside the panorama to keep moving.')
  renderScene()
  setPhase('welcome')
}

renderStrategyOptions()
renderScene()
setStrategyFeedback('Awaiting video completion…')
setDecisionFeedback('Choose a decision response or use the orange hotspots inside the panorama to keep moving.')
setPhase('welcome')
syncSceneViewport()

startButton.addEventListener('click', startScenario)
briefingVideo.addEventListener('ended', handleBriefingComplete)
window.addEventListener('resize', syncSceneViewport)
