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
  }
  postMount () {
    const table = this.spawn(new Table())
    
    this.spawn(new Button("run", "Create 1,000 rows", {create: 1000}, table.path()))
    this.spawn(new Button("runlots", "Create 10,000 rows", {create: 10000}, table.path()))
    this.spawn(new Button("add", "Append 1,000 rows", {add: 1000}, table.path()))
    this.spawn(new Button("update", "Update every 10th row", {update: true}, table.path()))
    this.spawn(new Button("clear", "Clear", {clear: true}, table.path()))
    this.spawn(new Button("swaprows", "Swap Rows", {swap: true}, table.path()))
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
}

class Button extends DomActor {
  constructor (hook, text, msg, tableRef) {
    super(hook)
    this.text = text
    this.msg = msg
    this.tableRef = tableRef
  }
  render () {
    return <button type="button" className="btn btn-primary btn-block">{this.text}</button>
  }
  events () {
    return { "click": events.click }
  }
  receive () {
    system.select(this.tableRef).tell(this.msg)
  }
}

class Table extends DomActor {
  constructor () {
    super("table")
    this.name = "table"
    this.offset = 1
    this.create = 0
    this.rows = []
  }
  render () {
    return <tbody></tbody>
  }
  receive (msg) {
    const startTime = performance.now()
    if (msg !== undefined) {
      if (msg.create !== undefined) {
        const children = this.children()
        for (let i in children) {
          children[i].kill()
        }
        this.rows = []
        for (let i = this.offset; i < (this.offset + msg.create); i++) {
          this.rows.push(this.spawn(new Row(i.toString())))
        }
        this.offset += msg.create
      } else if (msg.add !== undefined) {
        for (let i = this.offset; i < (this.offset + msg.add); i++) {
          this.rows.push(this.spawn(new Row(i.toString())))
        }
        this.offset += msg.add
      } else if (msg.update !== undefined) {
        const children = this.rows
        for (let i = 0; i < children.length; i += 10) {
          children[i].tell({update: true})
        }
      } else if (msg.swap !== undefined) {
        if (this.rows.length >= 998) {
          this.rows[1].tell({swapWith: this.rows[998]})
          const tmp = this.rows[1]
          this.rows[1] = this.rows[998]
          this.rows[998] = tmp
        }
      } else if (msg.clear !== undefined) {
        this.rows = []
        throw 'clean'
      } else if (msg.selected !== undefined) {
        try {
          this.selected.tell({unselect: true})
        } catch (e) { }
        this.selected = this.sender()
      } else if (msg.remove !== undefined) {
        for (let i in this.rows) {
          if (this.rows[i].path() === this.sender().path()) {
            this.rows.splice(i, 1)
          }
        }
      }
    }
    const stop = performance.now()
    log.info("took " + (stop - startTime))
  }
}

class Row extends DomActor {
  constructor (index) {
    super()
    this.name = index
    this.index = index
    this.selected = false
    this.label = buildLabel()
  }
  render () {
    return <tr className={this.selected ? 'danger' : ''}>
      {[<td className="col-md-1">{this.index}</td>,
        <td className="col-md-4">
          <a id={this.index} name="select">{this.label}</a>
        </td>,
        <td className="col-md-1">
          <a>
            <span id={this.index} name="remove" className="glyphicon glyphicon-remove" aria-hidden="true"></span>
          </a>
        </td>,
        <td className="col-md-6"></td>]}  
    </tr>
  }
  events () {
    return { "click": events.rowClick }
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.event !== undefined && msg.event == "select") {
        this.selected = true
        this.parent().tell({selected: this.index})
        this.update()
      } else if (msg.unselect !== undefined) {
        this.selected = false
        this.update()
      } else if (msg.event !== undefined && msg.event == "remove") {
        this.parent().tell({remove: this.index})
        this.self().kill()
      } else if (msg.update !== undefined) {
        this.label = this.label + ' !!!'
        this.update()
      } else if (msg.swapWith !== undefined) {
        msg.swapWith.tell({
          swapText: this.label,
          index: this.index,
          selected: this.selected,
          swapUpdate: this.self()
        })
        this.label = ""
      } else if (msg.swapText !== undefined) {
        if (msg.swapUpdate !== undefined) {
          msg.swapUpdate.tell({
            swapText: this.label,
            index: this.index,
            selected: this.selected
          })
        }
        this.index = msg.index
        this.selected = msg.selected
        this.label = msg.swapText
        this.update()
      }
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
