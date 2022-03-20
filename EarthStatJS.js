var gl;
var program;

var theta = 0.0;

var theta_loc;
var rotationMat_loc;
var viewM_loc;
var projectionM_loc;

var somethingVAO;

// ============================================================= //

function createVAO() {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    return vao;
}


function setupAttributes(vertices, colors, texcoord) {

    //vPosition
    var positionBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var vPosition_loc = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition_loc);



    //vColor
    // var colorBufferId = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    // gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    // var vColor_loc = gl.getAttribLocation(program, "vColor");
    // gl.vertexAttribPointer(vColor_loc, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vColor_loc);


    //a_texcoord
    var texBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, texcoord, gl.STATIC_DRAW);

    var a_texcoord_loc = gl.getAttribLocation(program, "a_texcoord");
    gl.vertexAttribPointer(a_texcoord_loc, 2, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(a_texcoord_loc);
}



function setupUniforms(viewM, projectionM){
    
    //rotation
    rotationMat_loc = gl.getUniformLocation(program, "rotationY");

    //view matrix
    viewM_loc = gl.getUniformLocation(program, "view");
    gl.uniformMatrix4fv(viewM_loc, false, flatten(viewM));

    //projection matrix
    projectionM_loc = gl.getUniformLocation(program, "projection");
    gl.uniformMatrix4fv(projectionM_loc, false, flatten(projectionM));
}


function render(numberOfIterations) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    //rendering of the something
    gl.bindVertexArray(somethingVAO);
    

    theta+=1.0;
    var rotation = rotate(theta, 0, 1, 0)
    gl.uniformMatrix4fv(rotationMat_loc, false, flatten(rotation));
    

    gl.drawArrays(gl.TRIANGLES, 0, numberOfIterations);
    requestAnimationFrame(render);

}


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
        [-15,    -15,  15],      //v0
        [-15,  15,   15],      //v1
        [15,   15,   15],      //v2
        [15,     -15,  15],      //v3
        
        [-15,     -15,  -15],      //v4
        [-15,     15,  -15],     //v5
        [15,    15,  -15],       //v6
        [15,  -15,  -15]           //v7
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

    var t = [
        [0.25, 0],
        [0.5, 0],
        [0, 0.34],
        [0.25, 0.34],
        [0.5, 0.34],
        [0.75, 0.34],
        [1.0, 0.34],
        [0, 0.66],
        [0.25, 0.66],
        [0.5, 0.66],
        [0.75, 0.66],
        [1.0, 0.66],
        [0.25, 1.0],
        [0.5, 1.0]
    ];

    var textcoord = new Float32Array([

        //front face
        ...t[8], ...t[9], ...t[4],
        ...t[4], ...t[3], ...t[8],

        //back face
        ...t[10], ...t[11], ...t[6 ],
        ...t[6 ], ...t[5 ], ...t[10],

        //left face
        ...t[7], ...t[8], ...t[3],
        ...t[3], ...t[2], ...t[7],

        //right face
        ...t[9], ...t[10], ...t[5],
        ...t[5], ...t[4 ], ...t[9],

        //top face
        ...t[3], ...t[4], ...t[1],
        ...t[1], ...t[0], ...t[3],

        //bottom face
        ...t[12], ...t[13], ...t[9 ],
        ...t[9 ], ...t[8 ], ...t[12]
    ]);
    
    var texture = gl.createTexture();

    // use texture unit 0
    gl.activeTexture(gl.TEXTURE0 + 0);

    // bind to the TEXTURE_2D bind point of texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    // Asynchronously load an image
    var image = new Image();
    image.src = "media/earth.png";
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });


    //total rendered number of vertices
    //var numberOfVertices = vertices.length / 2;
    var numberOfVertices = 6 * 3;

    var verticesColors = [];

    // var faceColor = [
    //     [1, 0, 0, 1],   //red
    //     [0, 1, 0, 1],   //green
    //     [0, 1, 1, 1],   //cyan
    //     [0, 0, 1, 1],   //blue
    //     [1, 0, 1, 1],   //purple
    //     [1, 1, 0, 1]    //yellow
    // ]


    
    // var selectedColor = 0;
    // while (verticesColors.length / 4 != numberOfVertices)       
    // {
    //     var counter = 0;
    //     while(counter != 6)
    //     {
    //         verticesColors.push(...faceColor[selectedColor]);
    //         counter++;
    //     }
        
    //     selectedColor++;
    // }
    
    
    //var view = lookAt(vec3(1, 1, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    //var projection = ortho(-30.0, 30.0, -30.0, 30.0, -30.0, 30.0);

    var view = lookAt(vec3(-60, 30, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    var projection = perspective(50, 1000/750, 1.0, 100.0);


    somethingVAO = createVAO();
    setupAttributes(vertices, new  Float32Array(verticesColors), textcoord);
    setupUniforms(view, projection);

    render(numberOfVertices);
}

