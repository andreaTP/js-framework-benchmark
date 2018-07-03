const { UiManager } = require("akkajs-dom/page")

new UiManager(
  // require("./Page.js"),
  new Worker("./dist/page.js"),
  // new SharedWorker("./dist/Page.out.js")
  { handlers: require("./Events.js") }
)
