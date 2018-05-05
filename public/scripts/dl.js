$(document).ready(function() {
  setTimeout(function() {
    $("#stat_text").text("Idle")
  }, 500)

  $("#dl_all").click(download("all"))
  $("#dl_alo").click(download("alo"))
  $("#dl_sec").click(download("sec"))
})

function download(type) {
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
        $.post("/download/" + auc + "/" + type, {
          low: $("#dl_sec_low").val(),
          high: $("#dl_sec_high").val()
        }).done(function() {
          setTimeout(stat, 2000)
          stat()
        })
        break
      default:
    }
  }
}

function stat() {
  setTimeout(function() {
    $.get("/download/stat").done(function(data) {
      if (data.status && data.status === "done") {
        $("#progress").css("width", "100%")
        $("#stat_text").text("Done")
      } else {
        $("#progress").css("width", data.done / data.total * 100 + "%")
        $("#stat_text").text(
          "Downloading (" + data.done + " of " + data.total + ")"
        )
        stat()
      }
    })
  }, 500)
}
