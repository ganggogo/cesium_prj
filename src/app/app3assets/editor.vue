<style lang="scss" scoped>
    .editor-box {
        position: fixed;
        left: 65%;
        top: 30%;
        cursor: move;
        z-index: 100;
        user-select: none;
        input, textarea, button {
            outline: none;
            border: none;
        }
        .icon {
            width: 1em;
            height: 1em;
            fill: currentColor;
            overflow: hidden;
            vertical-align: middle;
        }
        .close {
            position: absolute;
            top: 1em;
            right: 1em;
            cursor: pointer;
            color: #646464;
        }
        .close:hover {
            color: #212121;
        }
        .el-title{
            font-size: 16px;
            color: #606266;
            line-height: 40px;
            margin-bottom: 6px;
        }
        .el-title::before{
            margin-right: 8px;
        }
        .el-row{
            padding: 0 8px;
        }
        .el-input{
            width: 160px;
            margin-left: 16px;
        }
        .el-color-picker{
            vertical-align: middle;
            height: 32px;
            margin-left: 16px;
        }
        .el-pagination{
            margin: 4px 0;
        }
        :deep(.el-color-picker__trigger){
            padding: 0;
            border: none;
            width: 160px;
            height: 32px;
            overflow: hidden;
        }
        :deep(.el-color-picker__color){
            border: none;
        }
    }
    .controller {
        width: 350px;
        padding: 14px 16px;
        border-radius: 5px;
        border: 1px solid #adb1bf;
        background-color: #fff;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .controller .icon {
        font-size: 18px;
    }
    .controller.svg {
        & > div {
            width: 350px;
        }
    }
    .review-text textarea {
        width: 100%;
        height: 162px;
        line-height: 24px;
        padding: 1em;
        border: 1px solid #eeeeee;
        border-radius: 4px;
        box-sizing: border-box;
        resize: none;
    }
    .review-text {
        width: 190px;
    }
    .review-text textarea:focus {
        border-color: #8b8388;
    }
    .review-text button {
        width: 100%;
        height: 30px;
        border-radius: 15px;
        background-color: #8b8388;
        font-size: 12px;
        color: #ffffff;
        cursor: pointer;
    }
    .review-text button:hover {
        background-color: #f28f9a;
    }
    .config-box {
        width: 140px;
    }
    .config-box > div:first-child {
        margin-bottom: 16px;
    }
    .config-box .title {
        height: 24px;
        line-height: 24px;
        padding-bottom: 6px;
        margin-bottom: 6px;
        border-bottom: 1px solid #adb1bf;
        font-size: 15px;
        color: #535353;
    }
    .config-box .item-box {
        padding-left: 6px;
    }
    .config-box .item {
        display: inline-block;
        width: 18px;
        height: 18px;
        margin: 2px;
        border-radius: 3px;
        cursor: pointer;
    }
    .font-box .item {
        width: 24px;
        height: 22px;
        line-height: 22px;
        background-color: #f28f9a;
        font-size: 12px;
        text-align: center;
        color: #fefffd;
        margin: 4px;
    }
    .font-box .item:hover,
    .font-box .item.on {
        background-color: #e85e75;
    }
    .picker-box, .search-box {
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        margin-bottom: 12px;
    }
    .picker-box {
        & > span {
            display: inline-block;
            vertical-align: middle;
        }
        & > div {
            vertical-align: middle;
        }
    }
    .img-box {
        img {
            width: 36px;
            display: inline-block;
            margin: 3px 5px;
            cursor: pointer;
        }
    }
</style>

<template>
    <div class="editor-box" v-move v-show="isShowing">
        <div class="controller svg" v-if="isImage">
            <div class="el-title el-icon-search">
                <span>纹理搜索</span>
                <el-input size="small" v-model="keyword" placeholder="输入纹理名称"></el-input>
            </div>
            <div class="el-title el-icon-coin">纹理编辑</div>
            <el-row>
                <div class="img-box">
                    <img v-for="(n, i) of images" :key="i" :title="n" :data-name="n" :src="'static/hole/'+ n +'.svg'" @click="patternChange(n)">
                </div>
                <el-pagination
                    layout="prev, pager, next"
                    :page-size="14"
                    :total="total"
                    @current-change="pageChange">
                </el-pagination>
            </el-row>
            <div class="el-title el-icon-coin">
                <span style="margin-right: 0.05rem;">颜色编辑</span>
                <el-color-picker v-model="picker" @change="patternChange"></el-color-picker>
            </div>
        </div>
        <div class="controller" v-else>
            <div class="review-text" @mousemove.stop>
                <textarea ref="text"></textarea>
                <button @click="commit">确认修改</button>
            </div>
            <div class="config-box">
                <div class="color-box">
                    <p class="title">
                        <svg class="icon" aria-hidden="true" :style="{'color': color}">
                            <use xlink:href="#icon-color" />
                        </svg>
                        <span>字体颜色</span>
                    </p>
                    <div class="item-box" @click="setColor($event)">
                        <span v-for="(n, i) of colors" class="item" :style="{'background-color': n}" :key="i"></span>
                    </div>
                </div>
                <div class="font-box">
                    <p class="title">
                        <svg class="icon" aria-hidden="true">
                            <use xlink:href="#icon-bold" />
                        </svg>
                        <span>字体大小</span>
                    </p>
                    <div class="item-box" @click="setSize($event)">
                        <span v-for="(n, i) of sizes" :title="n" class="item" :class="{'on': n === size}" :key="i">{{ i + 1}}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="close" @click="isShowing = false">
            <!-- <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-close" />
            </svg> -->
            <span>x</span>
            <!-- <span style="display: block;width: 26px;height: 26px;color: black;font-size: 15px;"><img style="height:100%;width:100%;" src="static/img/close.png" alt=""></span> -->
        </div>
    </div>
</template>

<script>
/** 纹理和颜色的编辑组件 */

/**
 * 参数说明
 * @param {Object}            props                        props对象
 * @param {String}            props.textVl                 传入的修改的文字
 * @param {Array}             props.colors                 可修改的文字颜色
 * @param {Array}             [props.sizes]                可修改的文字字体
 * @param {Boolean}           [props.isImage = false]      是否为文字修改
 */

// import iconfont from './iconfont.js'
import move from './move.js'
import axios from 'axios'
export default {
  data()
  {
    return {
      total: 0,
      size: null,
      color: null,
      images: [],
      every: [],
      temp: [],
      picker: '#a7a8bd',
      isShowing: false,
      keyword: null
    }
  },
  created()
  {
    let _this = this
    this.getImages = (function()
    {
      axios.get('static/hole/').then(res =>
      {
        const r = res.data
        if (!r.length) return
        _this.temp = _this.every = r.map(t => t.split('.')[0])
        _this.images = _this.every.slice(0, 14)
        _this.total = _this.every.length
      })
      return function(pn = 1, ps = 14)
      {
        return _this.temp.slice((pn - 1) * ps, pn * ps)
      }
    })()
  },
  props: {
    textVl: {
      type: String,
      default: String()
    },
    colors: {
      type: Array,
      default: function()
      {
        return [
          '#151515', '#e60000', '#ff9900', '#008a00', '#0066cc', '#9933ff',
          '#777777', '#f06666', '#ffc266', '#66b966', '#66a3e0', '#c285ff'
        ]
      }
    },
    sizes: {
      type: Array,
      default: function()
      {
        return ['12px', '14px', '16px', '18px', '20px', '22px']
      }
    },
    isImage: {
      type: Boolean,
      default: false
    }
  },
  directives: { move: move },
  
  watch: {
    textVl: function(nv)
    {
      this.$refs.text.value = nv
    },
    keyword: function(nv)
    {
      this.temp = nv
        ? this.every.filter(function(r)
        {
          return r.includes(nv)
        })
        : this.every
      this.total = this.temp.length
      this.images = this.getImages(1)
    }
  },
  methods: {
    setSize(ev)
    {
      let t = ev.target
      if (t.className === 'item')
      {
        let n = Number(t.innerText)
        this.size = this.sizes[n - 1]
        this.repaint()
      }
    },
    setColor(ev)
    {
      let t = ev.target
      if (t.className === 'item')
      {
        this.color = t.style.backgroundColor
        this.repaint()
      }
    },
    clearStyle()
    {
      this.size = null
      this.color = null
      this.repaint()
    },
    commit()
    {
      this.$emit('texts', {
        text: this.$refs.text.value,
        color: this.color,
        size: this.size
      })
      this.isShowing = false
      this.clearStyle()
    },
    openBoxer()
    {
      this.isShowing = true
    },
    repaint()
    {
      let text = this.$refs.text
      text.style.fontSize = this.size
      text.style.color = this.color
    },

    patternChange(data)
    {
      this.isShowing = false
      this.$emit('pattern', data)
    },
    pageChange(num)
    {
      this.images = this.getImages(num)
    }
  }
}
</script>


