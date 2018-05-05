/**
 * Created by paulgerarts on 04/05/2017.
 */
var express = require("express")
var router = express.Router()

var axios = require("axios")
var download = require("download-file")

var queueTodo = []
var done = []
var savedImages = 0

router.get("/:auction/:type", function(req, res, next) {
  var dlo = { a: req.params.auction, t: req.params.type }
  dl(dlo, function(status) {
    res.json(status)
    next()
  })
})

router.post("/:id/:type", function(req, res, next) {
  var dlo = {
    a: req.params.id,
    t: req.params.type,
    f: {
      low: req.body.low,
      high: req.body.high
    }
  }
  dl(dlo, function(status) {
    res.json(status)
    next()
  })
})

router.get("/stat", function(req, res, next) {
  if (queueTodo.length === 0) {
    res.json({ status: "done" })
  } else {
    res.json({
      todo: queueTodo.length,
      done: done.length,
      total: queueTodo.length + done.length
    })
  }
  next()
})

var dl = function(dlo, cb) {
  if (queueTodo.length > 0) {
    cb({ status: "busy" })
  } else {
    axios
      .get("https://api.vanzadelhoff.nl/cache/lots-" + dlo.a + "-nl_NL.json.gz")
      .then(function(data) {
        var set = data.data

        // Filter non-alo
        if (dlo.t === "alo" || dlo.t === "sec") {
          var nwset = []
          for (var i in set) {
            if (set[i].alo_number && !isNaN(set[i].alo_number)) {
              nwset.push(set[i])
            }
          }
          set = nwset
        }

        // Filter if sec
        if (dlo.t === "sec" && !isNaN(dlo.f.low) && !isNaN(dlo.f.high)) {
          nwset = []
          for (var j in set) {
            var no = parseInt(set[j].alo_number)
            if (no >= parseInt(dlo.f.low) && no <= parseInt(dlo.f.high)) {
              nwset.push(set[j])
            }
          }
          set = nwset
        }

        queueTodo = set

        cb({ status: "ok", amount: set.length })
        setTimeout(step, 50)
      })
      .catch(function(e) {
        cb({ status: "fail" })
      })
  }
}

var step = function() {
  // Peek
  var c = queueTodo[queueTodo.length - 1]

  axios
    .get(
      "http://api.vanzadelhoff.nl/v1/auction/" +
        c.alo_auc_id +
        "/lot/" +
        c.alo_id
    )
    .then(function(data) {
      // Save images
      var d = data.data
      dlWrapper(d.alo_number || "cat", d.obj_barcode, d.alo_images, function() {
        // Step through
        done.push(queueTodo.pop())
        if (queueTodo.length === 0) {
          queueTodo = []
          done = []
        } else {
          step()
        }
      })
    })
}

var dlWrapper = function(no, bc, array, callback) {
  if (array.length === 0) {
    callback()
  } else {
    savedImages++
    var dlNext = array.pop()
    var path =
      dlNext.original ||
      dlNext.large ||
      dlNext.medium ||
      dlNext.small ||
      dlNext.tiny
    var ext = path.split(".").pop()
    var filename = bc + "." + ext
    if (path.split("_").length > 1) {
      var imgno = path
        .split("_")
        .pop()
        .split(".")
      filename = bc + "_" + imgno[0] + "." + ext
    }
    download(
      "https://www.vanzadelhoff.nl/portal/" + path,
      {
        directory: "./target/" + no + "_" + bc + "/",
        filename: filename
      },
      function() {
        dlWrapper(no, bc, array, callback)
      }
    )
  }
}

module.exports = router
