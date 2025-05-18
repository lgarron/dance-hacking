export function registerFileDragDrop(
  domElement: HTMLElement,
  callback: (file: File) => void,
  textFeedbackElement: HTMLElement
) {
  const css_classes = {
    over: "drag_drop_over",
    out: "drag_drop_out",
    done: "drag_drop_done",
  };

  const feedback_text = {
    over: "Let Go!",
    out: "Come back! :-(",
    done: "Got it!",
  };

  function setDragDropVisualFeedback(type: "over" | "out" | "done") {
      textFeedbackElement.innerHTML = feedback_text[type];

      for (const className of Object.values(css_classes)) {
        domElement.classList.remove(className);
        textFeedbackElement.classList.remove(className);
      }
      domElement.classList.add(css_classes[type]);
      textFeedbackElement.classList.add(css_classes[type]);
  }

  function dragEnter(event: DragEvent) {
    event.preventDefault();
    return true;
  }

  function dragOver(event: DragEvent) {
    event.preventDefault();
    setDragDropVisualFeedback("over");
    return false;
  }

  function dragLeave(event: DragEvent) {
    event.preventDefault();
    setDragDropVisualFeedback("out");
    return false;
  }

  function dragDrop(event: DragEvent) {
    event.stopPropagation(); // Stops some browsers from redirecting.
    event.preventDefault();
    setDragDropVisualFeedback("done");
    const src = event.dataTransfer!.files[0];
    callback(src);
    return false;
  }

  domElement.addEventListener("dragenter", dragEnter, false);
  domElement.addEventListener("dragover", dragOver, false);
  domElement.addEventListener("dragleave", dragLeave, false);
  domElement.addEventListener("drop", dragDrop, false);
}
