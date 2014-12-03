var VR_POSITION_SCALE = 25;
//
// WebVR Device initialization
//
var sensorDevice = null;
var hmdDevice = null;
var vrMode = false;
var stats = document.getElementById("stats");
var renderTargetWidth = 1920;
var renderTargetHeight = 1080;
var vrEffect;

//
// Rendering
//
//var renderer = new THREE.WebGLDeferredRenderer({width:window.innerWidth,height:window.innerHeight,scale:1,antialias:true}/*{precision:"highp",alpha:true,antialias:true,preserveDrawingBuffer:true}*/);
var renderer = new THREE.WebGLRenderer({/*precision:"highp",*/alpha:true,antialias:true});
renderer.shadowMapEnabled = true;
//renderer.shadowMapType = THREE.PCFShadowMapSoft;
//renderer.ShadowMapSoft=true;
//renderer.physicallyBasedShading=true;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

//
//Camera Oculus
//
var cameraLeft = new THREE.PerspectiveCamera( 75, 4/3, 0.1, 1000 );
var cameraRight = new THREE.PerspectiveCamera( 75, 4/3, 0.1, 1000 );
var cameraVR= new THREE.PerspectiveCamera(90,window.innerWidth, window.innerHeight,0.1,1000);
var camVR=new THREE.Object3D();
var fovScale = 2.0;	
			
//
// OBJS
//
var riftObj;
var cubeObj;
var groundObj;
var markObj;
var menu;

//
//STATS Var
//
var vrBtn = document.getElementById("vrBtn");
var timestamp = document.getElementById("timestamp");
var orientation = document.getElementById("orientation");
var position = document.getElementById("position");
var angularVelocity = document.getElementById("angularVelocity");
var linearVelocity = document.getElementById("linearVelocity");
var angularAcceleration = document.getElementById("angularAcceleration");
var linearAcceleration = document.getElementById("linearAcceleration");

var infoFPS=new Stats();

//
//Controls Var
//
var controls;
var controlsVR;
var keyboard = new THREEx.KeyboardState();

main();


function main()
{
	console.log("main");
	init();
	animate();
}

function init()
{
	console.log("init");
	
	//FPS information
	infoFPS.domElement.style.position = 'absolute';
	infoFPS.domElement.style.top = '0px';
	infoFPS.domElement.style.right = '0px';
	infoFPS.domElement.style.zIndex=1;
	document.body.appendChild( infoFPS.domElement );

	// verifica api supported
	if (navigator.getVRDevices) 
	{
    navigator.getVRDevices().then(EnumerateVRDevices);
  }
	else if (navigator.mozGetVRDevices) 
	{
    navigator.mozGetVRDevices(EnumerateVRDevices);
  }
	else 
	{
    stats.classList.add("error");
    stats.innerHTML = "WebVR API not supported";
  }
	
	//comands for reset camera center
	window.addEventListener("keydown", function(ev) 
	{
    if (hmdDevice) 
		{
			if (ev.keyCode == "r".charCodeAt(0))  
			{
				sensorDevice.resetSensor();
      }
      if (ev.keyCode == 187 || ev.keyCode == 61)  
			{
				// "+" key
        resizeFOV(0.1);
      }
      if (ev.keyCode == 189 || ev.keyCode == 173)  
			{ 
				// "-" key
        resizeFOV(-0.1);
      }
		}
	});
	
	vrEffect = new THREE.OculusRiftEffect( renderer, {worldScale: 100},{eyeToScreenDistance:.051,interpupillaryDistance:.064,lensSeparationDistance:.064} );
	vrEffect.setSize( window.innerWidth, window.innerHeight );
	//vrEffect.HMD.eyeToScreenDistance=.031;
	
	createScene();
	
	camVR.add(cameraVR);
	
	camera.position.set(0,10,10);
	//camera.lookAt(markObj.position);
	//camera.rotation.set(45,0,0);
	
	camVR.position.copy(camera.position);
	//cameraVR.lookAt(markObj.position);
	//camVR.rotation.set(-45,0,0);
	//scene.add(camVR);
	scene.add(camVR);
	
	resize();
  window.addEventListener("resize", resize, false);
	
	document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);
  document.addEventListener("mozfullscreenchange", onFullscreenChange, false);
	
	if (vrBtn) 
	{
    vrBtn.addEventListener("click", function() 
		{
      vrMode = true;
			camVR.position.copy(camera.position);
      resize();
      if (renderer.domElement.webkitRequestFullscreen) 
			{
        renderer.domElement.webkitRequestFullscreen({ vrDisplay: hmdDevice });
      }
			else if (renderer.domElement.mozRequestFullScreen) 
			{
        renderer.domElement.mozRequestFullScreen({ vrDisplay: hmdDevice });
      }
    }, false);
  }
	
	controls = new THREE.OrbitControls( camera,renderer.domElement );
	
	document.body.appendChild( renderer.domElement );
}

function animate()
{
	requestAnimationFrame(animate);
	infoFPS.update();
	render();
}

function render()
{
	if (!updateVRDevice() && rift) 
	{
    // If we don't have a VR device just spin the model around to give us
    // something pretty to look at.
    rift.rotation.y += 0.01;	
  }

  if (vrMode) 
	{
		//camVR.add(cameraVR);
	
		var vrState = sensorDevice.getState();
	
		move(camVR);
		
		cameraVR.position.x = vrState.position.x *VR_POSITION_SCALE+(camVR.position.x);
    cameraVR.position.y = vrState.position.y *VR_POSITION_SCALE+(camVR.position.y);
    cameraVR.position.z = vrState.position.z *VR_POSITION_SCALE+(camVR.position.z);
		
    camVR.quaternion.x = vrState.orientation.x;
    camVR.quaternion.y = vrState.orientation.y;
    camVR.quaternion.z = vrState.orientation.z;
    camVR.quaternion.w = vrState.orientation.w;
		
		cameraVR.quaternion.copy(camVR.quaternion);
    
		
		vrEffect.render(scene,cameraVR);
		//controlsVR.update();
	
		//camVR.translateX(.1);
		//console.log(camVR.position);
		
		hide_unhide_Menu();
  }
	else 
	{
    // Render mono view
    //renderer.enableScissorTest ( false );
    //renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
		//console.log(camera.position);
    renderer.render(scene, camera);
		controls.update();
  }
	
	//markObj.rotation.y+=.015*Math.PI;
	riftObj.rotation.z+=.01*Math.PI;
	cubeObj.rotation.y-=.01*Math.PI;
	
	//cameraVR.position.x-=1000;
	//console.log("rot: "+markObj.rotation);
	
}

//
// Support Functions
//

function move(obj)
{
	if(keyboard.pressed("w"))
	{
		obj.translateZ(-1);
		console.log("W");
	}
	if(keyboard.pressed("s"))
	{
		obj.translateZ(1);
		console.log("S");
	}
	if(keyboard.pressed("a"))
	{
		obj.translateX(-1);
		console.log("A");
	}
	if(keyboard.pressed("d"))
	{
		obj.translateX(1);
		console.log("D");
	}
}

function resize() 
{
  if (vrMode) 
	{
    //cameraVR.aspect = renderTargetWidth / renderTargetHeight;
    cameraVR.updateProjectionMatrix();
    vrEffect.setSize( window.innerWidth, window.innerHeight );
		//controlsVR.handleResize();
  } 
	else 
	{
		camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		menu.visible=false;
  }
}

function onFullscreenChange() 
{
  if(!document.webkitFullscreenElement && !document.mozFullScreenElement) 
    vrMode = false;
  resize();
}

function updateVRDevice() 
{
  if (!sensorDevice) 
		return false;
  var vrState = sensorDevice.getState();

  timestamp.innerHTML = vrState.timeStamp.toFixed(2);
  orientation.innerHTML = printVector(vrState.orientation);
  position.innerHTML = printVector(vrState.position);
  angularVelocity.innerHTML = printVector(vrState.angularVelocity);
  linearVelocity.innerHTML = printVector(vrState.linearVelocity);
  angularAcceleration.innerHTML = printVector(vrState.angularAcceleration);
  linearAcceleration.innerHTML = printVector(vrState.linearAcceleration);
	/*
  if (riftObj) 
	{
    riftObj.position.x = vrState.position.x * VR_POSITION_SCALE;
    riftObj.position.y = vrState.position.y * VR_POSITION_SCALE;
    riftObj.position.z = vrState.position.z * VR_POSITION_SCALE;

    riftObj.quaternion.x = vrState.orientation.x;
    riftObj.quaternion.y = vrState.orientation.y;
    riftObj.quaternion.z = vrState.orientation.z;
    riftObj.quaternion.w = vrState.orientation.w;
  }
*/
  return true;
}

function EnumerateVRDevices(devices) 
{
  // First find an HMD device
  for (var i = 0; i < devices.length; ++i) 
	{
    if (devices[i] instanceof HMDVRDevice) 
		{
      hmdDevice = devices[i];

      eyeOffsetLeft = hmdDevice.getEyeTranslation("left");
      eyeOffsetRight = hmdDevice.getEyeTranslation("right")
      document.getElementById("leftTranslation").innerHTML = printVector(eyeOffsetLeft);
      document.getElementById("rightTranslation").innerHTML = printVector(eyeOffsetRight);

      cameraLeft.position.add(eyeOffsetLeft);
      cameraLeft.position.z = 12;

      cameraRight.position.add(eyeOffsetRight);
      cameraRight.position.z = 12;

      resizeFOV(0.0);
    }
  }

  // Next find a sensor that matches the HMD hardwareUnitId
  for (var i = 0; i < devices.length; ++i) 
	{
    if (devices[i] instanceof PositionSensorVRDevice &&(!hmdDevice || devices[i].hardwareUnitId == hmdDevice.hardwareUnitId)) 
		{
      sensorDevice = devices[i];
      document.getElementById("hardwareUnitId").innerHTML = sensorDevice.hardwareUnitId;
      document.getElementById("deviceId").innerHTML = sensorDevice.deviceId;
      document.getElementById("deviceName").innerHTML = sensorDevice.deviceName;
    }
  }
}

function resizeFOV(amount) 
{
  var fovLeft, fovRight;

	if (!hmdDevice) 
		return;

	if (amount != 0 && 'setFieldOfView' in hmdDevice) 
	{
		fovScale += amount;
		if (fovScale < 0.1) 
		{ 
			fovScale = 0.1; 
		}

    fovLeft = hmdDevice.getRecommendedEyeFieldOfView("left");
    fovRight = hmdDevice.getRecommendedEyeFieldOfView("right");

    fovLeft.upDegrees *= fovScale;
    fovLeft.downDegrees *= fovScale;
    fovLeft.leftDegrees *= fovScale;
    fovLeft.rightDegrees *= fovScale;

    fovRight.upDegrees *= fovScale;
    fovRight.downDegrees *= fovScale;
    fovRight.leftDegrees *= fovScale;
    fovRight.rightDegrees *= fovScale;

    hmdDevice.setFieldOfView(fovLeft, fovRight);
  }

  if ('getRecommendedEyeRenderRect' in hmdDevice) 
	{
		var leftEyeViewport = hmdDevice.getRecommendedEyeRenderRect("left");
		var rightEyeViewport = hmdDevice.getRecommendedEyeRenderRect("right");
		renderTargetWidth = /*leftEyeViewport.width + rightEyeViewport.width;*/1920;
		renderTargetHeight = /*Math.max(leftEyeViewport.height, rightEyeViewport.height);*/1080;
		document.getElementById("renderTarget").innerHTML = renderTargetWidth + "x" + renderTargetHeight;
	}

  resize();

  if ('getCurrentEyeFieldOfView' in hmdDevice) 
	{
		fovLeft = hmdDevice.getCurrentEyeFieldOfView("left");
		fovRight = hmdDevice.getCurrentEyeFieldOfView("right");
	} 
	else 
	{
    fovLeft = hmdDevice.getRecommendedEyeFieldOfView("left");
    fovRight = hmdDevice.getRecommendedEyeFieldOfView("right");
  }

  cameraLeft.projectionMatrix = PerspectiveMatrixFromVRFieldOfView(fovLeft, 0.1, 1000);
  cameraRight.projectionMatrix = PerspectiveMatrixFromVRFieldOfView(fovRight, 0.1, 1000);
}

function PerspectiveMatrixFromVRFieldOfView(fov, zNear, zFar) 
{
  var outMat = new THREE.Matrix4();
  var out = outMat.elements;
  var upTan = Math.tan(fov.upDegrees * Math.PI/180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI/180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0);

  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);

	out[0] = xScale;
  out[4] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[12] = 0.0;

  out[1] = 0.0;
  out[5] = yScale;
  out[9] = ((upTan - downTan) * yScale * 0.5);
  out[13] = 0.0;

  out[2] = 0.0;
  out[6] = 0.0;
  out[10] = zFar / (zNear - zFar);
  out[14] = (zFar * zNear) / (zNear - zFar);

  out[3] = 0.0;
  out[7] = 0.0;
  out[11] = -1.0;
  out[15] = 0.0;

  return outMat;
}

function printVector(values) 
{
  var str = "[";

  str += values.x.toFixed(2) + ", ";
  str += values.y.toFixed(2) + ", ";
  str += values.z.toFixed(2);

  if ("w" in values) 
	{
    str += ", " + values.w.toFixed(2);
  }

  str += "]";
  return str;
}

function createScene()
{
	//renderer.setClearColor(0x202020, 1.0);
	renderer.gammaInput=true;
	renderer.gammaOutput=true;
	
	addLight();
	
	addMenu();
	
	riftObj = new THREE.Object3D();
  scene.add(riftObj);
	cubeObj=new THREE.Object3D();
	scene.add(cubeObj);
	markObj=new THREE.Object3D();
	scene.add(markObj);
	
	var pos=
	{
		x:0,
		y:2.55,
		z:0
	};
	var scale=
	{
		x:10,
		y:10,
		z:10
	};
	var rot=
	{
		x:0,
		y:.50*Math.PI,
		z:100
	};
	
	addJSON("Mark 42.json",markObj,pos,rot,scale);
	//markObj.rotation.copy(rot);
	console.log(markObj.rotation);
	console.log(markObj.children.rotation);
	
	addGround();
	
	geometry=new THREE.TorusKnotGeometry(25, 8, 75, 20);
	geometry2=new THREE.BoxGeometry(5,5,5);
	
	var material	= new THREE.MeshPhongMaterial(
	{
		ambient		: 0x444444,
		color			: 0x111488,
		shininess	: 300, 
		specular	: 0xFFFFFF,
		shading		: THREE.SmoothShading
		//map		: texture
	});
		
	rift=new THREE.Mesh( geometry, material );
	riftObj.add( rift );
	
	riftObj.scale.set(.1,.1,.1);
	riftObj.position.set(0,5,-10);
	riftObj.traverse(function(child)
	{
		if (child instanceof THREE.Mesh)
		{
			// enable casting shadows
			child.castShadow = true;
			child.receiveShadow = true;
		}	
	});
	
	cube=new THREE.Mesh(geometry2,material);
	cubeObj.add(cube);
	
	cubeObj.position.set(10,10,0);
	cubeObj.traverse(function(child)
	{
		if (child instanceof THREE.Mesh)
		{
			// enable casting shadows
			child.castShadow = true;
			child.receiveShadow = true;
		}	
	});

}

function addObj(obj_name,scale,position,rotation,obj)
{
	var loader=new THREE.OBJLoader();
	loader.load("/DK2/resources/"+obj_name,function(object)
	{
		object.traverse(function(child)
		{
			if (child instanceof THREE.Mesh)
			{
				// enable casting shadows
				child.castShadow = true;
				child.receiveShadow = true;
			}	
		});
		
		object.scale.copy(scale);
		
		object.position.copy(position);
			
		object.rotation.y=rotation.y*Math.PI;
		object.rotation.x=rotation.x*Math.PI;
		object.rotation.z=rotation.z*Math.PI;
			
			
		obj.add(object);
		scene.add(object);
			
	});
}

function addObjMtl(obj_name,mtl_name,scale,position,rotation,obj)
{
	var loader=new THREE.OBJMTLLoader();
	
	loader.load("/DK2/resources/"+obj_name,"/DK2/resources/"+mtl_name,function(object)
	{
		object.traverse( function( node ) 
		{
			if ( node instanceof THREE.Mesh ) 
			{
				node.castShadow = true; 
				node.receiveShadow=true; 
			} 
		});
		
		obj.add(object);
		obj.scale.copy(scale);
		obj.position.copy(position);
			
		obj.rotation.y=rotation.y*Math.PI;
		obj.rotation.x=rotation.x*Math.PI;
		obj.rotation.z=rotation.z*Math.PI;
		
		scene.add(object);
	});
}

function addJSON(obj_name,obj,pos,rot,scale)
{
	var loader = new THREE.JSONLoader();
  loader.load("/resources/" + obj_name, function(geometry,materials)
	{
		var object = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  /* Determine the ranges of x, y, and z in the vertices of the geometry. */
/*
  var xmin = Infinity;
  var xmax = -Infinity;
  var ymin = Infinity;
  var ymax = -Infinity;
  var zmin = Infinity;
  var zmax = -Infinity;
  for (var i = 0; i < geometry.vertices.length; i++) 
	{
    var v = geometry.vertices[i];
    if (v.x < xmin)
			xmin = v.x;
    else if (v.x > xmax)
			xmax = v.x;
    if (v.y < ymin)
      ymin = v.y;
    else if (v.y > ymax)
      ymax = v.y;
    if (v.z < zmin)
      zmin = v.z;
    else if (v.z > zmax)
      zmax = v.z;
  }
    
  /* translate the center of the object to the origin *//*
  var centerX = (xmin+xmax)/2;
  var centerY = (ymin+ymax)/2; 
  var centerZ = (zmin+zmax)/2;
  var max = Math.max(centerX - xmin, xmax - centerX);
  max = Math.max(max, Math.max(centerY - ymin, ymax - centerY) );
  max = Math.max(max, Math.max(centerZ - zmin, zmax - centerZ) );
  //var scale = 10/max;
  object.position.set( -centerX, -centerY, -centerZ );
  console.log("Loading finished, scaling object by " + scale);
  console.log("Center at ( " + centerX + ", " + centerY + ", " + centerZ + " )");
    
  /* Create the wrapper, model, to scale and rotate the object. */
    
  object.castShadow=true;
	object.receiveShadow=true;
	
  obj.add(object);
  obj.scale.copy(scale);
	obj.position.copy(pos);
	obj.rotation=new THREE.Vector3(rot);
	object.rotation=rot;
	
	//scene.add(obj);
	
	console.log(rot);
	console.log(object.rotation);
	console.log(obj.rotation);
	
	});
	//model.position.set(0,0,0)
	//obj.position.set(0,10,0);
	
}

function addGround()
{
	// add simple ground
		
	var woodMap = THREE.ImageUtils.loadTexture( "/resources/Texture parquet rovere seamless simo-3d.jpg",THREE.UVMapping );
	woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
	woodMap.repeat.set( 5, 5 );
	woodMap.anisotropy = 16;
		
	var woodBumpMap = THREE.ImageUtils.loadTexture( "/resources/Texture parquet rovere seamless bump simo-3d.jpg",THREE.UVMapping );
	woodBumpMap.wrapS = woodBumpMap.wrapT = THREE.RepeatWrapping;
	woodBumpMap.repeat.set( 5, 5 );
	woodBumpMap.anisotropy = 16;
		
	woodMaterial = new THREE.MeshPhongMaterial( { map: woodMap, specular: 0xffffff, shininess: 100, bumpMap: woodBumpMap, bumpScale: .1, side: THREE.DoubleSide } );
		
	var ground = new THREE.Mesh( new THREE.PlaneGeometry(150, 150, 1, 1), woodMaterial );
	ground.receiveShadow = true;
	ground.position.set(0, -1, 0);
	//ground.scale.set(.51, .51, .51);
	ground.rotation.x = -Math.PI / 2;
	scene.add(ground);
	
}

function addLight()
{

	//
	//Pointlight
	//
	light2=new THREE.PointLight(0xFFFFFF);
	light2.intensity=1.0;
	light2.position.set(10,10,20);
	//light2.castShadow=true;
	scene.add(light2);
	
	
	//
	//Ambientlight
	//
	var ambient = new THREE.AmbientLight( 0x404040 );
  //scene.add( ambient );

	//
	//Directionallight
	//
  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 100, 100, 1 );
	directionalLight.castShadow=true;
  //scene.add( directionalLight );
	directionalLight.shadowCameraVisible=true;
	
	directionalLight.shadowMapWidth = 4096;
	directionalLight.shadowMapHeight = 4096;
	
	directionalLight.shadowCameraNear = 20;
	directionalLight.shadowCameraFar = 500;
	directionalLight.shadowCameraFov = 5;
	directionalLight.shadowDarkness=0.7;
		
	//
	//Spotlight
	//
	var spotLight= new THREE.SpotLight( 0xAAAAAA );
	spotLight.intensity=2.0;
	spotLight.position.set( 0,150,-10 );
	spotLight.rotation.set(.10*Math.PI,.50*Math.PI,.90*Math.PI);
	spotLight.castShadow = true;
	spotLight.receiveShadow=true;

	spotLight.shadowMapWidth = 2048;
	spotLight.shadowMapHeight = 2048;


	spotLight.shadowCameraNear = 20;
	spotLight.shadowCameraFar = 5000;
	spotLight.shadowCameraFov = 100;
	spotLight.shadowDarkness=0.7;
		
	//Debug spotLight
	spotLight.shadowCameraVisible=true;
	
	var spotLightX=0, spotLightZ=0, spotLightTheta=0;
	//setInterval(function() 
	{
		spotLightTheta+=0.15;
		spotLightX=150*Math.cos(spotLightTheta),
    spotLightZ=150*Math.sin(spotLightTheta),
    spotLight.position.set(spotLightX,100,spotLightZ);
	}//, 46);
	
	scene.add(spotLight);
}

function addMenu()
{
	menu=new THREE.Object3D();
	camVR.add(menu);
	menu.position.set(0,0,-10);
	
	geometry=new THREE.BoxGeometry(.5,.5,.5);
	
	var material	= new THREE.MeshPhongMaterial(
	{
		ambient		: 0x444444,
		color			: 0xffffff
		//shininess	: 300, 
		//specular	: 0xFFFFFF,
		//shading		: THREE.SmoothShading
		//map		: texture
	});
		
	
	m=new THREE.Mesh( geometry, material );
	
	m.castShadow=false;
	m.receiveShadow=false;
	
	menu.add( m );
	menu.visible=false;
}

function hide_unhide_Menu()
{
	if(keyboard.pressed("h"))
	{
		if(menu.visible)
			menu.visible=false;
		else
			menu.visible=true;
	
		console.log(menu.visible);
	}
}