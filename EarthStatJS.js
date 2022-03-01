var gl;
var program;


var modelM_loc;
var viewM_loc;
var projectionM_loc;

var SatelliteVAO;

// ============================================================= //


window.onload = function init() {
    //create canvas context
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");

    //initialize shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //configure view
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); //set RGBA values of canvas color on color buffer clearance
    gl.enable(gl.DEPTH_TEST);



    //all unique points (corners) of the solar panel
    var p = [
        [-15,    0,  15],      //v0
        [-15,  15,   15],      //v1
        [15,   15,   15],      //v2
        [15,     0,  15],      //v3
        
        [-15,     0,  -15],      //v4
        [-15,     15,  -15],     //v5
        [15,    15,  -15],       //v6
        [15,  0,  -15]           //v7
    ];
    
    
    var vertices = new Float32Array([        
        ...p[0], ...p[3], ...p[2],
        ...p[2], ...p[1], ...p[0],   //front face

        ...p[4], ...p[7], ...p[6],
        ...p[6], ...p[5], ...p[4],   //back face



        ...p[4], ...p[0], ...p[1],
        ...p[1], ...p[5], ...p[4],   //left face

        ...p[3], ...p[7], ...p[6],
        ...p[6], ...p[2], ...p[3],   //right face



        ...p[1], ...p[2], ...p[6],
        ...p[6], ...p[5], ...p[1],   //top face

        ...p[0], ...p[3], ...p[7],
        ...p[7], ...p[4], ...p[0],   //bottom face
    ]);
    
    


    //total rendered number of vertices
    var numberOfVertices = vertices.length / 3;

    var verticesColors = [];

    var faceColor = [
        [1, 0, 0, 1],   //red
        [0, 1, 0, 1],   //green
        [0, 1, 1, 1],   //cyan
        [0, 0, 1, 1],   //blue
        [1, 0, 1, 1],   //purple
        [1, 1, 0, 1]    //yellow
    ]


    
    var selectedColor = 0;
    while (verticesColors.length / 4 != numberOfVertices)       
    {
        var counter = 0;
        while(counter != 6)
        {
            verticesColors.push(...faceColor[selectedColor]);
            counter++;
        }
        
        selectedColor++;
    }
    
    
    //orthographric projection
    //var view = lookAt(vec3(1, 1, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    //var projection = ortho(-30.0, 30.0, -30.0, 30.0, -30.0, 30.0);


    //perspective projection
    var view = lookAt(vec3(-60, 30, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    var projection = perspective(50, 1000/750, 1.0, 100.0);


    SatelliteVAO = createVAO();
    setupAttributes(vertices, new  Float32Array(verticesColors));
    setupUniforms(0, view, projection);

    render(numberOfVertices);
}





function createVAO() {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    return vao;
}


function setupAttributes(vertices, colors) {

    //vPosition
    var positionBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var vPosition_loc = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition_loc);



    //vColor
    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    var vColor_loc = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor_loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor_loc);
}



function setupUniforms(modelM, viewM, projectionM){
    
    //model
    rotationMat_loc = gl.getUniformLocation(program, "model");
    gl.uniformMatrix4fv(modelM_loc, false, flatten(modelM));

    //view matrix
    viewM_loc = gl.getUniformLocation(program, "view");
    gl.uniformMatrix4fv(viewM_loc, false, flatten(viewM));

    //projection matrix
    projectionM_loc = gl.getUniformLocation(program, "projection");
    gl.uniformMatrix4fv(projectionM_loc, false, flatten(projectionM));
}


function render(numberOfIterations) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    //rendering of the satellite
    gl.bindVertexArray(SatelliteVAO);


    gl.drawArrays(gl.TRIANGLES, 0, numberOfIterations);

}



