import Phaser from '../lib/phaser'
import type { MissionScenario } from '../types'

export class SectionalMap {
  private waypointLabels: Phaser.GameObjects.Text[] = []
  private waypointMarkers: Phaser.GameObjects.Arc[] = []
  private routeLines: Phaser.GameObjects.Line[] = []
  private plane: Phaser.GameObjects.Triangle

  constructor(
    scene: Phaser.Scene,
    mission: MissionScenario,
    bounds: { x: number; y: number; width: number; height: number },
  ) {
    const { x, y, width, height } = bounds
    scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0xf2ead3, 0.98).setStrokeStyle(3, 0x475569, 0.85)

    for (let i = 0; i <= 6; i += 1) {
      const horizontalY = y + (height / 6) * i
      scene.add.line(0, 0, x, horizontalY, x + width, horizontalY, 0x8b7e66, 0.12).setOrigin(0, 0)
    }

    for (let i = 0; i <= 8; i += 1) {
      const verticalX = x + (width / 8) * i
      scene.add.line(0, 0, verticalX, y, verticalX, y + height, 0x8b7e66, 0.12).setOrigin(0, 0)
    }

    scene.add.ellipse(x + width * 0.72, y + height * 0.38, 250, 170, 0x60a5fa, 0.08).setStrokeStyle(2, 0x3b82f6, 0.35)
    scene.add.ellipse(x + width * 0.72, y + height * 0.38, 360, 250, 0x60a5fa, 0.04).setStrokeStyle(1, 0x2563eb, 0.3)
    scene.add.text(x + width * 0.72, y + height * 0.29, 'Louisville Class C', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#1d4ed8',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const river = new Phaser.Curves.Spline([
      x + 80, y + height - 80,
      x + 220, y + height - 120,
      x + 430, y + height - 170,
      x + 670, y + height - 220,
      x + width - 80, y + 80,
    ])
    const graphics = scene.add.graphics()
    graphics.lineStyle(6, 0x3b82f6, 0.28)
    river.draw(graphics)

    scene.add.text(x + 28, y + 20, 'LEXINGTON SECTIONAL (SIMPLIFIED)', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#334155',
      fontStyle: 'bold',
    })

    const compassX = x + width - 110
    const compassY = y + 95
    scene.add.circle(compassX, compassY, 48, 0xffffff, 0.55).setStrokeStyle(2, 0x334155, 0.8)
    scene.add.line(0, 0, compassX, compassY - 32, compassX, compassY + 32, 0x0f172a, 0.8).setOrigin(0, 0)
    scene.add.line(0, 0, compassX - 32, compassY, compassX + 32, compassY, 0x0f172a, 0.8).setOrigin(0, 0)
    scene.add.text(compassX, compassY - 38, 'N', { fontFamily: 'Arial', fontSize: '16px', color: '#0f172a', fontStyle: 'bold' }).setOrigin(0.5)
    scene.add.text(compassX + 38, compassY, 'E', { fontFamily: 'Arial', fontSize: '16px', color: '#0f172a', fontStyle: 'bold' }).setOrigin(0.5)
    scene.add.text(compassX, compassY + 38, 'S', { fontFamily: 'Arial', fontSize: '16px', color: '#0f172a', fontStyle: 'bold' }).setOrigin(0.5)
    scene.add.text(compassX - 38, compassY, 'W', { fontFamily: 'Arial', fontSize: '16px', color: '#0f172a', fontStyle: 'bold' }).setOrigin(0.5)

    for (let i = 0; i < mission.route.waypoints.length - 1; i += 1) {
      const start = mission.route.waypoints[i]
      const end = mission.route.waypoints[i + 1]
      this.routeLines.push(
        scene.add.line(0, 0, start.x, start.y, end.x, end.y, 0xdc2626, 0.82).setOrigin(0, 0).setLineWidth(4, 4),
      )
    }

    mission.route.waypoints.forEach((waypoint) => {
      const marker = scene.add.circle(waypoint.x, waypoint.y, waypoint.airport ? 11 : 7, waypoint.airport ? 0x15803d : 0x475569)
      marker.setStrokeStyle(2, 0xf8fafc, 0.9)
      this.waypointMarkers.push(marker)
      this.waypointLabels.push(scene.add.text(waypoint.x + 12, waypoint.y - 14, waypoint.name, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#0f172a',
        backgroundColor: '#f8fafccc',
        padding: { left: 4, right: 4, top: 2, bottom: 2 },
      }))
    })

    this.plane = scene.add.triangle(mission.route.waypoints[0].x, mission.route.waypoints[0].y, 0, 20, 32, 10, 0, 0, 0xf97316)
    this.plane.setStrokeStyle(2, 0x7c2d12, 0.9)
  }

  updatePlanePosition(x: number, y: number, heading: number): void {
    this.plane.setPosition(x, y)
    this.plane.setRotation(Phaser.Math.DegToRad(heading + 90))
  }
}
