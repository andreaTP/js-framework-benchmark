
const click = function (event) {
  event.preventDefault()
  return "click"
}

const rowClick = function (event) {
  event.preventDefault()
  return {
    click: event.target.id,
    event: event.target.name
  }
}

const tableClick = function (event) {
  event.preventDefault()
  console.log("emitting event: ", event)
  return {
    click: event.target.id,
    event: event.target.name
  }
}

module.exports = {
  click,
  rowClick,
  tableClick
}
