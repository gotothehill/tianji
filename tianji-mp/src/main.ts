import { createSSRApp } from "vue";
import App from "./App.vue";
import BaziChart from "./components/BaziChart.vue";
import { getBriefInterpretation } from "./services/interpretationService";
export function createApp() {
  const app = createSSRApp(App);
  // Register globally to keep component in dependency graph for mp-weixin analysis.
  app.component("bazi-chart", BaziChart);
  // Keep interpretationService in the dependency graph for mp-weixin runtime.
  void getBriefInterpretation;
  return {
    app,
  };
}
