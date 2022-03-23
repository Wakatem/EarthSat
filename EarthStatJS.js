var gl;
var program;

var theta = 0.0;
var transformationMat_loc;
var viewM_loc;
var projectionM_loc;
var modelIsEarth_loc;

var earth;
var sat;

var translationX = 0.0;
var translationY = 0.0;
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
    gl.clearColor(0.0, 0.0, 0.0, 0.9); //set RGBA values of canvas color on color buffer clearance
    gl.enable(gl.DEPTH_TEST);



    var view = lookAt(vec3(-60, 30, 0), vec3(0, 0, 0), vec3(0, 1, 0));
    var projection = perspective(70, 1000/750, 1.0, 100.0);
    setupUniforms(view, projection);




    earth = new Earth();
    sat = new Surface();
    renderModels();
}


function renderModels(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    earth.render();
    sat.render();

    requestAnimationFrame(renderModels);
}




////////////////////////////////////   Helper Functions   ////////////////////////////////////




function setupAttributes(vertices, colors, texcoord) {

    //vPosition
    var positionBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var vPosition_loc = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition_loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition_loc);


    


    //vColor
    if(colors != null){
    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    var vColor_loc = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor_loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor_loc);
    
    }


    //a_texcoord
    if(texcoord != null){
        var texBufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, texcoord, gl.STATIC_DRAW);
    
        var a_texcoord_loc = gl.getAttribLocation(program, "a_texcoord");
        gl.vertexAttribPointer(a_texcoord_loc, 2, gl.FLOAT, true, 0, 0);
        gl.enableVertexAttribArray(a_texcoord_loc);
    }
}



function setupUniforms(viewM, projectionM){
    
    //transformation
    transformationMat_loc = gl.getUniformLocation(program, "transformation");

    //view matrix
    viewM_loc = gl.getUniformLocation(program, "view");
    gl.uniformMatrix4fv(viewM_loc, false, flatten(viewM));

    //projection matrix
    projectionM_loc = gl.getUniformLocation(program, "projection");
    gl.uniformMatrix4fv(projectionM_loc, false, flatten(projectionM));

    //modelIsEarth
    modelIsEarth_loc = gl.getUniformLocation(program, "modelIsEarth");
}


//4x1 transpose for a vector
function vTranspose( m )
{
    var result = [];
    for (var i=0; i < 4; i++){
        result.push([])
        result[i][0] = m[i]
    }
    
    return result;
}

function vMult(m, v)
{
    var result = []
    var sum = 0
    for (let i = 0; i < m.length; i++) {
        result.push([])
        for (let j = 0; j < m[i].length; j++) {
            sum += m[i][j] * v[i][0]
            
        }
        
        result[i][0] = sum
        sum=0
    }

    return result;

}






////////////////////////////////////   Classes   ////////////////////////////////////



class Surface{
    constructor(){
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertices = []
        this.verticesColors = [];
        this.properties = 
        {
            submodels:
            [
                {
                    rotation: rotate(10, 1, 0, 0),
                    points: 
                    [
                        [-15,    0,  13, 1],      //v0
                        [-15,  10,   13, 1],      //v1
                        [10,   10,   13, 1],      //v2
                        [10,     0,  13, 1],      //v3
                
                        [-15,     0,  -13, 1],      //v4
                        [-15,     15,  -13, 1],     //v5
                        [15,    15,  -13, 1],       //v6
                        [15,  0,  -13, 1]           //v7
                    ]
                }

            ],


        }


           this.getSubmodelsProperties();
           setupAttributes(this.vertices, new Float32Array(this.verticesColors), null);
           
    }


    getSubmodelsProperties(){

        this.properties.submodels.forEach(submodel => {
            var initialPoints = submodel.points
            var p = []; // array of transformed points
            var rotationMatrix = submodel.rotation;

            //transform points
            initialPoints.forEach(point => {
                var transformedPoint = vMult(rotationMatrix, vTranspose(point));
                //revert to 1x4 point
                var vec = vec4(transformedPoint[0][0], transformedPoint[1][0], transformedPoint[2][0], transformedPoint[3][0])
                p.push(vec);
            });

            this.vertices = new Float32Array([        
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
           var numberOfVertices = this.vertices.length / 4;

           
           var j=0;
           var factor = 0.17
           for (let i = 0; i < numberOfVertices; i++) {
               //scale x
               this.vertices[j] = this.vertices[j] * factor
               j++;

               //scale y
               this.vertices[j] = this.vertices[j] * factor
               j++;

               //scale z
               this.vertices[j] = this.vertices[j] * factor
               j++;

               //skip w
               j++
           }
    
           var faceColor = 
           [
            [1, 0, 0, 1],   //red
            [0, 1, 0, 1],   //green
            [0, 1, 1, 1],   //cyan
            [0, 0, 1, 1],   //blue
            [1, 0, 1, 1],   //purple
            [1, 1, 0, 1]    //yellow
            ]


    
           var selectedColor = 0;
           while (this.verticesColors.length / 4 != numberOfVertices)       
           {
               var counter = 0;
               while(counter != 6)
               {
                   this.verticesColors.push(...faceColor[selectedColor]);
                   counter++;
               }
               
               selectedColor++;
           }


           

        });


    }
    render(){
        //rendering of the something
        gl.bindVertexArray(this.vao);
        gl.uniform1f(modelIsEarth_loc, 2.0);

        theta+=1.0;
        var translation = translate(0, translationY, translationX)

        gl.uniformMatrix4fv(transformationMat_loc, false, flatten(translation));

        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}







class Earth{
    constructor(){
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

            //all unique points (corners) of the solar panel
    var p = [
        [-15,    -15,  15, 1],      //v0
        [-15,  15,   15, 1],      //v1
        [15,   15,   15, 1],      //v2
        [15,     -15,  15, 1],      //v3
        
        [-15,     -15,  -15, 1],      //v4
        [-15,     15,  -15, 1],     //v5
        [15,    15,  -15, 1],       //v6
        [15,  -15,  -15, 1]           //v7
    ];
    
    
    this.vertices = new Float32Array([        
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
        this.textcoord = new Float32Array([

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



        //total rendered number of vertices
        this.numberOfVertices = 6 * 6;
        this.prepareTexture()
        setupAttributes(this.vertices, null, this.textcoord);
    }

    prepareTexture(){
        
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
    }


    render(){
        //rendering of the something
        gl.bindVertexArray(this.vao);
        gl.uniform1f(modelIsEarth_loc, 1.0);

        theta+=1.0;
        var rotation = rotate(theta, 0, 1, 0)
        gl.uniformMatrix4fv(transformationMat_loc, false, flatten(rotation));

        gl.drawArrays(gl.TRIANGLES, 0, this.numberOfVertices);
    }

}



////////////////////////////// controls

document.addEventListener('keydown', (event) => {
    var name = event.key;
    var code = event.code;
    if (name === 'ArrowLeft') {
      // Do nothing.
      translationX -= 3.0;
    }

    if (name === 'ArrowRight') {
        // Do nothing.
        translationX += 3.0;
      }
    

      if (name === 'ArrowUp') {
        // Do nothing.
        translationY += 3.0;
      }

      if (name === 'ArrowDown') {
        // Do nothing.
        translationY -= 3.0; 
      }

    });



