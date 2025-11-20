<template>
  <div id="cesiumcontainer">
    <!-- <ShowVertexs class="show-vertexs"></ShowVertexs> -->

    <el-button
      class="fold-span"
      @click="foldPanel"
    >
      {{ ifshowpanel ? '收起' : '展开' }}
    </el-button>
    <span
      v-if="ifshowpanel"
      class="msg-panel"
    >
      <h3>--全局地球--</h3>
      <el-button @click="openGlobe">{{ ifOpenGlobalel ? '关闭' : '开启' }}地球</el-button>
      <el-button @click="backPos">复位</el-button>
      <el-button @click="addAxis">添加坐标轴</el-button>
      <h3>--模型调试--</h3>
      <el-button @click="openDebugWireframe">{{ ifopenDebugWireframe ? '关闭' : '开启' }}模型调试-cesium默认</el-button>
      <el-button @click="openDebugWireframe1">{{ ifopenDebugWireframe1 ? '关闭' : '开启' }}模型调试-自定义</el-button>
      <h3>--模型选择--</h3>
      <el-select
        v-model="modelvalue"
        placeholder="选择模型"
        size="large"
        style="width: 240px"
      >
        <el-option
          v-for="item in modelOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <h3>--模型操作--</h3>
      <p>
        模型透明度：<el-slider
          v-model="modelAlphaVal"
          :min="0"
          :max="1"
          :step="0.1"
          show-input
          @change="changeModelAlpha"
        />
      </p>
      <p>
        <!-- <el-button @click="loadImagery">加载影像</el-button> -->
        <!-- <el-button @click="loadTeria">加载地形</el-button> -->
        <el-button @click="loadModel1">加载模型</el-button>
        <el-button @click="hideModel">{{ ifHideModel ? '开启' : '隐藏' }}模型</el-button>
        <el-button @click="openPick">开启拾取</el-button>
        <el-button @click="closePick">关闭拾取</el-button>
        <el-button @click="flyToCustomModel">跳转模型</el-button>
        <el-button @click="getModelAllVe1c">绘制点云</el-button>
      </p>
      <p>
        <el-input
          v-model="hideDc"
          type="text"
          placeholder="隐藏模型"
        />
      </p>
      <el-button @click="hideOtherModels">隐藏其他</el-button>
      <el-button @click="showAllModels">全部显示</el-button>
      <h3>--射线检测--</h3>
      <p>
        <el-button @click="clipModelLine">射线检测</el-button>
      </p>
      <h3>固定法线剖切</h3>
      <p>
        <el-select
          v-model="fxFx"
          placeholder="选择法线方向"
        >
          <el-option
            v-for="item in fxFxOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="xPosition"
          style="width: 100px"
        />
      </p>
      <el-button @click="clipModelPolygon">开始分析</el-button>
      <el-button @click="clipModelPlane">剖切模型</el-button>
      <h3>动态法线剖切</h3>
      <p>
        <el-select
          v-model="clipType"
          placeholder="选择剖切类型"
        >
          <el-option
            v-for="item in clipTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-if="clipType === 'kw'"
          v-model="kwSdVal"
          type="text"
          style="width: 100px"
        />
      </p>
      <el-button @click="drawClipLine">绘制剖面线</el-button>
      <el-button @click="clearClipLine">清除剖面线</el-button>
      <el-button @click="endDrawLine">结束绘制</el-button>
      <el-button @click="startClip()">开始分析</el-button>
      <p>
        <el-button @click="clearAllKwRes()">隐藏剖切面</el-button>
        <el-button @click="addAllKwRes()">还原剖切面</el-button>
        <el-button @click="destroyRes()">销毁</el-button>
      </p>
      <p>
        <el-input
          v-model="clippingPlaneVal"
          type="number"
          style="width: 100px"
        />
        <el-button @click="clearsingleKwRes()">清除</el-button>
        <el-button @click="addsingleKwRes()">添加</el-button>
      </p>
      <h3>--地层数据展示--</h3>
      <p>
        <el-button @click="getSegamaData">获取地层数据</el-button>
        <el-button @click="clearSegamaData">清除</el-button>
      </p>
      <p class="segama-data">
        <ul>
          <li
            v-for="(item, index) in segamaDatas"
            :key="index"
            @click="clickSegamaData(item[1])"
          >{{ item[0] }}</li>
        </ul>
      </p>
    </span>
  </div>
</template>
<script>
/**
 * xugang 20230403 app1
 */
import { ElMessage } from 'element-plus'
import InitCesium from '@/utils/js/InitCesium'
import axios from 'axios'
import pako from 'pako'
import IndexDb from './IndexDb'
// import ShowVertexs from './ShowVertexs.vue'
import pakoInstance from './pako.min.js'

import patchCesium from './CesiumWsPatch.js'
// import patchCesium from 'cesium-ws-patch'
// import patchCesium from '../../dist/cesium_ws_patch/index.umd.min.js'

// import createSectionCap from './ClipModel.js'

import {removeAxes, addAxesAtTilesetOriginWithTransform} from './utils/AddAxis.js'
import runClips from './clipmodel/Cesium3DTilesClipByLine.js'
import {runPolygonClips, getModelAllVec} from './clipmodel/Cesium3DTilesClipByPolygon.js'
import {
  addClick1ListenEvent,
  destroyClickHandler,
  applySideClipping,
  addClick2ListenEvent,
  clearAllLine,
  endDrawLine,
  startClipModel
} from './clipmodel/CreateClipPlane.js'

import {openDebugWireframe} from './clipmodel/CeisumModelTriangleDebug.js'


window.pakoTool = pako
let winSocket = null
let viewer = null
let legends
let dcPointsEntities = []
export default {
  data()
  {
    return {
      ifshowpanel: true, // 是否显示面板
      modelvalue: '', // 当前模型
      modelOptions: [], // 模型路径选择
      modelLoadMsgs: [],
      ifOpenGlobalel: true, // 是否开启全局地球
      YValue: 800,
      ZValue: 800,
      xPosition: -300, // 剖切位置
      ifHideModel: false, // 是否隐藏模型
      ifopenDebugWireframe: false, // 是否开启模型调试
      ifopenDebugWireframe1: false, // 是否开启模型调试
      segamaDatas:[],
      clipType: 'pm', // 剖切类型
      clipTypeOptions:
      [
        {label: '剖面分析', value: 'pm'},
        {label: '开挖分析', value: 'kw'},
      ],
      clippingPlaneVal: 0,  // 开挖剖切面序号
      kwSdVal: 400, // 开挖剖切面深度
      modelAlphaVal: 1, // 模型透明度
      hideDc: '11-1',
      fxFx: 'x',
      fxFxOptions:
      [
        {label: 'x', value: 'x'},
        {label: 'y', value: 'y'},
        {label: 'z', value: 'z'},
      ],
    }
  },

  created()
  {
    this.modelOptions = [
      // {label: '珠海工程地质模型-测试', value: 'modelWsOnline/xg_test/1/地质体模型.json'},
      {label: '巷道点云模型', value: 'modelWsOnline/xg_test/3、金星-420/tileset.json'},
      {label: '点云模型1', value: 'modelWsOnline/xg_test/PointCloudBatched/tileset.json'},
      {label: '珠海工程地质模型-重建整块', value: 'modelWsOnline/xg_test/3dtiles/全市地质体模型.json'},
      // {label: '珠海工程地质模型-重建整块-cesiumlab', value: 'modelWsOnline/cesiumlab/3dtiles1/tileset.json'},
      // {label: '珠海工程地质模型-cesiumlab', value: 'modelWsOnline/cesiumlab/3dtiles/tileset.json'},
      // {label: '徐州工程地质模型-本地', value: 'modelWsLocal/static/model/工程地质模型.json'},
      {label: '无锡工程地质模型-122', value: 'modelWsOnline/wxmodels/无锡工程地质模型.json'},
      // {label: '徐州工程地质模型-122', value: 'modelWsOnline/wxmodels/工程地质模型.json'},
      // {label: '珠海工程地质模型-122', value: 'modelWsOnline/gis_zhcsdz/工程地质模型.json'},
      // {label: '珠海第四系模型-122', value: 'modelWsOnline/gis_zhcsdz/第四系.json'},
      {label: '珠海横琴示范区-122', value: 'modelWsOnline/gis_zhcsdz/横琴示范区.json'},
      // {label: '珠海横琴示范区-122-切割', value: 'modelWsOnline/gis_zhcsdz/E8DEAF12-A565-45b4-ADF4-4995D1C252E4.json'},
      {label: '河北全国模型-122', value: 'modelWsOnline/hb_shs_drzyxxzyqh_web/work/static/model/3dtiles/地质体.json'},
      // {label: '海南岛-122', value: 'modelWsOnline/hb_shs_drzyxxzyqh_web/work/static/model/3dtiles/海南岛_1.json'},
      {label: '海南岛2-122', value: 'modelWsOnline/xg_test/3Dtils/海岛/海南岛_1.json'},
      {label: '全国大分快-122', value: 'modelWsOnline/xg_test/3Dtils/Block-29.json'},
      {label: '雄安-122', value: 'modelWsOnline/xg_test/雄安地质体模型.json'},
      {label: '全国地质体模型--', value: 'modelWsOnline/hb_shs_drzyxxzyqh_web/work/static/model/3dtiles/全国地质体模型.json'},
      {label: '全国地质体模型--1', value: 'modelWsOnline/hb_shs_drzyxxzyqh_web/work/static/model/3dtiles/全国地质体模型-分块.rar/全国地质体模型-分块/1/block-1.json'},
      // {label: '1分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/1fk3dtiles/tileset.json'},
      // {label: '2分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/2fk3dtiles/tileset.json'},
      // {label: '3分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/3fk3dtiles/tileset.json'},
      // {label: '4分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/4fk3dtiles/tileset.json'},
      // {label: '5分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/5fk3dtiles/tileset.json'},
      // {label: '6分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/6fk3dtiles/tileset.json'},
      // {label: '7分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/7fk3dtiles/tileset.json'},
      // {label: '8分块', value: 'modelWsOnline/gis_zhcsdz/qxsymx/8fk3dtiles/tileset.json'},
      // {label: '官方模型', value: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json'},
    ]
    this.modelvalue = this.modelOptions.find(_ => _.label === '珠海横琴示范区-122').value


  },
  mounted()
  {
    let self = this
    this.$nextTick(async() =>
    {
      let InitCesiumIns = new InitCesium()
      window.viewer = viewer = InitCesiumIns.initviewer(() => this.$hLoading())

      window.InitCesiumIns = InitCesiumIns

      // patchCesium({ Cesium, serverUrl: 'ws://127.0.0.1:18888', maxConnections: 40, cesiumContainer: 'cesiumcontainer' })
      let calllFn = (msgTip) =>
      {
        let msg = msgTip ? `加载完成，${msgTip}` : '加载完成'
        self.$message.success(msg)
      }
      let readyMsg = await patchCesium({
        Cesium,
        serverUrl: window.modelWsPort || $g.syscfg.modelwsipset,
        modelWsLibPort: window.modelWsLibPort || $g.syscfg.modelWsLibPort,
        maxConnections: 40,
        cesiumContainer: 'cesiumcontainer',
        calllFn
      })
      if (readyMsg.statuscode === 1)
        self.$message.success(readyMsg.message)
      else
        self.$message.error(readyMsg.message)
    })

    window.axios = axios
  },
  methods:
  {
    // 查看模型所有点
    getModelAllVe1c()
    {
      getModelAllVec()
    },

    // 展开面板
    foldPanel()
    {
      this.ifshowpanel = !this.ifshowpanel
    },

    // 隐藏其他
    hideOtherModels()
    {
      tileset.root.children.forEach(_ =>
      {
        if (_?._content?.batchTable?._features)
        {
          _._content.batchTable._features.forEach(feature =>
          {
            let dcbm = feature.getProperty('dcbm')
            if (dcbm && dcbm !== this.hideDc)
              feature.show = false
          })
        }
      })
    },

    // 显示全部
    showAllModels()
    {
      tileset.root.children.forEach(_ =>
      {
        if (_?._content?.batchTable?._features)
        {
          _._content.batchTable._features.forEach(feature =>
          {
            feature.show = true
          })
        }
      })
    },

    consoleFn()
    {
      console.log(window.tileset)
      console.log(window.cueModelLegends)
      console.log(window.curFeature)
      console.log(window.curTile)
      console.log(window.curPrimitive)
    },

    // 跳转特定模型视角
    flyToCustomModel()
    {
      viewer.scene.camera.frustum.near = 0.01
      let view = {'lon':113.49195940667474, 'lat':22.038701950821793, 'hei':-348.39613030934515, 'heading':192.77170559323437, 'pitch':-48.51780225946186, 'roll':0.024425023608534404}
      viewer.flyTo(view)
    },

    // 获取地层数据
    getSegamaData()
    {
      this.segamaDatas = window.segamaArrCollectResult
      console.log(this.segamaDatas)
      // this.consoleFn()
    },

    // 清除地层数据
    clearSegamaData()
    {
      dcPointsEntities.forEach(item =>
      {
        viewer.entities.remove(item)
      })
    },

    // 点击单个地层数据
    clickSegamaData(clippedSegments)
    {
      dcPointsEntities.forEach(item =>
      {
        viewer.entities.remove(item)
      })
      console.log(clippedSegments)
      for (let i = 0; i < clippedSegments.length; i++)
      {
        // if (i > 0) break
        let segment = clippedSegments[i]
        let line = viewer.entities.add({
          polyline: {
            positions: segment,
            width: 3,
            material: Cesium.Color.RED,
          },
        })
        dcPointsEntities.push(line)

        segment.forEach(point =>
        {
          let pointEntity = viewer.entities.add({
            position: point,
            point: {
              pixelSize: 5,
              color: Cesium.Color.BLUE,
            },
          })
          dcPointsEntities.push(pointEntity)
        })
      }
    },

    // 模型透明度变化
    changeModelAlpha(val)
    {
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: `color(\'white\') * vec4(1.0, 1.0, 1.0, ${val})`,
      })
    },


    // 射线剖切
    async clipModelLine()
    {
      runClips({viewer, tileset})
    },

    // 绘制剖面线
    drawClipLine()
    {
      addClick2ListenEvent({viewer})
    },

    // 清除剖面线
    clearClipLine()
    {
      clearAllLine(viewer)
    },

    // 结束绘制
    endDrawLine()
    {
      endDrawLine(viewer, this.clipType)
    },

    // 开始剖切（自定义剖切线剖切）
    async startClip(type)
    {
      // let res = await startClipModel({viewer, vue_this: this, tileset, legends, calllFn: this.hideModel})
      let res = await startClipModel({viewer, vue_this: this, tileset, debug: true, legends, kwSdVal: Number(this.kwSdVal)})
      console.log(res)
    },

    // 隐藏剖切面
    clearAllKwRes()
    {
      tileset.clippingPlanes.enabled = false
    },

    // 还原
    addAllKwRes()
    {
      tileset.clippingPlanes.enabled = true
    },

    // 销毁
    destroyRes()
    {
      // 销毁剖切面
      tileset.clippingPlanes.removeAll()
      // 销毁绘制线
      clearAllLine(viewer)
      // 销毁封面polygon
      window.clipModelResPolygonPrimitiveCollections.forEach(item =>
      {
        viewer.scene.primitives.remove(item)
      })
    },

    // 清除单个开挖结果
    clearsingleKwRes()
    {
      if (!this.clippingPlaneCollection)
        this.clippingPlaneCollection = {}
      let targetPlane = tileset.clippingPlanes.get(this.clippingPlaneVal)
      this.clippingPlaneCollection[this.clippingPlaneVal] = targetPlane
      tileset.clippingPlanes.remove(targetPlane)
    },

    // 添加单个
    addsingleKwRes()
    {
      let targetPlane = this.clippingPlaneCollection[this.clippingPlaneVal]
      tileset.clippingPlanes.add(targetPlane)
    },

    // 面剖切--固定切面
    async clipModelPolygon()
    {
      let vue_this = this
      
      runPolygonClips({ tileset, viewer, legends, xPosition: this.xPosition, vue_this, axis: this.fxFx, applyplane: this.applySideClipping })
    },

    // 添加clipPlane-固定剖切线剖切
    clipModelPlane()
    {
      this.applySideClipping = applySideClipping({ xPosition: this.xPosition, tileset, axis: this.fxFx })
    },

    // 开启地球
    openGlobe()
    {
      this.ifOpenGlobalel = !this.ifOpenGlobalel
      window.InitCesiumIns.openGlobe(this.ifOpenGlobalel)
    },

    // 隐藏模型
    hideModel()
    {
      this.ifHideModel = !this.ifHideModel
      if (this.ifHideModel)
      {
        if (window.tileset)
          window.tileset.show = false
        else
          this.$message.warning('请先加载模型')
      }
      else
      {
        if (window.tileset)
          window.tileset.show = true
        else
          this.$message.warning('请先加载模型')
      }
    },

    // 开启模型调试-cesium默认
    openDebugWireframe()
    {
      this.ifopenDebugWireframe = !this.ifopenDebugWireframe
      tileset.debugWireframe = this.ifopenDebugWireframe
    },

    // 开启模型调试-自定义
    openDebugWireframe1()
    {
      this.ifopenDebugWireframe1 = !this.ifopenDebugWireframe1
      // tileset.debugWireframe = this.ifopenDebugWireframe1
      openDebugWireframe({tileset, viewer})
    },

    // 开启拾取
    openPick()
    {
      addClick1ListenEvent({ viewer, vue_this: this })
    },

    // 关闭拾取
    closePick()
    {
      destroyClickHandler()
    },

    // 添加坐标轴
    addAxis()
    {
      addAxesAtTilesetOriginWithTransform(viewer, tileset)
    },

    // 复位
    backPos()
    {
      InitCesiumIns.backPos()
    },
    // 获取数据
    getB3dmData(uri)
    {
      return axios({
        url: uri,
        responseType: 'arraybuffer' // 指定响应数据格式为 ArrayBuffer
      })
    },

    // 加载模型
    async loadModel1()
    {
      let modelJson = await axios.get(this.modelvalue)
      let modelJson1 = await axios.get('modelWsOnline/gis_zhcsdz/工程地质模型.json')
      legends = modelJson?.data?.properties?.legend ? modelJson.data.properties.legend : modelJson1.data.properties.legend
      window.cueModelLegends = legends
      if (window.WebSocketPoolDispatcher && !window.WebSocketPoolDispatcher.STATUS_CODE) return this.$message.warning('初始化中，请稍后')
      let self = this
      InitCesiumIns.load3DTiles(self.modelvalue)
      // this.openGlobe()
      viewer.scene.globe.depthTestAgainstTerrain = true
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = false
    }
  }
}
</script>
<style lang="scss" scoped>
:deep(.el-input__wrapper){
  margin: 0.11rem 0.11rem 0 0;
}
p{color: white;}
#cesiumcontainer {
  width: 100%;
  height: 100%;
  position: relative;
  // background-image: url('public/static/img/datebg.png');
  background-position: bottom;
}

.msg-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 5;
  border-radius: 8px;
  padding: 5px;
  backdrop-filter: blur(4px);
  background: rgb(0 122 255 / 29%);
  max-width: 500px;
  line-height: 18px;
  max-height: 900px;
  overflow: auto;
}

.fold-span{
  position: absolute;
  top: -11px;
  left: 10px;
  z-index: 6;
}

:deep(.el-button) {
  margin-top: 10px
}

.show-vertexs {
  position: absolute;
  top: 8px;
  left: 600px;
}

.panel-title {
  color: #feff00
}
.segama-data{
  li{color: white;font-size: 0.14rem;margin-bottom: 0.08rem;&:hover{background-color: #333;color: #0fc076;}}
}

h3{color: #e9bf00;}
</style>

