import { TrackParser } from './lib/TrackParser';
import { Track } from "./obj/Track";

export class Game {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene;
    camera: BABYLON.FreeCamera;

    track: Track;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true);

        // call the createScene function
        this.scene = this.createScene();

        // run the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // the canvas/window resize event handler
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        this.loadTrack('demo_06');
    }

    createScene() {
        // create a basic BJS Scene object
        var scene = new BABYLON.Scene(this.engine);

        // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
        this.camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5,-10), scene);

        // target the camera to scene origin
        this.camera.setTarget(BABYLON.Vector3.Zero());

        // // attach the camera to the canvas
         this.camera.attachControl(this.canvas, false);    // NO CAMERA CONTROLS

        // create a basic light, aiming 0,1,0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

        // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);

        // move the sphere upward 1/2 of its height
        sphere.position.y = 1;

        // return the created scene
        return scene;
    }

    loadTrack(track_id) {
        this.track = TrackParser(track_id+'.mp3', () => {
            this.trackReady();
        });
    }

    trackReady() {
        console.log(this.track);
        // material
        var mat = new BABYLON.StandardMaterial("mat1", this.scene);
        mat.alpha = 1;
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
        mat.emissiveColor = BABYLON.Color3.Black();
        mat.backFaceCulling = false;
        mat.wireframe = false;

        var paths = [];
        paths.push(new Array()); // the left bumper rail
        paths.push(new Array()); // the left curb
        paths.push(new Array()); // the right curb
        paths.push(new Array()); // the right bumper rail

        var origin = 0;
        for(var i = 0; i < this.track.buffer.duration; i++) {
            var z = i;
            origin = origin + ((this.track.data_rate[i]-5)/10);
            var y = origin;
            paths[0].push(new BABYLON.Vector3(-2, y+1, z));
            paths[1].push(new BABYLON.Vector3(-1, y, z));
            paths[2].push(new BABYLON.Vector3( 1, y, z));
            paths[3].push(new BABYLON.Vector3( 2, y+1, z));
        }

        var ribbon = BABYLON.Mesh.CreateRibbon("ribbon", paths, false, false, 0, this.scene, false, BABYLON.Mesh.BACKSIDE);
        ribbon.material = mat;
        this.camera.position = new BABYLON.Vector3(this.track.buffer.duration, this.track.buffer.duration/5, this.track.buffer.duration/2);
        this.camera.setTarget(new BABYLON.Vector3(0, 0, this.track.buffer.duration/2));

        this.startDemo();
    }

    startDemo() {
        // Get an AudioBufferSourceNode.
        // This is the AudioNode to use when we want to play an AudioBuffer
        var source = this.track.context.createBufferSource();

        // set the buffer in the AudioBufferSourceNode
        source.buffer = this.track.buffer;

        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(this.track.context.destination);

        console.log('ready to start');
        console.log(source);
        // start the source playing
        source.start();
    }
}