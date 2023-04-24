const CameraStates = Object.fromEntries([
    "THIRD_FOREWARD",
    "FIRST_FOREWARD",
    "FIRST_STERN",
    "THIRD_STERN",
    "THIRD_STARBOARD",
    "THIRD_FREE",
].map((x, i) => [x, i]));


class AmmoCar {
    carPosition = {
        x: -20,
        y: 15,
        z: 0
    }

    chassisParams = {
        height: 2 / 4,
        width: 6 / 4,
        length: 8 / 4
    };

    physicsWorld = null;
    keyboard = null;

    constructor(syncList, physicsWorld, keyboard) {
        this.physicsWorld = physicsWorld;
        this.keyboard = keyboard;
        return this.createVehicle(syncList);
    }

    /**
     * @param {Object} params
     * @param {Number} params.width
     * @param {Number} params.height
     * @param {Number} params.length
     */

    createChassis(params) {
        const chassis = new THREE.Mesh(
            new THREE.BoxGeometry(params.width, params.height, params.length),
            new THREE.MeshPhongMaterial({ color: "white" })
        );

        const makeLight = (pos, color, name) => {
            const dimensions = chassis.geometry.parameters;
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(dimensions.width / 8, dimensions.height / 4, dimensions.depth / 8),
                new THREE.MeshPhongMaterial({ color }),
            );
            mesh.name = "mesh";
            mesh.position.set(pos.roll * dimensions.width / 2.2, 0, pos.pitch * dimensions.depth / 2);
            mesh.position.x -= pos.roll * mesh.geometry.parameters.width / 2;
            mesh.material.emissive = VehicleLights.OFF;

            const light = new THREE.SpotLight();
            light.name = "light";
            light.intensity = 0;
            light.color = new THREE.Color(color);
            light.penumbra = 0.8;
            light.angle = Math.PI / 4;
            light.position.copy(mesh.position);
            light.position.z += pos.pitch * mesh.geometry.parameters.depth / 2;

            light.target = new THREE.Object3D();
            light.target.name = "target";
            light.target.position.copy(light.position);
            light.target.position.z += pos.pitch;

            const object = new THREE.Object3D();
            object.name = name;
            object.userData = { active: false };
            object.add(mesh, light, light.target);
            return object;
        }

        const composite = new THREE.Object3D();
        composite.add(
            chassis,
            makeLight({ roll: +1, pitch: -1 }, VehicleLights.REAR_ON, "bl"),
            makeLight({ roll: -1, pitch: -1 }, VehicleLights.REAR_ON, "br"),
            makeLight({ roll: +1, pitch: +1 }, VehicleLights.FRONT_ON, "fl"),
            makeLight({ roll: -1, pitch: +1 }, VehicleLights.FRONT_ON, "fr"),
        );

        scene.add(composite);
        return composite;
    }

    createAmmoWheel(params) {
        const wheelInfo = params.vehicle.addWheel(
            params.position,
            new Ammo.btVector3(0, -1, 0),
            new Ammo.btVector3(-1, 0, 0),
            0.6,
            params.radius,
            params.tuning,
            params.isFront);

        wheelInfo.set_m_suspensionStiffness(20.0);
        wheelInfo.set_m_wheelsDampingRelaxation(2.3);
        wheelInfo.set_m_wheelsDampingCompression(4.4);
        wheelInfo.set_m_frictionSlip(1000);
        wheelInfo.set_m_rollInfluence(0);
    }

    createWheel(params, ammoPosition, isFront) {

        const wheelGeom = new THREE.CylinderGeometry(
            params.radius,
            params.radius,
            params.height,
            50,
            1
        );
        const wheelMesh = new THREE.Mesh(
            wheelGeom,
            new THREE.MeshPhongMaterial({
                color: 0x000000
            })
        );

        wheelGeom.rotateZ(Math.PI / 2);

        scene.add(wheelMesh);

        params.position = ammoPosition;
        params.isFront = isFront;
        this.createAmmoWheel(params);

        return wheelMesh;
    }

    addToSyncList(syncList, chassisMesh, vehicle, wheelMeshes) {
        let vehicleSteering = 0;

        syncList.push(function () {
            if (window.shouldUpdate === false) {
                return;
            }

            if (keyboard.camera.justPressed()) {
                cameraState = (cameraState + 1) % Object.keys(CameraStates).length;
            }

            const tails = [chassisMesh.getObjectByName("bl"), chassisMesh.getObjectByName("br")];
            for (const tail of tails) {
                const light = tail.getObjectByName("light");
                const mesh = tail.getObjectByName("mesh");
                if (keyboard.backward.isDown() || keyboard.brake.isDown()) {
                    if (!tail.userData.active) {
                        tail.userData.active = true;
                        light.intensity = 1;
                        mesh.material.emissive = VehicleLights.REAR_ON;
                    }
                } else {
                    if (tail.userData.active) {
                        tail.userData.active = false;
                        light.intensity = 0;
                        mesh.material.emissive = VehicleLights.OFF;
                    }
                }
            }

            if (keyboard.headlight.justPressed()) {
                const heads = [chassisMesh.getObjectByName("fl"), chassisMesh.getObjectByName("fr")];
                for (const head of heads) {
                    const light = head.getObjectByName("light");
                    const mesh = head.getObjectByName("mesh");

                    head.userData.active = !head.userData.active;
                    if (head.userData.active) {
                        light.intensity = 1;
                        mesh.material.emissive = VehicleLights.FRONT_ON;
                    } else {
                        light.intensity = 0;
                        mesh.material.emissive = VehicleLights.OFF;
                    }
                }
            }

            const maxForce = 3000;
            const speed = vehicle.getCurrentSpeedKmHour();
            let force = 0;
            let brakingForce = 0;

            if (keyboard.forward.isDown()) {
                force = maxForce;
                if (speed < 0) {
                    brakingForce = 100;
                }
            }

            if (keyboard.backward.isDown()) {
                if (speed < 0) {
                    force = -maxForce;
                } else {
                    force = -maxForce;
                    brakingForce = 100;
                }
            }

            if (keyboard.left.isDown()) {
                vehicleSteering = Math.max(0, vehicleSteering);
                vehicleSteering += 0.0075;
            } else if (keyboard.right.isDown()) {
                vehicleSteering = Math.min(0, vehicleSteering);
                vehicleSteering -= 0.0075;
            } else {
                vehicleSteering = 0;
            }

            if (keyboard.brake.isDown()) {
                brakingForce = 100;
            }

            if (Math.abs(vehicleSteering) > 0.5) {
                vehicleSteering = 0.5 * Math.sign(vehicleSteering);
            }

            if (speed > 120) {
                force = 0;
            }

            vehicle.applyEngineForce(force, 1);
            vehicle.applyEngineForce(force, 0);

            vehicle.setBrake(brakingForce / 2, 0);
            vehicle.setBrake(brakingForce / 2, 1);
            vehicle.setBrake(brakingForce, 2);
            vehicle.setBrake(brakingForce, 3);

            vehicle.setSteeringValue(vehicleSteering, 0);
            vehicle.setSteeringValue(vehicleSteering, 1);

            for (let i = 0; i < 4; i++) {
                vehicle.updateWheelTransform(i, true);
                const wheelTransform = vehicle.getWheelTransformWS(i);
                const wheelPosition = wheelTransform.getOrigin();
                const wheelRotation = wheelTransform.getRotation();
                wheelMeshes[i].position.set(wheelPosition.x(), wheelPosition.y(), wheelPosition.z());
                wheelMeshes[i].quaternion.set(wheelRotation.x(), wheelRotation.y(), wheelRotation.z(), wheelRotation.w());
            }

            const vehicleTransform = vehicle.getChassisWorldTransform();
            const position = vehicleTransform.getOrigin();
            const rotation = vehicleTransform.getRotation();
            const quaternion = new THREE.Quaternion(rotation.x(), rotation.y(), rotation.z(), rotation.w());
            const pos = new THREE.Vector3(position.x(), position.y(), position.z());
            pos.applyQuaternion(quaternion);


            // Hides the front headlight

            function toggleHeadlightVisibility(state) {
                const heads = [chassisMesh.getObjectByName("fl"), chassisMesh.getObjectByName("fr")];
                for (const head of heads) {
                    const mesh = head.getObjectByName("mesh");
                    mesh.visible = state;
                }
            }


            // Updates the camera position

            switch (cameraState) {
                case CameraStates.THIRD_FOREWARD:
                    camera.position.set(0, 2, -10);
                    camera.rotation.set(0, Math.PI, 0);
                    break;
                case CameraStates.FIRST_FOREWARD:
                    camera.position.set(0, 0, 0);
                    camera.rotation.set(0, Math.PI, 0);
                    toggleHeadlightVisibility(false);
                    break;
                case CameraStates.FIRST_STERN:
                    camera.position.set(0, 0, 0);
                    camera.rotation.set(0, 0, 0);
                    toggleHeadlightVisibility(true);
                    break;
                case CameraStates.THIRD_STERN:
                    camera.position.set(0, 2, 10);
                    camera.rotation.set(0, 0, 0);
                    break;
                case CameraStates.THIRD_STARBOARD:
                    camera.position.set(10, 10, 0);
                    camera.lookAt(0, 0, 0);
                    break;
                case CameraStates.THIRD_FREE:
                    // Letting OrbitControl take over
                    break;
                default:
                    console.error(`unhandled camera state: ${cameraState}`);
                    break;
            }

            chassisMesh.position.set(position.x(), position.y(), position.z());
            chassisMesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());

            let speedFixed = speed.toFixed(2);
            carSpeed = speedFixed;
        });
    }

    createVehicle(syncList) {
        const carPosition = this.carPosition;
        const quat = ZERO_QUATERNION;
        const tuning = new Ammo.btVehicleTuning();
        const transform = new Ammo.btTransform();
        const localInertia = new Ammo.btVector3(0, 0, 0);

        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(carPosition.x, carPosition.y, carPosition.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        const motionState = new Ammo.btDefaultMotionState(transform);

        const ammoGeom = new Ammo.btBoxShape(
            new Ammo.btVector3(
                this.chassisParams.width * .5,
                this.chassisParams.height * .5,
                this.chassisParams.length * .5
            )
        );

        ammoGeom.calculateLocalInertia(800, localInertia);

        const ammoCarBody = new Ammo.btRigidBody(
            new Ammo.btRigidBodyConstructionInfo(
                800,
                motionState,
                ammoGeom,
                localInertia
            )
        );

        ammoCarBody.setActivationState(4);
        this.physicsWorld.addRigidBody(ammoCarBody);

        const rayCaster = new Ammo.btDefaultVehicleRaycaster(this.physicsWorld);
        const vehicle = new Ammo.btRaycastVehicle(tuning, ammoCarBody, rayCaster);
        vehicle.setCoordinateSystem(0, 1, 2);
        this.physicsWorld.addAction(vehicle);

        const wheelParams = {
            radius: 1 / 4,
            height: 1 / 4,
            tuning: tuning,
            vehicle,
        };

        const chassisMesh = this.createChassis(this.chassisParams);
        chassisMesh.add(camera);

        const wheelPosition = {
            x: this.chassisParams.width / 2 + 0.1,
            y: 0.2,
            z: this.chassisParams.length / 2
        }

        const wheelMeshes = [
            this.createWheel(
                wheelParams,
                new Ammo.btVector3(-wheelPosition.x, wheelPosition.y, wheelPosition.z),
                true
            ),
            this.createWheel(
                wheelParams,
                new Ammo.btVector3(wheelPosition.x, wheelPosition.y, wheelPosition.z),
                false
            ),
            this.createWheel(
                wheelParams,
                new Ammo.btVector3(+wheelPosition.x, wheelPosition.y, -wheelPosition.z),
                false
            ),
            this.createWheel(
                wheelParams,
                new Ammo.btVector3(-wheelPosition.x, wheelPosition.y, -wheelPosition.z),
                true
            )
        ];

        chassisMesh.position.set(carPosition.x, carPosition.y, carPosition.z);

        // Updates the car's position
        this.addToSyncList(syncList, chassisMesh, vehicle, wheelMeshes);

        return chassisMesh;
    }
}
