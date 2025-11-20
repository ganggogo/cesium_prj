<style lang='scss' scoped>
#loadingContain {
  position: absolute;
  top: 0rem;
  left: 0rem;
  z-index: 999999;
  background: rgba(65,65,65,0.8);
  backdrop-filter: 0.07rem;
  width: 100%;
  height: 100%;
}
.loadingText{font-size:0.18rem;color:rgb(187, 187, 187);margin-top:20rem;position: absolute;bottom: -250%;left: 46%;}
#transition-loader {//animation: textOpacity 0.6s ease-in-out .6s infinite;-webkit-animation: textOpacity 1s ease-in-out .5s infinite;
  bottom: 50%;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
  width: calc(100% - 8rem);
  text-align: center;
  display: none;
  z-index: 1;
}
#transition-loader label {
  padding: 0.08rem;
  opacity: 0;
  display: inline-block;
  border-radius: 50%;
  background-color: rgb(255, 255, 255);
  margin-right: 0.18rem
}
#transition-loader label:first-child {
    -webkit-animation: loader 3s ease-in-out .6s infinite;
    animation: loader 3s ease-in-out .6s infinite;
}
#transition-loader label:nth-child(2) {
    -webkit-animation: loader 3s ease-in-out .5s infinite;
    animation: loader 3s ease-in-out .5s infinite;
}
#transition-loader label:nth-child(3) {
    -webkit-animation: loader 3s ease-in-out .4s infinite;
    animation: loader 3s ease-in-out .4s infinite;
}
#transition-loader label:nth-child(4) {
    -webkit-animation: loader 3s ease-in-out .3s infinite;
    animation: loader 3s ease-in-out .3s infinite;
}
@keyframes loader {
  0% {
      opacity: 0;
      transform: translateX(-3rem) scale(1)
  }

  33% {
      opacity: 1;
      transform: translateX(0) scale(2)
  }

  66% {
      opacity: 1;
      transform: translateX(0) scale(1)
  }

  to {
      opacity: 0;
      transform: translateX(3rem) scale(2)
  }
}
@keyframes textOpacity {
  0% {
      opacity: 0;
      // transform: translateX(-3rem) scale(1)
      transform:scale(1)
  }

  33% {
      opacity: 0.4;
      transform:scale(1.2)
      // transform: translateX(0) scale(2)
  }

  66% {
      opacity: 0.6;
      // transform: translateX(0) scale(1)
      transform:scale(1.4)
  }

  88% {
      opacity: 0.8;
      // transform: translateX(0) scale(1)
      transform:scale(1.2)
  }

  to {
      opacity: 1;
      transform:scale(1)
      // transform: translateX(3rem) scale(2)
  }
}
@-webkit-keyframes loader {
  0% {
      opacity: 0;
      -webkit-transform: translateX(-3rem)
  }

  33% {
      opacity: 1;
      -webkit-transform: translateX(0)
  }

  66% {
      opacity: 1;
      -webkit-transform: translateX(0)
  }

  to {
      opacity: 0;
      -webkit-transform: translateX(3rem)
  }
}
</style>
<template>
  <!-- <div id="loadingContain" :style="{'width':currentWid+'rem','height':currentHei+'rem'}"> -->
  <div id="loadingContain">
    <div data-v-b802d750="" id="transition-loader" style="display: block;">
      <label data-v-b802d750=""></label>
      <label data-v-b802d750=""></label>
      <label data-v-b802d750=""></label>
      <label data-v-b802d750=""></label>
      <div class="loadingText">正 在 处 理 ···</div>
    </div>
  </div>
</template>
<script>
/**
 * 加载页面 xugang 20220926
 */
export default {
  data()
  {
    return {
      currentHei: window.innerHeight / 100,
      currentWid: window.innerWidth / 100
    }
  },
  mounted()
  {
    // window.onresize = () =>
    // {
    //   document.getElementById('loadingContain').style.height = document.getElementById('VUEROOTDOM').clientHeight / 100 + 'rem'
    //   document.getElementById('loadingContain').style.width = document.getElementById('VUEROOTDOM').clientWidth / 100 + 'rem'
    // }
  }
}
</script>
