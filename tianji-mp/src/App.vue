<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { preloadCities } from "@/services/cityService";
onLaunch(() => {
  console.log("App Launch");
  preloadCities().catch(() => {});
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
/* 全局盒模型 & 宽度守护，防止 padding 造成溢出 */
page {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

view,
text,
scroll-view,
swiper,
swiper-item,
cover-view,
input,
textarea,
button,
image,
navigator {
  box-sizing: border-box;
  max-width: 100%;
}
</style>
