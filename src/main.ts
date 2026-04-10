import Phaser from './lib/phaser'
import './style.css'
import { DebriefScene } from './scenes/DebriefScene'
import { FlightScene } from './scenes/FlightScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { MissionBriefingScene } from './scenes/MissionBriefingScene'
import { PreflightScene } from './scenes/PreflightScene'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 800,
  parent: 'app',
  backgroundColor: '#020617',
  scene: [MainMenuScene, MissionBriefingScene, PreflightScene, FlightScene, DebriefScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
})

export default game
