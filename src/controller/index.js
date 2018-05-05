/**
 * Created by paulgerarts on 04/05/2017.
 */
var express = require("express")
var router = express.Router()
var axios = require("axios")

router.use("/application", require("./application"))
router.use("/download", require("./download"))
// router.use('/path', require('./folder'));

router.get("/", function(req, res, next) {
  axios.get("https://api.vanzadelhoff.nl/v1/auctions").then(function(data) {
    res.render("auctions", { data: data.data })
    next()
  })
})

router.get("/auction/:id", function(req, res, next) {
  axios
    .get(
      "https://api.vanzadelhoff.nl/cache/lots-" +
        req.params.id +
        "-nl_NL.json.gz"
    )
    .then(function(data) {
      var max = 0
      var min = 9999999
      var numbered = 0
      for (var i in data.data) {
        if (data.data[i].alo_number && !isNaN(data.data[i].alo_number)) {
          numbered++
          var number = parseInt(data.data[i].alo_number)
          if (number > max) {
            max = number
          }
          if (number < min) {
            min = number
          }
        }
      }
      res.render("auction", {
        data: data.data,
        min: min,
        max: max,
        numbered: numbered
      })
      next()
    })
})

module.exports = router
