<style lang="scss" scoped>
:deep(.el-menu-vertical-demo:not(.el-menu--collapse)) {width: 200px;min-height: 400px;}
svg{width: 0.18rem !important;height: 0.18rem !important;margin-right: 0.06rem;}
.top-expand{height: 0.4rem;padding-left: 0.16rem;:deep(.el-icon){font-size: 0.35rem;cursor: pointer;}}
:deep(.el-menu--collapse .el-sub-menu .el-sub-menu__title .el-sub-menu__icon-arrow){display: none !important;}
</style>
<template>
  <div>
    <div class="top-expand" v-if="showExpendBtn">
      <el-icon @click="changeExpand"><Fold class="icons" v-if="!isCollapse" /><Expand class="icons" v-else /></el-icon>
    </div>
    <el-menu
      :default-active="defaultActive"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      @select="selectItem"
      @click="clickItem"
    >
    <div v-for="(item1, index1) in menus" :key="index1" >
      <el-sub-menu v-if="item1.children" :index="item1.plugin">
        <template #title>
          <el-icon>
            <component class="icons" :is="item1.icon"></component>
          </el-icon>
          <span v-if="!isCollapse">{{ item1.name }}</span>
        </template>
          <div v-for="(item2, index2) in item1.children" :key="index2" >
            <el-sub-menu v-if="(item2.children && item2.children.length !== 0)" :index="item2.plugin">
              <template #title>{{ item2.name }}</template>
              <el-menu-item v-for="(item3, index3) in item2.children" :key="index3" :index="item3.plugin">{{ item3.name }}</el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="item2.plugin">
              <span>{{ item2.name }}</span>
            </el-menu-item>
          </div>
      </el-sub-menu>
      <el-menu-item v-else :index="item1.plugin">
        <el-icon>
          <component class="icons" :is="item1.icon"></component>
        </el-icon>
        <span v-if="!isCollapse">{{ item1.name }}</span>
      </el-menu-item>
    </div>
    </el-menu>
  </div>
</template>
<script>
/**
 * 组件名称: 菜单目录树 xugang 20230506
 * 功能说明:
 *
 * 参数说明:
 * @prop  类型               参数名                          参数说明
 * @prop  Boolean            showExpendBtn                  是否展示收缩按钮
 * @prop  Array              menus                          菜单数据
 * @prop  Boolean            ifOpenRouter                   是否开启路由模式
 * @prop  String             defaultActive                  默认高亮菜单标识
 *
 * 事件说明:
 * @event 事件名             参数解构                        事件和参数说明
 * @event selectItem         菜单每一项绑定的index           点击选择菜单单项时向上传出事件
 *
 * 插槽说明:
 * @slot  插槽名             插槽prop解构                    插槽和prop说明
 */
export default {
  data()
  {
    return {
      isCollapse: true
    }
  },
  props:
  {
    showExpendBtn:
    {
      type: Boolean,
      default: true
    },
    ifOpenRouter:
    {
      type: Boolean,
      default: true
    },
    defaultActive:
    {
      type: String,
      default: 'xtgl'
    },
    menus:
    {
      type: Array,
      default: [
        {
          name: '系统管理',
          plugin: 'xtgl',
          icon: 'setting',
          children: [
            {
              name: '屏幕适配',
              plugin: 'xtglz1',
              icon: 'setting',
              children: []
            },
            {
              name: '模型加载（各类型）',
              plugin: 'xtglz2',
              icon: 'setting',
            },
            {
              name: '模型加载20250617',
              plugin: 'mxjz20250617',
              icon: 'setting',
            }
          ]
        },
        {
          name: '绘制分组图',
          plugin: 'xtglz3',
          icon: 'location',
        },
        {
          name: 'Webgl',
          plugin: 'dpzs',
          icon: 'Grid',
          children: [
            {
              name: 'Three场景（加载3dtiles）',
              plugin: 'dpzsz1',
              icon: 'Grid',
              children: []
            },
            {
              name: 'Cesium glsl',
              plugin: 'dpzsz7',
              icon: 'Grid',
              children: []
            },
            {
              name: 'Cesium',
              plugin: 'dpzsz2',
              icon: 'Grid',
              children: [
                {
                  name: 'ws加载模型-剖切模型封口',
                  plugin: 'dpzsz3',
                  icon: 'Grid',
                },
                {
                  name: 'Cesium水面倒影',
                  plugin: 'dpzsz4',
                  icon: 'Grid',
                }
              ]
            }
          ]
        },
        {
          name: '加密处理',
          plugin: 'dpzsz5',
          icon: 'setting',
          children: [
            {
              name: '加密处理',
              plugin: 'dpzsz5',
              icon: 'Grid',
              children: []
            }
          ]
        },
        {
          name: '模型Ws',
          plugin: 'dpzsz6',
          icon: 'setting',
          children: [
            {
              name: '模型Ws',
              plugin: 'dpzsz6',
              icon: 'Grid',
              children: []
            }
          ]
        },
      ]
    }
  },
  methods:
  {
    //展开/收缩菜单
    changeExpand()
    {
      this.isCollapse = !this.isCollapse
    },
    //选择菜单项
    selectItem(val)
    {
      this.$emit('selectItem', val)
      //如果开启路由模式
      if(this.ifOpenRouter)
      {
        this.$router.push(val)
      }
    },
    //点击菜单项
    clickItem(val)
    {
      // console.log(val)
    }
  }
}
</script>
