// Background

import PropTypes from 'prop-types'
import React, { Component } from 'react'
import * as THREE from 'three'
import MTLLoader from 'three-mtl-loader'
import OBJLoader from 'three-obj-loader'
OBJLoader(THREE)

import customShader from './customShader'
import head from './geometry/head 3 low res.obj'
import headRotation from './headRotation'
import mainMatcap from './images/mainMatcap.jpg'
import whiteMatcap from './images/whiteMatcap.jpg'
import Wrapper from './Wrapper'

class Scene extends React.PureComponent {
  constructor(props, context) {
    super(props, context)
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.animate = this.animate.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)

    // head ////////////

    // head materials
    this.mainMatcapMaterial = customShader(mainMatcap)
    this.whiteMatcapMaterial = customShader(whiteMatcap)

    // load head
    this.loader = new THREE.OBJLoader()

    this.loader.load(head, object => {
      object.traverse(child => {

        if (child instanceof THREE.Mesh) {

          if (child.name == 'head') {
            child.material = this.mainMatcapMaterial

          } else {
            child.material = this.whiteMatcapMaterial
          }
        }
      })

      this.head = object

      object.position.x = 0
      object.position.y = 5
      this.scene.add(object)
    })
  }

  handleMouseMove(evt) {
    this.mouse = {
      start: true,
      x: ( evt.clientX - this.windowHalfX ) * 0.7,
      y: ( evt.clientY - this.windowHalfY ) * 0.5
    }
  }

  componentDidMount() {
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.scene = new THREE.Scene()


    // Triangle Lines ////////////////

    // position the shapes
    const shapePos = {
      x: -62,
      y: 45,
      z: 20
    }

    // scale the shapes
    const shapeScale = 1.7

    // shape in front to create an invisible wall
    const hideShape = new THREE.Shape()
    hideShape.moveTo(0, -46)   // left line start
    hideShape.lineTo(40, -70)  // left line end
    hideShape.moveTo(43, -68)  // right line start
    hideShape.lineTo(83, -3)   // right line end
    hideShape.lineTo(83, -33)
    hideShape.lineTo(43, -98)
    hideShape.lineTo(40, -90)
    hideShape.lineTo(0, -66)
    hideShape.lineTo(0, -46) // close path

    const hideGeometry = new THREE.ShapeBufferGeometry(hideShape)
    const hideMesh = new THREE.Mesh(hideGeometry, new THREE.MeshBasicMaterial({
      color: 0x111111
    }))
    hideMesh.position.set(shapePos.x, shapePos.y, shapePos.z)
    hideMesh.scale.set(shapeScale, shapeScale, shapeScale)
    this.scene.add(hideMesh)

    // adds line shapes
    this.addLine = (shape, pos, scale=1) => {
      var shapePoints = shape.getPoints()
      var shapeGeometry = new THREE.BufferGeometry().setFromPoints(shapePoints)
      var shapeLine = new THREE.Line(shapeGeometry, new THREE.LineBasicMaterial({
        color: 0x222222,
        linewidth: 1
      }))
      shapeLine.position.set(...pos)
      const scaleNew = shapeScale * scale
      shapeLine.scale.set(scaleNew, scaleNew, scaleNew)
      this.scene.add(shapeLine)
    }

    const leftFrontShape = new THREE.Shape()
    leftFrontShape.moveTo(0, -46)
    leftFrontShape.lineTo(40, -70)
    this.addLine(leftFrontShape, [shapePos.x, shapePos.y, shapePos.z + 1])

    const rightFrontShape = new THREE.Shape()
    rightFrontShape.moveTo(43, -68)
    rightFrontShape.lineTo(83, -3)
    this.addLine(rightFrontShape, [shapePos.x, shapePos.y, shapePos.z + 1])

    const backShape = new THREE.Shape()
    backShape.moveTo(0, -43)
    backShape.lineTo(82, 0)
    this.addLine(backShape, [shapePos.x - 14, shapePos.y + 11, shapePos.z - 50], 1.23)


    // renderer ///////////

    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setClearColor(0x111111)
    this.renderer.setSize(this.width, this.height)


    // CAMERA //////////////

    this.camera = new THREE.PerspectiveCamera(
      45,                         // view angle
      this.width / this.height,   // aspect ratio
      0.1,                        // near
      1000                        // far
    )
    this.camera.position.x = 0
    this.camera.position.z = 250


    // MOUSE MOVE ////////////////

    this.mouse = {
      start: false,
      x: 0,
      y: 0
    }

    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    document.addEventListener( 'mousemove', this.handleMouseMove, false )

    this.mount.appendChild(this.renderer.domElement)
    this.start()
  }

  componentWillUnmount() {
    this.stop()
    this.mount.removeChild(this.renderer.domElement)
  }

  start() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }

  stop() {
    cancelAnimationFrame(this.frameId)
  }

  animate() {
    // head rotation
    if (this.head) {
      headRotation(this.head.rotation, this.mouse)
    }

    this.renderer.render(this.scene, this.camera)
    this.frameId = window.requestAnimationFrame(this.animate)

    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.setViewOffset(this.width, this.height, this.width / 4, 0, this.width, this.height)
    this.camera.aspect = (this.width) / (this.height)
    this.renderer.setSize(this.width, this.height)
    this.camera.updateProjectionMatrix()
  }

  render() {
    return (
      <Wrapper>
        <div
          ref={mount => { this.mount = mount }}
        />
      </Wrapper>
    )
  }
}

export default Scene
