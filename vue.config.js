const { defineConfig } = require('@vue/cli-service')
const path = require('path')

const IS_PROD = ['production'].includes(process.env.NODE_ENV)
const resolve = (dir) => path.join(__dirname, '.', dir)


module.exports = defineConfig({
  // 1-基础配置
  publicPath: IS_PROD ? './' : './',  // 部署应用包时的基本 URL,用法和 webpack 本身的 output.publicPath 一致
  outputDir: 'dist/app',              // 生产环境打包的输出目录
  assetsDir: 'assets',                // 打包时编译产生静态资源(js、css、img、fonts)目录，相对于outputDir目录的
  indexPath: 'index.html',            // 相对于outputDir目录的主文件index.html的路径
  transpileDependencies: true,
  lintOnSave: true,                   // 是否在开发环境下通过 eslint-loader 在每次保存时 lint 代码
  productionSourceMap: !IS_PROD,      // 生产环境的 source map

  // 2-开发服务
  devServer: {                        // dev环境下，webpack-dev-server 相关配置
    host: '0.0.0.0',                  // 可用localhost和ip访问
    port: 8123,                       // 行时的端口号，'auto'时自动
    https: false,                     // https:{type:Boolean}
    open: false,                      // 配置自动启动浏览器
    hot: true,                      // 热更新,true时刷新页面，only不刷新页面
    proxy: {                          // 配置多个跨域
      '/test': {
        target: 'http://192.168.2.227:17789/gistzhp',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/test': '/'
        }
      },
      '/zgis': {
        target: 'http://192.168.2.227:17899/zgis',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/zgis': '/'
        }
      },
      '/modelJson': { // 带有gzip
        // target: 'http://192.168.2.225:8094/gisxzdz/',
        target: 'http://192.168.2.225:9901/gisxzdz/',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/modelJson': '/'
        }
      },
      '/modelWithoutGzip': { // 带有gzip
        target: 'http://192.168.2.225:9907/gisxzdz/',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/modelWithoutGzip': '/'
        }
      },
      '/modelByH2': {
        target: 'https://192.168.2.225:9905/gisxzdz/',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/modelByH2': '/'
        }
      },
      '/tcModel': {
        target: 'http://192.168.2.201:8083/gisxntc_dev/',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/tcModel': '/'
        }
      },
      '/exclusive3DTilesModelAgent': {
        // target: 'http://192.168.2.201:18021/zgis/mongoSvr/',
        // target: 'http://192.168.2.225:9906/zgis/model/',   // monggo - minio -nginx
        // target: 'http://192.168.2.224:17899/zgis/model/', // http://192.168.2.224:17899/zgis/model/stream/
        // target: 'http://192.168.2.227:17899/zgis/model/', // http://192.168.2.224:17899/zgis/model/stream/
        target: 'http://192.168.2.122:17899/zgis/model/', // http://192.168.2.224:17899/zgis/model/stream/
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/exclusive3DTilesModelAgent': '/'
        }
      },
      '/modelUrlFrom2249900': { // 224 nginxE
        // target: 'http://192.168.2.224:9900/getModelData/',
        // target: 'http://192.168.2.227:17789/getModelData/',
        target: 'http://192.168.2.122:9010/getModelData/',
        changeOrigin: true,
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/modelUrlFrom2249900': '/'
        }
      },
      '/tdtQry': {
        target: 'http://192.168.2.224/tdtQry/',
        changeOrigin: true,
        pathRewrite: {
          '^/tdtQry': '/'
        }
      },
      // '/TyqAgent': {
      //   target: 'http://192.168.2.207:18006',
      //   changeOrigin: true,
      //   pathRewrite: {
      //     '^/TyqAgent': '/'
      //   }
      // },
      '/modelWsLocal': {
        target: 'http://127.0.0.1:18889/modelWs/',
        changeOrigin: true,
        pathRewrite: {
          '^/modelWsLocal': '/'
        }
      },
      '/modelWsOnline': {
        target: 'http://192.168.2.122:18889/modelWs/',
        changeOrigin: true,
        pathRewrite: {
          '^/modelWsOnline': '/'
        }
      },
      '/modelWsD': {
        target: 'http://192.168.2.122:18889/modelWsD/',
        changeOrigin: true,
        pathRewrite: {
          '^/modelWsD': '/'
        }
      }
    }
  },
  parallel: false, // 防止打包的时候web Worker报错
  // 3-链式修改webpack配置
  chainWebpack: config =>
  {
    // 3.1-解析
    config.resolve.alias
      .set('@', resolve('src'))
      .set('public', resolve('public'))

    config.resolve.extensions
      .clear()
      .merge(['.js', '.vue', '.scss'])

    // 解决：“window is undefined”报错，这个是因为worker线程中不存在window对象，因此不能直接使用，要用this代替
    
    // worker配置
    config.output.globalObject('this')
    config.module
      .rule('worker')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
      .options({
        filename: '[name].[contenthash].worker.js',
        inline: 'no-fallback',
        esModule: false
      })
      .end()

    // 3.2-自定义插件构造库的package文件
    // if (IS_PROD)
    // {
    //   config.plugin('LibPkgFile')
    //     .use(new LibPkgFile())
    // }
  },

  // 4-样式
  css: {
    extract: IS_PROD,
    loaderOptions: {
      css: {
        modules: {
          auto: () => false
        }
      },
      scss: {
        sourceMap: false
      }
    }
  }
})
