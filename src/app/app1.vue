<style lang="scss" scoped>
.sp_box{width: 100%;height: 100%;display: flex;flex-direction: column;}
.top_box,.bottom_box{height: 0.6rem;width: 100%;background: #004583;font-size: 22px;line-height: 60px;}
.center_box{width: 100%;height: calc(100% - 1.2rem);justify-content: center;align-items: center;display: flex;background: #e4bffc;}
.bottom_box{text-align: center;line-height: 0.6rem;font-size: 22px;color: white;}

.center-content-box{width: 600px;height: 500px;border: 1px solid red;font-size: 20px;margin-top: 250px;img{width: 200px;height: 200px;}}
.title-logo{float: left;}.title-right{float: right;}
</style>
<template>
  <div class="sp_box">
    <div class="top_box">
      <div :style="{
          'transformOrigin':'center top',
          'transform':`scale(${rate},${rate})`,
          '-webkit-transform':`scale(${rate},${rate})`,
          '-moz-transform':`scale(${rate},${rate})`,
          '-o-transform':`scale(${rate},${rate})`,
          '-ms-transform':`scale(${rate},${rate})`
        }" class="title-logo">何不言闯</div>
      <div class="title-right" :style="{
          'transformOrigin':'center top',
          'transform':`scale(${rate},${rate})`,
          '-webkit-transform':`scale(${rate},${rate})`,
          '-moz-transform':`scale(${rate},${rate})`,
          '-o-transform':`scale(${rate},${rate})`,
          '-ms-transform':`scale(${rate},${rate})`
        }">管理员账户</div>
    </div>
    <div class="center_box">
      <div class="center-content-box"  :style="{
          'transformOrigin':'center top',
          'transform':`scale(${rate},${rate})`,
          '-webkit-transform':`scale(${rate},${rate})`,
          '-moz-transform':`scale(${rate},${rate})`,
          '-o-transform':`scale(${rate},${rate})`,
          '-ms-transform':`scale(${rate},${rate})`
        }">
        <div>测试用例</div>
        <img src="static/img/datebg.png" alt="">
      </div>
    </div>
    <div class="bottom_box">
      xugang 20230427 适配
    </div>
  </div>
</template>
<script>
/**
 * xugang 20230427 适配
 */
export default {
  data()
  {
    return {
      rate: 1
    }
  },
  mounted()
  {
    this.resize_window()
    window.addEventListener('resize', () =>
    {
      this.resize_window()
    })
  },
  methods:
  {
    resize_window()
    {
      let heightRatio = Number(document.documentElement.clientHeight / 929)
      let widthRatio = Number(document.documentElement.clientWidth / 1920)
      var ratio = document.documentElement.clientWidth / document.documentElement.clientHeight
      if (ratio < 1920 / 929)
        this.rate = widthRatio
      else
        this.rate = heightRatio
    }
  }
}
</script>
