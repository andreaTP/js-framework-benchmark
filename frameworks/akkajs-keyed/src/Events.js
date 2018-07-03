
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

module.exports = {
  click,
  rowClick
}
