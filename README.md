# Computer Graphics Collaborative Project
## CPSC-425 Spring 2023 Team 2; "Team Wedge Car"

### Project Members
Dominic Bevilacqua
Ryan McKenzie
Suyash Kushwaha

## Live demo
https://gu-computer-graphics.github.io/team-project-team-wedge/

## Project Scene Description/Summary
A basic racing game: drive our goofy little car around on some basic terrain! Navigate the racetrack and obstacles. The scene is made up of a track, a curved terrain, the car, trees, and clouds! Lighting and fog are used to make the scene look prettier.

## Features Demonstrated

The following are features that demonstrated in this project scene:

- modeling, particularly hierarchical
    - This is used all over the place: from trees to the car itself. 
    - Files: [js/car.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/car.js) and [js/scene.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/scene.js)
- material, lighting and shading
    - Ambient lighting, spotlight and fog is used strategically to give the scene more depth. Tree-top’s shininess is set to 0. 
    - File: [index.html](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/index.html)
- changing camera position or shape
    - The camera is attached to the car object, so there’s no complicated logic required to track the camera with the car. Moving the car will automatically move the camera with it. This also enables us to position the camera in 5 different ways.
    - File: [js/car.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/car.js)
- curved lines or surfaces
    - The terrain is a curved surface. The heightmap is generated using the sine function. When trees are generated, their Y-value is adjusted using the heightmap.
    - File: [js/scene.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/scene.js)
- textures and texture-mapping
    -  Our textures are loaded from web sources, and applied to the grass terrain, road, and clouds.
    -  Files: [js/scene.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/scene.js) and [index.html](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/index.html)
- transparency
    - The clouds are transparent and have textures. The depthWrite property is set to false so the textures can be superimposed naturally
    -  File: [js/scene.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/scene.js)
- user interaction
    - The user can interact with the program in multiple ways: toggle headlights, control the car, change the camera view, and toggle the daylight.
    - Files: [js/car.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/car.js) and [index.html](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/index.html)
- animation
    - The clouds are animated.
    - File: [js/scene.js](https://github.com/GU-Computer-Graphics/team-project-team-wedge/blob/main/js/scene.js)
  
## Resources Used and/or Referenced
  - [Ammo.js](https://github.com/kripken/ammo.js)
    - The physics engine used to make the objects interactable.
  - [Ammo.js demo vehicle](https://github.com/kripken/ammo.js/tree/main/examples/webgl_demo_vehicle)
    - The vehicle demo we referenced to make the car.
  - [Ammo.js demo terrain](https://github.com/kripken/ammo.js/tree/main/examples/webgl_demo_terrain)
    - The terrain demo we referenced to generate the terrain.
  - [Three.js documentation and examples](https://threejs.org/docs/index.html)
