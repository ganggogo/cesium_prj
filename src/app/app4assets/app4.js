import * as THREE from 'three'
// 引入轨道控制器扩展库OrbitControls.js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
//引入性能监视器stats.js
import Stats from 'three/addons/libs/stats.module.js'
// 引入dat.gui.js的一个类GUI
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
// 引入gltf加载器
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// draco是谷歌出的一款模型压缩工具,可将gltf格式的模型进行进一步压缩提高页面加载速的一种方法
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
// 引入B3DMLoader
import { B3DMLoader, TilesRenderer } from "3d-tiles-renderer"
// 引入TWEEN动画库
import TWEEN from '@tweenjs/tween.js'
let canvasWrapper, scene, camera, renderer, controls, stats, gui, mesh, all3dTilesModels = []
export default {
  data()
  {
    return {
      
    }
  },
  mounted()
  {
    this.$nextTick(() =>
    {
      this.initScene()
    })
  },
  methods:
  {
    /**
     * @method
     * 初始化场景
     */
    initScene()
    {
      canvasWrapper = this.$refs.canvasWrapper
      let width = canvasWrapper.offsetWidth, height = canvasWrapper.offsetHeight
      scene = new THREE.Scene()
      window.myScene = scene
      console.log(window.myScene)
      this.addGui()
      camera = this.setCamera(width, height)
      renderer = this.setRenderer(width,height)
      canvasWrapper.appendChild(renderer.domElement)
      this.addAxesHelper()
      this.addStatsBox()
      mesh = this.addMesh()
      this.setOrbitControls()
      this.addPointLightHelper()
      this.addAmbientLight()
      this.addDirectionLight()
      this.listenerWindowChange()
      this.addGridHelper()
      // this.loadGltf()
      // this.load3DTiles('工程地质模型.json')
      // this.load3DTiles('DFdibiao.json')
      this.load3DTiles('LNGStation_100.json')
      this.animate()
      // window.addEventListener('mousedown', this.onMouseDown, false)


      canvasWrapper.addEventListener('click', function(event) {
        // 获取鼠标点击的屏幕坐标
        var mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };
    
        // 将屏幕坐标转换为NDC坐标
        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
    
        // 通过相机矩阵计算鼠标点击位置的空间坐标
        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersects = raycaster.intersectObjects(scene.children);
    
        if (intersects.length > 0) {
            // 如果鼠标点击位置与物体相交，则打印其空间坐标
            console.log('点击位置的空间坐标：', intersects[0].point);
        }
    }, false);
    },
    /**
     * @method
     * 设置相机
     * @param {Number} width
     * @param {Number} height
     */
    setCamera(width, height)
    {
      let camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 10000000)
      camera.position.set(100, 100, 100)
      let obj ={show: false}
      gui.add(obj, 'show').name('打印相机位置').onChange((val) =>
      {
        console.log(camera)
      })
      return camera
    },
    /**
     * @method
     * 渲染场景
     */
    animate()
    {
      requestAnimationFrame(this.animate)
      mesh.rotateY(0.005)
      if (stats) stats.update()
      if (controls) controls.update()
      renderer.render(scene, camera)
    },
    /**
     * @method
     * 设置渲染器
     * @param {Number} width
     * @param {Number} height
     */
    setRenderer(width, height)
    {
      let renderer = new THREE.WebGLRenderer()
      renderer.setSize(width, height)
      // 抗锯齿
      renderer.antialias = true
      // 适应不同的硬件设备屏幕
      renderer.setPixelRatio(window.devicePixelRatio)
      // 设置背景颜色
      renderer.setClearColor(0x444444, 1)
      return renderer
    },
    /**
     * @method
     * 添加辅助坐标系
     */
    addAxesHelper()
    {
      let axesHelper = new THREE.AxesHelper(150)
      scene.add(axesHelper)
    },
    /**
     * @method
     * 添加mesh
     */
    addMesh()
    {

      // 2、添加平面
      let planeGeo = new THREE.PlaneGeometry(8000, 8000)
      // let planeMaterial = new THREE.MeshPhongMaterial({
      //   color: new THREE.Color().setStyle('#C4B894'),
      //   shininess: 10,
      //   specular: new THREE.Color().setStyle('#EE8834')
      // })

      // 图片纹理贴图
      // 纹理贴图加载器TextureLoader
      let texLoader = new THREE.TextureLoader()
      let texture = texLoader.load('static/img/earth.jpg')
      let planeMaterial = new THREE.MeshPhongMaterial({
        // color: 0xff0000, // 会和图片混合
        shininess: 100, //高光部分的亮度，默认30
        specular: new THREE.Color().setStyle('#EE8834'), //高光部分的颜色
        map: texture
      })
      let planeMesh = new THREE.Mesh(planeGeo, planeMaterial)
      planeMesh.position.set(0,0,0)
      planeMesh.rotateX(- Math.PI / 2)
      console.log(planeMesh)
      let uvs = new Float32Array([0, 0.5, 0.75, 0.75, 0.25, 0.25, 0.45, 0.25])
      planeMesh.geometry.attributes.uv = new THREE.BufferAttribute(uvs, 2)
      scene.add(planeMesh)


      // 1、添加立方体
      let geometry = new THREE.BoxGeometry(10, 10, 10)
      // 设置基本材质
      // let material = new THREE.MeshBasicMaterial({color: 0x0000ff})
      // 设置高光材质
      let material = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          shininess: 1000, //高光部分的亮度，默认30
          specular: 0x444444, //高光部分的颜色
          // wireframe:true,//线条模式渲染mesh对应的三角形数据
      })
      let mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(10, 20, 0)
      window.mesh = mesh
      // 基本形状位移操作
      // mesh.geometry.scale(2,3,4)
      // mesh.geometry.translate(2,2,3)
      // mesh.geometry.rotateX(Math.PI / 4)
      // mesh.geometry.center() 旋转位移后中心点与起始位置重合
      scene.add(mesh)
      camera.lookAt(mesh.position)
      gui.add(mesh.position, 'x', 0, 100).name('mesh的x坐标').step(1)
      gui.add(mesh.position, 'y', 0, 100).name('mesh的y坐标').step(1)
      gui.add(mesh.position, 'z', 0, 100).name('mesh的z坐标').step(1)
      let obj = {color: 0xff0000}
      gui.addColor(obj, 'color').onChange((val) =>
      {
        mesh.material.color.set(val)
      }).name('mesh的颜色')

      // 世界坐标和本地坐标
      // 任何一个模型的本地坐标(局部坐标)就是模型的.position属性,一个模型的世界坐标，说的是，模型自身.position和所有父对象.position累加的坐标。
      let worldPos = new THREE.Vector3()
      mesh.getWorldPosition(worldPos)
      console.log('世界坐标', worldPos)
      console.log('本地坐标', mesh.position)
      return mesh
    },
    /**
     * @method
     * 使用OrbitControls
     */
    setOrbitControls()
    {
      controls = new OrbitControls(camera, renderer.domElement)
      // 使动画循环使用时阻尼或自转 意思是否有惯性
      controls.enableDamping = true
      // 动态阻尼系数 就是鼠标拖拽旋转灵敏度
      // controls.dampingFactor = 0.8
    },
    /**
     * @method
     * 添加点光源辅助观察
     */
    addPointLightHelper()
    {
      // new THREE.PointLight(颜色，强度，距离，衰减)
      let pointLight = new THREE.PointLight(0xff0000, 1, 100000)
      pointLight.position.set(40, 40, 40)
      gui.add(pointLight, 'intensity', 0, 10).name('点光源强度')
      scene.add(pointLight)
      let sphereSize = 2
      let pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize)
      scene.add(pointLightHelper)
    },
    /**
     * @method
     * 设置环境光
     */
    addAmbientLight()
    {
      let ambient = new THREE.AmbientLight(0xffffff, 3)
      gui.add(ambient, 'intensity', 0, 10).name('环境光强度')
      scene.add(ambient)
    },
    /**
     * @method
     * 添加平行光
     */
    addDirectionLight()
    {
      let directionLight = new THREE.DirectionalLight(0xffffff, 1)
      directionLight.position.set(80, 100, 50)
      mesh ? directionLight.target = mesh : new THREE.Vector3(0, 0, 0)
      scene.add(directionLight)
      let directionLightHelper = new THREE.DirectionalLightHelper(directionLight, 5, 0xff0000)
      gui.add(directionLight, 'intensity', 0, 10).name('平行光强度')
      scene.add(directionLightHelper)
    },
    /**
     * @method
     * 监听窗口变化
     */
    listenerWindowChange()
    {
      let self = this
      window.onresize = function()
      {
        let width = canvasWrapper.offsetWidth, height = canvasWrapper.offsetHeight
        renderer.setSize(width, height)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
    },
    /**
     * @method
     * 添加状态栏查看器
     */
    addStatsBox()
    {
      stats = new Stats()
      stats.domElement.style.left = 'unset'
      stats.domElement.style.right = '0px'
      this.$nextTick(() =>
      {
        canvasWrapper.appendChild(stats.domElement)
      })

      // let geometry = new THREE.BoxGeometry(100, 100, 100)
      // //材质对象Material
      // let material = new THREE.MeshLambertMaterial({
      //     color: 0x00ffff, //设置材质颜色
      //     transparent: true,//开启透明
      //     opacity: 0.5,//设置透明度
      // })
      // for (let i = 0 i < 10 i++) {
      //   for (let j = 0 j < 10 j++) {
      //     let mesh = new THREE.Mesh(geometry, material) //网格模型对象Mesh
      //     // 在XOZ平面上分布
      //     mesh.position.set(i * 200, 0, j * 200)
      //     scene.add(mesh) //网格模型添加到场景中  
      //   }
      // }
    },
    /**
     * @method
     * 添加GUI对象
     * @example add(控制对象，对象具体属性，属性参数最小值，属性参数最大值)
     */
    addGui()
    {
      gui = new GUI()
      let domStyle = gui.domElement.style
      domStyle.width = '300px'
      domStyle.right = '100px'
    },
    /**
     * @method
     * 添加网格地面辅助观察
     */
    addGridHelper()
    {
      let gridHelper = new THREE.GridHelper(1000, 10, 0x004444, 0x004444)
      scene.add(gridHelper)
    },
    /**
     * @method
     * 加载gltf模型
     */
    loadGltf()
    {
      let loader = new GLTFLoader()
      let dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/static/draco/')
      loader.setDRACOLoader(dracoLoader)
      loader.load('static/model/people/woman.gltf', (gltf) =>
      {
        console.log(gltf)
        let people = gltf.scene
        // 设置模型位置
        people.position.set(0, 0, 0)
        // 设置模型缩放
        people.scale.set(20,20,20)
        // scene.add(people)
        // 遍历模型节点
        let modelBones = []
        // people.traverse((v) =>
        // {
        //   modelBones.push(v.uuid)
        //   console.log(v)
        // })
        // modelBones.forEach(item =>
        // {
        //   let mesh = scene.getObjectByProperty('uuid', item)

        // })

      //   people.traverse(function (child) {
      //     if (child.isMesh) {
      //         // 创建具有反射属性的材质
      //         let material = new THREE.MeshPhysicalMaterial({
      //             map: child.material.map, // 使用原始纹理贴图
      //             envMap: scene.background, // 使用场景的背景作为环境贴图
      //             envMapIntensity: 100, // 设置环境贴图强度
      //         })
  
      //         // 将材质应用到当前网格
      //         child.material = material
      //     }
      // })

      people.traverse(function (child) {
        if (child.isMesh) {
          // 创建具有反射属性的材质
          let material = new THREE.MeshPhongMaterial({
            // color: 0xff0000, // 会和图片混合
            shininess: 100, //高光部分的亮度，默认30
            specular: new THREE.Color().setStyle('#FFFFFF'), //高光部分的颜色
            map: child.material.map
          })

          // 将材质应用到当前网格
          child.material = material
      }
      })
      // 将模型添加到场景中
      scene.add(people)
      }, (xhr =>
        {
          let percent = xhr.loaded / xhr.total
          console.log('加载进度' + percent)
        }))
    },
    /**
     * @method
     * 加载3dtiles模型
     */
    load3DTiles(filename) {
      all3dTilesModels = []
      let basepath = 'static/model/'
      let group = new THREE.Group()
      console.log('整个模型的group:', group)
      group.position.set(0,0,0)
      scene.add(group)
    
      fetch(basepath + filename)
      .then((response) => {
        return response.json()
      })
      .then((resdata) => {
        let tilesetArr = resdata.root.children
        for (let tilese of tilesetArr) {
          new B3DMLoader().load(basepath + tilese.content.uri.split('./')[1]).then((res) => {
            let ress = res.scene
            // ress.rotation.set(-Math.PI / 2, 0, 0)
            // ress.scale.set(0.01, 0.01, 0.01);
            // ress.position.set(0, 0, 0);
            console.log(res.scene)
            console.log(filename + ':', ress.children[0].position)
            ress.traverse((model) => {
              all3dTilesModels.push(model)
              group.add(ress)
              if (model.isMesh) {
                model.material.side = THREE.BackSide // 背面可见
                model.material.side = THREE.DoubleSide // 两侧的面可见
              }
            })
          })
        }
      })
      .catch((error) => {
        console.error(error)
      })
    },
    /**
     * @method
     * 鼠标点击拾取
     */
    onMouseDown(event)
    {
      let mouse = new THREE.Vector2()
      mouse.x = (event.clientX / canvasWrapper.offsetWidth) * 2 - 1
      mouse.y = -(event.clientY / canvasWrapper.offsetHeight) * 2 + 1
      let raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      let intersects = raycaster.intersectObjects(all3dTilesModels, true)
      if (intersects.length > 0) {
        let selectedObject = intersects[0].object
        selectedObject.material.color.set(0xff0000)
      }
    }
  }
}
