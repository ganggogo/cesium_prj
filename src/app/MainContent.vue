<style lang="scss" scoped>
.MainContetnt{width: 100%;height: 100%;display: flex;}
.LeftTree{width: auto;background: #FCFCFC;}
// .RightApp{flex: 1;background: #D2D2D2;}
.RightApp{flex: 1;background: white;}
:deep(.el-menu){border-right: none !important;}
</style>
<template>
  <div class="MainContetnt">
    <LeftTree class="LeftTree" @goRoute="goRoute"></LeftTree>
    <!-- <el-button><router-link to="/index">登录</router-link></el-button>
    <el-button><router-link to="/xtglz1">注册</router-link></el-button> -->
    <div class="RightApp">
      <router-view/>
    </div>
  </div>
</template>
<script>
/**
 * 主界面
 */
import axios from 'axios'
import LeftTree from '@/components/LeftTree.vue'
export default {
  components: {LeftTree},
  data()
  {
    return {

    }
  },
  async mounted()
  {
    // let param = {
    //   "type": 1,
    //   "sys": 11,
    //   "account": `${cx.security.encrypt.encrypt(`admin`, '11ZBCX#2')}`,
    //   "password": `${cx.security.encrypt.encrypt(`zbcx@15!`, '11ZBCX#2')}`,
    //   "time": `${cx.security.encrypt.encrypt(`${Date.now()}`, '11ZBCX#2')}`,
    //   "username": `${cx.security.encrypt.encrypt(`admin`, '11ZBCX#2')}`
    // }
    // let pathname = 'zh_hqsfq_model/横琴示范区/', rootname = 'model3d'
    // let loginres = await cx.http.post('zgis/login/login', param), param1 = {
    //     dir: `${rootname}:${pathname}`,
    //     root: `${rootname}`,
    //     types: '*'
    //   }, resArr = [], res = await cx.http.post(`zgis/FileSvr/getDirFiles?_auth=${loginres.Authorization}`, param1)
    // resArr = this.rankObjects(res.data, 'length', false)
    // console.log(resArr)

    // for (let i of resArr)
    // {
    //   axios.get(`${window._model_nginx_name}/${pathname}${i.name}`, {responseType: 'arraybuffer'}).then(res => {
    //     if (res && res.status === 200)
    //     {
    //       console.log(res.data)
    //       // 存入indexdb
    //     }
    //   })
    // }



    // setTimeout(async () => {

    //   let param = {
    //     "type": 1,
    //     "sys": 11,
    //     "account": cx.security.encrypt.encrypt('admin', '11ZBCX#2'),
    //     "password": cx.security.encrypt.encrypt('zbcx@15!', '11ZBCX#2'),
    //     "time": cx.security.encrypt.encrypt(Date.now().toString(), '11ZBCX#2'),
    //     "username": cx.security.encrypt.encrypt('admin', '11ZBCX#2')
    //   };
    //   // let pathname = 'zh_hqsfq_model/横琴示范区/', databaseName = pathname,
    //   // let pathname = 'sunan_gcdz_model/工程地质模型/', databaseName = pathname,
    //   let pathname = 'gc_dz_model/工程地质模型/', databaseName = pathname,
    //     rootname = 'model3d',
    //     loginres = await cx.http.post('zgis/login/login', param),
    //     allSavedDatas = await window.pre_featch_allModelDatas(pathname),
    //     param1 = {
    //       dir: `${rootname}:${pathname}`,
    //       root: rootname,
    //       types: '*'
    //     }, res = await cx.http.post(`zgis/FileSvr/getDirFiles?_auth=${loginres.Authorization}`, param1);
    //   console.log(allSavedDatas)
    //   const worker = new Worker('static/lib/Cesium/PreSaveModelData.js')
    //   console.log(worker)
    //   worker.postMessage({action:'start', databaseName, filedatas: res.data, _model_nginx_name: window._model_nginx_name, pathname, allSavedDatas })
    //   worker.onmessage = (event) => {
    //     const { status, error } = event.data
    //     if (status === 'success') {
    //       console.log('数据写入成功');
    //     } else {
    //       console.error('数据写入失败:', error);
    //     }
    //   }
    // }, 1000) // 必须要在真正加载模型前执行，不然共用的一个fetch线程会混乱
  },
  methods:
  {
  }
}
</script>
