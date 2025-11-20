// import { createRouter, createWebHistory } from 'vue-router' //history
/**
 * vue-router历史模式的问题： vue3中历史模式默认改为了HTML5模式：createWebHistory()，导致刷新页面会导致404，
 * 要解决这个问题，需要做的就是在服务器上添加一个简单的回退路由。如果 URL 不匹配任何静态资源，它应提供与应用程序中的 index.html 相同的页面。
 * 详细解决方法 vue-router官网“不同的历史记录模式”部分： router.vuejs.org/zh/guide/essentials/history-mode.html
 */
import { createRouter, createWebHashHistory } from 'vue-router' //hash

// 路由列表数据
import routes from './routes'

// 创建路由实例
const router = createRouter({
  // history: createWebHistory(process.env.BASE_URL), //history
  history: createWebHashHistory(process.env.BASE_URL), //hash
  routes
})

/**
 * 路由守卫拦截
 */
router.beforeEach((to, from, next) =>
{
  // to 目标路由对象 
  // from 当前导航正要离开的路由对象
  // next 是一个函数，表示放行
  // console.log(to)
  // console.log(from)
  // console.log(next)
  // if (from.path === '/') 
  next ()
})
 
router.afterEach(to =>
{

})
 
export default router
