import { mat4 } from 'gl-matrix';
import q3glshader from '../gl-shaders';
import q3shader from '../shaders';
import BSPTree from './bsp-tree';

const Worker = require('worker-loader!./../worker');

// Constants
const q3bsp_vertex_stride = 56;
const q3bsp_sky_vertex_stride = 20;

export default class q3bsp {
  constructor (gl) {
    // gl initialization
    this.gl = gl;
    this.onload = null;
    this.onbsp = null;
    this.onentitiesloaded = null;

    var map = this;

    this.showLoadStatus();

    // Spawn the web worker
    this.worker = new Worker;
    this.worker.onmessage = function(msg) {
      map.onMessage(msg);
    };
    this.worker.onerror = function(msg) {
      console.error('Line: ' + msg.lineno + ', ' + msg.message);
    };

    // Map elements
    this.skyboxBuffer = null;
    this.skyboxIndexBuffer = null;
    this.skyboxIndexCount = 0;
    this.skyboxMat = mat4.create();

    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.indexCount = 0;
    this.lightmap = q3glshader.createSolidTexture(gl, [255,255,255,255]);
    this.surfaces = null;
    this.shaders = {};

    this.highlighted = null;

    // Sorted draw elements
    this.skyShader = null;
    this.unshadedSurfaces = [];
    this.defaultSurfaces = [];
    this.modelSurfaces = [];
    this.effectSurfaces = [];

    // BSP Elements
    this.bspTree = null;

    // Effect elements
    this.startTime = new Date().getTime();
    this.bgMusic = null;
  }

  highlightShader (name) {
    this.highlighted = name;
  }

  onMessage (message) {
    const type = message.data.type;

    switch(type) {
      case 'entities':
        this.entities = message.data.entities;
        this.processEntities(this.entities);
        break;

      case 'geometry':
        this.buildBuffers(message.data.vertices, message.data.indices);
        this.surfaces = message.data.surfaces;
        this.bindShaders();
        break;

      case 'lightmap':
        this.buildLightmaps(message.data.size, message.data.lightmaps);
        break;

      case 'shaders':
        this.buildShaders(message.data.shaders);
        break;

      case 'bsp':
        this.bspTree = new BSPTree(message.data.bsp);

        if(this.onbsp) {
          this.onbsp(this.bspTree);
        }

        this.clearLoadStatus();
        break;

      case 'visibility':
        this.setVisibility(message.data.visibleSurfaces);
        break;

      case 'status':
        this.onLoadStatus(message.data.message);
        break;

      default:
        throw `Unexpected message type: ${message.data.type}`;
    }
  }

  showLoadStatus () {
    // Yeah, this shouldn't be hardcoded in here
    var loading = document.getElementById('loading');
    loading.style.display = 'block';
  }

  onLoadStatus (message) {
    // Yeah, this shouldn't be hardcoded in here
    var loading = document.getElementById('loading');
    loading.innerHTML = message;
  }

  clearLoadStatus () {
    // Yeah, this shouldn't be hardcoded in here
    var loading = document.getElementById('loading');
    loading.style.display = 'none';
  }

  load (url, tesselationLevel) {
    if(!tesselationLevel) {
      tesselationLevel = 5;
    }
    this.worker.postMessage({
      type: 'load',
      url: '/q3tourney2.bsp',
      tesselationLevel: tesselationLevel
    });
  }

  loadShaders (sources) {
    var map = this;

    for(var i = 0; i < sources.length; ++i) {
      sources[i] = '/' + sources[i];
    }

    q3shader.loadList(sources, function(shaders) {
      map.buildShaders(shaders);
    });
  }

  buildBuffers (vertices, indices) {
    var gl = this.gl;

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.indexCount = indices.length;

    var skyVerts = [
      -128, 128, 128, 0, 0,
      128, 128, 128, 1, 0,
      -128, -128, 128, 0, 1,
      128, -128, 128, 1, 1,

      -128, 128, 128, 0, 1,
      128, 128, 128, 1, 1,
      -128, 128, -128, 0, 0,
      128, 128, -128, 1, 0,

      -128, -128, 128, 0, 0,
      128, -128, 128, 1, 0,
      -128, -128, -128, 0, 1,
      128, -128, -128, 1, 1,

      128, 128, 128, 0, 0,
      128, -128, 128, 0, 1,
      128, 128, -128, 1, 0,
      128, -128, -128, 1, 1,

      -128, 128, 128, 1, 0,
      -128, -128, 128, 1, 1,
      -128, 128, -128, 0, 0,
      -128, -128, -128, 0, 1
    ];

    var skyIndices = [
      0, 1, 2,
      1, 2, 3,

      4, 5, 6,
      5, 6, 7,

      8, 9, 10,
      9, 10, 11,

      12, 13, 14,
      13, 14, 15,

      16, 17, 18,
      17, 18, 19
    ];

    this.skyboxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyboxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyVerts), gl.STATIC_DRAW);

    this.skyboxIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyboxIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(skyIndices), gl.STATIC_DRAW);

    this.skyboxIndexCount = skyIndices.length;
  }

  // Update which portions of the map are visible based on position
  updateVisibility (pos) {
    this.worker.postMessage({
      type: 'visibility',
      pos: pos
    });
  }

  setVisibility (visibilityList) {
    if(this.surfaces.length > 0) {
      for(var i = 0; i < this.surfaces.length; ++i) {
        this.surfaces[i].visible = (visibilityList[i] === true);
      }
    }
  }


  processEntities (entities) {
    if(this.onentitiesloaded) {
      this.onentitiesloaded(entities);
    }
  }

  buildLightmaps (size, lightmaps) {
    var gl = this.gl;

    gl.bindTexture(gl.TEXTURE_2D, this.lightmap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    for(var i = 0; i < lightmaps.length; ++i) {
      gl.texSubImage2D(
        gl.TEXTURE_2D, 0, lightmaps[i].x, lightmaps[i].y, lightmaps[i].width, lightmaps[i].height,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(lightmaps[i].bytes)
      );
    }

    gl.generateMipmap(gl.TEXTURE_2D);

    q3glshader.init(gl, this.lightmap);
  }

  buildShaders (shaders) {
    var gl = this.gl;

    for(var i = 0; i < shaders.length; ++i) {
      var shader = shaders[i];
      var glShader = q3glshader.build(gl, shader);
      this.shaders[shader.name] = glShader;
    }
  }

  bindShaders () {
    if(!this.surfaces) { return; }

    if(this.onsurfaces) {
      this.onsurfaces(this.surfaces);
    }

    for(var i = 0; i < this.surfaces.length; ++i) {
      var surface = this.surfaces[i];
      if(surface.elementCount === 0 || surface.shader || surface.shaderName == 'noshader') { continue; }
      this.unshadedSurfaces.push(surface);
    }

    var map = this;

    var interval = setInterval(function() {
      if(map.unshadedSurfaces.length === 0) { // Have we processed all surfaces?
        // Sort to ensure correct order of transparent objects
        map.effectSurfaces.sort(function(a, b) {
          var order = a.shader.sort - b.shader.sort;
          // TODO: Sort by state here to cut down on changes?
          return order; //(order == 0 ? 1 : order);
        });

        clearInterval(interval);
        return;
      }

      var surface = map.unshadedSurfaces.shift();

      var shader = map.shaders[surface.shaderName];
      if(!shader) {
        surface.shader = q3glshader.buildDefault(map.gl, surface);
        if(surface.geomType == 3) {
          surface.shader.model = true;
          map.modelSurfaces.push(surface);
        } else {
          map.defaultSurfaces.push(surface);
        }
      } else {
        surface.shader = shader;
        if(shader.sky) {
          map.skyShader = shader; // Sky does not get pushed into effectSurfaces. It's a separate pass
        } else {
          map.effectSurfaces.push(surface);
        }
        q3glshader.loadShaderMaps(map.gl, surface, shader);
      }
    }, 10);
  }

  // Draw the map
  bindShaderMatrix (shader, modelViewMat, projectionMat) {
    var gl = this.gl;

    // Set uniforms
    gl.uniformMatrix4fv(shader.uniform.modelViewMat, false, modelViewMat);
    gl.uniformMatrix4fv(shader.uniform.projectionMat, false, projectionMat);
  }

  bindShaderAttribs (shader) {
    var gl = this.gl;

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attrib.position);
    gl.vertexAttribPointer(shader.attrib.position, 3, gl.FLOAT, false, q3bsp_vertex_stride, 0);

    if(shader.attrib.texCoord !== undefined) {
      gl.enableVertexAttribArray(shader.attrib.texCoord);
      gl.vertexAttribPointer(shader.attrib.texCoord, 2, gl.FLOAT, false, q3bsp_vertex_stride, 3*4);
    }

    if(shader.attrib.lightCoord !== undefined) {
      gl.enableVertexAttribArray(shader.attrib.lightCoord);
      gl.vertexAttribPointer(shader.attrib.lightCoord, 2, gl.FLOAT, false, q3bsp_vertex_stride, 5*4);
    }

    if(shader.attrib.normal !== undefined) {
      gl.enableVertexAttribArray(shader.attrib.normal);
      gl.vertexAttribPointer(shader.attrib.normal, 3, gl.FLOAT, false, q3bsp_vertex_stride, 7*4);
    }

    if(shader.attrib.color !== undefined) {
      gl.enableVertexAttribArray(shader.attrib.color);
      gl.vertexAttribPointer(shader.attrib.color, 4, gl.FLOAT, false, q3bsp_vertex_stride, 10*4);
    }
  }

  bindSkyMatrix (shader, modelViewMat, projectionMat) {
    var gl = this.gl;

    mat4.copy(this.skyboxMat, modelViewMat);
    // Clear out the translation components
    this.skyboxMat[12] = 0;
    this.skyboxMat[13] = 0;
    this.skyboxMat[14] = 0;

    // Set uniforms
    gl.uniformMatrix4fv(shader.uniform.modelViewMat, false, this.skyboxMat);
    gl.uniformMatrix4fv(shader.uniform.projectionMat, false, projectionMat);
  }

  bindSkyAttribs (shader) {
    var gl = this.gl;

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attrib.position);
    gl.vertexAttribPointer(shader.attrib.position, 3, gl.FLOAT, false, q3bsp_sky_vertex_stride, 0);

    if(shader.attrib.texCoord !== undefined) {
      gl.enableVertexAttribArray(shader.attrib.texCoord);
      gl.vertexAttribPointer(shader.attrib.texCoord, 2, gl.FLOAT, false, q3bsp_sky_vertex_stride, 3*4);
    }
  }

  setViewport (viewport) {
    if (viewport) {
      this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
    }
  }

  draw (leftViewMat, leftProjMat, leftViewport, rightViewMat, rightProjMat, rightViewport) {
    if(this.vertexBuffer === null || this.indexBuffer === null) { return; } // Not ready to draw yet

    var gl = this.gl; // Easier to type and potentially a bit faster

    // Seconds passed since map was initialized
    var time = (new Date().getTime() - this.startTime)/1000.0;
    var i = 0;

    // Loop through all shaders, drawing all surfaces associated with them
    if(this.surfaces.length > 0) {

      // If we have a skybox, render it first
      if(this.skyShader) {
        // SkyBox Buffers
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyboxIndexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyboxBuffer);

        // Render Skybox
        if(q3glshader.setShader(gl, this.skyShader)) {
          for(var j = 0; j < this.skyShader.stages.length; ++j) {
            var stage = this.skyShader.stages[j];

            var shaderProgram = q3glshader.setShaderStage(gl, this.skyShader, stage, time);
            if(!shaderProgram) { continue; }
            this.bindSkyAttribs(shaderProgram);

            // Draw Sky geometry
            this.bindSkyMatrix(shaderProgram, leftViewMat, leftProjMat);
            this.setViewport(leftViewport);
            gl.drawElements(gl.TRIANGLES, this.skyboxIndexCount, gl.UNSIGNED_SHORT, 0);

            if (rightViewMat) {
              this.bindSkyMatrix(shaderProgram, rightViewMat, rightProjMat);
              this.setViewport(rightViewport);
              gl.drawElements(gl.TRIANGLES, this.skyboxIndexCount, gl.UNSIGNED_SHORT, 0);
            }
          }
        }
      }

      // Map Geometry buffers
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

      // Default shader surfaces (can bind shader once and draw all of them very quickly)
      if(this.defaultSurfaces.length > 0 || this.unshadedSurfaces.length > 0) {
        // Setup State
        var shader = q3glshader.defaultShader;
        q3glshader.setShader(gl, shader);
        let shaderProgram = q3glshader.setShaderStage(gl, shader, shader.stages[0], time);
        this.bindShaderAttribs(shaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, q3glshader.defaultTexture);

        this.bindShaderMatrix(shaderProgram, leftViewMat, leftProjMat);
        this.setViewport(leftViewport);
        for(i = 0; i < this.unshadedSurfaces.length; ++i) {
          var surface = this.unshadedSurfaces[i];
          gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
        }
        for(i = 0; i < this.defaultSurfaces.length; ++i) {
          let surface = this.defaultSurfaces[i];
          let stage = surface.shader.stages[0];
          gl.bindTexture(gl.TEXTURE_2D, stage.texture);
          gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
        }

        if (rightViewMat) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, q3glshader.defaultTexture);

          this.bindShaderMatrix(shaderProgram, rightViewMat, rightProjMat);
          this.setViewport(rightViewport);
          for(i = 0; i < this.unshadedSurfaces.length; ++i) {
            let surface = this.unshadedSurfaces[i];
            gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
          }

          for(i = 0; i < this.defaultSurfaces.length; ++i) {
            let surface = this.defaultSurfaces[i];
            let stage = surface.shader.stages[0];
            gl.bindTexture(gl.TEXTURE_2D, stage.texture);
            gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
          }
        }
      }

      // Model shader surfaces (can bind shader once and draw all of them very quickly)
      if(this.modelSurfaces.length > 0) {
        // Setup State
        let shader = this.modelSurfaces[0].shader;
        q3glshader.setShader(gl, shader);
        let shaderProgram = q3glshader.setShaderStage(gl, shader, shader.stages[0], time);
        this.bindShaderAttribs(shaderProgram);
        gl.activeTexture(gl.TEXTURE0);

        this.bindShaderMatrix(shaderProgram, leftViewMat, leftProjMat);
        this.setViewport(leftViewport);
        for(i = 0; i < this.modelSurfaces.length; ++i) {
          let surface = this.modelSurfaces[i];
          let stage = surface.shader.stages[0];
          gl.bindTexture(gl.TEXTURE_2D, stage.texture);
          gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
        }

        if (rightViewMat) {
          this.bindShaderMatrix(shaderProgram, rightViewMat, rightProjMat);
          this.setViewport(rightViewport);
          for(i = 0; i < this.modelSurfaces.length; ++i) {
            let surface = this.modelSurfaces[i];
            let stage = surface.shader.stages[0];
            gl.bindTexture(gl.TEXTURE_2D, stage.texture);
            gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
          }
        }
      }

      // Effect surfaces
      for(let i = 0; i < this.effectSurfaces.length; ++i) {
        let surface = this.effectSurfaces[i];
        if(surface.elementCount == 0 || surface.visible !== true) { continue; }

        // Bind the surface shader
        let shader = surface.shader;

        if(this.highlighted && this.highlighted == surface.shaderName) {
          shader = q3glshader.defaultShader;
        }

        if(!q3glshader.setShader(gl, shader)) { continue; }

        for(let j = 0; j < shader.stages.length; ++j) {
          let stage = shader.stages[j];

          let shaderProgram = q3glshader.setShaderStage(gl, shader, stage, time);
          if(!shaderProgram) { continue; }
          this.bindShaderAttribs(shaderProgram);
          this.bindShaderMatrix(shaderProgram, leftViewMat, leftProjMat);
          this.setViewport(leftViewport);
          // Draw all geometry that uses this textures
          gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);

          if (rightViewMat) {
            this.bindShaderMatrix(shaderProgram, rightViewMat, rightProjMat);
            this.setViewport(rightViewport);
            // Draw all geometry that uses this textures
            gl.drawElements(gl.TRIANGLES, surface.elementCount, gl.UNSIGNED_SHORT, surface.indexOffset);
          }
        }
      }
    }
  }
}
