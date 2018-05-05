/**
 * Created by paulgerarts on 04/05/2017.
 */
var express = require("express")
var router = express.Router()

var axios = require("axios")
var download = require("download-file")

var queueTodo = []
var done = []
var imageQueue = []
var imageDone = []
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
  if (queueTodo.length === 0 && imageQueue.length === 0) {
    res.json({ status: "done" })
  } else {
    res.json({
      todo: queueTodo.length,
      done: done.length,
      total: queueTodo.length + done.length,
      imageQueue: imageQueue.length,
      imageDone: imageDone.length,
      imageTotal: imageQueue.length + imageDone.length
    })
  }
  next()
})

router.get("/stop", function(req, res, next) {
  if (queueTodo.length > 0) queueTodo = [queueTodo.pop()]
  if (imageQueue.length > 0) imageQueue = [imageQueue.pop()]
  res.json("ok")
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
      .catch(function() {
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
      var index = 1
      for (var i in data.data.alo_images) {
        var im = data.data.alo_images[i]
        var path = ""
        var ext = (im.original || im.large || im.medium || im.small || im.tiny)
          .split(".")
          .pop()
        if (im.is_key_image) {
          path = data.data.obj_barcode + "." + ext
        } else {
          index++
          path = data.data.obj_barcode + "_" + index + "." + ext
        }
        imageQueue.push({
          no: data.data.alo_number || "unlisted",
          barcode: data.data.obj_barcode,
          filename: path,
          source:
            "https://www.vanzadelhoff.nl/portal/" +
            (im.original || im.large || im.medium || im.small || im.tiny)
        })
      }

      // DeQueue
      done.push(queueTodo.pop())

      if (queueTodo.length > 0) {
        step()
      } else {
        queueTodo = []
        done = []
        stepImage()
      }
    })
    .catch(function() {
      step()
    })
}

var stepImage = function() {
  // Peek
  var c = imageQueue[imageQueue.length - 1]

  download(
    c.source,
    {
      directory: "./target/" + c.no + "_" + c.barcode + "/",
      filename: c.filename
    },
    function() {
      // DeQueue
      imageDone.push(imageQueue.pop())

      if (imageQueue.length > 0) {
        stepImage()
      } else {
        imageQueue = []
        imageDone = []
      }
    }
  )
}

module.exports = router
