/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2011-08-02
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

export const saveAs = (function (view) {
  "use strict";
  const doc = view.document;
  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
  const get_URL = function () {
    return view.URL || view.webkitURL || view;
  };
  const URL = view.URL || view.webkitURL || view;
  const save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a") as HTMLAnchorElement;
  const can_use_save_link = "download" in save_link;
  const click = function (node) {
    const event = doc.createEvent("MouseEvents");
    event.initMouseEvent(
      "click",
      true,
      false,
      view,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null,
    );
    return node.dispatchEvent(event); // false if event was cancelled
  };
  const webkit_req_fs: typeof globalThis.requestFileSystem = (view as any)
    .webkitRequestFileSystem;
  const req_fs =
    (view as any).requestFileSystem ||
    webkit_req_fs ||
    (view as any).mozRequestFileSystem;
  const throw_outside = function (ex) {
    ((view as any).setImmediate || view.setTimeout)(function () {
      throw ex;
    }, 0);
  };
  const force_saveable_type = "application/octet-stream";
  let fs_min_size = 0;
  const deletion_queue: (string | {remove: () => void})[] = [];
  const process_deletion_queue = function () {
    let i = deletion_queue.length;
    while (i--) {
      const file = deletion_queue[i];
      if (typeof file === "string") {
        // file is an object URL
        URL.revokeObjectURL(file);
      } else {
        // file is a File
        file.remove();
      }
    }
    deletion_queue.length = 0; // clear queue
  };
  const dispatch = function (filesaver, event_types, event?: any) {
    event_types = [].concat(event_types);
    let i = event_types.length;
    while (i--) {
      const listener = filesaver[`on${event_types[i]}`];
      if (typeof listener === "function") {
        try {
          listener.call(filesaver, event || filesaver);
        } catch (ex) {
          throw_outside(ex);
        }
      }
    }
  };
  const FileSaver = function (blob, name) {
    // First try a.download, then web filesystem, then object URLs
    const filesaver = this;
    const type = blob.type;
    let blob_changed = false;
    let object_url;
    let target_view;
    const get_object_url = function (blob) {
      const object_url = get_URL().createObjectURL(blob);
      deletion_queue.push(object_url);
      return object_url;
    };
    const dispatch_all = function () {
      dispatch(filesaver, "writestart progress write writeend".split(" "));
    };
    // on any filesys errors revert to saving with object URLs
    const fs_error = function () {
      // don't create more object URLs than needed
      if (blob_changed || !object_url) {
        object_url = get_object_url(blob);
      }
      target_view.location.href = object_url;
      filesaver.readyState = filesaver.DONE;
      dispatch_all();
    };
    const abortable = function (func) {
      return function () {
        if (filesaver.readyState !== filesaver.DONE) {
          // rome-ignore lint/style/noArguments: <explanation>
          return func.apply(this, arguments);
        }
      };
    };
    const create_if_not_found = { create: true, exclusive: false };
    let slice;
    filesaver.readyState = filesaver.INIT;
    if (!name) {
      name = "download";
    }
    if (can_use_save_link) {
      object_url = get_object_url(blob);
      save_link.href = object_url;
      save_link.download = name;
      if (click(save_link)) {
        filesaver.readyState = filesaver.DONE;
        dispatch_all();
        return;
      }
    }
    // Object and web filesystem URLs have a problem saving in Google Chrome when
    // viewed in a tab, so I force save with application/octet-stream
    // http://code.google.com/p/chromium/issues/detail?id=91158
    if ((view as any).chrome && type && type !== force_saveable_type) {
      slice = blob.slice || blob.webkitSlice;
      blob = slice.call(blob, 0, blob.size, force_saveable_type);
      blob_changed = true;
    }
    // Since I can't be sure that the guessed media type will trigger a download
    // in WebKit, I append .download to the filename.
    // https://bugs.webkit.org/show_bug.cgi?id=65440
    if (webkit_req_fs && name !== "download") {
      name += ".download";
    }
    if (type === force_saveable_type || webkit_req_fs) {
      target_view = view;
    } else {
      target_view = view.open();
    }
    if (!req_fs) {
      fs_error();
      return;
    }
    fs_min_size += blob.size;
    req_fs(
      (view as any).TEMPORARY,
      fs_min_size,
      abortable(function (fs) {
        fs.root.getDirectory(
          "saved",
          create_if_not_found,
          abortable(function (dir) {
            const save = function () {
              dir.getFile(
                name,
                create_if_not_found,
                abortable(function (file) {
                  file.createWriter(
                    abortable(function (writer) {
                      writer.onwriteend = function (event) {
                        target_view.location.href = file.toURL();
                        deletion_queue.push(file);
                        filesaver.readyState = filesaver.DONE;
                        dispatch(filesaver, "writeend", event);
                      };
                      writer.onerror = function () {
                        const error = writer.error;
                        if (error.code !== error.ABORT_ERR) {
                          fs_error();
                        }
                      };
                      "writestart progress write abort"
                        .split(" ")
                        .forEach(function (event) {
                          writer[`on${event}`] = filesaver[`on${event}`];
                        });
                      writer.write(blob);
                      filesaver.abort = function () {
                        writer.abort();
                        filesaver.readyState = filesaver.DONE;
                      };
                      filesaver.readyState = filesaver.WRITING;
                    }),
                    fs_error,
                  );
                }),
                fs_error,
              );
            };
            dir.getFile(
              name,
              { create: false },
              abortable(function (file) {
                // delete file if it already exists
                file.remove();
                save();
              }),
              abortable(function (ex) {
                if (ex.code === ex.NOT_FOUND_ERR) {
                  save();
                } else {
                  fs_error();
                }
              }),
            );
          }),
          fs_error,
        );
      }),
      fs_error,
    );
  };
  const FS_proto = FileSaver.prototype;
  const saveAs = function (blob, name) {
    return new FileSaver(blob, name);
  };
  FS_proto.abort = function () {
    const filesaver = this;
    filesaver.readyState = filesaver.DONE;
    dispatch(filesaver, "abort");
  };
  FS_proto.readyState = FS_proto.INIT = 0;
  FS_proto.WRITING = 1;
  FS_proto.DONE = 2;

  FS_proto.error =
    FS_proto.onwritestart =
    FS_proto.onprogress =
    FS_proto.onwrite =
    FS_proto.onabort =
    FS_proto.onerror =
    FS_proto.onwriteend =
      null;

  view.addEventListener("unload", process_deletion_queue, false);
  return saveAs;
})(self);
