import 'aframe'
import './immersive-training.css'

const scenes = {
  alpha: {
    id: 'alpha',
    name: 'Alpha Side Size-Up',
    sky: '#alpha-side-panorama',
    skyRotation: '0 -78 0',
    summary:
      'Start outside on the alpha side. Read smoke volume, note fire location, and decide whether conditions justify immediate entry or a wider 360.',
    question: 'On arrival, what should anchor your first tactical decision?',
    choices: [
      {
        label: 'Complete a fast exterior size-up while confirming fire location and occupant profile.',
        feedback:
          'Strong choice. The scene is about reading conditions before committing crews into an unknown flow path.',
      },
      {
        label: 'Force the nearest opening immediately before confirming where the main body of fire is.',
        feedback:
          'Too aggressive for the information available. The trainer should reward reading smoke, layout, and likely victim area first.',
      },
      {
        label: 'Vent high immediately from the exterior before the attack line is in place.',
        feedback:
          'Not yet. Vent timing should support the coordinated interior plan, not outpace it.',
      },
    ],
    hotspots: [
      {
        id: 'alpha-to-front',
        label: 'Move to front door',
        position: '2.4 0.2 -3.8',
        target: 'frontDoor',
      },
      {
        id: 'alpha-focus-fire',
        label: 'Focus on fire room',
        position: '-2.6 0.55 -3.5',
        onClick: () => setFeedback('Scan the exterior opening, smoke pressure, and any extension indicators before advancing crews.'),
      },
    ],
  },
  frontDoor: {
    id: 'frontDoor',
    name: 'Front Door Threshold',
    sky: '#front-door-panorama',
    skyRotation: '0 -100 0',
    summary:
      'You are now at the threshold. Evaluate door control, visibility, and how opening this path could influence interior conditions.',
    question: 'At the front door, what is the best immediate priority?',
    choices: [
      {
        label: 'Control the door, cool if needed, and coordinate entry with the charged line.',
        feedback:
          'Exactly. Threshold discipline is a major decision point in preventing air track from worsening interior tenability.',
      },
      {
        label: 'Leave the entry fully open to improve visibility before the line is ready.',
        feedback:
          'Risky. An uncontrolled opening can rapidly intensify interior conditions.',
      },
      {
        label: 'Send crews interior without a clear communication plan on search vs. fire attack.',
        feedback:
          'That loses tactical clarity. Entry decisions should align assignment, line placement, and victim priorities.',
      },
    ],
    hotspots: [
      {
        id: 'front-to-alpha',
        label: 'Back to alpha side',
        position: '-3.8 0.15 -2.6',
        target: 'alpha',
      },
      {
        id: 'front-to-entry',
        label: 'Advance inside',
        position: '1.2 0.05 -4.1',
        target: 'entry',
      },
    ],
  },
  entry: {
    id: 'entry',
    name: 'Interior Entry Conditions',
    sky: '#entry-panorama',
    skyRotation: '0 -86 0',
    summary:
      'Inside the structure, pay attention to visibility, heat, and the likely route to the seat of the fire. This is where decision-making pressure increases fast.',
    question: 'Once interior conditions begin to tighten, what should guide the next move?',
    choices: [
      {
        label: 'Reassess tenability, maintain orientation, and decide whether the current path still supports the objective.',
        feedback:
          'Yes. Interior immersion is about constant re-evaluation, not blind momentum.',
      },
      {
        label: 'Continue deeper solely because crews already committed through the door.',
        feedback:
          'That is the trap. Commitment should not override changing interior conditions.',
      },
      {
        label: 'Split crews immediately without a shared reference point or hose-line orientation.',
        feedback:
          'Poor interior discipline. In a real trainer we can score this as increased disorientation risk.',
      },
    ],
    hotspots: [
      {
        id: 'entry-to-front',
        label: 'Retreat to threshold',
        position: '-1.4 0.1 4.3',
        target: 'frontDoor',
      },
      {
        id: 'entry-hold-point',
        label: 'Hold and reassess',
        position: '2.7 0.4 -3.6',
        onClick: () => setFeedback('Good pause point. In the scored version this hotspot can trigger a mini-debrief or telemetry event.'),
      },
    ],
  },
}

const sky = document.querySelector('#training-sky')
const hotspotLayer = document.querySelector('#hotspot-layer')
const sceneButtons = document.querySelector('#scene-buttons')
const sceneSummary = document.querySelector('#scene-summary')
const decisionQuestion = document.querySelector('#decision-question')
const decisionOptions = document.querySelector('#decision-options')
const decisionFeedback = document.querySelector('#decision-feedback')

if (!sky || !hotspotLayer || !sceneButtons || !sceneSummary || !decisionQuestion || !decisionOptions || !decisionFeedback) {
  throw new Error('Immersive training page failed to initialize')
}

let currentSceneId = 'alpha'

function setFeedback(message) {
  decisionFeedback.textContent = message
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
  label.setAttribute('width', '2.8')
  label.setAttribute('position', '0 0.34 0')
  label.setAttribute('look-at', '[camera]')
  entity.appendChild(label)

  entity.addEventListener('click', () => {
    if (hotspot.target) {
      renderScene(hotspot.target)
    }
    if (hotspot.onClick) {
      hotspot.onClick()
    }
  })

  return entity
}

function renderDecisionChoices(scene) {
  decisionOptions.replaceChildren()

  scene.choices.forEach((choice) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'choice-button'
    button.textContent = choice.label
    button.addEventListener('click', () => setFeedback(choice.feedback))
    decisionOptions.appendChild(button)
  })
}

function renderSceneButtons() {
  sceneButtons.replaceChildren()

  Object.values(scenes).forEach((scene) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `scene-button${scene.id === currentSceneId ? ' is-active' : ''}`
    button.textContent = scene.name
    button.addEventListener('click', () => renderScene(scene.id))
    sceneButtons.appendChild(button)
  })
}

function renderScene(sceneId) {
  const scene = scenes[sceneId]
  currentSceneId = sceneId

  sky.setAttribute('src', scene.sky)
  sky.setAttribute('rotation', scene.skyRotation)
  sceneSummary.textContent = scene.summary
  decisionQuestion.textContent = scene.question
  setFeedback('Choose an option or click a hotspot inside the scene to continue the exercise.')
  renderDecisionChoices(scene)
  renderSceneButtons()

  hotspotLayer.replaceChildren()
  scene.hotspots.forEach((hotspot) => {
    hotspotLayer.appendChild(createHotspot(hotspot))
  })
}

renderScene(currentSceneId)
