/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { Logger, LogLevel, DomActor, localPort } = require("akkajs-dom/work")

const events = require("./Events.js")

const system = ActorSystem.create()

const log = new Logger(system, LogLevel.debug)

class Page extends DomActor {
  constructor () {
    super("root")
    this.offset = 1
  }
  postMount () {
    this.table = this.spawn(new Table(this.offset))
    
    this.spawn(new Button("run", "Create 1,000 rows", {create: 1000}))
    this.spawn(new Button("runlots", "Create 10,000 rows", {create: 10000}))
    this.spawn(new Button("add", "Append 1,000 rows", {add: 1000}))
    this.spawn(new Button("update", "Update every 10th row", {update: true}))
    this.spawn(new Button("clear", "Clear", {clear: true}))
    this.spawn(new Button("swaprows", "Swap Rows", {swap: true}))
  }
  render () {
    return <div className="container">
      {[<div className="jumbotron">
          {[<div className="row">
            {[<div className="col-md-6">
                  <h1>AkkaJS keyed</h1>
              </div>,
              <div className="col-md-6">
                  {[<div className="row">
                    {[<div id="run" className="col-sm-6 smallpad">
                      </div>,
                      <div id="runlots" className="col-sm-6 smallpad">
                      </div>,
                      <div id="add" className="col-sm-6 smallpad">
                      </div>,
                      <div id="update" className="col-sm-6 smallpad">
                      </div>,
                      <div id="clear" className="col-sm-6 smallpad">
                      </div>,
                      <div id="swaprows" className="col-sm-6 smallpad">
                      </div>]}
                  </div>]}
              </div>]}
          </div>]}
      </div>,
      <table id="table" className="table table-hover table-striped test-data">
      </table>,
      <span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>]}
  </div>
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.offset != undefined) {
        this.offset = msg.offset
      } else if (msg.clear) {
        this.table.kill()
        this.table = this.spawn(new Table(this.offset))
      } else {
        this.table.tell(msg)
      }
    }
  }
}

class Button extends DomActor {
  constructor (hook, text, msg) {
    super(hook)
    this.text = text
    this.msg = msg
  }
  render () {
    return <button type="button" className="btn btn-primary btn-block">{this.text}</button>
  }
  events () {
    return { "click": events.click }
  }
  receive () {
    this.parent().tell(this.msg)
  }
}

class Table extends DomActor {
  constructor (offset) {
    super("table")
    this.offset = offset
    this.rows = []
    this.selected = -1
  }
  render () {
    return <tbody>
      {
        this.rows.map((row, pos) => {
          return <tr className={row.selected ? 'danger' : ''}>
            {[<td className="col-md-1">{row.index}</td>,
              <td className="col-md-4">
                <a id={pos} name="select">{row.label}</a>
              </td>,
              <td className="col-md-1">
                <a>
                  <span id={pos} name="remove" className="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </a>
              </td>,
              <td className="col-md-6"></td>]}
          </tr>
        })
      }
    </tbody>
  }
  events () {
    return { "click": events.tableClick }
  }
  receive (msg) {
    if (msg !== undefined) {
      const startTime = performance.now()
      if (msg.create !== undefined) {
        this.rows = []
        for (let i = this.offset; i < (this.offset + msg.create); i++) {
          this.rows.push({
            index: i,
            selected: false,
            label: buildLabel()
          })
        }
        this.offset += msg.create
        this.parent().tell({offset: this.offset})
      } else if (msg.add !== undefined) {
        for (let i = this.offset; i < (this.offset + msg.add); i++) {
          this.rows.push({
            index: i,
            selected: false,
            label: buildLabel()
          })
        }
        this.offset += msg.add
        this.parent().tell({offset: this.offset})
      } else if (msg.update !== undefined) {
        for (let i = 0; i < this.rows.length; i += 10) {
          this.rows[i].label += ' !!!'
        }
      } else if (msg.swap !== undefined) {
        if (this.rows.length >= 998) {
          const tmp = this.rows[1]
          this.rows[1] = this.rows[998]
          this.rows[998] = tmp
        }
      } else if (msg.event !== undefined) {
        if (msg.event === "select") {
          try {
            this.rows[this.selected].selected = false
          } catch (e) { }
          this.rows[msg.click].selected = true
          this.selected = msg.click
        } else if (msg.event === "remove") {
          this.rows.splice(msg.click, 1)
        }
      }
      this.update()
      const stop = performance.now()
      log.info("took " + (stop - startTime))
    }
  }
}

/* utilities */
const _random = function (max) {
  return Math.round(Math.random() * 1000) % max;
}

const buildLabel = function () {
  var adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
  var colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
  var nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
  return adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)]
}

const actor = system.spawn(new Page())

module.exports = {
  localPort
}
