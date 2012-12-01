function setDragDropVisualFeedback(text, cssClass) {
  document.getElementById("new_song").innerHTML = text;
  var cL = document.getElementById("new_song").classList;
  while (cL.length > 0) {
    cL.remove(cL[0]);
  }
  document.getElementById("new_song").classList.add(cssClass);
}

function dragEnter(ev) {
  return true;
}

function dragOver(ev) {
  setDragDropVisualFeedback("Let Go!", "over");
  return false;
}

function dragLeave(ev) {
  setDragDropVisualFeedback("Come back! :-(", "out");
  return false;
}

function dragDrop(ev) {
  setDragDropVisualFeedback("Got it!", "done");
  var src = ev.dataTransfer.files[0];
  go(src);
  ev.preventDefault();
  return false;
}

$(document).ready(function(){
  document.body.addEventListener("dragenter", dragEnter, false );
  document.body.addEventListener("dragover", dragOver, false );
  document.body.addEventListener("dragleave", dragLeave, false );
  document.body.addEventListener("drop", dragDrop, false );
});