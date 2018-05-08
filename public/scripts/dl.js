$(document).ready(function() {
  setTimeout(function() {
    $("#stat_text").text("Idle")
    stat()
  }, 500)

  $("#dl_all").click(download("all"))
  $("#dl_alo").click(download("alo"))
  $("#dl_sec").click(download("sec"))
  $("#dl_sec_single_get").click(download("sec", true))
  $("#dl_stop").click(stop)
})

function download(type, single) {
  return function() {
    var url = window.location.href.split("/")
    var auc = url[url.length - 1]
    var state = false
    switch (type) {
      case "all":
      case "alo":
        $.get("/download/" + auc + "/" + type).done(function() {
          stat()
        })
        break
      case "sec":
        var values = {}
        if (single) {
          values = {
            low: $("#dl_sec_single").val(),
            high: $("#dl_sec_single").val()
          }
        } else {
          values = {
            low: $("#dl_sec_low").val(),
            high: $("#dl_sec_high").val()
          }
        }
        $.post("/download/" + auc + "/" + type, values).done(function() {
          setTimeout(stat, 2000)
          stat()
        })
        break
      default:
    }
  }
}

function stop() {
  $.get("/download/stop")
}

// todo: queueTodo.length,
// done: done.length,
// total: queueTodo.length + done.length,
// imageQueue: imageQueue.length,
// imageDone: imageDone.length,
// imageTotal:
function stat() {
  setTimeout(function() {
    $.get("/download/stat").done(function(data) {
      if (data.status && data.status === "done") {
        $("#progress").css("width", "100%")
        $("#stat_text").text("Done")
      } else if (data.todo > 0) {
        $("#progress").css("width", data.done / data.total * 100 + "%")
        $("#progress").css("background-color", "orangered")
        $("#stat_text").text(
          "Fetching article info " +
            data.done +
            " of " +
            data.total +
            " (" +
            data.imageQueue +
            " images found)"
        )
        stat()
      } else {
        $("#progress").css(
          "width",
          data.imageDone / data.imageTotal * 100 + "%"
        )
        $("#progress").css("background-color", "limegreen")
        $("#stat_text").text(
          "Fetching images (" + data.imageDone + " of " + data.imageTotal + ")"
        )
        stat()
      }
    })
  }, 500)
}
