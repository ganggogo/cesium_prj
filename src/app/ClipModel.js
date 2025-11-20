const GeologicalModelClipper = (function () {
  let viewer, tileset, clipPlanes = [], contourPoints = [], layers = [], wallEntities = [];

  function init(_viewer, _tileset) {
    viewer = _viewer;
    tileset = _tileset;
    GeologicalModelClipper.clear();
  }

  function interpolatePoints(points, countPerEdge = 10) {
    const result = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      for (let j = 0; j < countPerEdge; j++) {
        const t = j / countPerEdge;
        const interp = Cesium.Cartesian3.lerp(p1, p2, t, new Cesium.Cartesian3());
        result.push(interp);
      }
    }
    return result;
  }

  function getClipPlanesFromContour(points) {
    const up = Cesium.Cartesian3.UNIT_Z;
    const planes = [];

    for (let i = 0; i < points.length; i++) {
      const p0 = points[i];
      const p1 = points[(i + 1) % points.length];
      const edge = Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3());
      const normal = Cesium.Cartesian3.cross(edge, up, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(normal, normal);
      planes.push(Cesium.Plane.fromPointNormal(p0, normal));
    }
    return planes;
  }

  async function getLayerPointsByRay(contour, downDir, maxLayerCount = 10, withDebug = false) {
    const layerPoints = [];

    const useRayIntersect = typeof tileset.rayIntersect === 'function';

    for (const pt of contour) {
      const points = [];
      let start = Cesium.Cartesian3.clone(pt);

      for (let i = 0; i < maxLayerCount; i++) {
        const ray = new Cesium.Ray(start, downDir);
        let res;

        if (useRayIntersect) {
          try {
            res = await tileset.rayIntersect(ray);
          } catch (e) {
            console.warn("rayIntersect failed:", e);
            break;
          }
        } else {
          res = viewer.scene.pickFromRay(ray, [tileset]);
        }

        if (withDebug) drawRay(start, downDir, res?.position);

        if (!res || !res.position) break;

        points.push(res.position);
        start = Cesium.Cartesian3.clone(res.position);
      }

      if (points.length) {
        for (let i = 0; i < points.length; i++) {
          if (!layerPoints[i]) layerPoints[i] = [];
          layerPoints[i].push(points[i]);
        }
      }
    }

    return layerPoints;
  }



  function createWallEntities(layerPoints) {
    const entities = [];

    for (let i = 0; i < layerPoints.length - 1; i++) {
      const upper = layerPoints[i], lower = layerPoints[i + 1];

      const maxHeights = upper.map(p => Cesium.Cartographic.fromCartesian(p).height);
      const minHeights = lower.map(p => Cesium.Cartographic.fromCartesian(p).height);

      const entity = viewer.entities.add({
        wall: {
          positions: upper,
          maximumHeights: maxHeights,
          minimumHeights: minHeights,
          material: Cesium.Color.fromRandom({ alpha: 1.0 }),
          outline: false
        }
      });

      entities.push(entity);
    }

    const bottom = layerPoints[layerPoints.length - 1];
    const baseHeights = new Array(bottom.length).fill(-1000);

    const baseEntity = viewer.entities.add({
      wall: {
        positions: bottom,
        maximumHeights: bottom.map(p => Cesium.Cartographic.fromCartesian(p).height),
        minimumHeights: baseHeights,
        material: Cesium.Color.DARKGRAY.withAlpha(1.0),
        outline: false
      }
    });

    entities.push(baseEntity);
    return entities;
  }

  function drawRay(start, dir, hitPoint) {
    const length = hitPoint
      ? Cesium.Cartesian3.distance(start, hitPoint)
      : 5000;

    const end = Cesium.Cartesian3.add(
      start,
      Cesium.Cartesian3.multiplyByScalar(dir, length, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    viewer.entities.add({
      polyline: {
        positions: [start, end],
        width: 2,
        material: hitPoint
          ? Cesium.Color.LIME.withAlpha(0.6)   // 命中：绿色
          : Cesium.Color.RED.withAlpha(0.4),   // 未命中：红色
      },
    });

    if (hitPoint) {
      viewer.entities.add({
        position: hitPoint,
        point: {
          pixelSize: 6,
          color: Cesium.Color.YELLOW,
        },
      });
    }
  }

  async function clipAndFillWithDebug() {
    if (!contourPoints.length || !tileset) return;

    tileset.clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: clipPlanes.map(p => Cesium.ClippingPlane.fromPlane(p)),
      unionClippingRegions: true
    });

    const downDir = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());

    console.log('⚙️ 开始射线剖切 + 可视化');

    layers = await getLayerPointsByRay(contourPoints, downDir, 10, true); // 开启调试可视化

    console.log('✅ 射线剖切完成，层数：', layers.length);

    wallEntities = createWallEntities(layers);
  }

  function drawTilesetBoundingBox(tileset) {
    if (!tileset || !tileset.boundingVolume) return;

    let box = tileset.boundingVolume.boundingVolume || tileset.boundingVolume;

    if (box instanceof Cesium.BoundingRegion) {
      console.warn("📦 BoundingRegion 可视化暂不支持");
      return;
    }

    if (box instanceof Cesium.BoundingSphere) {
      const center = box.center;
      const radius = box.radius;

      viewer.entities.add({
        position: center,
        ellipsoid: {
          radii: new Cesium.Cartesian3(radius, radius, radius),
          material: Cesium.Color.AQUA.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.AQUA
        }
      });

      console.log("📦 显示 boundingSphere");

    } else if (box instanceof Cesium.OrientedBoundingBox) {
      const outline = Cesium.OrientedBoundingBox.computeCorners(box);

      const indices = [
        [0,1],[1,2],[2,3],[3,0], // 上面
        [4,5],[5,6],[6,7],[7,4], // 下面
        [0,4],[1,5],[2,6],[3,7]  // 垂直连接
      ];

      indices.forEach(([start, end]) => {
        viewer.entities.add({
          polyline: {
            positions: [outline[start], outline[end]],
            width: 2,
            material: Cesium.Color.CYAN.withAlpha(0.6)
          }
        });
      });

      console.log("📦 显示 OrientedBoundingBox");
    } else {
      console.warn("❗ 未识别的包围盒类型：", box);
    }
  }





  return {
    init,
    clipAndFillWithDebug,
    drawTilesetBoundingBox,
    setClipContour(clipPolygon, sampleCount = 10) {
      contourPoints = interpolatePoints(clipPolygon, sampleCount);
      clipPlanes = getClipPlanesFromContour(contourPoints);
    },
    clear() {
      if (tileset && tileset.clippingPlanes) tileset.clippingPlanes.removeAll();
      wallEntities.forEach(e => viewer.entities.remove(e));
      wallEntities = [];
      clipPlanes = [];
      layers = [];
    }
  };
})();

if (typeof window !== 'undefined') {
  window.GeologicalModelClipper = GeologicalModelClipper;
}
