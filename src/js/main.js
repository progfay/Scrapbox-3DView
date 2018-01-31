let vrDisplay, vrFrameData, vrControls, arView;
let canvas, camera, scene, renderer, loader;
let pages = [];

/**
 * Use the `getARDisplay()` utility to leverage the WebVR API
 * to see if there are any AR-capable WebVR VRDisplays. Returns
 * a valid display if found. Otherwise, display the unsupported
 * browser message.
 */
THREE.ARUtils.getARDisplay().then(function(display) {
    if (display) {
        vrFrameData = new VRFrameData();
        vrDisplay = display;
        init();
    } else {
        THREE.ARUtils.displayUnsupportedMessage();
    }
});


function init() {
    // Turn on the debugging panel
    let arDebug = new THREE.ARDebug(vrDisplay);
    document.body.appendChild(arDebug.getElement());
    // Setup the three.js rendering environment
    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log('setRenderer size', window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    canvas = renderer.domElement;
    document.body.appendChild(canvas);
    scene = new THREE.Scene();
    // Creating the ARView, which is the object that handles
    // the rendering of the camera stream behind the three.js
    // scene
    arView = new THREE.ARView(vrDisplay, renderer);
    // The ARPerspectiveCamera is very similar to THREE.PerspectiveCamera,
    // except when using an AR-capable browser, the camera uses
    // the projection matrix provided from the device, so that the
    // perspective camera's depth planes and field of view matches
    // the physical camera on the device.
    camera = new THREE.ARPerspectiveCamera(
        vrDisplay,
        60,
        window.innerWidth / window.innerHeight,
        vrDisplay.depthNear,
        vrDisplay.depthFar
    );
    // VRControls is a utility from three.js that applies the device's
    // orientation/position to the perspective camera, keeping our
    // real world and virtual world in sync.
    vrControls = new THREE.VRControls(camera);
    // Bind our event handlers
    window.addEventListener('resize', onWindowResize, false);
    // init TexutureLoader
    loader = new THREE.TextureLoader();
    // add Scrapbox pages
    addPages();
    // add lights
    let light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    // Kick off the render loop!
    update();
}


/**
 * The render loop, called once per frame. Handles updating
 * our scene and rendering.
 */
function update() {
    // Render the device's camera stream on screen first of all.
    // It allows to get the right pose synchronized with the right frame.
    arView.render();
    // Update our camera projection matrix in the event that
    // the near or far planes have updated
    camera.updateProjectionMatrix();
    // From the WebVR API, populate `vrFrameData` with
    // updated information for the frame
    vrDisplay.getFrameData(vrFrameData);
    // Update our perspective camera's positioning
    vrControls.update();
    // Render our three.js virtual scene
    renderer.clearDepth();
    renderer.render(scene, camera);
    // Kick off the requestAnimationFrame to call this function
    // on the next frame
    requestAnimationFrame(update);
}


/**
 * On window resize, update the perspective camera's aspect ratio,
 * and call `updateProjectionMatrix` so that we can get the latest
 * projection matrix provided from the device
 */
function onWindowResize() {
    console.log('setRenderer size', window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function addPages() {
    // Fetch the pose data from the current frame
    let pose = vrFrameData.pose;
    // Convert the pose orientation and position into
    // THREE.Quaternion and THREE.Vector3 respectively
    let ori = new THREE.Quaternion(
        pose.orientation[0],
        pose.orientation[1],
        pose.orientation[2],
        pose.orientation[3]
    );
    let pos = new THREE.Vector3(
        pose.position[0],
        pose.position[1],
        pose.position[2]
    );

    let dirMtx = new THREE.Matrix4();
    dirMtx.makeRotationFromQuaternion(ori);

    let push = new THREE.Vector3(0, 0, -1.0);
    push.transformDirection(dirMtx);
    pos.addScaledVector(push, 0.125);
}