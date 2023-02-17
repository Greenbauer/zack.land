import { BufferGeometry, Shape, Vector3 } from 'three'
import { darkestColor, borderColor } from '@/styles/_library.module.scss'

export default function RetroFrame() {
  const hiddenShape = new Shape()
  hiddenShape.moveTo(0, -46)
  hiddenShape.lineTo(40, -70)
  hiddenShape.moveTo(43, -68)
  hiddenShape.lineTo(83, -3)
  hiddenShape.lineTo(83, -33)
  hiddenShape.lineTo(43, -98)
  hiddenShape.lineTo(40, -90)
  hiddenShape.lineTo(0, -66)
  hiddenShape.lineTo(0, -46)

  const pointGeometry = (pointSets: [number, number, number][]) => new BufferGeometry()
    .setFromPoints(pointSets.map(points => new Vector3(...points)))

  const frontLeftLineGeometry: BufferGeometry = pointGeometry([
    [1, -46, 2],
    [39, -68.8, 2],
  ])

  const frontRightLineGeometry: BufferGeometry = pointGeometry([
    [42, -68.8, 2],
    [82.5, -3, 2],
  ])

  const backLineGeometry: BufferGeometry = pointGeometry([
    [-13, -41, -50],
    [83, 10, -50],
  ])

  return (
    <group position={[-62, 45, 20]} scale={1.7}>
      {/* @ts-ignore */}
      <line geometry={frontLeftLineGeometry}>
        <lineBasicMaterial color={borderColor} />
      </line>
      {/* @ts-ignore */}
      <line geometry={frontRightLineGeometry}>
        <lineBasicMaterial color={borderColor} />
      </line>
      {/* @ts-ignore */}
      <line geometry={backLineGeometry} scale={1.23}>
        <lineBasicMaterial color={borderColor} />
      </line>
      <mesh>
        <extrudeGeometry attach="geometry" args={[hiddenShape]} />
        <meshBasicMaterial color={darkestColor} />
      </mesh>
    </group>
  );
}
