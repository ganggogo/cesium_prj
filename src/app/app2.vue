<style lang="scss" scoped>
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
  background: rgb(129 170 90 / 53%);
  max-width: 500px;
  line-height: 18px;
  max-height: 880px;
  overflow: auto;
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
</style>
<template>
  <div id="cesiumcontainer">
    <!-- <ShowVertexs class="show-vertexs"></ShowVertexs> -->
    <span class="msg-panel">
      <el-select v-model="modelvalue" placeholder="选择模型" size="large" style="width: 240px">
        <el-option v-for="item in modelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="loadtype" placeholder="选择加载方式" size="large" style="width: 240px">
        <el-option v-for="item in loadOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button @click="backPos" type="success">复位</el-button>
      <el-button @click="loadImagery" type="success">加载影像</el-button>
      <el-button @click="loadTeria" type="success">加载地形</el-button>
      <el-button @click="loadModel1" type="success">加载模型</el-button>
      <el-button @click="openGlobe" type="success">{{ ifOpenGlobalel ? '关闭' : '开启' }}地球</el-button>
      <!-- <div class="slider-demo-block">
        <span class="demonstration">Y</span>
        <el-slider :min="0" :max="2000" v-model="YValue" show-input @change="handleYChange" />
      </div>
      <div class="slider-demo-block">
        <span class="demonstration">Z</span>
        <el-slider :min="0" :max="2000" v-model="ZValue" show-input @change="handleZChange" />
      </div> -->
      <!--
      <el-button @click="saveModelData" type="success">存储模型数据</el-button>
      <el-button @click="fetchModelData" type="success">读取模型数据</el-button>
      -->
      <div v-for="(item, index) in modelLoadMsgs" :key="index">
        <h3 class="panel-title">模型标识：{{ item.cur_indexdb_name }}</h3>
        <p style="color:white"><span class="panel-title">ws连接状态：</span>{{ item.wsconnectsMsgs }}</p>
        <p style="color:white"><span class="panel-title">ws错误日志：</span>{{ item.wsconnectsLogs }}</p>
        <p style="color:white"><span class="panel-title">加载进度：</span>{{ item.loadProgress }}</p>
        <p style="color:white"><span class="panel-title">出错日志：</span>{{ item.errorLogs }}</p>
        <p style="color:white"><span class="panel-title">耗时：</span>{{ item.loadFixTime }}</p>
      </div>
    </span>
  </div>
</template>
<script>
/**
 * xugang 20230403 app1
 */
// import Worker from "./Get3dTilesArrayBuffer"
import { ElMessage } from 'element-plus'
import InitIndexDb from './InitIndexDb'
import InitCesium from '@/utils/js/InitCesium'
import axios from 'axios'
import pako from 'pako'
import IndexDb from './IndexDb'
// import ShowVertexs from './ShowVertexs.vue'
import pakoInstance from './pako.min.js'

//console.log(pako)


// const saveWorker = new Worker(new URL('./SaveWorker.js', import.meta.url))
// window.saveWorker = saveWorker
window.pakoTool = pako
let winSocket = null
let viewer = null
export default {
  // components: { ShowVertexs },
  data() {
    return {
      modelvalue: '', // 当前模型
      modelOptions: [], // 模型路径选择
      loadtype: '', // 加载类型
      loadOptions: [], // 加载选项
      modelLoadMsgs: [],
      ifOpenGlobalel: true, // 是否开启全局地球
      YValue: 800,
      ZValue: 800,
    }
  },
  watch:
  {
    loadtype(val) {
      window.request_model_type = val
      console.log(window.request_model_type)
      if (val !== 'ws') clearInterval(window.checkAllPendingErrorTilesIntval)
    }
  },
  created() {
    axios.get('tdtQry/search?postStr={"keyWord":"商厦","queryType":12,"start":0,"count":10,"specify":"156110108"}&type=query&tk=6ac5ffa2361330cbbf535ba6d1b10f92').then(res =>
    {
      console.log(res)
    })
    // axios.get('exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=06e2b805-af5f-4713-aebf-2e4493ddff54/工程地质模型.json&type=2').then(res => {
    //   console.log(res)
    // }
    // )
    // axios.get('exclusive3DTilesModelAgent/stream?bucketName=model&filename=gc_dz_model/工程地质模型.json&type=0').then(res => {
    //   console.log(res)
    // }
    // )
    // axios.get(`${window._model_nginx_name}/gc_dz_model/工程地质模型.json`).then(res => {
    //   console.log(res)
    // }
    // )
    this.modelOptions = [
      // { label: '珠海三维实景模型1', value: 'gis_zhcsdz/qxsymx/1fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型2', value: 'gis_zhcsdz/qxsymx/2fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型3', value: 'gis_zhcsdz/qxsymx/3fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型4', value: 'gis_zhcsdz/qxsymx/4fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型5', value: 'gis_zhcsdz/qxsymx/5fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型6', value: 'gis_zhcsdz/qxsymx/6fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型7', value: 'gis_zhcsdz/qxsymx/7fk3dtiles/tileset.json' },
      // { label: '珠海三维实景模型8', value: 'gis_zhcsdz/qxsymx/8fk3dtiles/tileset.json' },
      // {label: '5402011301_LN', value: 'xg_test/gxmodel/5402011301_LN.json'},
      // {label: '5402012101_PT', value: 'xg_test/gxmodel/5402012101_PT.json'},
      // {label: '5402012104_PT', value: 'xg_test/gxmodel/5402012104_PT.json'},
      // {label: '5402012105_PT', value: 'xg_test/gxmodel/5402012105_PT.json'},
      // {label: '5402012109_PT', value: 'xg_test/gxmodel/5402012109_PT.json'},
      // {label: '5402012110_PT', value: 'xg_test/gxmodel/5402012110_PT.json'},
      // {label: '5402012111_PT', value: 'xg_test/gxmodel/5402012111_PT.json'},
      // {label: '5402013101_PT', value: 'xg_test/gxmodel/5402013101_PT.json'},
      // // {label: '5402013101-JG_PT', value: 'xg_test/gxmodel/5402013101-JG_PT.json'},
      // {label: '5402013105_PT', value: 'xg_test/gxmodel/5402013105_PT.json'},
      // {label: '5402013105-JG_PT', value: 'xg_test/gxmodel/5402013105-JG_PT.json'},
      // {label: '5402014101_PT', value: 'xg_test/gxmodel/5402014101_PT.json'},
      // {label: '5402021301_LN', value: 'xg_test/gxmodel/5402021301_LN.json'},
      // {label: '5402022102_PT', value: 'xg_test/gxmodel/5402022102_PT.json'},
      // {label: '5402022105_PT', value: 'xg_test/gxmodel/5402022105_PT.json'},
      // {label: '5402022106_PT', value: 'xg_test/gxmodel/5402022106_PT.json'},
      // {label: '5402022108_PT', value: 'xg_test/gxmodel/5402022108_PT.json'},
      // {label: '5402022109_PT', value: 'xg_test/gxmodel/5402022109_PT.json'},
      // {label: '5402022110_PT', value: 'xg_test/gxmodel/5402022110_PT.json'},
      // {label: '5402022111_PT', value: 'xg_test/gxmodel/5402022111_PT.json'},
      // {label: '5402022112_PT', value: 'xg_test/gxmodel/5402022112_PT.json'},
      // {label: '5402023101_PT', value: 'xg_test/gxmodel/5402023101_PT.json'},
      // {label: '5402023101-JG_PT', value: 'xg_test/gxmodel/5402023101-JG_PT.json'},
      // {label: '5402024101_PT', value: 'xg_test/gxmodel/5402024101_PT.json'},
      // {label: '5402031301_LN', value: 'xg_test/gxmodel/5402031301_LN.json'},
      // {label: '5402032109_PT', value: 'xg_test/gxmodel/5402032109_PT.json'},
      // {label: '5402032111_PT', value: 'xg_test/gxmodel/5402032111_PT.json'},
      // {label: '5402033101_PT', value: 'xg_test/gxmodel/5402033101_PT.json'},
      // {label: '5402033101-JG_PT', value: 'xg_test/gxmodel/5402033101-JG_PT.json'},
      // {label: '5402033105_PT', value: 'xg_test/gxmodel/5402033105_PT.json'},
      // {label: '5402033105-JG_PT', value: 'xg_test/gxmodel/5402033105-JG_PT.json'},
      // { label: '荆州官网模型1', value: 'xg_test/model/WS_PT.json' },
      // { label: '荆州官网模型2', value: 'xg_test/model/WS_LN.json' },
      // { label: '珠海横琴示范区', value: 'zh_hqsfq_model/横琴示范区.json' },
      { label: '尖草坪站3dtiles', value: 'tyqTestModel/地铁站3dtiles/尖草坪站3dtiles/tileset.json', flag: 'pos1' },
      { label: '涧河站3dtiles', value: 'tyqTestModel/地铁站3dtiles/涧河站3dtiles/tileset.json', flag: 'pos2' },
      { label: '小商品市场-西涧河3dtiles', value: 'tyqTestModel/地铁站3dtiles/小商品市场-西涧河3dtiles/tileset.json', flag: 'pos3' },
      { label: '珠海横琴示范区1', value: 'gis_zhcsdz/横琴示范区.json' },
      // { label: '云找矿模型', value: 'gis_zhcsdz/横琴示范区.json' },
      { label: '珠海工程地质模型', value: 'xg_test/工程地质模型.json' },
      { label: '珠海工程合并-cesiumlab', value: 'gis_zhcsdz/cesiumlab切片-3dtiles/tileset.json' },
      { label: '珠海工程合并-zgis', value: 'zhgcdz-hb/珠海合并模型_1.json' },
      { label: '主洞室进度模型', value: 'hn_dk/安庆洞库/主洞室进度模型.json' },
      { label: '水沐孔', value: 'hn_dk/安庆洞库/水幕孔.json' },
      { label: '水幕巷道工程进度模型', value: 'hn_dk/安庆洞库/水幕巷道工程进度模型.json' },
      { label: '施工巷道工程进度模型', value: 'hn_dk/安庆洞库/施工巷道工程进度模型.json' },
      { label: '渗压计孔', value: 'hn_dk/安庆洞库/渗压计孔.json' },
      { label: '多点位移计孔', value: 'hn_dk/安庆洞库/多点位移计孔.json' },
      // // { label: '徐州工程地质模型http-本地', value: 'static/model/工程地质模型.json' },
      // // { label: '徐州工程地质模型-压缩后-ws-资源管理器', value: 'exclusive3DTilesModelAgent/stream?filename=yasuohou-xz-gcdz-mx/工程地质模型.json&type=0&copyurl=modelUrlFrom2249900/yasuohou-xz-gcdz-mx/工程地质模型.json' },
      // // { label: '徐州工程地质模型http-资源管理器', value: 'modelUrlFrom2249900/xz_gcdz_model/工程地质模型.json' },
      // // { label: '徐州工程地质模型ws', value: 'xz_gcdz_model/工程地质模型.json' },
      // // { label: '珠海工程地质模型ws-minio', value: 'exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=06e2b805-af5f-4713-aebf-2e4493ddff54/工程地质模型.json&type=2' },
      // // { label: '珠海工程地质模型http-资源管理器', value: 'modelUrlFrom2249900/gc_dz_model/工程地质模型.json' },
      { label: '珠海工程地质模型ws-资源管理器', value: 'gis_zhcsdz/工程地质模型.json' },
      // // { label: '珠海工程地质模型-压缩后ws-资源管理器', value: 'exclusive3DTilesModelAgent/stream?filename=yasuohou_zh_gcdz_mx/工程地质模型.json&type=0&copyurl=modelUrlFrom2249900/yasuohou_zh_gcdz_mx/工程地质模型.json' },
      // { label: '珠海承载力模型资源管理器', value: 'gis_zhcsdz/承载力.json' },
      // // { label: '珠海承载力模型minio', value: 'exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=48c47a64-2bf8-48f4-a59f-f64315d85519/地基承载力.json&type=2' },
      // // { label: '江苏全省基岩模型minio', value: 'exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=3dtiles/tileset.json&type=2' },
      // // { label: '江苏基岩地质模型资源管理器', value: 'exclusive3DTilesModelAgent/stream?filename=quansheng_jiyan_dizhi_model/全省基岩地质模型.json&type=0&copyurl=exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=10062e3c-11a8-4e18-8cfd-11c664f3cdda/全省基岩地质模型.json&type=2' },
      // // { label: '上海白模ws-minio', value: 'exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=e6f5b86c-5664-462e-bc56-f8cd6dd1ea38/data.json&type=2' },
      // // { label: '上海白模http-资源管理器', value: 'modelUrlFrom2249900/shanghaimodel/tilestet.json' },
      // // { label: '上海白模资源管理器', value: 'exclusive3DTilesModelAgent/stream?filename=shanghaimodel/tileset.json&type=0&copyurl=exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=e6f5b86c-5664-462e-bc56-f8cd6dd1ea38/data.json&type=2' },
      // // { label: '基坑开挖模型ws-minio', value: 'exclusive3DTilesModelAgent/stream?bucketName=model3d&filename=5eae1ec8-9b95-4b9d-907b-2ea8d6db3d9d/基坑开挖内侧.json&type=2' },
      // // { label: '苏南工程地质模型ws-资源管理器', value: 'sunan_gcdz_model/工程地质模型.json' },
      // // { label: '苏南工程地质模型http-本地', value: 'static/model/苏南工程地质模型/工程地质模型.json' },
      // // { label: '苏南工程地质模型http-资源管理器', value: 'modelUrlFrom2249900/sunan_gcdz_model/工程地质模型.json' }
    ]
    this.modelvalue = this.modelOptions[0].value

    this.loadOptions = [
      { label: 'ws多线程', value: 'ws' },
      { label: 'http', value: 'http' }
    ]
    this.loadtype = this.loadOptions[0].value

  },
  mounted() {
    //console.log(pakoInstance)
    let scoped = this
    // scoped.queryAndDealPakoData()
    // scoped.$sLoading()
    scoped.$nextTick(() => {
      let InitCesiumIns = new InitCesium()
      window.viewer = viewer = InitCesiumIns.initviewer(() => scoped.$hLoading())

      // // let hbbj = require ('../assets/json/hbs.json')
      // // InitCesiumIns.loadBJDataSouces(hbbj, '#CD9A9A', 2.5)
      window.InitCesiumIns = InitCesiumIns
      // this.startWorker()

      setInterval(() => {
        if (!window.modelLoadMsgs.length) return
        scoped.modelLoadMsgs = []
        window.modelLoadMsgs.forEach((_1, idx1) => {
          let obj = {}
          // 模型标识
          obj.cur_indexdb_name = _1.cur_indexdb_name
          // 连接状态
          let sockets1 = _1.modelSocketBucket, sockets2 = []
          if (sockets1 && sockets1.length) sockets2 = sockets1.filter(_ => _.socket && _.socket.readyState === 1)
          obj.wsconnectsMsgs = `共 ${_1.ws_max_connections} 个连接，${sockets2.length} 个连接成功~`
          // 连接日志
          obj.wsconnectsLogs = _1.recordAllErrorSockets && _1.recordAllErrorSockets.length ? _1.recordAllErrorSockets.join('-') : ''
          // 加载进度
          obj.loadProgress = _1.wsconnectsLogs
          // 出错日志
          obj.errorLogs = ``
          if (_1.tilesSelfLoadLogs && _1.tilesSelfLoadLogs.length)
          {
            _1.tilesSelfLoadLogs.forEach(err => {
              obj.errorLogs += err + ' | '
            })
          }
          // 加载耗时
          obj.loadFixTime = _1.loadFixTime

          scoped.modelLoadMsgs.push(obj)
        })
      }, 30)

      // setTimeout(() => {
        
      //   // InitCesiumIns.load3DTiles(scoped.modelOptions[4].value, {ifOpenWsConnect: true, ifUseIndexDb: true})
      //   // InitCesiumIns.load3DTiles(scoped.modelOptions[5].value, {ifOpenWsConnect: true, ifUseIndexDb: true})
      //   // InitCesiumIns.load3DTiles(scoped.modelOptions[6].value, {ifOpenWsConnect: true, ifUseIndexDb: true})
      //   // InitCesiumIns.load3DTiles(scoped.modelOptions[7].value, {ifOpenWsConnect: true, ifUseIndexDb: true})
      //   // InitCesiumIns.load3DTiles(scoped.modelOptions[8].value, {ifOpenWsConnect: true, ifUseIndexDb: true})
      //   // InitCesiumIns.load3DTiles(scoped.modelOptions[9].value, {ifOpenWsConnect: true, ifUseIndexDb: true})

      //   for (let i = 0; i < scoped.modelOptions.length; i++)
      //   {
      //     if (i > 7 ) InitCesiumIns.load3DTiles(scoped.modelOptions[i].value, {ifOpenWsConnect: false, ifUseIndexDb: false})
      //   }
      // }, 1500)

      // setInterval(() => {
      //   scoped.modelLoadMsgs = [{loadFixTime: InitCesiumIns.loadFixTime}]
      // }, 10)
    })
    // 普通axios请求
    // axios.get(`exclusive3DTilesModelAgent/stream?filename=shanghai2/data/data33.b3dm`).then(res =>
    // {
    //   console.log(res.data)
    // })
    window.axios = axios
    // axios.get(`exclusive3DTilesModelAgent/stream?filename=shanghai2/data/data619.b3dm`).then(res =>
    // {
    //   console.log(res.data)
    // })
    // // ArrayBuffer请求
    // this.getBufferDataByAjax(`exclusive3DTilesModelAgent/stream?filename=shanghai2/data/data33.b3dm`).then(res =>
    // {
    //   console.log(res)
    // })
  },
  methods:
  {
    handleYChange(val)
    {
      let primitives = window.viewer.scene.primitives._primitives[1]._primitives
      for (let i = 0; i < primitives.length; i++) {
        let primitive = primitives[i]
        InitCesiumIns.setModelPos(primitive,'pos1',{offsetVal: {x: 0, y: val, z: this.ZValue}})
      }
    },
    handleZChange(val)
    {
      let primitives = window.viewer.scene.primitives._primitives[1]._primitives
      for (let i = 0; i < primitives.length; i++) {
        let primitive = primitives[i]
        InitCesiumIns.setModelPos(primitive,'pos1',{offsetVal: {x: 0, y: this.YValue, z: val}})
      }
    },
    
    loadImagery()
    {
      let yxLayer = new cxe.ImageryLayer('tms', {
        // url: 'static/model/ynyx/'
        // url: 'static/model/ynyx12/dx/'
        url: 'TyqAgent/download/yx/'
      })
      window.viewer.layers.addImageryLayer(yxLayer)
    },

    loadTeria()
    {
      let terrainLayer = new cxe.TerrainLayer('t_xyz', {
        url: 'static/model/ynyx12/dx/',
        url: 'TyqAgent/download/dx/'
      })
      window.viewer.layers.addTerrain(terrainLayer)
    },

    openGlobe()
    {
      this.ifOpenGlobalel = !this.ifOpenGlobalel
      window.InitCesiumIns.openGlobe(this.ifOpenGlobalel)
    },

    fetchModelData() {
      function fetchAllData() {
        return new Promise((resolve, reject) => {
          // const worker = new Worker(new URL('./FetchWorker.js', import.meta.url))

          get_modelDatas_woker.onmessage = (event) => {
            const { status, data, error } = event.data;

            if (status === 'success') {
              resolve(data);
            } else {
              reject(error);
            }
          };

          get_modelDatas_woker.postMessage({ action: 'fetchAll' });
        });
      }

      // 使用fetchAllData函数获取所有数据
      fetchAllData()
        .then((data) => {
          console.log('数据全部读取:', data);
          ElMessage({
            message: '数据全部读取完毕',
            type: 'success',
          })
          _MODEL_WS_SOCKET.wsModelDataCollections = data
        })
        .catch((error) => {
          console.error('数据读取失败:', error);
          ElMessage({
            message: '数据读取失败',
            type: 'error',
          })
        });
    },
    getRandomIntInclusive(min = 1, max = 20) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min; // 含min和max
    },
    saveModelData() {
      let data = _MODEL_WS_SOCKET.wsModelDataCollections, dataArray = []
      for (let i in data) {
        dataArray.push({ key: i, data: data[i] })
      }

      const chunkSize = 100; // 每次写入的块大小
      // const worker = new Worker(new URL('./SaveWorker.js', import.meta.url))
      window.save_modelData_Worker.onmessage = (event) => {
        const { status, error } = event.data;

        if (status === 'success') {
          console.log('数据全部写入成功');
          ElMessage({
            message: '数据全部写入完毕',
            type: 'success',
          })
        } else {
          console.error('数据写入失败:', error);
          ElMessage({
            message: '数据写入失败',
            type: 'error',
          })
        }
      };

      window.save_modelData_Worker.postMessage({ dataArray, chunkSize });

    },
    async loadModel2() {
      let time1s = performance.now()

      let indexdbIns = new IndexDb()
      indexdbIns.indexIns = await indexdbIns.initIndexDB()
      console.log(indexdbIns)

      let time1e = performance.now()
      console.log('初始化数据库耗时', time1e - time1s)

      let time2s = performance.now()

      let arraybufferdata = new ArrayBuffer(1233920)
      console.log(arraybufferdata)
      let res = await indexdbIns.storeArrayBufferToIndexDB('selfurl', '', arraybufferdata)
      console.log(res)

      let time2e = performance.now()
      console.log('存储耗时', time2e - time2s)

      console.log(66)
    },
    /**
     * 请求加处理压缩数据
     */
    queryAndDealPakoData() {
      axios({ url: 'modelJson/static/model/工程地质模型-压缩/FE16022F-DDB0-4666-8F50-0D7115C5301F.b3dm.gz', responseType: 'arraybuffer' })
        .then(res => {
          let regionData = res.data
          console.log('解压前的数据：', regionData)
          let inflatedData = pako.inflate(regionData).buffer
          // let inflatedData = pako.inflate(new Uint8Array(regionData), { to: 'arraybuffer' })
          // let inflatedData = pako.inflate(new Uint8Array(regionData), { to: 'string' })
          console.log('解压后的数据：', inflatedData)
        })
      axios({ url: 'modelJson/static/model/工程地质模型/FE16022F-DDB0-4666-8F50-0D7115C5301F.b3dm', responseType: 'arraybuffer' })
        .then(res => {
          console.log(res.data)
        })
      axios({ url: 'modelWithoutGzip/static/model/工程地质模型/FE16022F-DDB0-4666-8F50-0D7115C5301F.b3dm', responseType: 'arraybuffer' })
        .then(res => {
          console.log(res.data)
        })
    },
    /**
     * 使用ajax请求b3dm模型数据-ArrayBuffer格式
     * @method
     * @param {String} url
     */
    getBufferDataByAjax(url) {
      return new Promise((resolve, reject) => {
        // 创建一个XMLHttpRequest对象
        let xhr = new XMLHttpRequest()
        // 配置请求
        xhr.open('GET', url, true)
        xhr.responseType = 'arraybuffer'
        // 设置请求完成后的回调函数
        xhr.onload = function () {
          if (xhr.status === 200) {
            // 请求成功
            let arrayBuffer = xhr.response
            // 处理arrayBuffer，例如转换为其他格式
            resolve(arrayBuffer)
          } else {
            // 请求失败
            reject(xhr.status)
          }
        };
        // 发送请求
        xhr.send();
      })
    },
    startWorker() {
      // 创建Web Worker实例
      // this.worker = new Worker('./Get3dTilesArrayBuffer.js');
      this.worker = new Worker();

      // 监听Web Worker的消息
      this.worker.onmessage = function (event) {
        // 处理接收到的消息
        let result = event.data;
        // 在Vue组件中更新数据或执行其他操作
        console.log(result)
      };

      // 向Web Worker发送消息
      let message = { data: [1, 2, 3, 4] };
      this.worker.postMessage(message);
    },
    //复位
    backPos() {
      InitCesiumIns.backPos()
    },
    //获取数据
    getB3dmData(uri) {
      return axios({
        url: uri,
        responseType: 'arraybuffer' // 指定响应数据格式为 ArrayBuffer
      })
    },

    // 调整视角
    adjustView()
    {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500), // 500米高度
        orientation: {
            heading: Cesium.Math.toRadians(heading || 0), // 默认朝向北方
            pitch: Cesium.Math.toRadians(pitch || -30),  // 默认俯视30度
            roll: 0.0
        }
    });
      // 可选：在场景中添加图片实体
      window.viewer.entities.add({
          name: '参考图片',
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
          billboard: {
              image: 'path/to/your/image.jpg', // 图片路径
              width: 300,
              height: 200,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          }
      });
    },

    //加载模型
    async loadModel()
    {
      function sendMessage(message) {
        return new Promise((resolve, reject) => {
          const onMessage = (data) => {
            let resdata = JSON.parse(data)
            console.time(`${resdata.flag}耗时`)
            let base64Data = resdata.fileData
            let binaryString = atob(base64Data);
            // 创建一个Uint8Array来保存解码后的二进制数据
            let byteArray = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              byteArray[i] = binaryString.charCodeAt(i);
            }
            // 创建ArrayBuffer
            let arrayBuffer = byteArray.buffer;
            console.timeEnd(`${resdata.flag}耗时`)
            resolve(arrayBuffer);
          };
          winSocket.onmessage = (ev) => {
            return onMessage(ev.data)
          }
          winSocket.send(message); // 发送消息到服务器
        });
      }

      let requestArrs = [
        { type: 2, filename: 'e6f5b86c-5664-462e-bc56-f8cd6dd1ea38/data/data1012.b3dm', flag: 'fdshbhzjkfbdshjf8', bucketName: 'model3d' },
        { type: 2, filename: 'e6f5b86c-5664-462e-bc56-f8cd6dd1ea38/data/data1013.b3dm', flag: 'dawdgdawdwdawdwgde', bucketName: 'model3d' }
      ]
      for (let i = 0; i < requestArrs.length; i++) {
        let res = await sendMessage(JSON.stringify(requestArrs[i]))
        console.log(res)
      }
    },
    async loadModel1() {
      let self = this

      InitCesiumIns.load3DTiles(self.modelvalue, {ifOpenWsConnect: true, ifUseIndexDb: true}, this.modelOptions.find(_ => _.value === self.modelvalue).flag)

      // // 请求压缩数据并解压
      // axios({url: 'modelJson/static/model/工程地质模型.json.gz', responseType: 'arraybuffer'}).then(res =>
      // {
      //   // 将压缩数据解压缩
      //   try {
      //     // 获取原始数据
      //     let regionData = res.data
      //     console.log('原始数据：', regionData)
      //     // 使用pako的inflate函数来解压缩数据
      //     let inflatedData = pako.inflate(new Uint8Array(regionData), { to: 'string' })
      //     // 解压后的数据现在可以在inflatedData中获取，根据具体情况进行后续处理
      //     console.log('解压后的数据：', inflatedData)
      //   } catch (err) {
      //     console.error('解压缩数据时发生错误：', err)
      //   }
      // })

      // InitCesiumIns.load3DTiles('modelByH2/static/model/工程地质模型.json', {
      // })


      //--------------------------http2
      // InitCesiumIns.load3DTiles('https://192.168.2.225:9905/gisxzdz/static/model/工程地质模型.json', {
      // })

      // InitCesiumIns.load3DTiles('https://192.168.2.225:9905/gisxzdz/static/model/shanghaimodel/tileset.json', {
      // })

      //--------------------------minio

      //InitCesiumIns.load3DTiles('exclusive3DTilesModelAgent/stream?filename=5eae1ec8-9b95-4b9d-907b-2ea8d6db3d9d/基坑开挖内侧.json&type=2', {})


      //--------------------------http1

      // InitCesiumIns.load3DTiles('http://192.168.2.225:9901/gisxzdz/static/model/工程地质模型.json', {
      // })
      // InitCesiumIns.load3DTiles('modelJson/static/model/工程地质模型.json', {
      // })

      // InitCesiumIns.load3DTiles('exclusive3DTilesModelAgent/stream?filename=3dtiles/tileset.json&type=1', {
      // })  // 有问题

      // InitCesiumIns.load3DTiles('exclusive3DTilesModelAgent/stream?filename=shanghai2/tileset.json&type=1', {
      // })

      // InitCesiumIns.load3DTiles('modelJson/static/model/珠海地上白模/zhuhai_001_0.json', {
      // //   maximumScreenSpaceError: 1024,
      // //     // skipLevelOfDetail: true, // 表示是否跳过细节级别。设置为 true 时，将跳过一些细节级别的加载，从而提高性能。默认值为 true。
      // //   // baseScreenSpaceError: 4096, // 设置基础的屏幕空间误差。屏幕空间误差是控制模型细节显示的一个重要参数。较小的值会显示更多的细节，但可能导致性能下降。默认值为 1024。
      // //   // skipScreenSpaceErrorFactor: 4, // 控制是否跳过屏幕空间误差。当细节级别超过 baseScreenSpaceError 的 skipScreenSpaceErrorFactor 倍时，将跳过加载。默认值为 16。
      // //   // skipLevels: 0.5, // 控制是否跳过一些级别的加载。设置为正整数时，将跳过指定数量的级别加载。默认值为 1。
      // //   // immediatelyLoadDesiredLevelOfDetail: false, // 控制是否立即加载所需的细节级别。如果设置为 true，将直接加载所需的细节级别，而不等待其他细节级别的加载。
      // //   // loadSiblings: false,
      // //   // cullWithChildrenBounds: true
      // //   // minimumZoomLevel: 16,
      // //   // maximumZoomLevel: 19,
      // //   // maximumClippingDistance: 1000000000000000000
      // //   // dynamicScreenSpaceError: true
      // //   // maximumMemoryUsage: 1024 * 1024 * 1024
      // }) // 34s


      // InitCesiumIns.load3DTiles('modelJson/static/model/珠海地上白模/zhuhai_001_0.json', {
      //   // skipLevelOfDetail: true, // 表示是否跳过细节级别。设置为 true 时，将跳过一些细节级别的加载，从而提高性能。默认值为 true。
      //   // baseScreenSpaceError: 1024, // 设置基础的屏幕空间误差。屏幕空间误差是控制模型细节显示的一个重要参数。较小的值会显示更多的细节，但可能导致性能下降。默认值为 1024。
      //   // skipScreenSpaceErrorFactor: 16, // 控制是否跳过屏幕空间误差。当细节级别超过 baseScreenSpaceError 的 skipScreenSpaceErrorFactor 倍时，将跳过加载。默认值为 16。
      //   // skipLevels: 1, // 控制是否跳过一些级别的加载。设置为正整数时，将跳过指定数量的级别加载。默认值为 1。
      //   // immediatelyLoadDesiredLevelOfDetail: false, // 控制是否立即加载所需的细节级别。如果设置为 true，将直接加载所需的细节级别，而不等待其他细节级别的加载。
      //   // loadSiblings: false,
      //   // cullWithChildrenBounds: true
      // }) // 耗时: 29518.796142578125 ms

      // InitCesiumIns.load3DTiles('modelJson/static/model/工程地质模型.json', {
      //   // maximumScreenSpaceError: 0,
      //   // skipLevelOfDetail: true, // 表示是否跳过细节级别。设置为 true 时，将跳过一些细节级别的加载，从而提高性能。默认值为 true。
      //   // baseScreenSpaceError: 1024, // 设置基础的屏幕空间误差。屏幕空间误差是控制模型细节显示的一个重要参数。较小的值会显示更多的细节，但可能导致性能下降。默认值为 1024。
      //   // skipScreenSpaceErrorFactor: 16, // 控制是否跳过屏幕空间误差。当细节级别超过 baseScreenSpaceError 的 skipScreenSpaceErrorFactor 倍时，将跳过加载。默认值为 16。
      //   // skipLevels: 3, // 控制是否跳过一些级别的加载。设置为正整数时，将跳过指定数量的级别加载。默认值为 1。
      //   // immediatelyLoadDesiredLevelOfDetail: false, // 控制是否立即加载所需的细节级别。如果设置为 true，将直接加载所需的细节级别，而不等待其他细节级别的加载。
      //   // loadSiblings: false,
      //   // cullWithChildrenBounds: true
      // }) // 耗时: 29518.796142578125 ms
      // InitCesiumIns.load3DTiles('modelJson/static/model/无锡工程地质模型.json', {
      //   skipLevelOfDetail: true,
      //   baseScreenSpaceError: 1024,
      //   skipScreenSpaceErrorFactor: 16,
      //   skipLevels: 1,
      //   immediatelyLoadDesiredLevelOfDetail: false,
      //   loadSiblings: false,
      //   cullWithChildrenBounds: true
      // }) // 耗时: 29518.796142578125 ms
      // InitCesiumIns.load3DTiles('modelJson/static/model1/工程地质模型.json', {
      //   // skipLevelOfDetail: true,
      //   // baseScreenSpaceError: 1024,
      //   // skipScreenSpaceErrorFactor: 16,
      //   // skipLevels: 1,
      //   // immediatelyLoadDesiredLevelOfDetail: false,
      //   // loadSiblings: false,
      //   // cullWithChildrenBounds: true
      // }) // 耗时: 40074.5234375 ms
      // InitCesiumIns.load3DTiles('static/model/工程地质模型.json', {
      //   // skipLevelOfDetail: true,
      //   // baseScreenSpaceError: 1024,
      //   // skipScreenSpaceErrorFactor: 16,
      //   // skipLevels: 1,
      //   // immediatelyLoadDesiredLevelOfDetail: false,
      //   // loadSiblings: false,
      //   // cullWithChildrenBounds: true
      // }) // 耗时: 40074.5234375 ms

      // // http://192.168.2.201:8083/gisxntc_dev/static/models/gisxntc_dev/tileset.json
      // InitCesiumIns.load3DTiles('tcModel/static/models/gisxntc_dev/tileset.json', {
      //   // skipLevelOfDetail: true,
      //   // baseScreenSpaceError: 1024,
      //   // skipScreenSpaceErrorFactor: 16,
      //   // skipLevels: 1,
      //   // immediatelyLoadDesiredLevelOfDetail: false,
      //   // loadSiblings: false,
      //   // cullWithChildrenBounds: true
      // }) // 耗时: 40074.5234375 ms
      // // InitCesiumIns.load3DTiles('static/model/工程地质模型.json.gz')



      // //请求倾斜摄影模型--------right
      // 组织所有的tiles的请求地址-存入localstorage
      // let b3dmUrls1 = []
      // await axios.get('modelJson/static/model1/工程地质模型.json').then(res =>
      // {
      //   b3dmUrls1 = res.data.root.children.map(item => `modelJson/static/model1/工程地质模型/${item.content.uri.split('./工程地质模型/')[1]}.gz`)
      // })
      // console.log(b3dmUrls1)
      // localStorage.setItem('xg_modelUrlDatas', JSON.stringify(b3dmUrls1))


      //    -------------------------------存储数据
      // // 声明多个 b3dm URL
      // let b3dmUrls = JSON.parse(localStorage.getItem('xg_modelUrlDatas'))
      // console.log(b3dmUrls)
      // //请求模型b3dm数据并存储
      // let allBuffers1 = []
      // let allBuffers2 = []
      // await Promise.all(b3dmUrls.map(url => self.getB3dmData(url))).then(res =>
      // {
      //   allBuffers1 = res.map(item => item.data)
      // })
      // console.log(allBuffers1)
      // allBuffers1.forEach(item =>
      //   {
      //     let tmp1 = new Uint8Array(item)
      //     let tmp2 = pako.inflate(tmp1, { to: 'string' })
      //     allBuffers2.push(tmp2)
      //   })
      //   console.log(allBuffers2)
      // self.addData('accessDataMainKey', {modeldata: allBuffers2})

      //-------------------------------------------------------



      // -------------------读取数据

      // let tmpdata1 = await window.acessDataDB.getDataByKey('accessDataMainKey')
      // let tmpdata2 = tmpdata1.accessData.modeldata
      // // console.log(tmpdata2)


      // await axios.get('modelJson/static/model1/工程地质模型.json', { responseType: 'blob' }).then(res =>
      // {
      //   // // 将文本数据转化为 ArrayBuffer 类型
      //   // let jsonTextData = JSON.stringify(res.data) // json 文件的文本数据
      //   // console.log(jsonTextData)
      //   // let arrayBuffer = new ArrayBuffer(jsonTextData.length);
      //   // let bufferView = new Uint8Array(arrayBuffer);
      //   // for (let i = 0; i < jsonTextData.length; i++) {
      //   //   bufferView[i] = jsonTextData.charCodeAt(i)
      //   // }

      //   // // 创建Blob对象
      //   // let blob = new Blob([bufferView], {type: "application/json"})

      //   // // 创建URL
      //   // let url = URL.createObjectURL(blob)
      //   // console.log(url)

      //   console.log(res)
      //   const blobData =  new Blob([res.data], { type: 'application/json' });
      //   const blobUrl = URL.createObjectURL(blobData);
      //   console.log(blobUrl)

      //   // 将URL加载到 cesium 中
      //   let tileset = new Cesium.Cesium3DTileset({
      //     url: blobUrl
      //   })
      //   console.log(tileset)
      //   viewer.scene.primitives.add(tileset)
      //   // axios.get(blobUrl).then(d =>
      //   // {
      //   //   console.log(d)
      //   // })
      // })
    }
  }
}
</script>
