import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router/index'

window.cx = require('zbcx_cx').default   



//引入elementPlus
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import locale from 'element-plus/lib/locale/lang/zh-cn'
//引入elementPlus图标
import * as ElIconModules from '@element-plus/icons-vue'


//引入elementPlus图标
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }


let app = createApp(App)

// 全局注册element-plus icon图标组件
Object.keys(ElIconModules).forEach((key) => {//循环遍历组件名称
  if ("Menu" !== key) {//如果不是图标组件不是Menu，就跳过，否则加上ICon的后缀
      app.component(key, ElIconModules[key]);
  } else {
      app.component(key + "Icon", ElIconModules[key]);
  }
})

//开启loading
let showLoading = () =>
{
  store.state.ifLoading = true
}
//关闭loading
let hideLoading = () =>
{
  store.state.ifLoading = false
}
app.config.globalProperties['$sLoading'] = showLoading
app.config.globalProperties['$hLoading'] = hideLoading


//设置rem单位为 全局单位
let pxToVw = (t) =>
{
  return t / document.body.clientWidth * 100
}
document.body.parentNode.style.cssText = `font-size: ${pxToVw(100)}vw`
document.body.style.cssText = 'font-size: 0.16rem'

app.use(store).use(ElementPlus, { locale }).use(router).mount('#app') // 最后！
