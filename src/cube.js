import { randomInteger } from "./utilities";

const maxFPS = 10;

export class Cube {
    //ThreeJS variables
    renderer = null;

    camera = null;

    scene = null;

    raycaster = null;

    pointer = null;

    cube = null;

    uniforms = null;

    //animations variables

    lastTimestamp = 0;

    timestep = 1000 / maxFPS;

    animationComplete = true;

    isDestroyed = false;

    constructor(canvas) {
        this.renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 400;

        this.scene = new THREE.Scene();

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        
        //Биндинги
        this.animationLoop = this.animationLoop.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.init = this.init.bind(this);

        //Навешивание обработчиков
        canvas.addEventListener( 'click', this.handleClick );
    }

    init(positionZ) {
        this.scene.fog = new THREE.Fog('lightblue', 200, 450);
        this.scene.background = new THREE.Color( 'lightblue' );

        this.uniforms = {
            colorA:      {type: 'vec3', value: new THREE.Color(0x2138FF)},
            colorB:      {type: 'vec3', value: new THREE.Color(0xFFCB0E)},
            u_time:      {type: 'float', value: Date.now()},
            positionZ:   {type: 'float', value: positionZ},
            fogColor:    { type: "vec3", value: this.scene.fog.color },
            fogNear:     { type: "float", value: this.scene.fog.near },
            fogFar:      { type: "float", value: this.scene.fog.far }
        };
        
        
        let geometry = new THREE.BoxGeometry(200, 200, 200);
        let material =  new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          fragmentShader: this.#fragmentShader(),
          vertexShader: this.#vertexShader(),
          fog: true,
        })
        
        let cube = new THREE.Mesh(geometry, material)
        //cube.position.x = 200;
        cube.position.z = positionZ;
        cube.rotation.y = 5;
        cube.rotation.x = 5;

        cube.cursor = 'pointer';
        

        this.cube = cube;

        this.scene.add(cube);
        this.animationLoop();


        console.log(this.scene.fog)
    }

    #vertexShader() {
        return `
          varying vec3 vUv; 
          varying vec4 modelViewPosition; 
          varying vec3 vecNormal;
      
          void main() {
            vUv = position; 
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
          }
        `;
      }
      
    #fragmentShader() {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif

            uniform vec3 colorA; 
            uniform vec3 colorB; 
            uniform float u_time;
            uniform float positionZ;
            varying vec3 vUv;

            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;
      
            void main() {
              gl_FragColor = vec4(mix(colorA, colorB, abs((positionZ + 0.5) * sin(u_time))), 1.0);
              #ifdef USE_FOG
                  #ifdef USE_LOGDEPTHBUF_EXT
                      float depth = gl_FragDepthEXT / gl_FragCoord.w;
                  #else
                      float depth = gl_FragCoord.z / gl_FragCoord.w;
                  #endif
                  float fogFactor = smoothstep( fogNear, fogFar, depth );
                  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
              #endif
            }
        `;
    }

    handleClick(event) {
        
        if(!this.animationComplete) {
            return;
        }

        this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        this.raycaster.setFromCamera( this.pointer, this.camera );

        const intersects = this.raycaster.intersectObjects( this.scene.children  );
        
        if(!intersects[0])
            return;

        this.animationComplete = false;

        const axis = ['x', 'y'];
        const randIndexAxis = randomInteger(0, 2);
        const value = randomInteger(2, 10)
        gsap.to(this.cube.rotation, {duration: 2, [axis[randIndexAxis]]: value, 
            onComplete: () => this.animationComplete = true,
            onUpdate: () => this.renderer.render(this.scene, this.camera),
        })
    }

    animationLoop(time) {
        if(this.isDestroyed)
            return;
        
        requestAnimationFrame(this.animationLoop);

        if (time - this.lastTimestamp < this.timestep) return;

        this.lastTimestamp = time;
    
        this.renderer.render(this.scene, this.camera)
        
        //Блок с изменением цвета
        this.uniforms.u_time = {type: 'float', value: time % 100};
        this.cube.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.#fragmentShader(),
            vertexShader: this.#vertexShader(),
            fog: true,
        });
    }

    destroy() {
        this.isDestroyed = true;
    }
}