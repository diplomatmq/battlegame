//src/three-knight.ts - 3D Cryo-Knight using global THREE
declare const THREE: any;

export class Knight3D {
  scene: any;
  camera: any;
  renderer: any;
  modelGroup: any;
  container: HTMLElement;
  isDestroyed: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    
    const rect = container.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000);
    this.camera.position.set(4, 2.5, 4);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    this.initModel();
    this.animate();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private initModel() {
    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.2 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.7, roughness: 0.15 });
    const eyeMat = new THREE.MeshStandardMaterial({ emissive: 0x67e8f9, emissiveIntensity: 2 });
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 });
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const shieldBaseMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
    const shieldSphereMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xdc2626, emissiveIntensity: 1 });
    const swordMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x67e8f9, emissiveIntensity: 0.8 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e40af });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.9), bodyMat);
    body.position.set(0, 0.5, 0);
    body.castShadow = true;
    this.modelGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.0), headMat);
    head.position.set(0, 1.9, 0);
    head.castShadow = true;
    this.modelGroup.add(head);

    // Eyes
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), eyeMat);
    leftEye.position.set(-0.25, 1.9, 0.51);
    this.modelGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), eyeMat);
    rightEye.position.set(0.25, 1.9, 0.51);
    this.modelGroup.add(rightEye);

    // Crystal
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), crystalMat);
    crystal.position.set(0, 2.6, 0);
    crystal.castShadow = true;
    this.modelGroup.add(crystal);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), limbMat);
    leftArm.position.set(-1.1, 0.6, 0);
    leftArm.castShadow = true;
    this.modelGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), limbMat);
    rightArm.position.set(1.1, 0.6, 0);
    rightArm.castShadow = true;
    this.modelGroup.add(rightArm);

    // Shield
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-1.8, 0.6, 0.2);
    
    const shieldBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32), shieldBaseMat);
    shieldBase.rotation.x = Math.PI / 2;
    shieldBase.castShadow = true;
    shieldGroup.add(shieldBase);

    const shieldSphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), shieldSphereMat);
    shieldSphere.position.z = 0.1;
    shieldGroup.add(shieldSphere);

    this.modelGroup.add(shieldGroup);

    // Sword
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), swordMat);
    sword.position.set(1.8, 0.8, 0);
    sword.rotation.z = -0.1;
    sword.castShadow = true;
    this.modelGroup.add(sword);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), legMat);
    leftLeg.position.set(-0.4, -0.9, 0);
    leftLeg.castShadow = true;
    this.modelGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), legMat);
    rightLeg.position.set(0.4, -0.9, 0);
    rightLeg.castShadow = true;
    this.modelGroup.add(rightLeg);
  }

  private onResize() {
    if (this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  private animate() {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate.bind(this));

    const time = performance.now() * 0.001;
    
    // Rotation (matching reference code)
    this.modelGroup.rotation.y += 0.003;

    // Bobbing/Floating (matching reference float intensity)
    this.modelGroup.position.y = Math.sin(time * 2) * 0.1;

    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
