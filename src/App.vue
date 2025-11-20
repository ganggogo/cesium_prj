<template>
  <div id='VUEROOTDOM'>
    <MainContent></MainContent>
    <LoadingPage v-if="ifLoading"></LoadingPage>
  </div>
</template>

<script>
import MainContent from './app/MainContent.vue'
import LoadingPage from '@/utils/vue/LoadingPage.vue'
import { mapState } from "vuex"
export default {
  name: 'App',
  components: {
    MainContent, LoadingPage
  },
  data()
  {
    return {
    }
  },
  computed: {
    ...mapState(['ifLoading'])
  },
  mounted()
  {
  }
}
</script>

<style>
html, body{
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}
#app{
  width: 100%;
  height: 100%;
}
#VUEROOTDOM{position: relative;width: 100%;height: 100%;}
</style>
