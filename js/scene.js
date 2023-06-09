let heightData;
const maxTerrainHeight = 30;

function createRigidObject(pos, quat, params, mass, friction, isBox = false, color = 0x919691) {
    let shape, geometry;
    if (isBox) {
        const w = params.width;
        const l = params.length;
        const h = params.height;
        shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
        geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));
    } else {
        const radius = params.radius;
        const height = params.height;
        shape = new THREE.CylinderGeometry(radius, radius, height, 100, 1);
        geometry = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height * 0.5, radius));
    }
    if (!mass) mass = 0;
    if (!friction) friction = 1;

    if (params.shouldAddMesh !== false) {
        const mesh = new THREE.Mesh(shape, params.material ? params.material : new THREE.MeshPhongMaterial({ color }));
        mesh.position.copy(pos);
        mesh.quaternion.copy(quat);
        console.log(mesh);
        scene.add(mesh);
    }

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(friction);
    body.setRestitution(.9);
    body.setDamping(0.2, 0.2);

    physicsWorld.addRigidBody(body);

    if (mass > 0) {
        body.setActivationState(DISABLE_DEACTIVATION);

        function sync(dt) {
            const ms = body.getMotionState();
            if (ms) {
                ms.getWorldTransform(TRANSFORM_AUX);
                const p = TRANSFORM_AUX.getOrigin();
                const q = TRANSFORM_AUX.getRotation();
                mesh.position.set(p.x(), p.y(), p.z());
                mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }

        syncList.push(sync);
    }
}

function makeTrack(material, brickMaterial) {
    const yOffset = 10;
    createRigidObject(new THREE.Vector3(0, yOffset + 0, 0), ZERO_QUATERNION, { height: 20, radius: 25, material: [new THREE.MeshPhongMaterial({ color: 0xfca400 }), material, new THREE.MeshPhongMaterial({ color: 0xfca400 })] }, 0, 2);
    createRigidObject(
        new THREE.Vector3(0, yOffset + 0, 20),
        ZERO_QUATERNION,
        {
            height: 40,
            width: 50,
            length: 20,
            material: [
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                material,
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
            ]
        }, 0, 2, true);


    createRigidObject(
        new THREE.Vector3(0, yOffset + 0, 40),
        ZERO_QUATERNION,
        {
            height: 20,
            radius: 25,
            material: [
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                material,
                new THREE.MeshPhongMaterial({ color: 0xfca400 })
            ]
        }, 0, 2);


    createRigidObject(
        new THREE.Vector3(0, yOffset + 10, 0),
        ZERO_QUATERNION,
        {
            height: 10,
            radius: 13,
            material: new THREE.MeshPhongMaterial({ color: 0xfca400 }),
            // [
            //     brickMaterial,
            //     brickMaterial
            // ]
        }, 0, 2, false, 0xff0000);

    createRigidObject(
        new THREE.Vector3(0, yOffset + 10, 20),
        ZERO_QUATERNION,
        {
            height: 40,
            width: 26,
            length: 10,
            material: new THREE.MeshPhongMaterial({ color: 0xfca400 }),
            // [
            //     brickMaterial,
            //     brickMaterial,
            //     brickMaterial,
            // ]
        }, 0, 2, true, 0xff0000);

    createRigidObject(
        new THREE.Vector3(0, yOffset + 10, 40),
        ZERO_QUATERNION,
        {
            height: 10,
            radius: 13,
            material: new THREE.MeshPhongMaterial({ color: 0xfca400 }),
            // [
            //     brickMaterial,
            //     brickMaterial
            // ]
        }, 0, 2, false, 0xff0000);

    const quaternion = new THREE.Quaternion(0, 0, 0, 1);
    quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 8);
    createRigidObject(
        new THREE.Vector3(0, yOffset - 11.5, -36.6),
        quaternion,
        {
            height: 40,
            width: 20,
            length: 30,
            material: [
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                material,
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
                new THREE.MeshPhongMaterial({ color: 0xfca400 }),
            ]
        }, 0, 2, true);
}

function generateHeight(width, depth, minHeight, maxHeight) {
    const size = width * depth;
    const data = new Float32Array(size);

    const hRange = maxHeight - minHeight;
    const w2 = width / 2;
    const d2 = depth / 2;
    const phaseMult = 12;

    let index = 0;
    for (var j = 0; j < depth; j++) {
        for (var i = 0; i < width; i++) {

            const radius = Math.sqrt(
                Math.pow((i - w2) / w2, 2.0) +
                Math.pow((j - d2) / d2, 2.0));

            data[index] = Math.sin(radius * 3) * maxTerrainHeight;

            index++;
        }
    }
    return data;
}

function createTree(sizeParams, position) {

    const treeObj = new THREE.Object3D();
    const trunkGeometry = new THREE.CylinderGeometry(
        sizeParams.radius,
        sizeParams.radius,
        sizeParams.height,
        sizeParams.segments
    );
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 });
    const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
    const geometry = new THREE.CylinderGeometry(0, sizeParams.radius * 4, 20, sizeParams.segments);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 0 });
    const treeTop = new THREE.Mesh(geometry, material);

    position.x = position.x;
    position.z = position.z;
    position.y = heightData[position.x * 1000 + position.z];

    treeObj.add(trunkMesh);
    treeObj.add(treeTop);

    treeTop.position.set(0, 10, 0);
    treeObj.position.set(
        -500 + position.x,
        position.y + sizeParams.height / 2,
        -500 + position.z
    );

    createRigidObject(
        new THREE.Vector3(
            -500 + position.x,
            position.y + sizeParams.height / 2,
            -500 + position.z
        ),
        ZERO_QUATERNION,
        {
            height: sizeParams.height,
            radius: sizeParams.radius,
        }, 0, 2, false, 0xff0000);

    scene.add(treeObj);
}

function createTerrainShape(terrainWidth, terrainDepth, heightData) {
    const heightScale = 1;
    const upAxis = 1;
    const hdt = "PHY_FLOAT";
    const flipQuadEdges = false;
    const ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);
    let p = 0;
    let p2 = 0;

    for (let j = 0; j < terrainDepth; j++) {
        for (let i = 0; i < terrainWidth; i++) {
            Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[p];
            p++;
            p2 += 4;
        }
    }

    const heightFieldShape = new Ammo.btHeightfieldTerrainShape(
        terrainWidth,
        terrainDepth,
        ammoHeightData,
        heightScale,
        0,
        maxTerrainHeight,
        upAxis,
        hdt,
        flipQuadEdges
    );

    const scaleX = 1000 / (terrainWidth - 1);
    const scaleZ = 1000 / (terrainDepth - 1);
    heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX, 1, scaleZ));
    heightFieldShape.setMargin(0.05);

    return heightFieldShape;
}

function makeTerrain(material) {

    heightData = generateHeight(1000, 1000, 100, 100);
    const terrainWidth = 1000;
    const terrainDepth = 1000;
    const ammoTerrain = createTerrainShape(terrainWidth, terrainDepth, heightData);
    const terrainTransform = new Ammo.btTransform();
    terrainTransform.setIdentity();
    terrainTransform.setOrigin(new Ammo.btVector3(0, maxTerrainHeight / 2, 0));

    const groundBody = new Ammo.btRigidBody(
        new Ammo.btRigidBodyConstructionInfo(
            0,
            new Ammo.btDefaultMotionState(terrainTransform),
            ammoTerrain,
            new Ammo.btVector3(0, 0, 0)
        )
    );
    physicsWorld.addRigidBody(groundBody);

    const geometry = new THREE.PlaneBufferGeometry(terrainWidth, terrainDepth, 1000 - 1, 1000 - 1);
    geometry.rotateX(- Math.PI / 2);
    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        vertices[j + 1] = heightData[i];
    }

    terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.position.set(0, 0, 0);

    for (let i = 0; i < 300; i++) {
        const radius = 75 + Math.floor(Math.random() * 425);
        const theta = 0 + Math.random() * Math.PI * 2;

        const shouldAdd = true;
        if (shouldAdd) {
            createTree(
                {
                    radius: 1 + Math.floor(Math.random() * 10) / 10,
                    height: 10 + Math.floor(Math.random() * 10),
                    segments: 6
                },
                new THREE.Vector3(
                    500 + Math.floor(radius * Math.sin(theta)),
                    0,
                    500 + Math.floor(radius * Math.cos(theta))
                )
            );
        }
    }
    return terrainMesh;
}

function addClouds(cloudTexture) {
    const cloudList = [];
    const cloudObject = new THREE.Object3D();
    const cloudMaterial = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: 0.6,
        map: cloudTexture,
        depthWrite: false,
    });

    // Sphere parametric equation: [sin(u)*cos(v), sin(u)*sin(v), cos(u)]
    for (let i = 0; i < 300; i++) {
        // Making sure the clouds don't clip
        const radius = 200 + 500 * Math.random();
        const u = Math.PI * Math.random();
        const v = Math.PI * Math.random();
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64, 1, 1), cloudMaterial);
        plane.position.x = radius * Math.sin(u) * Math.cos(v);
        plane.position.y = radius * Math.sin(u) * Math.sin(v);
        plane.position.z = radius * Math.cos(u);
        plane.rotation.x = Math.PI / 2;
        plane.castShadow = true;

        plane.lookAt(0, 0, 0);
        plane.scale.x = plane.scale.y = Math.random() * Math.random() + 0.3;
        plane.renderOrder = i;

        cloudList.push({
            mesh: plane,
            u,
            v,
            radius
        });

        cloudObject.add(plane);

    }

    // cloudObject.rotation.x = Math.PI / 2;
    cloudObject.position.y = 100;

    // cloudObject.add(mesh);
    scene.add(cloudObject);

    return cloudList;

}