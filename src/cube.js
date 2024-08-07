import { randomInteger } from "./utilities";

const maxFPS = 60;

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
            u_time:      {type: 'float', value: Date.now()},
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
        

        cube.position.y = 0;
        cube.position.x = 0;

        cube.rotation.y = 1.6 * Math.PI;
        cube.rotation.x = 1.6 * Math.PI;

        cube.cursor = 'pointer';
        

        this.cube = cube;

        this.scene.add(cube);
        this.animationLoop();
    }

    #vertexShader() {
        return `
          varying vec3 vUv; 
          varying vec4 modelViewPosition; 
          varying vec3 vecNormal;
          varying vec3 mv;
      
          void main() {
            vUv = position;
            mv = (modelMatrix * vec4(position, 1.0)).xyz;
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

            uniform float u_time;
            varying vec3 vUv;
            varying vec3 mv;

            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;


      
            void main() {
              vec3 colorA = vec3(1.0, 0.0 , 0.0);
              vec3 colorB = vec3(0.0, 1.0, 0.0);

              vec3 color = vec3(0.0);
              color.x += abs(sin(mv.x * 0.01 * 0.5 * cos(u_time * 1.0 * 3.14159))); 
              color.y += abs(sin(mv.y * 0.01 * 0.5 * cos(u_time * 2.0 * 3.14159))); 
              color.z += abs(sin(mv.z * 0.01 * 0.75 * cos(u_time * 3.0 * 3.14159)));
              
              gl_FragColor = vec4(color, 1.0);
              
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

        const currentValueForAxis = this.cube.rotation[axis[randIndexAxis]];
        let value = currentValueForAxis;
        while(value <= currentValueForAxis + 1 && value >= currentValueForAxis - 1){
            value = randomInteger(2, 10);
        }

        gsap.to(this.cube.rotation, {duration: 2, [axis[randIndexAxis]]: value, 
            onComplete: () => this.animationComplete = true,
            onUpdate: () => this.renderer.render(this.scene, this.camera),
        })
    }

    animationLoop(time) {
        if(this.isDestroyed)
            return;
        
        requestAnimationFrame(this.animationLoop);
    
        this.renderer.render(this.scene, this.camera)
        
        //Блок с изменением цвета
        this.uniforms.u_time = {type: 'float', value: (time * 0.001).toFixed(2)};
        this.cube.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.#fragmentShader(),
            vertexShader: this.#vertexShader(),
            fog: false,
        });
    }

    destroy() {
        this.isDestroyed = true;
    }
}