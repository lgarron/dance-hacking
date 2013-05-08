function registerFileDragDrop(domElement, feedbackElement, callback) {

  var css_classes = {
    "over": "drag_drop_over",
    "out": "drag_drop_out",
    "done": "drag_drop_done"
  };

  var feedback_text = {
    "over": "Let Go!",
    "out": "Come back! :-(",
    "done": "Got it!"
  };

  function setDragDropVisualFeedback(type) {
    feedbackElement.innerHTML = feedback_text[type]
    var cL = feedbackElement.classList;
    for (i in css_classes) {
      cL.remove(css_classes[i]);
    }
    feedbackElement.classList.add(css_classes[type]);
  }

  function dragEnter(event) {
    event.preventDefault();
    return true;
  }

  function dragOver(event) {
    event.preventDefault();
    setDragDropVisualFeedback("over");
    return false;
  }

  function dragLeave(event) {
    event.preventDefault();
    setDragDropVisualFeedback("out");
    return false;
  }

  function dragDrop(event) {
    event.stopPropagation(); // Stops some browsers from redirecting.
    event.preventDefault();
    setDragDropVisualFeedback("done");
    var src = event.dataTransfer.files[0];
    callback(src);
    return false;
  }

  domElement.addEventListener("dragenter", dragEnter, false);
  domElement.addEventListener("dragover", dragOver, false);
  domElement.addEventListener("dragleave", dragLeave, false);
  domElement.addEventListener("drop", dragDrop, false);

}