var ModelClippingPlanesPipelineStage = {
  name: "ModelClippingPlanesPipelineStage"
  // Helps with debugging
};
var textureResolutionScratch2 = new Cartesian2_default();
ModelClippingPlanesPipelineStage.process = function(renderResources, model, frameState) {
  const clippingPlanes = model.clippingPlanes;
  const context = frameState.context;
  const shaderBuilder = renderResources.shaderBuilder;
  shaderBuilder.addDefine(
    "HAS_CLIPPING_PLANES",
    void 0,
    ShaderDestination_default.FRAGMENT
  );
  shaderBuilder.addDefine(
    "CLIPPING_PLANES_LENGTH",
    clippingPlanes.length,
    ShaderDestination_default.FRAGMENT
  );
  if (clippingPlanes.unionClippingRegions) {
    shaderBuilder.addDefine(
      "UNION_CLIPPING_REGIONS",
      void 0,
      ShaderDestination_default.FRAGMENT
    );
  }
  if (ClippingPlaneCollection_default.useFloatTexture(context)) {
    shaderBuilder.addDefine(
      "USE_CLIPPING_PLANES_FLOAT_TEXTURE",
      void 0,
      ShaderDestination_default.FRAGMENT
    );
  }
  const textureResolution = ClippingPlaneCollection_default.getTextureResolution(
    clippingPlanes,
    context,
    textureResolutionScratch2
  );
  shaderBuilder.addDefine(
    "CLIPPING_PLANES_TEXTURE_WIDTH",
    textureResolution.x,
    ShaderDestination_default.FRAGMENT
  );
  shaderBuilder.addDefine(
    "CLIPPING_PLANES_TEXTURE_HEIGHT",
    textureResolution.y,
    ShaderDestination_default.FRAGMENT
  );
  shaderBuilder.addUniform(
    "sampler2D",
    "model_clippingPlanes",
    ShaderDestination_default.FRAGMENT
  );
  shaderBuilder.addUniform(
    "vec4",
    "model_clippingPlanesEdgeStyle",
    ShaderDestination_default.FRAGMENT
  );
  shaderBuilder.addUniform(
    "mat4",
    "model_clippingPlanesMatrix",
    ShaderDestination_default.FRAGMENT
  );
  shaderBuilder.addFragmentLines(ModelClippingPlanesStageFS_default);
  const uniformMap2 = {
    model_clippingPlanes: function() {
      return clippingPlanes.texture;
    },
    model_clippingPlanesEdgeStyle: function() {
      const style = Color_default.clone(clippingPlanes.edgeColor);
      style.alpha = clippingPlanes.edgeWidth;
      return style;
    },
    model_clippingPlanesMatrix: function() {
      return model._clippingPlanesMatrix;
    }
  };
  renderResources.uniformMap = combine_default(uniformMap2, renderResources.uniformMap);
};
var ModelClippingPlanesPipelineStage_default = ModelClippingPlanesPipelineStage;

// packages/engine/Source/Scene/Model/ModelNode.js
function ModelNode(model, runtimeNode) {
  Check_default.typeOf.object("model", model);
  Check_default.typeOf.object("runtimeNode", runtimeNode);
  this._model = model;
  this._runtimeNode = runtimeNode;
}
Object.defineProperties(ModelNode.prototype, {
  /**
   * The value of the <code>name</code> property of this node.
   *
   * @memberof ModelNode.prototype
   *
   * @type {string}
   * @readonly
   */
  name: {
    get: function() {
      return this._runtimeNode._name;
    }
  },
  /**
   * The index of the node in the glTF.
   *
   * @memberof ModelNode.prototype
   *
   * @type {number}
   * @readonly
   */
  id: {
    get: function() {
      return this._runtimeNode._id;
    }
  },
  /**
   * Determines if this node and its children will be shown.
   *
   * @memberof ModelNode.prototype
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function() {
      return this._runtimeNode.show;
    },
    set: function(value) {
      this._runtimeNode.show = value;
    }
  },
  /**
   * The node's 4x4 matrix transform from its local coordinates to
   * its parent's. Setting the matrix to undefined will restore the
   * node's original transform, and allow the node to be animated by
   * any animations in the model again.
   * <p>
   * For changes to take effect, this property must be assigned to;
   * setting individual elements of the matrix will not work.
   * </p>
   *
   * @memberof ModelNode.prototype
   * @type {Matrix4}
   */
  matrix: {
    get: function() {
      return this._runtimeNode.transform;
    },
    set: function(value) {
      if (defined_default(value)) {
        this._runtimeNode.transform = value;
        this._runtimeNode.userAnimated = true;
        this._model._userAnimationDirty = true;
      } else {
        this._runtimeNode.transform = this.originalMatrix;
        this._runtimeNode.userAnimated = false;
      }
    }
  },
  /**
   * Gets the node's original 4x4 matrix transform from its local
   * coordinates to its parent's, without any node transformations
   * or articulations applied.
   *
   * @memberof ModelNode.prototype
   * @type {Matrix4}
   */
  originalMatrix: {
    get: function() {
      return this._runtimeNode.originalTransform;
    }
  }
});
var ModelNode_default = ModelNode;

// packages/engine/Source/Shaders/Model/InstancingStageCommon.js
var InstancingStageCommon_default = "mat4 getInstancingTransform()\n{\n    mat4 instancingTransform;\n\n    #ifdef HAS_INSTANCE_MATRICES\n    instancingTransform = mat4(\n        a_instancingTransformRow0.x, a_instancingTransformRow1.x, a_instancingTransformRow2.x, 0.0, // Column 1\n        a_instancingTransformRow0.y, a_instancingTransformRow1.y, a_instancingTransformRow2.y, 0.0, // Column 2\n        a_instancingTransformRow0.z, a_instancingTransformRow1.z, a_instancingTransformRow2.z, 0.0, // Column 3\n        a_instancingTransformRow0.w, a_instancingTransformRow1.w, a_instancingTransformRow2.w, 1.0  // Column 4\n    );\n    #else\n    vec3 translation = vec3(0.0, 0.0, 0.0);\n    vec3 scale = vec3(1.0, 1.0, 1.0);\n    \n        #ifdef HAS_INSTANCE_TRANSLATION\n        translation = a_instanceTranslation;\n        #endif\n        #ifdef HAS_INSTANCE_SCALE\n        scale = a_instanceScale;\n        #endif\n\n    instancingTransform = mat4(\n        scale.x, 0.0, 0.0, 0.0,\n        0.0, scale.y, 0.0, 0.0,\n        0.0, 0.0, scale.z, 0.0,\n        translation.x, translation.y, translation.z, 1.0\n    ); \n    #endif\n\n    return instancingTransform;\n}\n\n#ifdef USE_2D_INSTANCING\nmat4 getInstancingTransform2D()\n{\n    mat4 instancingTransform2D;\n\n    #ifdef HAS_INSTANCE_MATRICES\n    instancingTransform2D = mat4(\n        a_instancingTransform2DRow0.x, a_instancingTransform2DRow1.x, a_instancingTransform2DRow2.x, 0.0, // Column 1\n        a_instancingTransform2DRow0.y, a_instancingTransform2DRow1.y, a_instancingTransform2DRow2.y, 0.0, // Column 2\n        a_instancingTransform2DRow0.z, a_instancingTransform2DRow1.z, a_instancingTransform2DRow2.z, 0.0, // Column 3\n        a_instancingTransform2DRow0.w, a_instancingTransform2DRow1.w, a_instancingTransform2DRow2.w, 1.0  // Column 4\n    );\n    #else\n    vec3 translation2D = vec3(0.0, 0.0, 0.0);\n    vec3 scale = vec3(1.0, 1.0, 1.0);\n    \n        #ifdef HAS_INSTANCE_TRANSLATION\n        translation2D = a_instanceTranslation2D;\n        #endif\n        #ifdef HAS_INSTANCE_SCALE\n        scale = a_instanceScale;\n        #endif\n\n    instancingTransform2D = mat4(\n        scale.x, 0.0, 0.0, 0.0,\n        0.0, scale.y, 0.0, 0.0,\n        0.0, 0.0, scale.z, 0.0,\n        translation2D.x, translation2D.y, translation2D.z, 1.0\n    ); \n    #endif\n\n    return instancingTransform2D;\n}\n#endif\n";

// packages/engine/Source/Shaders/Model/InstancingStageVS.js
var InstancingStageVS_default = "void instancingStage(inout ProcessedAttributes attributes) \n{\n    vec3 positionMC = attributes.positionMC;\n    \n    mat4 instancingTransform = getInstancingTransform();\n    \n    attributes.positionMC = (instancingTransform * vec4(positionMC, 1.0)).xyz;\n\n    #ifdef HAS_NORMALS\n    vec3 normalMC = attributes.normalMC;\n    attributes.normalMC = (instancingTransform * vec4(normalMC, 0.0)).xyz;\n    #endif\n\n    #ifdef USE_2D_INSTANCING\n    mat4 instancingTransform2D = getInstancingTransform2D();\n    attributes.position2D = (instancingTransform2D * vec4(positionMC, 1.0)).xyz;\n    #endif\n}\n";

// packages/engine/Source/Shaders/Model/LegacyInstancingStageVS.js
var LegacyInstancingStageVS_default = "void legacyInstancingStage(\n    inout ProcessedAttributes attributes,\n    out mat4 instanceModelView,\n    out mat3 instanceModelViewInverseTranspose)\n{\n    vec3 positionMC = attributes.positionMC;\n\n    mat4 instancingTransform = getInstancingTransform();\n \n    mat4 instanceModel = instancingTransform * u_instance_nodeTransform;\n    instanceModelView = u_instance_modifiedModelView;\n    instanceModelViewInverseTranspose = mat3(u_instance_modifiedModelView * instanceModel);\n\n    attributes.positionMC = (instanceModel * vec4(positionMC, 1.0)).xyz;\n    \n    #ifdef USE_2D_INSTANCING\n    mat4 instancingTransform2D = getInstancingTransform2D();\n    attributes.position2D = (instancingTransform2D * vec4(positionMC, 1.0)).xyz;\n    #endif\n}\n";

// packages/engine/Source/Scene/Model/InstancingPipelineStage.js
var modelViewScratch = new Matrix4_default();
var nodeTransformScratch = new Matrix4_default();
var modelView2DScratch = new Matrix4_default();
var InstancingPipelineStage = {
  name: "InstancingPipelineStage",
  // Helps with debugging
  // Expose some methods for testing
  _getInstanceTransformsAsMatrices: getInstanceTransformsAsMatrices,
  _transformsToTypedArray: transformsToTypedArray
};
InstancingPipelineStage.process = function(renderResources, node, frameState) {
  const instances = node.instances;
  const count = instances.attributes[0].count;
  const shaderBuilder = renderResources.shaderBuilder;
  shaderBuilder.addDefine("HAS_INSTANCING");
  shaderBuilder.addVertexLines(InstancingStageCommon_default);
  const model = renderResources.model;
  const sceneGraph = model.sceneGraph;
  const runtimeNode = renderResources.runtimeNode;
  const use2D = frameState.mode !== SceneMode_default.SCENE3D && !frameState.scene3DOnly && model._projectTo2D;
  const instancingVertexAttributes = [];
  processTransformAttributes(
    renderResources,
    frameState,
    instances,
    instancingVertexAttributes,
    use2D
  );
  processFeatureIdAttributes(
    renderResources,
    frameState,
    instances,
    instancingVertexAttributes
  );
  const uniformMap2 = {};
  if (instances.transformInWorldSpace) {
    shaderBuilder.addDefine(
      "USE_LEGACY_INSTANCING",
      void 0,
      ShaderDestination_default.VERTEX
    );
    shaderBuilder.addUniform(
      "mat4",
      "u_instance_modifiedModelView",
      ShaderDestination_default.VERTEX
    );
    shaderBuilder.addUniform(
      "mat4",
      "u_instance_nodeTransform",
      ShaderDestination_default.VERTEX
    );
    uniformMap2.u_instance_modifiedModelView = function() {
      let modifiedModelMatrix = Matrix4_default.multiplyTransformation(
        // For 3D Tiles, model.modelMatrix is the computed tile
        // transform (which includes tileset.modelMatrix). This always applies
        // for i3dm, since such models are always part of a tileset.
        model.modelMatrix,
        // For i3dm models, components.transform contains the RTC_CENTER
        // translation.
        sceneGraph.components.transform,
        modelViewScratch
      );
      if (use2D) {
        return Matrix4_default.multiplyTransformation(
          frameState.context.uniformState.view3D,
          modifiedModelMatrix,
          modelViewScratch
        );
      }
      if (frameState.mode !== SceneMode_default.SCENE3D) {
        modifiedModelMatrix = Transforms_default.basisTo2D(
          frameState.mapProjection,
          modifiedModelMatrix,
          modelViewScratch
        );
      }
      return Matrix4_default.multiplyTransformation(
        frameState.context.uniformState.view,
        modifiedModelMatrix,
        modelViewScratch
      );
    };
    uniformMap2.u_instance_nodeTransform = function() {
      return Matrix4_default.multiplyTransformation(
        // glTF y-up to 3D Tiles z-up
        sceneGraph.axisCorrectionMatrix,
        // This transforms from the node's coordinate system to the root
        // of the node hierarchy
        runtimeNode.computedTransform,
        nodeTransformScratch
      );
    };
    shaderBuilder.addVertexLines(LegacyInstancingStageVS_default);
  } else {
    shaderBuilder.addVertexLines(InstancingStageVS_default);
  }
  if (use2D) {
    shaderBuilder.addDefine(
      "USE_2D_INSTANCING",
      void 0,
      ShaderDestination_default.VERTEX
    );
    shaderBuilder.addUniform("mat4", "u_modelView2D", ShaderDestination_default.VERTEX);
    const context = frameState.context;
    const modelMatrix2D = Matrix4_default.fromTranslation(
      runtimeNode.instancingReferencePoint2D,
      new Matrix4_default()
    );
    uniformMap2.u_modelView2D = function() {
      return Matrix4_default.multiplyTransformation(
        context.uniformState.view,
        modelMatrix2D,
        modelView2DScratch
      );
    };
  }
  renderResources.uniformMap = combine_default(uniformMap2, renderResources.uniformMap);
  renderResources.instanceCount = count;
  renderResources.attributes.push.apply(
    renderResources.attributes,
    instancingVertexAttributes
  );
};
var projectedTransformScratch = new Matrix4_default();
var projectedPositionScratch = new Cartesian3_default();
function projectTransformTo2D(transform3, modelMatrix, nodeTransform, frameState, result) {
  let projectedTransform = Matrix4_default.multiplyTransformation(
    modelMatrix,
    transform3,
    projectedTransformScratch
  );
  projectedTransform = Matrix4_default.multiplyTransformation(
    projectedTransform,
    nodeTransform,
    projectedTransformScratch
  );
  result = Transforms_default.basisTo2D(
    frameState.mapProjection,
    projectedTransform,
    result
  );
  return result;
}
function projectPositionTo2D(position, modelMatrix, nodeTransform, frameState, result) {
  const translationMatrix = Matrix4_default.fromTranslation(
    position,
    projectedTransformScratch
  );
  let projectedTransform = Matrix4_default.multiplyTransformation(
    modelMatrix,
    translationMatrix,
    projectedTransformScratch
  );
  projectedTransform = Matrix4_default.multiplyTransformation(
    projectedTransform,
    nodeTransform,
    projectedTransformScratch
  );
  const finalPosition = Matrix4_default.getTranslation(
    projectedTransform,
    projectedPositionScratch
  );
  result = SceneTransforms_default.computeActualWgs84Position(
    frameState,
    finalPosition,
    result
  );
  return result;
}
function getModelMatrixAndNodeTransform(renderResources, modelMatrix, nodeComputedTransform) {
  const model = renderResources.model;
  const sceneGraph = model.sceneGraph;
  const instances = renderResources.runtimeNode.node.instances;
  if (instances.transformInWorldSpace) {
    modelMatrix = Matrix4_default.multiplyTransformation(
      model.modelMatrix,
      sceneGraph.components.transform,
      modelMatrix
    );
    nodeComputedTransform = Matrix4_default.multiplyTransformation(
      sceneGraph.axisCorrectionMatrix,
      renderResources.runtimeNode.computedTransform,
      nodeComputedTransform
    );
  } else {
    modelMatrix = Matrix4_default.clone(sceneGraph.computedModelMatrix, modelMatrix);
    modelMatrix = Matrix4_default.multiplyTransformation(
      modelMatrix,
      renderResources.runtimeNode.computedTransform,
      modelMatrix
    );
    nodeComputedTransform = Matrix4_default.clone(
      Matrix4_default.IDENTITY,
      nodeComputedTransform
    );
  }
}
var modelMatrixScratch = new Matrix4_default();
var nodeComputedTransformScratch = new Matrix4_default();
var transformScratch2 = new Matrix4_default();
var positionScratch9 = new Cartesian3_default();
function projectTransformsTo2D(transforms, renderResources, frameState, result) {
  const modelMatrix = modelMatrixScratch;
  const nodeComputedTransform = nodeComputedTransformScratch;
  getModelMatrixAndNodeTransform(
    renderResources,
    modelMatrix,
    nodeComputedTransform
  );
  const runtimeNode = renderResources.runtimeNode;
  const referencePoint = runtimeNode.instancingReferencePoint2D;
  const count = transforms.length;
  for (let i = 0; i < count; i++) {
    const transform3 = transforms[i];
    const projectedTransform = projectTransformTo2D(
      transform3,
      modelMatrix,
      nodeComputedTransform,
      frameState,
      transformScratch2
    );
    const position = Matrix4_default.getTranslation(
      projectedTransform,
      positionScratch9
    );
    const finalTranslation = Cartesian3_default.subtract(
      position,
      referencePoint,
      position
    );
    result[i] = Matrix4_default.setTranslation(
      projectedTransform,
      finalTranslation,
      result[i]
    );
  }
  return result;
}
function projectTranslationsTo2D(translations, renderResources, frameState, result) {
  const modelMatrix = modelMatrixScratch;
  const nodeComputedTransform = nodeComputedTransformScratch;
  getModelMatrixAndNodeTransform(
    renderResources,
    modelMatrix,
    nodeComputedTransform
  );
  const runtimeNode = renderResources.runtimeNode;
  const referencePoint = runtimeNode.instancingReferencePoint2D;
  const count = translations.length;
  for (let i = 0; i < count; i++) {
    const translation3 = translations[i];
    const projectedPosition2 = projectPositionTo2D(
      translation3,
      modelMatrix,
      nodeComputedTransform,
      frameState,
      translation3
    );
    result[i] = Cartesian3_default.subtract(
      projectedPosition2,
      referencePoint,
      result[i]
    );
  }
  return result;
}
var scratchProjectedMin = new Cartesian3_default();
var scratchProjectedMax = new Cartesian3_default();
function computeReferencePoint2D(renderResources, frameState) {
  const runtimeNode = renderResources.runtimeNode;
  const modelMatrix = renderResources.model.sceneGraph.computedModelMatrix;
  const transformedPositionMin = Matrix4_default.multiplyByPoint(
    modelMatrix,
    runtimeNode.instancingTranslationMin,
    scratchProjectedMin
  );
  const projectedMin = SceneTransforms_default.computeActualWgs84Position(
    frameState,
    transformedPositionMin,
    transformedPositionMin
  );
  const transformedPositionMax = Matrix4_default.multiplyByPoint(
    modelMatrix,
    runtimeNode.instancingTranslationMax,
    scratchProjectedMax
  );
  const projectedMax = SceneTransforms_default.computeActualWgs84Position(
    frameState,
    transformedPositionMax,
    transformedPositionMax
  );
  runtimeNode.instancingReferencePoint2D = Cartesian3_default.lerp(
    projectedMin,
    projectedMax,
    0.5,
    new Cartesian3_default()
  );
}
function transformsToTypedArray(transforms) {
  const elements = 12;
  const count = transforms.length;
  const transformsTypedArray = new Float32Array(count * elements);
  for (let i = 0; i < count; i++) {
    const transform3 = transforms[i];
    const offset2 = elements * i;
    transformsTypedArray[offset2 + 0] = transform3[0];
    transformsTypedArray[offset2 + 1] = transform3[4];
    transformsTypedArray[offset2 + 2] = transform3[8];
    transformsTypedArray[offset2 + 3] = transform3[12];
    transformsTypedArray[offset2 + 4] = transform3[1];
    transformsTypedArray[offset2 + 5] = transform3[5];
    transformsTypedArray[offset2 + 6] = transform3[9];
    transformsTypedArray[offset2 + 7] = transform3[13];
    transformsTypedArray[offset2 + 8] = transform3[2];
    transformsTypedArray[offset2 + 9] = transform3[6];
    transformsTypedArray[offset2 + 10] = transform3[10];
    transformsTypedArray[offset2 + 11] = transform3[14];
  }
  return transformsTypedArray;
}
function translationsToTypedArray(translations) {
  const elements = 3;
  const count = translations.length;
  const transationsTypedArray = new Float32Array(count * elements);
  for (let i = 0; i < count; i++) {
    const translation3 = translations[i];
    const offset2 = elements * i;
    transationsTypedArray[offset2 + 0] = translation3[0];
    transationsTypedArray[offset2 + 1] = translation3[4];
    transationsTypedArray[offset2 + 2] = translation3[8];
  }
  return transationsTypedArray;
}
var translationScratch = new Cartesian3_default();
var rotationScratch = new Quaternion_default();
var scaleScratch = new Cartesian3_default();
function getInstanceTransformsAsMatrices(instances, count, renderResources) {
  const transforms = new Array(count);
  const translationAttribute = ModelUtility_default.getAttributeBySemantic(
    instances,
    InstanceAttributeSemantic_default.TRANSLATION
  );
  const rotationAttribute = ModelUtility_default.getAttributeBySemantic(
    instances,
    InstanceAttributeSemantic_default.ROTATION
  );
  const scaleAttribute = ModelUtility_default.getAttributeBySemantic(
    instances,
    InstanceAttributeSemantic_default.SCALE
  );
  const instancingTranslationMax = new Cartesian3_default(
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE
  );
  const instancingTranslationMin = new Cartesian3_default(
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE
  );
  const hasTranslation = defined_default(translationAttribute);
  const hasRotation = defined_default(rotationAttribute);
  const hasScale = defined_default(scaleAttribute);
  const translationTypedArray = hasTranslation ? translationAttribute.typedArray : new Float32Array(count * 3);
  let rotationTypedArray = hasRotation ? rotationAttribute.typedArray : new Float32Array(count * 4);
  if (hasRotation && rotationAttribute.normalized) {
    rotationTypedArray = AttributeCompression_default.dequantize(
      rotationTypedArray,
      rotationAttribute.componentDatatype,
      rotationAttribute.type,
      count
    );
  }
  let scaleTypedArray;
  if (hasScale) {
    scaleTypedArray = scaleAttribute.typedArray;
  } else {
    scaleTypedArray = new Float32Array(count * 3);
    scaleTypedArray.fill(1);
  }
  for (let i = 0; i < count; i++) {
    const translation3 = new Cartesian3_default(
      translationTypedArray[i * 3],
      translationTypedArray[i * 3 + 1],
      translationTypedArray[i * 3 + 2],
      translationScratch
    );
    Cartesian3_default.maximumByComponent(
      instancingTranslationMax,
      translation3,
      instancingTranslationMax
    );
    Cartesian3_default.minimumByComponent(
      instancingTranslationMin,
      translation3,
      instancingTranslationMin
    );
    const rotation = new Quaternion_default(
      rotationTypedArray[i * 4],
      rotationTypedArray[i * 4 + 1],
      rotationTypedArray[i * 4 + 2],
      hasRotation ? rotationTypedArray[i * 4 + 3] : 1,
      rotationScratch
    );
    const scale = new Cartesian3_default(
      scaleTypedArray[i * 3],
      scaleTypedArray[i * 3 + 1],
      scaleTypedArray[i * 3 + 2],
      scaleScratch
    );
    const transform3 = Matrix4_default.fromTranslationQuaternionRotationScale(
      translation3,
      rotation,
      scale,
      new Matrix4_default()
    );
    transforms[i] = transform3;
  }
  const runtimeNode = renderResources.runtimeNode;
  runtimeNode.instancingTranslationMin = instancingTranslationMin;
  runtimeNode.instancingTranslationMax = instancingTranslationMax;
  if (hasTranslation) {
    translationAttribute.typedArray = void 0;
  }
  if (hasRotation) {
    rotationAttribute.typedArray = void 0;
  }
  if (hasScale) {
    scaleAttribute.typedArray = void 0;
  }
  return transforms;
}
function getInstanceTranslationsAsCartesian3s(translationAttribute, count, renderResources) {
  const instancingTranslations = new Array(count);
  const translationTypedArray = translationAttribute.typedArray;
  const instancingTranslationMin = new Cartesian3_default(
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE
  );
  const instancingTranslationMax = new Cartesian3_default(
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE
  );
  for (let i = 0; i < count; i++) {
    const translation3 = new Cartesian3_default(
      translationTypedArray[i * 3],
      translationTypedArray[i * 3 + 1],
      translationTypedArray[i * 3 + 2]
    );
    instancingTranslations[i] = translation3;
    Cartesian3_default.minimumByComponent(
      instancingTranslationMin,
      translation3,
      instancingTranslationMin
    );
    Cartesian3_default.maximumByComponent(
      instancingTranslationMax,
      translation3,
      instancingTranslationMax
    );
  }
  const runtimeNode = renderResources.runtimeNode;
  runtimeNode.instancingTranslationMin = instancingTranslationMin;
  runtimeNode.instancingTranslationMax = instancingTranslationMax;
  translationAttribute.typedArray = void 0;
  return instancingTranslations;
}
function createVertexBuffer2(typedArray, frameState) {
  const buffer = Buffer_default.createVertexBuffer({
    context: frameState.context,
    typedArray,
    usage: BufferUsage_default.STATIC_DRAW
  });
  buffer.vertexArrayDestroyable = false;
  return buffer;
}
function processTransformAttributes(renderResources, frameState, instances, instancingVertexAttributes, use2D) {
  const rotationAttribute = ModelUtility_default.getAttributeBySemantic(
    instances,
    InstanceAttributeSemantic_default.ROTATION
  );
  if (defined_default(rotationAttribute)) {
    processTransformMatrixAttributes(
      renderResources,
      instances,
      instancingVertexAttributes,
      frameState,
      use2D
    );
  } else {
    processTransformVec3Attributes(
      renderResources,
      instances,
      instancingVertexAttributes,
      frameState,
      use2D
    );
  }
}
function processTransformMatrixAttributes(renderResources, instances, instancingVertexAttributes, frameState, use2D) {
  const shaderBuilder = renderResources.shaderBuilder;
  const count = instances.attributes[0].count;
  const model = renderResources.model;
  const runtimeNode = renderResources.runtimeNode;
  shaderBuilder.addDefine("HAS_INSTANCE_MATRICES");
  const attributeString = "Transform";
  let transforms;
  let buffer = runtimeNode.instancingTransformsBuffer;
  if (!defined_default(buffer)) {
    transforms = getInstanceTransformsAsMatrices(
      instances,
      count,
      renderResources
    );
    const transformsTypedArray = transformsToTypedArray(transforms);
    buffer = createVertexBuffer2(transformsTypedArray, frameState);
    model._modelResources.push(buffer);
    runtimeNode.instancingTransformsBuffer = buffer;
  }
  processMatrixAttributes(
    renderResources,
    buffer,
    instancingVertexAttributes,
    attributeString
  );
  if (!use2D) {
    return;
  }
  const frameStateCV = clone_default(frameState);
  frameStateCV.mode = SceneMode_default.COLUMBUS_VIEW;
  computeReferencePoint2D(renderResources, frameStateCV);
  let buffer2D = runtimeNode.instancingTransformsBuffer2D;
  if (!defined_default(buffer2D)) {
    const projectedTransforms = projectTransformsTo2D(
      transforms,
      renderResources,
      frameStateCV,
      transforms
    );
    const projectedTypedArray = transformsToTypedArray(projectedTransforms);
    buffer2D = createVertexBuffer2(projectedTypedArray, frameState);
    model._modelResources.push(buffer2D);
    runtimeNode.instancingTransformsBuffer2D = buffer2D;
  }
  const attributeString2D = "Transform2D";
  processMatrixAttributes(
    renderResources,
    buffer2D,
    instancingVertexAttributes,
    attributeString2D
  );
}
function processTransformVec3Attributes(renderResources, instances, instancingVertexAttributes, frameState, use2D) {
  const shaderBuilder = renderResources.shaderBuilder;
  const runtimeNode = renderResources.runtimeNode;
  const translationAttribute = ModelUtility_default.getAttributeBySemantic(
    instances,
    InstanceAttributeSemantic_default.TRANSLATION
  );
  const scaleAttribute = ModelUtility_default.getAttributeBySemantic(
    instances,
    InstanceAttributeSemantic_default.SCALE
  );
  if (defined_default(scaleAttribute)) {
    shaderBuilder.addDefine("HAS_INSTANCE_SCALE");
    const attributeString2 = "Scale";
    processVec3Attribute(
      renderResources,
      scaleAttribute.buffer,
      scaleAttribute.byteOffset,
      scaleAttribute.byteStride,
      instancingVertexAttributes,
      attributeString2
    );
  }
  if (!defined_default(translationAttribute)) {
    return;
  }
  let instancingTranslations;
  const typedArray = translationAttribute.typedArray;
  if (defined_default(typedArray)) {
    instancingTranslations = getInstanceTranslationsAsCartesian3s(
      translationAttribute,
      translationAttribute.count,
      renderResources
    );
  } else if (!defined_default(runtimeNode.instancingTranslationMin)) {
    runtimeNode.instancingTranslationMin = translationAttribute.min;
    runtimeNode.instancingTranslationMax = translationAttribute.max;
  }
  shaderBuilder.addDefine("HAS_INSTANCE_TRANSLATION");
  const attributeString = "Translation";
  processVec3Attribute(
    renderResources,
    translationAttribute.buffer,
    translationAttribute.byteOffset,
    translationAttribute.byteStride,
    instancingVertexAttributes,
    attributeString
  );
  if (!use2D) {
    return;
  }
  const frameStateCV = clone_default(frameState);
  frameStateCV.mode = SceneMode_default.COLUMBUS_VIEW;
  computeReferencePoint2D(renderResources, frameStateCV);
  let buffer2D = runtimeNode.instancingTranslationBuffer2D;
  if (!defined_default(buffer2D)) {
    const projectedTranslations = projectTranslationsTo2D(
      instancingTranslations,
      renderResources,
      frameStateCV,
      instancingTranslations
    );
    const projectedTypedArray = translationsToTypedArray(projectedTranslations);
    buffer2D = createVertexBuffer2(projectedTypedArray, frameState);
    renderResources.model._modelResources.push(buffer2D);
    runtimeNode.instancingTranslationBuffer2D = buffer2D;
  }
  const byteOffset = 0;
  const byteStride = void 0;
  const attributeString2D = "Translation2D";
  processVec3Attribute(
    renderResources,
    buffer2D,
    byteOffset,
    byteStride,
    instancingVertexAttributes,
    attributeString2D
  );
}
function processMatrixAttributes(renderResources, buffer, instancingVertexAttributes, attributeString) {
  const vertexSizeInFloats = 12;
  const componentByteSize = ComponentDatatype_default.getSizeInBytes(
    ComponentDatatype_default.FLOAT
  );
  const strideInBytes = componentByteSize * vertexSizeInFloats;
  const matrixAttributes = [
    {
      index: renderResources.attributeIndex++,
      vertexBuffer: buffer,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype_default.FLOAT,
      normalize: false,
      offsetInBytes: 0,
      strideInBytes,
      instanceDivisor: 1
    },
    {
      index: renderResources.attributeIndex++,
      vertexBuffer: buffer,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype_default.FLOAT,
      normalize: false,
      offsetInBytes: componentByteSize * 4,
      strideInBytes,
      instanceDivisor: 1
    },
    {
      index: renderResources.attributeIndex++,
      vertexBuffer: buffer,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype_default.FLOAT,
      normalize: false,
      offsetInBytes: componentByteSize * 8,
      strideInBytes,
      instanceDivisor: 1
    }
  ];
  const shaderBuilder = renderResources.shaderBuilder;
  shaderBuilder.addAttribute("vec4", `a_instancing${attributeString}Row0`);
  shaderBuilder.addAttribute("vec4", `a_instancing${attributeString}Row1`);
  shaderBuilder.addAttribute("vec4", `a_instancing${attributeString}Row2`);
  instancingVertexAttributes.push.apply(
    instancingVertexAttributes,
    matrixAttributes
  );
}
function processVec3Attribute(renderResources, buffer, byteOffset, byteStride, instancingVertexAttributes, attributeString) {
  instancingVertexAttributes.push({
    index: renderResources.attributeIndex++,
    vertexBuffer: buffer,
    componentsPerAttribute: 3,
    componentDatatype: ComponentDatatype_default.FLOAT,
    normalize: false,
    offsetInBytes: byteOffset,
    strideInBytes: byteStride,
    instanceDivisor: 1
  });
  const shaderBuilder = renderResources.shaderBuilder;
  shaderBuilder.addAttribute("vec3", `a_instance${attributeString}`);
}
function processFeatureIdAttributes(renderResources, frameState, instances, instancingVertexAttributes) {
  const attributes = instances.attributes;
  const shaderBuilder = renderResources.shaderBuilder;
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    if (attribute.semantic !== InstanceAttributeSemantic_default.FEATURE_ID) {
      continue;
    }
    if (attribute.setIndex >= renderResources.featureIdVertexAttributeSetIndex) {
      renderResources.featureIdVertexAttributeSetIndex = attribute.setIndex + 1;
    }
    instancingVertexAttributes.push({
      index: renderResources.attributeIndex++,
      vertexBuffer: attribute.buffer,
      componentsPerAttribute: AttributeType_default.getNumberOfComponents(
        attribute.type
      ),
      componentDatatype: attribute.componentDatatype,
      normalize: false,
      offsetInBytes: attribute.byteOffset,
      strideInBytes: attribute.byteStride,
      instanceDivisor: 1
    });
    shaderBuilder.addAttribute(
      "float",
      `a_instanceFeatureId_${attribute.setIndex}`
    );
  }
}
var InstancingPipelineStage_default = InstancingPipelineStage;

// packages/engine/Source/Scene/Model/ModelMatrixUpdateStage.js
var ModelMatrixUpdateStage = {};
ModelMatrixUpdateStage.name = "ModelMatrixUpdateStage";
ModelMatrixUpdateStage.update = function(runtimeNode, sceneGraph, frameState) {
  const use2D = frameState.mode !== SceneMode_default.SCENE3D;
  if (use2D && sceneGraph._model._projectTo2D) {
    return;
  }
  if (runtimeNode._transformDirty) {
    const modelMatrix = use2D ? sceneGraph._computedModelMatrix2D : sceneGraph._computedModelMatrix;
    updateRuntimeNode(
      runtimeNode,
      sceneGraph,
      modelMatrix,
      runtimeNode.transformToRoot
    );
    runtimeNode._transformDirty = false;
  }
};
function updateRuntimeNode(runtimeNode, sceneGraph, modelMatrix, transformToRoot) {
  let i;
  transformToRoot = Matrix4_default.multiplyTransformation(
    transformToRoot,
    runtimeNode.transform,
    new Matrix4_default()
  );
  runtimeNode.updateComputedTransform();
  const primitivesLength = runtimeNode.runtimePrimitives.length;
  for (i = 0; i < primitivesLength; i++) {
    const runtimePrimitive = runtimeNode.runtimePrimitives[i];
    const drawCommand = runtimePrimitive.drawCommand;
    drawCommand.modelMatrix = Matrix4_default.multiplyTransformation(
      modelMatrix,
      transformToRoot,
      drawCommand.modelMatrix
    );
    drawCommand.cullFace = ModelUtility_default.getCullFace(
      drawCommand.modelMatrix,
      drawCommand.primitiveType
    );
  }
  const childrenLength = runtimeNode.children.length;
  for (i = 0; i < childrenLength; i++) {
    const childRuntimeNode = sceneGraph._runtimeNodes[runtimeNode.children[i]];
    childRuntimeNode._transformToRoot = Matrix4_default.clone(
      transformToRoot,
      childRuntimeNode._transformToRoot
    );
    updateRuntimeNode(
      childRuntimeNode,
      sceneGraph,
      modelMatrix,
      transformToRoot
    );
    childRuntimeNode._transformDirty = false;
  }
}
var ModelMatrixUpdateStage_default = ModelMatrixUpdateStage;

// packages/engine/Source/Scene/Model/NodeStatisticsPipelineStage.js
var NodeStatisticsPipelineStage = {
  name: "NodeStatisticsPipelineStage",
  // Helps with debugging
  // Expose some methods for testing
  _countInstancingAttributes: countInstancingAttributes,
  _countGeneratedBuffers: countGeneratedBuffers
};
NodeStatisticsPipelineStage.process = function(renderResources, node, frameState) {
  const statistics2 = renderResources.model.statistics;
  const instances = node.instances;
  const runtimeNode = renderResources.runtimeNode;
  countInstancingAttributes(statistics2, instances);
  countGeneratedBuffers(statistics2, runtimeNode);
};
function countInstancingAttributes(statistics2, instances) {
  if (!defined_default(instances)) {
    return;
  }
  const attributes = instances.attributes;
  const length3 = attributes.length;
  for (let i = 0; i < length3; i++) {
    const attribute = attributes[i];
    if (defined_default(attribute.buffer)) {
      const hasCpuCopy = false;
      statistics2.addBuffer(attribute.buffer, hasCpuCopy);
    }
  }
}
function countGeneratedBuffers(statistics2, runtimeNode) {
  if (defined_default(runtimeNode.instancingTransformsBuffer)) {
    const hasCpuCopy = false;
    statistics2.addBuffer(runtimeNode.instancingTransformsBuffer, hasCpuCopy);
  }
  if (defined_default(runtimeNode.instancingTransformsBuffer2D)) {
    const hasCpuCopy = false;
    statistics2.addBuffer(runtimeNode.instancingTransformsBuffer2D, hasCpuCopy);
  }
  if (defined_default(runtimeNode.instancingTranslationBuffer2D)) {
    const hasCpuCopy = false;
    statistics2.addBuffer(runtimeNode.instancingTranslationBuffer2D, hasCpuCopy);
  }
}
var NodeStatisticsPipelineStage_default = NodeStatisticsPipelineStage;
