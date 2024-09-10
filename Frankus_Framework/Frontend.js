// =============================================================================
// Frankus JavaScript Library (Frontend)
// Programmed by Francois Lamini
// =============================================================================

const NO_VALUE_FOUND = -1;
const CELL_W = 16;
const CELL_H =  32;
const SCREEN_W = 960;
const SCREEN_H = 640;
const MOBILE_W = 360;
const MOBILE_H = 640;
const MOUSE_LEFT = 0;
const MOUSE_WHEEL = 1;
const MOUSE_RIGHT = 2;

// *****************************************************************************
// Global Variables
// *****************************************************************************

let code = "";
let http = location.href.split(/:/).shift() + "://";
let frankus_layout = null;

// *****************************************************************************
// File Implementation
// *****************************************************************************

class cFile {

  /**
   * Creates a file module.
   * @param name The name of the file.
   */
  constructor(name) {
    this.file = name;
    this.lines = [];
    this.data = "";
    this.message = "";
    this.error = "";
    this.on_read = null;
    this.on_write = null;
    this.on_not_found = null;
    this.on_denied = null;
    this.pointer = 0;
  }

  /**
   * Reads the contents of the file.
   */
  Read() {
    let ajax = new XMLHttpRequest();
    let component = this;
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          component.data = ajax.responseText;
          component.lines = Split(component.data);
          if (component.on_read) {
            component.on_read();
          }
        }
        else if (ajax.status == 404) { // Not found.
          component.error = ajax.responseText;
          if (component.on_not_found) {
            component.on_not_found();
          }
        }
        else if (ajax.status == 401) { // Access denied.
          component.error = ajax.responseText;
          if (component.on_denied) {
            component.on_denied();
          }
        }
      }
    };
    ajax.open("GET", this.file + "?code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }

  /**
   * Writes the contents of a file.
   */
  Write() {
    let ajax = new XMLHttpRequest();
    let component = this;
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          component.message = ajax.responseText;
          if (component.on_write) {
            component.on_write();
          }
        }
        else if (ajax.status == 404) { // Not found.
          component.error = ajax.responseText;
          if (component.on_not_found) {
            component.on_not_found();
          }
        }
        else if (ajax.status == 401) { // Access denied.
          component.error = ajax.responseText;
          if (component.on_denied) {
            component.on_denied();
          }
        }
      }
    };
    // Collapse lines into data.
    if (this.lines.length > 0) {
      this.data = this.lines.join("\n");
    }
    ajax.open("POST", this.file, true);
    ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax.send("data=" + encodeURIComponent(this.data) + "&code=" + encodeURIComponent(code));
  }

  /**
   * Adds a line to the file.
   * @param line The line to add.
   */
  Add(line) {
    this.lines.push(line);
  }

  /**
   * Adds an object to the file.
   * @param object The object to add to the file.
   */
  Add_Object(object) {
    this.Add("object");
    for (let field in object) {
      let value = object[field];
      if (value instanceof Array) {
        this.Add(field + "=" + value.join(","));
      }
      else {
        this.Add(field + "=" + value);
      }
    }
    this.Add("end");
  }

  /**
   * Adds a bunch of lines to the file.
   * @param lines The list of lines to add.
   */
  Add_Lines(lines) {
    this.lines = this.lines.concat(lines);
  }

  /**
   * Removes a line at a specified index.
   * @param index The index of the line to remove.
   * @throws An error if the index is not valid.
   */
  Remove(index) {
    Check_Condition(((index >= 0) && (index < this.lines.length)), "Cannot remove line that does not exist.");
    this.lines.splice(index, 1);
  }

  /**
   * Gets the number of lines in the file.
   * @return The number of lines in the file.
   */
  Count() {
    return this.lines.length;
  }

  /**
   * Gets the string at the index.
   * @param index The index of the string.
   * @return The string at the index.
   * @throws An error if the string is not present.
   */
  Get_Line_At(index) {
    Check_Condition(((index >= 0) && (index < this.lines.length)), "Cannot remove line that does not exist.");
    return this.lines[index];
  }
  
  /**
   * Gets a line from the file sequentially.
   * @return The read line.
   * @throws An error if no more lines can be read.
   */
  Get_Line() {
    Check_Condition(this.Has_More_Lines(), "No more lines to read.");
    return this.lines[this.pointer++];
  }

  /**
   * Reads a numeric value from an index.
   * @return The number read.
   * @throws An error if the number could not be read.
   */
  Get_Number() {
    Check_Condition(this.Has_More_Lines(), "No more lines to read.");
    return parseInt(this.lines[this.pointer++]);
  }

  /**
   * Reads an object from the file.
   * @param object The object to read in.
   * @throws An error if the object could not be read.
   */
  Get_Object(object) {
    Check_Condition(this.Has_More_Lines(), "No more lines to read.");
    let line = this.lines[this.pointer++];
    if (line != "object") {
      throw new Error("Object identifier missing.");
    }
    while (line != "end") {
      Check_Condition(this.Has_More_Lines(), "No more lines to read.");
      line = this.lines[this.pointer++];
      let pair = line.split("=");
      if (pair.length == 2) {
        let name = pair[0];
        let value = pair[1];
        if (!isNaN(value)) {
          object[name] = parseInt(value);
        }
        else {
          object[name] = value;
        }
      }
    }
  }

  /**
   * Clears out the file's lines.
   */
  Clear() {
    this.lines = [];
    this.pointer = 0;
  }
  
  /**
   * Determines if a file has more lines.
   * @return True if there are more lines, false otherwise.
   */
  Has_More_Lines() {
    return (this.pointer < this.lines.length);
  }

  /**
   * Gets the extension of the given file.
   * @param file The file path.
   * @return The file extension without the dot.
   */
  static Get_Extension(file) {
    return file.split("/").pop().replace(/^\w+\./, "");
  }

  /**
   * Gets the name of a file.
   * @param file The file to get the name of.
   * @return The name of the file.
   */
  static Get_File_Name(file) {
    return file.split("/").pop();
  }

  /**
   * Gets the title of the file.
   * @param file The file to get the title of.
   * @return The title of the file.
   */
  static Get_File_Title(file) {
    return cFile.Get_File_Name(file).replace(/\.\w+$/, "");
  }

  /**
   * Determines if a file is a folder.
   * @param file The name of the file.
   */
  static Is_Folder(file) {
    return !file.match(/\w+\.\w+$/);
  }

  /**
   * Escapes a folder path to platform independent path separators.
   * @param folder The folder path.
   * @return The path that is platform independent.
   */
  static Escape_Path(folder) {
    return folder.replace(/(\/|\\|:)/g, "/");
  }

  /**
   * Creates a new folder.
   * @param folder The folder to create.
   * @param on_create Called when the folder is created.
   */
  static Create_Folder(folder, on_create) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          on_create();
        }
      }
    };
    ajax.open("GET", "create-folder?folder=" + encodeURIComponent(folder) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }

  /**
   * Queries a set of files from the server.
   * @param search The search string.
   * @param folder The folder to search for the files.
   * @param on_query Called with the file list passed in.
   */
  static Query_Files(search, folder, on_query) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          let file_list = Split(ajax.responseText);
          on_query(file_list);
        }
      }
    };
    ajax.open("GET", "query-files?folder=" + encodeURIComponent(folder) + "&search=" + encodeURIComponent(search) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }
  
  /**
   * Downloads a file.
   * @param name The name of the file.
   * @param data The file data. (text)
   */
  static Download(name, data) {
    let file = new Blob([ data ], {
      type: "text/plain"
    });
    // Create download clicker.
    let clicker = document.createElement("a");
    clicker.download = name;
    clicker.href = window.URL.createObjectURL(file);
    clicker.style.display = "none";
    clicker.click();
  }

}

// *****************************************************************************
// Shell Implementation
// *****************************************************************************

class cShell {

  /**
   * Fires a new Coder Doc generator.
   * @param project The project to generate documentation for.
   */
  static Coder_Doc(project, on_generate) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          console.log(ajax.responseText);
          on_generate();
        }
      }
    };
    ajax.open("GET", "coder-doc?project=" + encodeURIComponent(project) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }

  /**
   * Executes a command.
   * @param command The command to execute.
   * @param on_close Called when the command is closed with output.
   */
  static Execute_Command(command, on_close) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          let log = ajax.responseText;
          on_close(log);
        }
        else if (ajax.status == 404) {
          on_close(ajax.responseText);
        }
      }
    };
    ajax.open("GET", "terminal?command=" + encodeURIComponent(command) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }

}

// *****************************************************************************
// Config Implementation
// *****************************************************************************

class cConfig {

  /**
   * Creates a new config module.
   * @param name The name of the config file.
   * @param on_load Called when the config file is loaded.
   */
  constructor(name, on_load) {
    this.config = {};
    this.properties = [];
    let component = this;
    let file = new cFile("Config/" + name + ".txt");
    file.Read();
    file.on_read = function() {
      let line_count = file.lines.length;
      for (let line_index = 0; line_index < line_count; line_index++) {
        let line = file.lines[line_index];
        let pair = line.split("=");
        if (pair.length == 2) {
          let name = pair[0];
          let value = pair[1];
          if (!isNaN(pair[1])) {
            value = parseInt(pair[1]);
          }
          component.config[name] = value;
          component.properties.push(name);
        }
      }
      on_load();
    };
  }

  /**
   * Gets a numeric property value.
   * @param name The name of the property.
   * @return The value of the property.
   * @throws An error if the property does not exist.
   */
  Get_Property(name) {
    if (this.config[name] == undefined) {
      throw new Error("Property value " + name + " does not exist.");
    }
    return this.config[name];
  }

}

// *****************************************************************************
// Browser Implementation
// *****************************************************************************

class cBrowser {
 
  /**
   * Create a new browser object.
   */
  constructor() {
    this.name = "";
    this.ip = "";
    this.port = "";
  }

  /**
   * Detects the type of browser that is running the system.
   * @param on_success Called if the browser is successfull detected.
   * @param on_error Called if there was a problem detecting the browser. A parameter containing the error is passed in.
   */
  Detect(on_success, on_error) {
    let old_browser = false;
    let unknown_browser = false;
    let unsupported_browser = false;
    if (navigator.userAgent.match(/Android/)) { // Android
      this.name = "android";
      this.ip = location.hostname;
      this.port = location.port;
    }
    else if (navigator.userAgent.match(/Chrome\/\d+/)) { // Chrome
      let parts = navigator.userAgent.split(/\s+/);
      // Find pair.
      let part_count = parts.length;
      for (let part_index = 0; part_index < part_count; part_index++) {
        let part = parts[part_index];
        if (part.match(/Chrome/)) {
          let pair = part.split(/\//);
          let version = parseInt(pair[1]);
          if (version < 50) { // Older than 2016?
            old_browser = true;
          }
          break;
        }
      }
      this.name = "chrome";
      this.ip = location.hostname;
      this.port = location.port;
    }
    else if (navigator.userAgent.match(/Firefox\/\d+/)) { // Firefox
      let parts = navigator.userAgent.split(/\s+/);
      // Find pair.
      let part_count = parts.length;
      for (let part_index = 0; part_index < part_count; part_index++) {
        let part = parts[part_index];
        if (part.match(/Firefox/)) {
          let pair = part.split(/\//);
          let version = parseInt(pair[1]);
          if (version < 50) { // Older than 2016?
            old_browser = true;
          }
          break;
        }
      }
      this.name = "firefox";
      this.ip = location.hostname;
      this.port = location.port;
    }
    else { // Unknown browser.
      unknown_browser = true;
    }
    if (unknown_browser) {
      window.addEventListener("load", function() {
        on_error("browser-unknown");
      }, false);
    }
    else if (old_browser) {
      window.addEventListener("load", function() {
        on_error("browser-old");
      }, false);
    }
    else if (unsupported_browser) {
      window.addEventListener("load", function() {
        on_error("unsupported-browser");
      }, false);
    }
    else {
      // Wait for window to load first.
      window.addEventListener("load", function() {
        on_success();
      }, false);
    }
  }
  
}

// **************************************************************************
// Frankus Picture
// **************************************************************************

/**
 * This is a reader for Frankus pictures. It also has the ability to read PNG
 * and JPEG files which cannot be converted to Frankus pictures.
 */
class cImage {

  MAX_COLORS = 94;

  /**
   * Creates a new Frankus Picture reader.
   */
  constructor() {
    this.width = 0;
    this.height = 0;
    this.palette = new Array(this.MAX_COLORS).fill(null);
    this.scanlines = [];
    this.layers = [];
    this.image = null;
    this.type = "";
    this.error = "";
    this.on_load = null;
    this.on_error = null;
    this.on_not_found = null;
    this.on_unknown_type = null;
    this.image_props = [
      "x",
      "y",
      "width",
      "height",
      "zoom"
    ];
    this.layer_props = [
      "name",
      "x",
      "y",
      "width",
      "height",
      "angle",
      "scale"
    ];
  }

  /**
   * Loads a Frankus picture by name.
   * @param name The name of the Frankus picture to load.
   */
  Load(name) {
    if (name == undefined) {
      if (this.on_error) {
        this.on_error();
      }
    }
    else {
      if (name.match(/\.pic$/)) { // Frankus picture.
        let pic_file = new cFile(name);
        let component = this;
        pic_file.on_read = function() {
          try {
            let signature = pic_file.Get_Line();
            Check_Condition((signature == "--- Frankus Picture ---"), "Invalid Frankus picture.");
            let meta = {};
            pic_file.Get_Object(meta);
            Check_Condition((meta["width"] != undefined), "Missing picture width.");
            Check_Condition((meta["height"] != undefined), "Missing picture height.");
            component.width = meta.width;
            component.height = meta.height;
            // Read palette.
            for (let pal_index = 0; pal_index < component.MAX_COLORS; pal_index++) {
              let entry = pic_file.Get_Line().split(",");
              if (entry.length == 4) {
                let red = parseInt(entry[0]);
                let green = parseInt(entry[1]);
                let blue = parseInt(entry[2]);
                let alpha = parseFloat(entry[3]);
                component.palette[pal_index] = {
                  red: red,
                  green: green,
                  blue: blue,
                  alpha: alpha
                };
              }
            } // Don't break! Read all blank lines!
            // Read pixel data.
            for (let y = 0; y < meta.height; y++) {
              let scanline = pic_file.Get_Line();
              component.scanlines.push([]); // Add new scanline.
              for (let x = 0; x < meta.width; x++) {
                let index = scanline.charCodeAt(x) - 32;
                let entry = component.palette[index];
                component.scanlines[y].push({
                  red: entry.red,
                  green: entry.green,
                  blue: entry.blue,
                  alpha: Math.floor(entry.alpha * 255)
                });
              }
            }
            component.type = "frankus-picture";
            if (component.on_load) {
              component.on_load();
            }
          }
          catch (error) {
            component.error = error.message;
            component.on_error();
          }
        };
        pic_file.on_not_found = function() {
          if (component.on_not_found) {
            component.on_not_found();
          }
        };
        pic_file.Read();
      }
      else if (name.match(/\.pix$/)) {
        let pix_file = new cFile(name + ".pix");
        let component = this;
        pix_file.on_read = function() {
          try {
            // Read image meta data.
            let image_meta = {};
            pix_file.Get_Object(image_meta);
            Check_Object_Properties(image_meta, component.image_props);
            // Update the image.
            component.width = image_meta.width;
            component.height = image_meta.height;
            // Load the palette.
            let palette_start = pix_file.Get_Line();
            Check_Condition((palette_start == "palette"), "Missing palette start tag.");
            while (pix_file.Has_More_Lines()) {
              let entry = pix_file.Get_Line();
              if (entry == "end") {
                break;
              }
              else {
                let record = entry.split(/,/);
                Check_Condition((record.length == 5), "Invalid palette entry.");
                let letter = record[0];
                let red = parseInt(record[1]);
                let green = parseInt(record[2]);
                let blue = parseInt(record[3]);
                let alpha = Math.floor(parseFloat(record[4]) * 255.0);
                let color = {
                  red: red,
                  green: green,
                  blue: blue,
                  alpha: alpha
                };
                let index = letter.charCodeAt(0) - 32;
                component.palette[index] = color;
              }
            }
            // Load up the image layers.
            while (file.Has_More_Lines()) {
              let layer = {
                scanlines: []
              };
              pix_file.Get_Object(layer);
              Check_Object_Properties(layer, component.layer_props);
              // Read pixel info.
              let row_count = layer.height;
              for (let y = 0; y < row_count; y++) {
                let scanline = file.Get_Line();
                Check_Condition((scanline.length == layer.width), "Invalid scanline size.");
                layer.scanlines.push([]);
                let column_count = scanline.length;
                for (let x = 0; x < column_count; x++) {
                  let index = scanline.charCodeAt(x) - 32;
                  let color = component.palette[index];
                  if (color) {
                    layer.scanlines[y].push({
                      red: color.red,
                      green: color.green,
                      blue: color.blue,
                      alpha: color.alpha
                    });
                  }
                }
              }
              component.layers.push(layer);
            }
            component.type = "image-list";
            if (component.on_load) {
              component.on_load();
            }
          }
          catch (error) {
            component.error = error.message;
            component.on_error();
          }
        };
        file.Read();
      }
      else if (name.match(/\.(png|jpg)$/)) {
        this.image = new Image();
        let component = this;
        this.image.addEventListener("load", function(event) {
          component.type = "web-picture";
          component.width = component.image.width;
          component.height = component.image.height;
          if (component.on_load) {
            component.on_load();
          }
        }, false);
        this.image.addEventListener("error", function(event) {
          if (component.on_error) {
            component.error = "Image loading error.";
            component.on_error();
          }
        });
        this.image.src = name;
      }
      else {
        if (this.on_unknown_type) {
          this.on_unknown_type();
        }
      }
    }
  }

  /**
   * Draws the image to the surface of a canvas.
   * @param surface The surface to draw to.
   */
  Draw(surface) {
    if (this.type == "frankus-picture") {
      let image_data = surface.createImageData(this.width, this.height);
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let pixel = this.scanlines[y][x];
          let offset = ((y * this.width) + x) * 4;
          image_data.data[offset + 0] = pixel.red;
          image_data.data[offset + 1] = pixel.green;
          image_data.data[offset + 2] = pixel.blue;
          image_data.data[offset + 3] = Math.floor(pixel.alpha * 255.0);
        }
      }
      surface.putImageData(image_data, 0, 0);
    }
    else if (this.type == "image-list") {
      // Fill buffer with pixels.
      let buffer = document.createElement("canvas");
      buffer.width = this.width;
      buffer.height = this.height;
      buffer.style.width = this.width + "px";
      buffer.style.height = this.height + "px";
      let buffer_surface = buffer.getContext("2d");
      let layer_count = this.layers.length;
      for (let layer_index = 0; layer_index < layer_count; layer_index++) {
        let layer = this.layers[layer_index];
        // Draw pixels for buffer.
        let image_data = buffer_surface.createImageData(layer.width, layer.height);
        for (let y = 0; y < layer.height; y++) {
          for (let x = 0; x < layer.width; x++) {
            let pixel = layer.scanlines[y][x];
            let offset = ((y * layer.width) + x) * 4;
            image_data.data[offset + 0] = pixel.red;
            image_data.data[offset + 1] = pixel.green;
            image_data.data[offset + 2] = pixel.blue;
            image_data.data[offset + 3] = pixel.alpha;
          }
        }
        buffer_surface.putImageData(image_data, 0, 0);
        // Draw buffer.
        surface.save();
        // Clear out canvas.
        surface.fillStyle = "transparent";
        surface.fillRect(0, 0, this.width, this.height);
        if (layer.scale < 1) {
          surface.translate(((buffer.width / 2) + layer.x) * layer.scale, ((buffer.height / 2) + layer.y) * layer.scale);
        }
        else {
          surface.translate((buffer.width / 2) + layer.x, (buffer.height / 2) + layer.y);
        }
        surface.scale(layer.scale, layer.scale);
        surface.rotate(layer.angle * (Math.PI / 180));
        surface.drawImage(buffer, -(buffer.width / 2), -(buffer.height / 2));
        this.surface.restore();
      }
    }
    else if (this.type == "web-picture") {
      surface.drawImage(this.image, 0, 0);
    }
  }

  /**
   * Gets the data URL of a loaded image.
   * @return The URL containing the base 64 string of the loaded image.
   */
  Get_Data_URL() {
    let canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.width = this.width + "px";
    canvas.style.height = this.height + "px";
    let surface = canvas.getContext("2d");
    this.Draw(surface);
    return canvas.toDataURL();
  }
  
  /**
   * Fills a colored part of an the loaded image. The
   * color is as follows:
   * %
   * {
   *   red: 0,
   *   green: 0,
   *   blue: 0,
   *   alpha: 0.0
   * }
   * %
   * @param x The x coordinate of the bounding box.
   * @param y The y coordinate of the bounding box.
   * @param width The width of the bounding box.
   * @param height The height of the bounding box.
   * @param color The filling color.
   * @throws An error if the bounding box is invalid.
   */
  Fill_Colored(x, y, width, height, color) {
    Check_Condition(((x >= 0) && (x < this.width)), "X coordinate must be in image.");
    Check_Condition(((y >= 0) && (y < this.height)), "Y coordinate must be in image.");
    Check_Condition(((x + width - 1) < this.width), "The bounding box is too wide.");
    Check_Condition(((y + height - 1) < this.height), "The bounding box is too high.");
    let row_end = y + height - 1;
    let col_end = x + width - 1;
    for (let row = 0; row <= row_end; row++) {
      for (let column = 0; column <= col_end; column++) {
        let pixel = this.scanlines[row][column];
        if (pixel.alpha > 0.0) { // Non-transparent?
          pixel.red = color.red;
          pixel.green = color.green;
          pixel.blue = color.blue;
          pixel.alpha = color.alpha;
        }
      }
    }
  }

  /**
   * Creates a temporary canvas to be used for drawing.
   * @return The canvas object.
   */
  Get_Canvas() {
    let canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.width = this.width + "px";
    canvas.style.height = this.height + "px";
    let surface = canvas.getContext("2d");
    this.Draw(surface);
    return canvas;
  }

}

// **************************************************************************
// Frankus Layout Engine
// **************************************************************************

class cLayout {

  /**
   * Creates a new Frankus layout engine.
   */
  constructor() {
    this.grid = null;
    this.grid_w = 0;
    this.grid_h = 0;
    this.screen_w = 0;
    this.screen_h = 0;
    this.entities = [];
    this.properties = {};
    this.components = {};
    this.timer = null;
    this.pages = {};
    this.current_page = "";
    this.home_page = "";
    this.hash_off = false;
    this.elements = {};
    this.nav_condition = function() {
      return true;
    };
    this.browser = new cBrowser();
    this.on_init = null;
    this.on_component_init = null;
  }

  /**
   * Grabs all elements by ID and creates references to them.
   */
  Map_Element_Ids() {
    let tags = document.getElementsByTagName("*");
    let tag_count = tags.length;
    for (let tag_index = 0; tag_index < tag_count; tag_index++) {
      let tag = tags[tag_index];
      if (tag.hasAttribute("id")) {
        let id = tag.getAttribute("id");
        this.elements[id] = tag;
      }
    }
  }

  /**
   * Creates page containers given that the page hash is populated.
   */
  Create_Page_Containers() {
    for (let name in this.pages) {
      let container_id = this.pages[name].container;
      let container = document.createElement("div");
      container.setAttribute("class", "container");
      container.setAttribute("id", container_id);
      container.innerHTML = "Loading... please wait.";
      document.body.appendChild(container);
    }
  }

  /**
   * Remaps the IDs of the pages to containers.
   */
  Remap_Page_Ids() {
    for (let name in this.pages) {
      let container_id = this.pages[name].container;
      this.pages[name].container = this.elements[container_id];
    }
  }

  /**
   * Initializes the global parse grid.
   * @param viewport_w The width of the viewport in pixels.
   * @param viewport_h The height of the viewport in pixels.
   */
  Init_Grid(viewport_w, viewport_h) {
    this.screen_w = viewport_w;
    this.screen_h = viewport_h;
    this.grid_w = Math.floor(viewport_w / CELL_W);
    this.grid_h = Math.floor(viewport_h / CELL_H);
    this.grid = [];
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      let row = [];
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        row.push("");
      }
      this.grid.push(row);
    }
  }

  /**
   * Clears out the grid.
   */
  Clear_Grid() {
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        this.grid[cell_y][cell_x] = "";
      }
    }
  }

  /**
   * Maps the grid out. This is used for debugging purposes to actually output
   * the grid itself.
   */
  Map_Grid() {
    grid_str = "";
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        let cell = this.grid[cell_y][cell_x];
        this.grid_str += String(cell);
      }
      this.grid_str += "<br />";
    }
    return this.grid_str;
  }

  /**
   * Parses the grid given the layout text.
   * @param text The text containing the layout.
   */
  Parse_Grid(text) {
    let lines = Split(text);
    let line_count = (lines.length > this.grid_h) ? this.grid_h : lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = lines[line_index];
      let char_count = (line.length > this.grid_w) ? this.grid_w : line.length;
      for (let char_index = 0; char_index < char_count; char_index++) {
        let ch = line.charAt(char_index);
        this.grid[line_index][char_index] = ch;
      }
    }
  }

  /**
   * Parses the markdown stored in the grid.
   * @param text The text containing the layout markdown.
   * @param container The container to render the entities to.
   */
  Parse_Markdown(text, container) {
    try {
      let html = [];
      this.entities = [];
      // Parse the properties.
      text = this.Parse_Properties(text);
      // Now parse the grid.
      this.Parse_Grid(text);
      // Parse the entities.
      while (this.Has_Entity()) {
        let entity = this.Parse_Entity();
        this.entities.push(entity);
      }
      this.Render_Entities(container);
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Determines if there is an entity still on the grid.
   */
  Has_Entity() {
    let has_entity = false;
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        let cell = this.grid[cell_y][cell_x];
        if (cell.match(/\[|\{|\(|\+/)) { // Entity identifier.
          has_entity = true;
          break;
        }
      }
    }
    return has_entity;
  }

  /**
   * Parses one entity from the grid and removes it. This entity is turned into
   * a component and a reference is generated with the component.
   */
  Parse_Entity() {
    let entity = {
      id: "",
      type: "",
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        let cell = this.grid[cell_y][cell_x];
        if (cell == '+') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "box";
          this.Parse_Box(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else if (cell == '[') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "field";
          this.Parse_Field(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else if (cell == '{') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "panel";
          this.Parse_Panel(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else if (cell == '(') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "button";
          this.Parse_Button(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else {
          continue; // Ignore but allow looking for other entities.
        }
      }
    }
    return entity;
  }

  /**
   * Parses a box entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Box(entity) {
    // We'll navigate in this path: right -> down -> left -> up
    let pos_x = entity.x; // Skip the plus.
    let pos_y = entity.y;
    let rev_width = 1;
    let rev_height = 1;
    let id_str = "";
    // Clear out first plus.
    this.grid[pos_y][pos_x] = "";
    // Navigate right.
    pos_x++;
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '+') {
        entity.width++;
        entity.id = id_str.replace(/\-/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\-|\w/)) { // Box Edge
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (right)");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated box. (width)");
    }
    // Navigate down.
    pos_y++; // Skip the first plus.
    while (pos_y < this.grid_h) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '+') {
        entity.height++;
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell == '|') {
        entity.height++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (down)");
      }
      pos_y++;
    }
    // Check for truncated object.
    if (pos_y == this.grid_h) {
      throw new Error("Truncated box. (height)");
    }
    // Navigate left.
    pos_x--; // Skip that first plus.
    while (pos_x >= 0) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '+') {
        rev_width++;
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell == '-') {
        rev_width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (left)");
      }
      pos_x--;
    }
    if (rev_width != entity.width) {
      throw new Error("Not a valid box. (width mismatch)");
    }
    // Navigate up.
    pos_y--;
    while (pos_y >= 0) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '') { // Plus was removed but validated before.
        rev_height++;
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell == '|') {
        rev_height++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (up)");
      }
      pos_y--;
    }
    if (rev_height != entity.height) {
      throw new Error("Not a valid box. (height mismatch)");
    }
  }

  /**
   * Parses a field entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Field(entity) {
    let pos_x = entity.x;
    let pos_y = entity.y;
    let id_str = "";
    // Clear out initial bracket.
    this.grid[pos_y][pos_x] = "";
    // Parse out field.
    pos_x++; // Pass over initial bracket.
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == ']') {
        entity.width++;
        entity.id = id_str.replace(/\s/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\w|\s/)) {
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid field.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated field.");
    }
  }

  /**
   * Parses a panel entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Panel(entity) {
    let pos_x = entity.x;
    let pos_y = entity.y;
    let id_str = "";
    // Clear out initial curly.
    this.grid[pos_y][pos_x] = "";
    // Skip over initial curly.
    pos_x++;
    // Go ahead and parse the rest.
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '}') {
        entity.width++;
        entity.id = id_str.replace(/\s/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\w|\s/)) {
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid panel.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated panel.");
    }
  }

  /**
   * This parses the button entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Button(entity) {
    let pos_x = entity.x;
    let pos_y = entity.y;
    let id_str = "";
    this.grid[pos_y][pos_x] = "";
    pos_x++;
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == ')') {
        entity.width++;
        entity.id = id_str.replace(/\s/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\w|\s/)) {
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid button.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated button.");
    }
  }

  /**
   * Parses all properties related to entities.
   * @param text The text to parse into properties.
   * @throws String If the property is not formatted correctly.
   */
  Parse_Properties(text) {
    let lines = Split(text);
    let line_count = lines.length;
    let new_lines = [];
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = lines[line_index];
      if (line.match(/\w+\s*\->/)) { // Property signature.
        let record = line.trim();
        let pair = record.split(/\s*\->\s*/);
        if (pair.length == 2) {
          let entity_id = pair[0];
          let value = pair[1];
          // Create entity property object.
          this.properties[entity_id] = {};
          let props = value.split(/\s*,\s*/);
          let prop_count = props.length;
          for (let prop_index = 0; prop_index < prop_count; prop_index++) {
            let prop = props[prop_index].split(/\s*=\s*/);
            if (prop.length == 2) {
              let name = prop[0];
              let value = prop[1];
              this.properties[entity_id][name] = value;
            }
            else {
              throw new Error("Property is missing value.");
            }
          }
        }
        else {
          throw new Error("Entity ID is missing properties.");
        }
      }
      else { // We're not including property lines.
        new_lines.push(line);
      }
    }
    return new_lines.join("\n");
  }

  /**
   * Renders all of the entities as components.
   * @param container The container to render the entities to.
   */
  Render_Entities(container) {
    container.innerHTML = "";
    let entity_count = this.entities.length;
    for (let entity_index = 0; entity_index < entity_count; entity_index++) {
      let entity = this.entities[entity_index];
      let settings = this.properties[entity.id] || {};
      entity.x *= CELL_W;
      entity.y *= CELL_H;
      entity.width *= CELL_W;
      entity.height *= CELL_H;
      let component = null;
      // We can override the entity type in the settings.
      if (settings["change-type"] != undefined) {
        entity.type = settings["change-type"];
      }
      if (entity.type == "box") {
        component = new cBox(entity, settings, container);
      }
      else if (entity.type == "field") {
        component = new cField(entity, settings, container);
      }
      else if (entity.type == "panel") {
        component = new cPanel(entity, settings, container);
      }
      else if (entity.type == "button") {
        component = new cButton(entity, settings, container)
      }
      else if (entity.type == "select") {
        component = new cSelect(entity, settings, container);
      }
      else if (entity.type == "edit") {
        component = new cEdit(entity, settings, container);
      }
      else if (entity.type == "checkbox") {
        component = new cCheckbox(entity, settings, container);
      }
      else if (entity.type == "radio") {
        component = new cRadio(entity, settings, container);
      }
      else if (entity.type == "wiki") {
        component = new cWiki(entity, settings, container);
      }
      else if (entity.type == "picture") {
        component = new cPicture(entity, settings, container);
      }
      else if (entity.type == "menu") {
        component = new cMenu(entity, settings, container);
      }
      else if (entity.type == "toolbar") {
        component = new cToolbar(entity, settings, container);
      }
      else if (entity.type == "image-button") {
        component = new cImage_Button(entity, settings, container);
      }
      else if (entity.type == "label") {
        component = new cLabel(entity, settings, container);
      }
      else if (entity.type == "marquee") {
        component = new cMarquee(entity, settings, container);
      }
      else if (entity.type == "tool-palette") {
        component = new cTool_Palette(entity, settings, container);
      }
      else if (entity.type == "grid-view") {
        component = new cGrid_View(entity, settings, container);
      }
      else if (entity.type == "comic-reader") {
        component = new cComic_Reader(entity, settings, container);
      }
      else if (entity.type == "code-editor") {
        component = new cCode_Editor(entity, settings, container);
      }
      else if (entity.type == "frame") {
        component = new cFrame(entity, settings, container);
      }
      else if (entity.type == "bump-map-editor") {
        component = new cBump_Map_Editor(entity, settings, container);
      }
      else if (entity.type == "sound-editor") {
        component = new cSound_Editor(entity, settings, container);
      }
      else if (entity.type == "board") {
        component = new cBoard(entity, settings, container);
      }
      else if (entity.type == "chat") {
        component = new cChat(entity, settings, container);
      }
      else if (entity.type == "screen") {
        component = new cScreen(entity, settings, container);
      }
      else if (entity.type == "uploader") {
        component = new cUploader(entity, settings, container);
      }
      else if (entity.type == "poll") {
        component = new cPoll(entity, settings, container);
      }
      else if (entity.type == "counter") {
        component = new cCounter(entity, settings, container);
      }
      else if (entity.type == "visitor-chart") {
        component = new cVisitor_Chart(entity, settings, container);
      }
      else if (entity.type == "link") {
        component = new cLink(entity, settings, container);
      }
      else if (entity.type == "terminal") {
        component = new cTerminal(entity, settings, container);
      }
      else if (entity.type == "color-picker") {
        component = new cColor_Picker(entity, settings, container);
      }
      else if (entity.type == "paint") {
        component = new cPaint(entity, settings, container);
      }
      else {
        throw new Error("Wrong entity type: " + entity.type);
      }
      this.components[entity.id] = component;
    }
  }

  /**
   * Loads a layout from a file and renders it.
   * @param file The file to load the layout from.
   * @param on_load Called if the layout is parsed and rendered.
   */
  Load_Layout(file, container, on_load) {
    let layout_file = new cFile("Pages/" + file);
    let component = this;
    layout_file.on_read = function() {
      component.Parse_Markdown(layout_file.data, container);
      on_load();
    };
    layout_file.on_not_found = function() {
      console.log("Error: " + layout_file.error);
      on_load();
    };
    layout_file.Read();
  }

  /**
   * Loads a page in a list of pages.
   * @param index The index of the page to load.
   * @param on_load Called when all pages have been loaded.
   */
  Load_Page(index, on_load) {
    let names = Object.keys(this.pages);
    if (index < names.length) {
      let name = names[index];
      let page = this.pages[name];
      let file = Is_Mobile() ? page.mobile : page.layout;
      if (file) {
        let component = this;
        this.Load_Layout(file, page.container, function() {
          component.Load_Page(index + 1, on_load);
        });
      }
      else {
        this.Load_Page(index + 1, on_load);
      }
    }
    else {
      on_load();
    }
  }

  /**
   * Resizes a container according to the size of the browser window.
   * @param container The container to resize.
   */
  Resize_Container(container) {
    let width = document.body.clientWidth;
    let height = document.body.clientHeight;
    let scale_x = width / this.screen_w;
    let scale_y = height / this.screen_h;
    if (this.browser.name == "firefox") {
      scale_x = (width - 8) / this.screen_w;
      scale_y = (height - 8) / this.screen_h;
    }
    if (height > this.screen_h) {
      container.style.transformOrigin = "center center";
      container.style.transform = "scaleX(" + scale_y + ") scaleY(" + scale_y + ") translateZ(0)";
    }
  }

  /**
   * Resizes all page containers in accordance with the window size.
   */
  Resize_Page_Containers() {
    for (let name in this.pages) {
      let container = this.pages[name].container;
      this.Resize_Container(container);
    }
  }

  /**
   * Flips to a named page.
   * @param name The name of the page to flip to.
   */
  Flip_Page(name) {
    let result = this.nav_condition();
    if (result) {
      if (this.pages[name]) { // Does page exist?
        let container = this.pages[name].container;
        // Post process current page before changing it.
        if (this.current_page.length > 0) {
          let old_page_container = this.pages[this.current_page].container;
          old_page_container.style.display = "none";
          if (this.pages[this.current_page].pause) {
            this.pages[this.current_page].pause();
          }
        }
        else { // Hide all pages!
          for (let page in this.pages) {
            let page_container = this.pages[page].container;
            page_container.style.display = "none";
          }
        }
        // Display current page.
        this.current_page = name;
        container.style.display = "block";
        if (this.pages[name].resume) {
          this.pages[name].resume();
        }
        // Set the hash of the page.
        if (!this.hash_off) {
          location.hash = "#" + name;
        }
        // Set home page.
        if (this.home_page.length == 0) {
          this.home_page = name;
        }
      }
    }
  }

  /**
   * Initializes the navigation handler to deal with browser navigation buttons.
   */
  Init_Navigation_Handler() {
    let component = this;
    window.addEventListener("hashchange", function(event) {
      if (location.hash.length > 0) {
        let page = decodeURIComponent(location.hash.slice(1));
        if (page.length > 0) {
          component.Flip_Page(page);
        }
        else {
          component.Flip_Page(component.home_page);
        }
      }
      else {
        component.Flip_Page(component.home_page);
      }
    }, false);
  }

  /**
   * Initializes a handler to resize the page containers when the window resizes.
   */
  Init_Resize_Handler() {
    // Create handlers for window resize.
    let component = this;
    window.addEventListener("resize", function(event) {
      if (!Is_Mobile()) {
        component.Resize_Page_Containers();
      }
    }, false);
  }

  /**
   * Adds a page to the layout for processing.
   * @param name The name of the page.
   * @param container The name of the page container.
   * @param pause Callback for when page is paused.
   * @param resume Callback for when page is resumed.
   * @param layout The layout file name.
   * @param mobile The mobile layout file name.
   */
  Add_Page(name, container, pause, resume, layout, mobile) {
    this.pages[name] = {
      container: container,
      pause: pause,
      resume: resume,
      layout: layout,
      mobile: mobile
    };
  }

  /**
   * Creates the layout.
   * @param page The name of the initial page to open.
   */
  Create(page) {
    let component = this;
    this.browser.Detect(function() {
      component.Create_Page_Containers();
      component.Map_Element_Ids();
      component.Remap_Page_Ids();
      let is_mobile = Is_Mobile();
      if (is_mobile) {
        component.Init_Grid(MOBILE_W, MOBILE_H);
      }
      else {
        component.Init_Grid(SCREEN_W, SCREEN_H);
      }
      if (!is_mobile) {
        component.Resize_Page_Containers();
      }
      setTimeout(function() {
        component.Load_Page(0, function() {
          // Initialize navigation handler.
          component.Init_Navigation_Handler();
          component.on_component_init();
          component.on_init();
          component.Init_Resize_Handler();
          component.Flip_Page(page);
        });
      }, 1); // Set a delay to sync DOM.
      // Respond to resize event.
      window.addEventListener("resize", function(event) {
        component.Resize_Page_Containers();
      }, false);
    }, function(error) {
      console.log("Browser Error: " + error);
    });
  }

}

// *****************************************************************************
// Code Bank Implementation
// *****************************************************************************

class cCode_Bank {

  /**
   * Creates a new code bank.
   * @param name The name of the file to load for the code bank.
   * @param on_load Called when the code bank is loaded.
   */
  constructor(name, on_load) {
    this.name = name;
    this.bank = {};
    this.Load(name, on_load);
  }

  /**
   * Loads a code bank by name.
   * @param name The name of the code bank file.
   * @param on_load Called when the code bank is loaded.
   * @throws An error if the bank is not correctly formatted.
   */
  Load(name, on_load) {
    let cb_file = new cFile("Code_Banks/" + name + ".txt");
    let component = this;
    cb_file.on_read = function() {
      try {
        while (cb_file.Has_More_Lines()) {
          let file_meta = {
            "lines": []
          };
          cb_file.Get_Object(file_meta);
          Check_Condition((file_meta["name"] != undefined), "Missing file name.");
          Check_Condition((file_meta["type"] != undefined), "Missing file type.");
          file_meta["name"] = component.Convert_To_Bank_Path(file_meta["name"]); // Make sure we have bank path.
          if (file_meta["type"] == "code") {
            Check_Condition((file_meta["count"] != undefined), "Missing number of lines.");
            let line_count = file_meta["count"];
            for (let line_index = 0; line_index < line_count; line_index++) {
              let line = cb_file.Get_Line();
              file_meta["lines"].push(line);
            }
            component.bank[file_meta["name"]] = file_meta;
          }
          else if (file_meta["type"] == "link") {
            component.bank[file_meta["name"]] = file_meta; // Just link info.
          }
          else {
            throw new Error("Unknown file type " + file_meta["type"] + ".");
          }
        }
        on_load();
      }
      catch (error) {
        console.log(error.message);
      }
    };
    cb_file.Read();
  }

  /**
   * Gets the contents of a file from the code bank.
   * @param name The name of the file.
   * @return A file object with the data or without it.
   * @throws An error if the file does not exist.
   */
  Get(name) {
    name = this.Convert_To_Bank_Path(name);
    Check_Condition((this.bank[name] != undefined), name + " does not exist.");
    let file_meta = this.bank[name];
    let file = new cFile(name);
    if (file_meta["type"] == "code") {
      file.Add_Lines(file_meta["lines"]);
    }
    return file;
  }

  /**
   * Browses a cabinet via a folder.
   * @param folder The folder path.
   * @return A list of file names.
   */
  Browse_By_Folder(folder) {
    let files = [];
    folder = this.Convert_To_Bank_Path(folder);
    for (let file in this.bank) {
      if (file.indexOf(folder) == 0) {
        files.push(this.Convert_To_URL_Path(file));
      }
    }
    return files;
  }

  /**
   * Converts a folder path to a bank path.
   * @param folder The folder path.
   * @return The bank path.
   */
  Convert_To_Bank_Path(folder) {
    return folder.replace(/:|\/|\\/g, "->");
  }

  /**
   * Converts a folder path to a URL path.
   * @param folder The folder to convert.
   */
  Convert_To_URL_Path(folder) {
    return folder.replace(/\->/g, "/");
  }

  /**
   * Queries a group of files in a directory or a group of folders.
   * @param folder The folder to look for files.
   * @param search The search string. Used Frankus wildcards.
   * @return The list of files in the folder.
   */
  Query_Files(folder, search) {
    let file_list = [];
    let dest = this.Convert_To_Bank_Path(folder);
    let files = this.Browse_By_Folder(dest);
    // Process files to determine if they are directories.
    let file_count = files.length;
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = files[file_index];
      if (search == "all") { // All keys.
        file_list.push(file);
      }
      else if (search.match(/,/)) { // List of extensions.
        let list = search.replace(/,/g, "|");
        if (file.match(new RegExp("\\.(" + list + ")$"), "")) {
          file_list.push(file);
        }
      }
      else if (search.match(/^\*\w+$/)) { // File extension.
        let query = search.replace(/^\*/, "");
        if (file.match(new RegExp("\\w+\\." + query + "$"), "")) {
          file_list.push(file);
        }
      }
      else if (search.match(/^\*\w+\.\w+$/)) { // File pattern.
        let query = search.replace(/^\*/, "");
        if (file.match(new RegExp(query + "$"), "")) {
          file_list.push(file);
        }
      }
      else if (search.match(/^@\w+$/)) { // Random pattern.
        let query = search.replace(/^@/, "");
        if (file.indexOf(query) != -1) {
          file_list.push(file);
        }
      }
    }
    return file_list;
  }

  /**
   * Clears the bank.
   */
  Clear() {
    this.bank = {};
  }

}

// *****************************************************************************
// Base Paint Tool Implementation
// *****************************************************************************

class cPaint_Tool {
}

// **************************************************************************
// Base Component
// **************************************************************************

/**
 * This is the base component for all components.
 */
class cComponent {

  /**
   * Instantiates the component. The following default properties exist:
   *
   * - change-type - This changes the type of component. Values can be:
   * -> "box"
   * -> "field"
   * -> "panel"
   * -> "button"
   * -> "select"
   * -> "edit"
   * -> "checkbox"
   * -> "radio"
   * -> "wiki"
   * -> "picture"
   * -> "menu"
   * -> "toolbar"
   * -> "image-button"
   * -> "label"
   * -> "marquee"
   * -> "tool-palette"
   * -> "grid-view"
   * -> "comic-reader"
   * -> "code-editor"
   * -> "frame"
   * -> "board"
   * -> "chat"
   * -> "poll"
   * -> "counter"
   * -> "visitor-chart"
   * -> "link"
   * -> "terminal"
   * -> "paint"
   * -> "color-picker"
   *
   * @param entity The parsed entity object.
   * @param settings The parsed settings hash.
   * @param container The container where the component will be added.
   */
  constructor(entity, settings, container) {
    this.entity = entity;
    this.settings = settings;
    this.container = container;
    this.elements = {};
  }

  /**
   * This is where you create the component. You override this to process all
   * settings and create the layout associated with the entity.
   */
  Create() {
    // This is meant to be overridden.
  }

  /**
   * Creates an event on the component. This should be overridden per component.
   * @param name The name of the event, like "click".
   * @param handler The event handler. It is formatted like this:
   * %
   * function(component, event) {
   *
   * }
   * %
   */
  On(name, handler) {
    // This is meant to be overridden.
  }

  /**
   * Gets the value of the component.
   * @return The value of the component.
   */
  Get_Value() {
    return this.elements[this.entity.id].innerHTML;
  }

  /**
   * Sets the value of the component.
   * @param value The value to set the component to.
   */
  Set_Value(value) {
    this.elements[this.entity.id].innerHTML = value;
  }

  /**
   * Creates an element from a JSON tree and places it into a container.
   * Elements are formatted into a JSON object tree.
   * %
   *    {
   *      id: "container", // The ID of the element.
   *      type: "div", // The type of element tag.
   *      attrib: { // The element attributes.
   *        width: 100,
   *        height: 100
   *      },
   *      css: { // CSS properties.
   *        "position": "absolute",
   *        "background-color": "red"
   *      },
   *      subs: [ // All sub elements.
   *        {
   *          id: "area",
   *          type: "div"
   *        }
   *      ]
   *    }
   * %
   * @param element The JSON element tree.
   * @param container The container to attach the element tree. It can be a name.
   * @return A reference to the entire element tree.
   */
  Create_Element(element, container) {
    // First create the element.
    let object = document.createElement(element.type); // The tag type.
    // Set the attributes.
    if (element.attrib) {
      let keys = Object.keys(element.attrib);
      let key_count = keys.length;
      for (let key_index = 0; key_index < key_count; key_index++) {
        let attrib = keys[key_index];
        object.setAttribute(attrib, element.attrib[attrib]);
      }
    }
    // Set the style or CSS. This would overwrite template styles.
    if (element.css) {
      let keys = Object.keys(element.css);
      let key_count = keys.length;
      let style_str = "";
      for (let key_index = 0; key_index < key_count; key_index++) {
        let style = keys[key_index];
        let value = element.css[style];
        if (style == "cursor") {
          this.Bind_Image(Unquote_URL(value), object, style);
        }
        else if (style == "background-image") {
          if (value != "none") { // Background images can have no value.
            this.Bind_Image(Unquote_URL(value), object, style);
          }
        }
        else {
          style_str += String(style + ": " + value + "; ");
        }
      }
      object.setAttribute("style", style_str); // We want to allow conventional style strings.
    }
    // Store element reference.
    if (element.id) {
      this.elements[element.id] = object; // Reference.
      // Add in an ID property for object.
      object.frankus_id = element.id;
      object.setAttribute("id", element.id); // Set and ID to identify in debugger.
    }
    // Set text inside of element.
    if (element.text) {
      object.innerHTML = Format(element.text);
    }
    // Parse all other sub elements.
    if (element.subs) {
      let sub_count = element.subs.length;
      for (let sub_index = 0; sub_index < sub_count; sub_index++) {
        let sub = element.subs[sub_index];
        let sub_ref = this.Create_Element(sub, object);
      }
    }
    // Install handler to prevent form submission.
    if (object.tagName == "INPUT") {
      object.addEventListener("keypress", function(event) {
        let key = event.keyCode;
        if (key == 13) { // Enter
          event.preventDefault();
        }
      }, false);
    }
    // Prevent tabbing away from text boxes.
    if (object.tagName == "TEXTAREA") {
      object.addEventListener("keydown", function(event) {
        let key = event.keyCode;
        if (key == 9) { // Tab
          event.preventDefault();
        }
      }, false);
    }
    // Do we add in the element to a container?
    if (typeof container == "string") {
      if (this.elements[container] != undefined) {
        this.elements[container].appendChild(object);
      }
    }
    else {
      container.appendChild(object);
    }
    // Very important! Return element reference.
    return object;
  }

  /**
   * Binds an image to an element given the URL and property.
   * @param url The URL of the image.
   * @param element The element to bind to.
   * @param property The property to bind to.
   */
  Bind_Image(url, element, property) {
    let image = new cImage();
    image.on_load = function() {
      if (property == "cursor") {
        element.style.cursor = 'url("' + image.Get_Data_URL() + '"), default';
      }
      else if (property == "background-image") {
        element.style.backgroundImage = 'url("' + image.Get_Data_URL() + '")';
      }
    };
    image.Load(url);
  }

  /**
   * Loads up an image element with an image.
   * @param url The URL of the image to load.
   * @param element The image element to load.
   */
  Load_Image_Element(url, element) {
    let image = new cImage();
    image.on_load = function() {
      element.src = image.Get_Data_URL();
    };
    image.Load(url);
  }

  /**
   * Shows an element.
   * @param element The name of the element to be shown.
   */
  Show(element) {
    this.elements[element].style.display = "block";
  }

  /**
   * Hides an element.
   * @param element The name of the element to hide.
   */
  Hide(element) {
    this.elements[element].style.display = "none";
  }

  /**
   * Changes the color of an element.
   * @param element The name of the element to change the color.
   * @param color The color of the element.
   */
  Change_Color(element, color) {
    this.elements[element].style.backgroundColor = color;
  }

  /**
   * Capitalize the name and return a formatted version.
   * @param name The name to format.
   * @return The unformatted name.
   */
  Capitalize(name) {
    let words = name.split(/_/);
    let word_count = words.length;
    let title = [];
    for (let word_index = 0; word_index < word_count; word_index++) {
      let word = words[word_index];
      let first_letter = word.substring(0, 1).toUpperCase();
      let other = word.substring(1);
      title.push(first_letter + other);
    }
    return title.join(" ");
  }

  /**
   * Creates a button JSON element. The settings are as follows.
   *
   * - label - The text to display on the button.
   * - left - The left coordinate.
   * - top - The top coordinate.
   * - right - The right coordinate.
   * - bottom - The bottom coordinate.
   * - width - The width of the button.
   * - height - The height of the button.
   * - bg-color - The background color.
   * - fg-color - The foreground color.
   * - opacity - The opacity, ranges for 0 to 1.
   * - position - Can be "static", "absolute", or "relative".
   * - show - Can be "on" or "off".
   *
   * @param id The ID of the button.
   * @param settings Specifies the dimensions and style of the button.
   * @return The JSON structure of the button element.
   */
  Make_Button(id, settings) {
    let left = (settings["left"] != undefined) ? settings["left"] : "auto";
    let top = (settings["top"] != undefined) ? settings["top"] : "auto";
    let right = (settings["right"] != undefined) ? settings["right"] : "auto";
    let bottom = (settings["bottom"] != undefined) ? settings["bottom"] : "auto";
    return {
      id: id,
      type: "div",
      text: settings["label"],
      css: {
        "position": settings["position"] || "absolute",
        "left": (left != "auto") ? left + "px" : left,
        "top": (top != "auto") ? top + "px" : top,
        "right": (right != "auto") ? right + "px" : right,
        "bottom": (bottom != "auto") ? bottom + "px" : bottom,
        "width": settings["width"] + "px",
        "height": settings["height"] + "px",
        "border-radius": "5px",
        "background-color": settings["bg-color"] || "black",
        "color": settings["fg-color"] || "white",
        "opacity": settings["opacity"] || "1",
        "line-height": settings["height"] + "px",
        "text-align": "center",
        "cursor": String(Get_Image("Cursor.pic", true) + ", default"),
        "font-family": "Regular, sans-serif",
        "font-size":  "16px",
        "font-weight": "bold"
      }
    };
  }

  /**
   * Creates an edit control. The settings are as follows:
   *
   * - label - The text to display on the edit control.
   * - value - The value that the edit control has.
   * - border - The border around the edit control.
   * - fg-color - The foreground color.
   * - bg-color - The background color.
   *
   * @param id The ID of the edit control.
   * @param settings The settings associated with the edit control.
   * @return The JSON structure of the edit control.
   */
  Make_Edit(id, settings) {
    return {
      id: id,
      type: "textarea",
      attrib: {
        nowrap: "",
        value: settings["value"] || "",
        placeholder: settings["label"] || ""
      },
      css: {
        "margin": "0",
        "margin-left": "1px",
        "margin-top": "1px",
        "padding": "2px",
        "border": settings["border"] || "1px solid silver",
        "width": "calc(100% - 8px)",
        "height": "calc(100% - 8px)",
        "resize": "none",
        "font-family": '"Courier New", monospace',
        "font-size": "16px",
        "color": settings["fg-color"] || "black",
        "background-color": settings["bg-color"] || "white"
      }
    };
  }

  /**
   * Creates a generic form with sub elements in it.
   * @param id The id of the form.
   * @param subs All of the sub elements of the form.
   * @return The form element JSON.
   */
  Make_Form(id, subs) {
    return {
      id: id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "margin": "0",
        "padding": "0",
        "left": "0",
        "top": "0",
        "width": "100%",
        "height": "100%"
      },
      subs: subs
    };
  }

  /**
   * Creates a generic field. The settings are as follows:
   *
   * - label - The default text to display.
   * - type - The type of field. i.e. "text", "password", etc.
   * - border - The border style.
   * - fg-color - The text color.
   * - bg-color - The color of the field.
   * - font - The font to use for the field.
   * - size - The size of the font.
   * - height - The height of the field. Pass it in if setting font size.
   * - object-width - The width of the object itself.
   * - object-height - The height of the object itself.
   * - value - The default value for the field.
   *
   * @param id The ID of the field.
   * @param settings The properties for the field.
   * @return The JSON structure for the field.
   */
  Make_Field(id, settings) {
    let font_size = settings["size"] || settings["height"];
    return {
      id: id,
      type: "input",
      attrib: {
        type: settings["type"] || "text",
        placeholder: settings["label"] || "",
        value: settings["value"] || ""
      },
      css: {
        "width": (settings["object-width"]) ? String("calc(" + settings["object-width"] + " - 8px)") : "calc(100% - 8px)",
        "height": (settings["object-height"]) ? String("calc(" + settings["object-height"] + "px - 8px)") : "calc(100% - 8px)",
        "padding": "2px",
        "margin": "0",
        "margin-left": "1px",
        "margin-top": "1px",
        "border": settings["border"] || "1px solid silver",
        "color": settings["fg-color"] || "black",
        "background-color": settings["bg-color"] || "white",
        "font-family": settings["font"] || "Regular, sans-serif",
        "font-size": (settings["height"] != undefined) ? String(font_size - 10) + "px" : font_size + "px",
        "cursor": Get_Image("Cursor.pic", true) + ", default"
      }
    };
  }

  /**
   * Creates a generic drop down list. The settings are as follows:
   *
   * - border - The border style.
   * - fg-color - The text color.
   * - bg-color - The color of the field.
   * - font - The font to use for the field.
   * - size - The size of the font.
   * - height - The height of the field. Pass it in if setting font size.
   * - object-width - The width of the object itself.
   * - object-height - The height of the object itself.
   *
   * @param id The ID of the field.
   * @param items An array of items representing the list.
   * @param settings The properties for the field.
   * @return The JSON structure for the field.
   */
  Make_Dropdown_List(id, items, settings) {
    let font_size = settings["size"] || settings["height"];
    let options = [];
    // Populate options.
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let option = {
        id: id + "_option_" + item_index,
        type: "option",
        text: item,
        attrib: {
          value: item
        }
      };
      options.push(option);
    }
    return {
      id: id,
      type: "select",
      attrib: {
        type: settings["type"] || "text",
        placeholder: settings["label"] || ""
      },
      css: {
        "width": (settings["object-width"]) ? String("calc(" + settings["object-width"] + " - 8px)") : "calc(100% - 8px)",
        "height": (settings["object-height"]) ? String("calc(" + settings["object-height"] + "px - 8px)") : "100%",
        "padding": "2px",
        "margin": "0",
        "margin-left": "1px",
        "margin-top": "1px",
        "border": settings["border"] || "1px solid silver",
        "color": settings["fg-color"] || "black",
        "background-color": settings["bg-color"] || "white",
        "font-family": settings["font"] || "Regular, sans-serif",
        "font-size": (settings["height"] != undefined) ? String(font_size - 10) + "px" : font_size + "px"
      },
      subs: options
    };
  }

  /**
   * Creates a radio selector group. The settings are as follows:
   *
   * float - Can be "left", "right", or "none".
   * width - The width of the radio selector.
   * clear - Whether to break floating. Can be "left", "right", "both", or "none".
   *
   * @param id The ID of the radio selector.
   * @param name The name of the radio selector.
   * @param items A hash of items with key/value pair as label/name.
   * @param settings The settings associated with the radio control.
   * @return A layout tree for the radio selector.
   */
  Make_Radio_Selector(id, name, items, settings) {
    let title = this.Capitalize(name);
    let radio_box = {
      id: id + "_radio_box",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "margin": "0",
        "margin-bottom": "10px",
        "padding": "0",
        "position": "static",
        "height": "auto",
        "margin-top": "10px",
        "float": settings["float"] || "none",
        "width": settings["width"] || "auto",
        "clear": settings["clear"] || "none"
      },
      subs: [
        {
          id: id + "_radio_box_label",
          type: "div",
          text: "#" + title + "#",
          css: {
            "font-size": "18px",
            "margin-bottom": "4px"
          }
        }
      ]
    };
    for (let label in items) {
      let key = items[label];
      radio_box.subs.push({
        id: id + "_radio_button_" + key,
        type: "input",
        attrib: {
          type: "radio",
          name: name,
          value: key
        },
        css: {
          "margin": "0",
          "padding": "0",
          "width": "25px",
          "vertical-align": "middle",
          "height": "12px",
          "cursor": Get_Image("Cursor.pic", true) + ", default"
        }
      },
      {
        id: id + "_radio_label_" + key,
        type: "label",
        text: label,
        attrib: {
          "for": id + "_radio_button_" + key
        },
        css: {
          "font-size": "12px"
        }
      },
      {
        id: id + "_radio_break_" + key,
        type: "br"
      });
    }
    return radio_box;
  }

  /**
   * Creates a new checkbox board control. The following settings apply:
   *
   * float - Set to "left", "right", or "both".
   * clear - Set to "left", "right", "both", or "none".
   * width - The width of the control.
   *
   * @param id The id of the control.
   * @param name The name of the control.
   * @param items The items set up in key/value format with the key being the label and value being the name.
   * @param settings The settings hash to apply to the control.
   * @return The object dom tree for the control.
   */
  Make_Checkbox_Board(id, name, items, settings) {
    let title = this.Capitalize(name);
    let checkbox_board = {
      id: id + "_checkbox_board",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "margin": "0",
        "margin-bottom": "10px",
        "padding": "0",
        "position": "static",
        "height": "auto",
        "margin-top": "10px",
        "float": settings["float"] || "none",
        "width": settings["width"] || "auto",
        "clear": settings["clear"] || "none"
      },
      subs: [
        {
          id: id + "_checkbox_board_label",
          type: "div",
          text: "#" + title + "#",
          css: {
            "font-size": "18px",
            "margin-bottom": "4px"
          }
        }
      ]
    };
    for (let label in items) {
      let key = items[label];
      checkbox_board.subs.push({
        id: id + "_checkbox_button_" + key,
        type: "input",
        attrib: {
          type: "checkbox",
          name: name,
          value: key
        },
        css: {
          "margin": "0",
          "padding": "0",
          "width": "25px",
          "vertical-align": "middle",
          "height": "12px",
          "cursor": Get_Image("Cursor.pic", true) + ", default"
        }
      },
      {
        id: id + "_checkbox_label_" + key,
        type: "label",
        text: label,
        attrib: {
          "for": id + "_checkbox_button_" + key
        },
        css: {
          "font-size": "12px"
        }
      },
      {
        id: id + "_checkbox_break_" + key,
        type: "br"
      });
    }
    return checkbox_board;
  }

  /**
   * Creates a loading sign.
   */
  Make_Loading_Sign() {
    return {
      id: this.entity.id + "_loading_sign",
      type: "canvas",
      css: {
        "position": "absolute",
        "left": "0",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "margin": "auto",
        "width": "391px",
        "height": "83px",
        "background-image": Get_Image("Loading.pic", true),
        "display": "none"
      }
    };
  }

  /**
   * Creates a saving sign.
   */
  Make_Saving_Sign() {
    return {
      id: this.entity.id + "_saving_sign",
      type: "div",
      css: {
        "position": "absolute",
        "left": "0",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "margin": "auto",
        "width": "391px",
        "height": "83px",
        "background-image": Get_Image("Saving.pic", true),
        "display": "none"
      }
    };
  }

  /**
   * Turns the loading sign on or off.
   * @param on If set to true then the sign appears, otherwise it doesn't.
   */
  Toggle_Loading_Sign(on) {
    this.elements[this.entity.id + "_loading_sign"].style.display = (on) ? "block" : "none";
  }

  /**
   * Turns the saving sign on or off.
   * @param on If set to true then the sign appears, otherwise it doesn't.
   */
  Toggle_Saving_Sign(on) {
    this.elements[this.entity.id + "_saving_sign"].style.display = (on) ? "block" : "none";
  }

  /**
   * Initializes the loading click handler.
   */
  Init_Loading_Click() {
    let component = this;
    this.elements[this.entity.id + "_loading_sign"].addEventListener("click", function(event) {
      component.elements[component.entity.id + "_loading_sign"].style.display = "none";
    }, false);
  }

  /**
   * Initializes the saving click handler.
   */
  Init_Saving_Click() {
    let component = this;
    this.elements[this.entity.id + "_saving_sign"].addEventListener("click", function(event) {
      component.elements[component.entity.id + "_saving_sign"].style.display = "none";
    }, false);
  }

  /**
   * Removes the elements inside of the container.
   * @param container The container with the elements.
   */
  Remove_Elements(container) {
    while (container.childNodes.length > 0) {
      let element = container.childNodes[0];
      this.Remove_Element(element, container);
    }
  }
  
  /**
   * Removes an element and it's children.
   * @param element The element.
   * @param container The container of the element.
   */
  Remove_Element(element, container) {
    let id = element.id;
    // Remove child nodes of item, if any.
    this.Remove_Elements(element);
    container.removeChild(element);
    // Remove element reference for garbage collection.
    if (this.elements[id]) {
      delete this.elements[id];
    }
  }

}

// **************************************************************************
// Non-Visual Component
// **************************************************************************

/**
 * A non-visual component is one that appears offscreen. Use it to render
 * resources offscreen.
 */
class cNon_Visual_Component extends cComponent {

  OFFSCREEN_POS = -16000;

  /**
   * Creates a new non-visual component.
   * @param container The container associated with the component.
   * @param id The ID of the component.
   */
  constructor(container, id) {
    super({}, {}, container);
    this.base = this.Create_Element({
      id: id,
      type: "div",
      css: {
        "position": "absolute",
        "left": this.OFFSCREEN_POS + "px",
        "top": "0",
        "width": "64px",
        "height": "64px"
      }
    }, container);
  }

}

// **************************************************************************
// Field
// **************************************************************************

/**
 * A field component is a field on a form like a text input. The following
 * properties can be set:
 *
 * - type - The type of field. Like "password" or "text".
 * - label - The text displayed in the field by default.
 * - border - The border around the field.
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - font - The font used.
 * - size - The size of the text.
 */
class cField extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "margin": "0",
        "padding": "0",
        "border": "0",
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px"
      },
      subs: [
        {
          id: this.entity.id + "_field",
          type: "input",
          attrib: {
            type: this.settings["type"] || "text",
            placeholder: this.settings["label"] || ""
          },
          css: {
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "padding": "2px",
            "margin": "0",
            "margin-left": "1px",
            "margin-top": "1px",
            "border": this.settings["border"] || "1px solid silver",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": String(this.settings["size"] || (this.entity.height - 10)) + "px",
            "cursor": Get_Image("Cursor.pic", true) + ", default"
          }
        }
      ]
    }, this.container);
  }

  /**
   * Gets the value from a field.
   * @return The field value.
   */
  Get_Value() {
    return this.elements[this.entity.id + "_field"].value;
  }

  /**
   * Sets a field value.
   * @param value The value of the field to set.
   */
  Set_Value(value) {
    this.elements[this.entity.id + "_field"].value = value;
  }

}

// **************************************************************************
// Panel
// **************************************************************************

/**
 * A panel is a small box where text can be displayed. The properties are:
 *
 * - label - The text to be displayed.
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - font - The font used.
 * - size - The size of the text.
 * - align - How to align the text in the panel.
 */
class cPanel extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let padding = parseInt(this.settings["padding"]) || 2;
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"] || "",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": String(this.entity.width - (padding * 2)) + "px",
        "height": (this.entity.height - (padding * 2)) + "px",
        "background-color": this.settings["bg-color"] || "white",
        "color": this.settings["fg-color"] || "black",
        "font-family": this.settings["font"] || "Regular, sans-serif",
        "font-size": String(this.settings["size"] || 16) + "px",
        "line-height": String(this.entity.height - (padding * 2)) + "px",
        "text-align": this.settings["align"] || "left",
        "padding": padding + "px"
      }
    }, this.container);
  }

}

// **************************************************************************
// Box
// **************************************************************************

/**
 * A box is like a panel but can be sized in height. The properties are:
 *
 * - label - The text to be displayed.
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - font - The font used.
 * - size - The size of the text.
 * - align - How to align the text in the panel.
 */
class cBox extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let center_vertical = (this.settings["center-vertical"] == "on") ? this.entity.height + "px" : "100%";
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"] || "",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-color": this.settings["bg-color"] || "white",
        "color": this.settings["fg-color"] || "black",
        "text-align": this.settings["align"] || "left",
        "line-height": center_vertical,
        "font-family": this.settings["font"] || "Regular, sans-serif",
        "font-size": String(this.settings["size"] || 16) + "px"
      }
    }, this.container);
  }

}

// **************************************************************************
// Button
// **************************************************************************

/**
 * This is a rectangular click button. The properties are:
 *
 * - fg-color - The color of the text.
 * - bg-color - The button color.
 * - label - The text to display on the button.
 */
class cButton extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"] || "",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-color": this.settings["bg-color"] || "blue",
        "color": this.settings["fg-color"] || "white",
        "font-weight": "bold",
        "text-align": "center",
        "line-height": this.entity.height + "px",
        "border-radius": "5px",
        "cursor": Get_Image("Cursor.pic", true) + ", default",
        "font-size": "16px",
        "font-family": "Regular, sans-serif"
      }
    }, this.container);
  }

  On(name, handler) {
    let component = this;
    this.elements[this.entity.id].addEventListener(name, function(event) {
      // Call handler here.
      handler(component, event);
    }, false);
  }

}

// **************************************************************************
// Select
// **************************************************************************

/**
 * Creates a select component. The properties are as follows:
 * - list - The list of options in the select. The list item are separated with a semicolon.
 * - bg_color - The background color.
 * - fg-color - The text color.
 * - border - The border of the select.
 * - font - The font to be used for the options.
 * - size - The size of the font.
 */
class cSelect extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.sel_index = -1;
    this.sel_text = "";
    this.Create();
  }

  Create() {
    let list = this.settings["list"];
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        {
          id: this.entity.id + "_select",
          type: "select",
          css: {
            "width": "calc(100% - 2px)",
            "height": "calc(100% - 2px)",
            "margin": "0",
            "padding": "2px",
            "margin-left": "1px",
            "margin-top": "1px",
            "background-color": this.settings["bg-color"] || "white",
            "color": this.settings["fg-color"] || "black",
            "border": this.settings["border"] || "1px solid silver",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": String(this.settings["size"] || (this.entity.height - 10)) + "px",
            "cursor": Get_Image("Cursor.pic", true) + ", default"
          }
        }
      ]
    }, this.container);
    // Attach list options.
    if (list != undefined) {
      let options = list.split(/\s*;\s*/);
      let option_count = options.length;
      for (let option_index = 0; option_index < option_count; option_index++) {
        let label = options[option_index].trim();
        let option = new Option(label, label);
        this.elements[this.entity.id + "_select"].add(option);
      }
    }
  }

  On(name, handler) {
    let component = this;
    this.elements[this.entity.id + "_select"].addEventListener(name, function(event) {
      this.sel_index = event.target.selectedIndex;
      this.sel_text = event.target.options[this.sel_index].text;
      handler(component, event);
    }, false);
  }

}

// **************************************************************************
// Edit
// **************************************************************************

/**
 * A very basic edit component. The properties are:
 *
 * @see cComponent:Make_Button
 */
class cEdit extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        this.Make_Edit(this.entity.id + "_edit", this.settings)
      ]
    }, this.container);
  }

  /**
   * Gets a value from the edit control.
   * @return The value of the editor.
   */
  Get_Value() {
    return this.elements[this.entity.id + "_edit"].value;
  }

  /**
   * Sets the value of the editor.
   * @param value The value to set the editor to.
   */
  Set_Value(value) {
    this.elements[this.entity.id + "_edit"].value = value;
  }

}

// **************************************************************************
// Checkbox
// **************************************************************************

/**
 * A checkbox is an object that can be checked on a form. The settings are
 * as follows:
 *
 * - label - The text to display beside the checkbox.
 * - fg-color - The text color.
 * - bg-color - The background color.
 *
 * A checkbox will have the property #checked#.
 */
class cCheckbox extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.checked = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "margin": "0",
        "padding": "0",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_checkbox",
          type: "input",
          attrib: {
            type: "checkbox"
          },
          css: {
            "margin": "0",
            "margin-left": "1px",
            "margin-top": "1px",
            "margin-right": "8px",
            "width": "32px",
            "height": "100%",
            "cursor": Get_Image("Cursor.pic", true) + ", default"
          }
        },
        {
          id: this.entity.id + "_label",
          type: "span",
          text: this.settings["label"] || "",
          css: {
            "font-family": "Regular, sans-serif",
            "font-size": String(this.entity.height - 4) + "px",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "line-height": this.entity.height + "px",
            "vertical-align": "top"
          }
        }
      ]
    }, this.container);
    // Handle click.
    let component = this;
    this.elements[this.entity.id + "_checkbox"].addEventListener("click", function(event) {
      component.checked = event.target.checked;
    }, false);
  }

  /**
   * Sets the checked state of the checkbox.
   * @param checked If set to true then the checkbox is 
   */
  Set_Checked(checked) {
    this.checked = checked;
    this.elements[this.entity.id + "_checkbox"].checked = checked;
  }

}

// **************************************************************************
// Radio Button
// **************************************************************************

/**
 * A radio object similar to a checkbox. The settings are as follows:
 *
 * - label - The text to display beside the checkbox.
 * - fg-color - The color of the text.
 * - bg-color - The background color.
 *
 * A radio button will have the property #checked#.
 */
class cRadio extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.checked = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        {
          id: this.entity.id + "_radio",
          type: "input",
          attrib: {
            type: "radio"
          },
          css: {
            "margin": "0",
            "margin-left": "1px",
            "margin-top": "1px",
            "margin-right": "8px",
            "width": "32px",
            "height": "100%",
            "cursor": Get_Image("Cursor.pic", true) + ", default"
          }
        },
        {
          id: this.entity.id + "_label",
          type: "span",
          text: this.settings["label"] || "",
          css: {
            "font-family": "Regular, sans-serif",
            "font-size": String(this.entity.height - 4) + "px",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "line-height": this.entity.height + "px",
            "vertical-align": "top"
          }
        }
      ]
    }, this.container);
    // Handle click.
    let component = this;
    this.elements[this.entity.id + "_radio"].addEventListener("click", function(event) {
      component.checked = event.target.checked;
    }, false);
  }

  On(name, handler) {
    let component = this;
    this.elements[this.entity.id + "_radio"].addEventListener(name, function(event) {
      handler(component, event);
    }, false);
  }

  /**
   * Sets the checked state of the radio button.
   * @param checked True if checked, false otherwise.
   */
  Set_Checked(checked) {
    this.elements[this.entity.id + "_radio"].checked = checked;
  }

}

// **************************************************************************
// Wiki
// **************************************************************************

/**
 * A wiki can display and edit markdown. The markdown is sent to the server
 * via a passcode. The properties are as follows:
 *
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - border - The border around the display.
 * - font - The display font.
 * - size - The size of the display font.
 * - file - The file to load the wiki from.
 *
 * @see cComponent:Make_Edit
 */
class cWiki extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px"
      },
      subs: [
        this.Make_Form(this.entity.id + "_form", [
          this.Make_Edit(this.entity.id, this.settings),
          this.Make_Button(this.entity.id + "_save", {
            "right": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Save",
            "bg-color": "lightgreen",
            "opacity": "0.8"
          }),
          this.Make_Button(this.entity.id + "_cancel", {
            "right": 16,
            "top": 5,
            "width": 64,
            "height": 32,
            "label": "Cancel",
            "bg-color": "lightblue",
            "opacity": "0.8"
          })
        ]),
        {
          id: this.entity.id + "_display",
          type: "div",
          css: {
            "position": "absolute",
            "left": "1px",
            "top": "1px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "padding": "2px",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": String(this.settings["size"] || 16) + "px",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "overflow": "scroll",
            "border": this.settings["border"] || "1px solid silver"
          }
        },
        this.Make_Button(this.entity.id + "_edit", {
          "right": 16,
          "bottom": 5,
          "width": 64,
          "height": 32,
          "label": "Edit",
          "opacity": 0.8,
          "bg-color": "lightblue",
          "opacity": "0.8"
        }),
        this.Make_Loading_Sign(),
        this.Make_Saving_Sign()
      ]
    }, this.container);
    this.Init_Loading_Click();
    this.Init_Saving_Click();
    // Load from file if specified.
    if (this.settings["file"]) {
      this.Load(this.settings["file"]);
    }
    let component = this;
    this.elements[this.entity.id + "_edit"].addEventListener("click", function(event) {
      component.Hide(component.entity.id + "_edit");
      component.Hide(component.entity.id + "_display");
      component.elements[component.entity.id].focus();
      component.elements[component.entity.id].setSelectionRange(0, 0);
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      component.elements[component.entity.id + "_display"].innerHTML = Format(component.elements[component.entity.id].value);
      component.Load_Wiki_Images();
      component.elements[component.entity.id + "_display"].scrollTop = 0;
      component.Show(component.entity.id + "_edit");
      component.Show(component.entity.id + "_display");
      // Save out to a file if specified.
      if (component.settings["file"]) {
        component.Toggle_Saving_Sign(true);
        let save_file = new cFile("Wiki/" + component.settings["file"]);
        save_file.data = component.elements[component.entity.id].value;
        save_file.on_write = function() {
          component.Toggle_Saving_Sign(false);
        };
        save_file.Write();
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      component.Show(component.entity.id + "_edit");
      component.Show(component.entity.id + "_display");
      component.elements[component.entity.id + "_display"].scrollTop = 0;
    }, false);
  }

  /**
   * Loads the wiki from a file and displays the contents.
   * @param file The file to load the wiki from.
   */
  Load(file) {
    this.settings["file"] = file;
    let component = this;
    this.Toggle_Loading_Sign(true);
    let wiki_file = new cFile("Wiki/" + file);
    wiki_file.on_read = function() {
      component.elements[component.entity.id + "_display"].innerHTML = Format(wiki_file.data);
      component.Load_Wiki_Images();
      component.elements[component.entity.id].value = wiki_file.data; // We need to load the edit control too.
      component.elements[component.entity.id + "_display"].scrollTop = 0;
      component.Toggle_Loading_Sign(false);
    };
    wiki_file.on_not_found = function() {
      component.elements[component.entity.id + "_display"].innerHTML = "";
      component.elements[component.entity.id].value = "";
      component.elements[component.entity.id + "_display"].scrollTop = 0;
      component.Toggle_Loading_Sign(false);
    };
    wiki_file.Read();
  }

  /**
   * Sets the file to save to.
   * @param file The file to save to.
   */
  Set_File(file) {
    this.settings["file"] = file;
  }

  /**
   * Loads a wiki document from an external file.
   * @param name The name of the file to load from. 
   */
  Load_External(name) {
    let component = this;
    this.Toggle_Loading_Sign(true);
    let wiki_file = new cFile("Wiki/" + name + ".txt");
    wiki_file.on_read = function() {
      component.elements[component.entity.id + "_display"].innerHTML = Format(wiki_file.data);
      component.Load_Wiki_Images();
      component.elements[component.entity.id].value = wiki_file.data; // We need to load the edit control too.
      component.elements[component.entity.id + "_display"].scrollTop = 0;
      component.Toggle_Loading_Sign(false);
    };
    wiki_file.on_not_found = function() {
      component.elements[component.entity.id + "_display"].innerHTML = "";
      component.elements[component.entity.id].value = "";
      component.elements[component.entity.id + "_display"].scrollTop = 0;
      component.Toggle_Loading_Sign(false);
    };
    wiki_file.Read();
  }

  /**
   * Loads all images of the wiki. Focuses on Frankus pictures.
   */
  Load_Wiki_Images() {
    let container = this.elements[this.entity.id + "_display"];
    let images = container.getElementsByTagName("img");
    let image_count = images.length;
    for (let image_index = 0; image_index < image_count; image_index++) {
      let image = images[image_index];
      let url = image.src;
      if (!url.match(/png|jpg/)) { // Leave PNG or JPEG images alone.
        this.Load_Image_Element(url, image);
      }
    }
  }

}

// **************************************************************************
// Picture
// **************************************************************************

/**
 * A static picture to place on a web page. The options are as follows:
 *
 * image - The file to load the picture from.
 * root - Where to load the picture from.
 */
class cPicture extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.root = "Images";
    this.Create();
  }

  Create() {
    this.canvas = this.Create_Element({
      id: this.entity.id,
      type: "canvas",
      attrib: {
        width: this.entity.width - 2,
        height: this.entity.height - 2
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      }
    }, this.container);
    this.surface = this.canvas.getContext("2d");
    if (this.settings["root"]) {
      this.Change_Image_Root(this.settings["root"]);
    }
    this.Load(this.settings["image"]);
  }

  /**
   * Outputs an error to the image.
   * @param message The error message.
   */
  Output_Error(message) {
    this.surface.save();
    this.surface.font = "12px Regular";
    this.surface.fillStyle = "red";
    this.surface.fillText(message, 0, 12);
    this.surface.restore();
  }

  /**
   * Clears out the picture.
   */
  Clear() {
    this.surface.save();
    this.surface.fillStyle = "transparent";
    this.surface.fillRect(0, 0, this.entity.width - 2, this.entity.height - 2);
    this.surface.restore();
  }

  /**
   * Loads up a picture.
   * @param name The name of the picture to load. 
   */
  Load(name) {
    let image = new cImage();
    let component = this;
    image.on_load = function() {
      image.Draw(component.surface);
    };
    image.on_error = function() {
      component.Output_Error("No image loaded.");
    };
    image.on_not_found = function() {
      component.Output_Error("Image not found.");
    };
    image.Load(this.root + "/" + name);
  }

  /**
   * Changes the image root to a different location.
   * @param folder The root folder to load the image from.
   */
  Change_Image_Root(folder) {
    this.root = folder;
  }

}

// **************************************************************************
// Menu
// **************************************************************************

/**
 * A side menu component. Items are displayed from top down and a scrollbar is
 * present in the menu. Each menu item is separated by a semicolon. Each item
 * consists of a pair specifying the label and image respectively. A menu item
 * can have either text or an image.
 *
 * Properties are as follows:
 *
 * - items - The menu items with each separated by a semicolon.
 * - height - The height of each menu item.
 * - fg-color - The color of the font.
 * - bg-color - The background color.
 * - highlight-color - The color of the menu item selected.
 * - file - The file with the items to load.
 * - filter - If set to on then a filter is shown.
 */
class cMenu extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.item_selected = "";
    this.handler = null;
    this.sel_text = "";
    this.items = [];
    this.timer = null;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_menu_area",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        this.Make_Form(this.entity.id + "_form", [
          this.Make_Edit(this.entity.id + "_editor", this.settings),
          this.Make_Button(this.entity.id + "_save", {
            "left": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Save",
            "bg-color": "lightgreen",
            "opacity": "0.5"
          }),
          this.Make_Button(this.entity.id + "_cancel", {
            "right": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Cancel",
            "bg-color": "lightblue",
            "opacity": "0.5"
          })
        ]),
        {
          id: this.entity.id,
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": (this.settings["filter"] == "on") ? "calc(100% - 24px)" : "100%",
            "overflow-y": "scroll",
            "background-color": this.settings["bg-color"] || "white"
          }
        },
        this.Make_Button(this.entity.id + "_edit", {
          "right": 16,
          "bottom": (this.settings["filter"] == "on") ? 29 : 5,
          "width": 64,
          "height": 32,
          "label": "Edit",
          "bg-color": "lightgreen",
          "opacity": "0.5"
        }),
        {
          id: this.entity.id + "_search_area",
          type: "div",
          css: {
            "width": "100%",
            "height": "24px",
            "position": "absolute",
            "left": "0",
            "bottom": "0",
            "background-color": "white",
            "display": (this.settings["filter"] == "on") ? "block": "none"
          },
          subs: [
            this.Make_Form(this.entity.id + "_search_form", [
              this.Make_Field(this.entity.id + "_search", {
                "type": "text",
                "fg-color": "black",
                "bg-color": "white",
                "height": 24,
                "label": "Search terms."
              })
            ])
          ]
        }
      ]
    }, this.container);
    // Set up handlers for buttons.
    let component = this;
    this.elements[this.entity.id + "_edit"].addEventListener("click", function(event) {
      component.Hide(component.entity.id + "_edit");
      component.Hide(component.entity.id);
      component.Hide(component.entity.id + "_search_area");
      component.elements[component.entity.id + "_editor"].focus();
      component.elements[component.entity.id + "_editor"].setSelectionRange(0, 0);
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      component.Show(component.entity.id + "_edit");
      component.Show(component.entity.id);
      if (component.settings["filter"] == "on") {
        component.Show(component.entity.id + "_search_area");
      }
      let items = Split(component.elements[component.entity.id + "_editor"].value);
      component.items = items.slice(0);
      component.Load_Menu(items, component.elements[component.entity.id]);
      if (component.settings["file"]) {
        let save_file = new cFile("Menu/" + component.settings["file"]);
        save_file.data = component.elements[component.entity.id + "_editor"].value;
        save_file.Write();
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      component.Show(component.entity.id + "_edit");
      component.Show(component.entity.id);
      if (component.settings["filter"] == "on") {
        component.Show(component.entity.id + "_search_area");
      }
    }, false);
    this.elements[this.entity.id + "_search"].addEventListener("keydown", function(event) {
      if (component.timer) {
        clearTimeout(component.timer);
      }
      component.timer = setTimeout(function() {
        let items = component.Search_Menu(component.elements[component.entity.id + "_search"].value);
        component.Load_Menu(items, component.elements[component.entity.id]);
        component.timer = null; // Make timer free.
      }, 500);
    }, false);
    if (this.settings["items"]) {
      let items = this.settings["items"].split(/\s*;\s*/);
      this.items = items.slice(0);
      this.Load_Menu(items, this.elements[this.entity.id]);
      // Set editor data.
      this.elements[this.entity.id + "_editor"].value = items.join("\n");
    }
    else if (this.settings["file"]) {
      let menu_file = new cFile("Menu/" + this.settings["file"]);
      menu_file.on_read = function() {
        let items = menu_file.lines;
        component.items = items.slice(0);
        component.Load_Menu(items, component.elements[component.entity.id]);
        component.elements[component.entity.id + "_editor"].value = items.join("\n");
      };
      menu_file.Read();
    }
  }

  /**
   * Internal routine to load the menu. It will replace the menu with new items.
   * @param items All items to be loaded as an array.
   * @param container The container to load the menu in.
   */
  Load_Menu(items, container) {
    this.item_selected = ""; // Clear out selected item.
    this.Remove_Elements(container);
    // Format for items:
    //
    // label:image
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let options = item.split(/\s*\:\s*/);
      let label = options[0];
      let image = options[1];
      let layout = this.Create_Element({
        id: this.entity.id + "_item_" + item_index,
        text: label,
        type: "div",
        css: {
          "width": "calc(100% - 8px)",
          "height": "calc(" + (this.settings["height"] || 24) + "px - 8px)",
          "overflow": "hidden",
          "padding": "4px",
          "cursor": String(Get_Image("Cursor.pic", true) + ", default"),
          "line-height": "calc(" + (this.settings["height"] || 24) + "px - 8px)",
          "font-family": "Regular, sans-serif",
          "font-size": String((this.settings["height"] || 24) - 8) + "px",
          "color": this.settings["fg-color"] || "black",
          "background-image": (image.length > 0) ? Get_Image(image, true) : "none",
          "background-repeat": "no-repeat",
          "background-color": this.settings["bg-color"] || "transparent",
          "overflow": "hidden",
          "text-indent": (image.length > 0) ? String((this.settings["height"] || 24) + "px") : "0"
        }
      }, container);
      let component = this;
      this.elements[this.entity.id + "_item_" + item_index].addEventListener("click", function(event) {
        let name = event.target.frankus_id;
        // Highlight the menu item to show position.
        if (component.item_selected.length > 0) {
          component.Change_Color(component.item_selected, component.settings["bg-color"] || "transparent");
        }
        component.Change_Color(name, component.settings["highlight-color"] || "lightblue");
        component.item_selected = name;
        component.sel_text = event.target.innerHTML;
        if (component.handler) {
          component.handler(component, event);
        }
      }, false);
    }
  }

  /**
   * Searches a menu and returns only the items in the search.
   * @param search The search string.
   * @return The menu items to display.
   */
  Search_Menu(search) {
    let items = [];
    if (search.length > 0) {
      let terms = search.split(/\s+/);
      let search_exp = new RegExp(terms.join("|"), "i");
      let item_count = this.items.length;
      for (let item_index = 0; item_index < item_count; item_index++) {
        let item = this.items[item_index];
        if (item.match(search_exp)) {
          items.push(item);
        }
      }
    }
    else {
      items = this.items.slice(0);
    }
    return items;
  }

  /**
   * You pass in the handler here. To get the selected item you can either use
   * the component property #sel_text# or #item_selected#. With #item_selected#
   * you will access item menu item by number. The item selected is specified as
   * #<component_id>_item_<item_index>#.
   */
  On(name, handler) {
    this.handler = handler;
  }

  /**
   * Loads a menu from an external file.
   * @param name The name of the file to load the menu from.
   */
  Load_External(name) {
    let component = this;
    let menu_file = new cFile("Menu/" + name + ".txt");
    menu_file.on_read = function() {
      let items = menu_file.lines;
      component.items = items.slice(0);
      component.Load_Menu(items, component.elements[component.entity.id]);
      component.elements[component.entity.id + "_editor"].value = items.join("\n");
    };
    menu_file.Read();
  }

  /**
   * Loads a menu from a list.
   * @param list The list of menu items in menu format. 
   */
  Load_From_List(list) {
    this.items = list.slice(0);
    this.Load_Menu(list, this.elements[this.entity.id]);
    this.elements[this.entity.id + "_editor"].value = list.join("\n");
  }

  /**
   * Saves the menu list to a file.
   * @param name The name of the file to save to.
   */
  Save(name) {
    let save_file = new cFile("Menu/" + name + ".txt");
    save_file.data = this.elements[this.entity.id + "_editor"].value;
    save_file.Write();
  }

  /**
   * Adds an item to the menu.
   * @param item The item to add in menu format. 
   */
  Add_Item(item) {
    this.items.push(item);
    this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
    this.Load_Menu(this.items, this.elements[this.entity.id]);
  }

  /**
   * Removes an item given the index.
   * @param index The index of the item. 
   */
  Remove_Item(index) {
    if (this.items[index] != undefined) {
      this.items.splice(index, 1);
      this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
      this.Load_Menu(this.items, this.elements[this.entity.id]);
    }
  }

  /**
   * Gets the index of the selected item.
   * @return The index of the selected item.
   */
  Get_Selected_Index() {
    let index = -1;
    if (this.item_selected.length > 0) {
      index = parseInt(this.item_selected.split(/_item_/).pop());
    }
    return index;
  }

  /**
   * Clears out the menu.
   */
  Clear() {
    this.items = [];
    this.elements[this.entity.id + "_editor"].value = "";
    this.Load_Menu(this.items, this.elements[this.entity.id]);
  }

  /**
   * Updates an item by index.
   * @param value The menu item value.
   * @param index The item index.
   */
  Update_Item(value, index) {
    if (this.items[index] != undefined) {
      this.items[index] = value;
      this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
      this.Load_Menu(this.items, this.elements[this.entity.id]);
    }
  }

}

// **************************************************************************
// Toolbar
// **************************************************************************

/**
 * A toolbar consists of a group a icons going out to the side. It is a graphical
 * menu. The data is formatted like in a menu.
 * @see cMenu:constructor
 *
 * Properties are as follows:
 *
 * - items - The menu items.
 * - file - The file to load the items from. The items are line separated.
 */
class cToolbar extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.handler = null;
    this.sel_text = "";
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow-y": "scroll"
      }
    }, this.container);
    if (this.settings["items"]) {
      let items = this.settings["items"].split(/\s*;\s*/);
      this.Load_Toolbar(items, layout);
    }
    else if (this.settings["file"]) {
      let component = this;
      let tool_file = new cFile("Toolbar/" + this.settings["file"]);
      tool_file.on_read = function() {
        let items = tool_file.lines;
        component.Load_Toolbar(items, layout);
      };
      tool_file.Read();
    }
  }

  /**
   * Loads the toolbar with a list of items.
   * @param items An array of pairs to load. Format is image:label.
   * @param container The container to load the items into.
   */
  Load_Toolbar(items, container) {
    // Item Format:
    //
    // image:label
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let options = item.split(/\s*:\s*/);
      let image = options[0];
      let label = options[1];
      let layout = this.Create_Element({
        id: this.entity.id + "_tool_" + item_index,
        type: "div",
        attrib: {
          title: label
        },
        css: {
          "width": String(this.entity.height - 2) + "px",
          "height": String(this.entity.height - 2) + "px",
          "background-image": Get_Image(image, true),
          "background-repeat": "no-repeat",
          "background-size": String(this.entity.height - 2) + "px " + String(this.entity.height - 2) + "px",
          "cursor": String(Get_Image("Cursor.pic", true) + ", default"),
          "margin-right": String(this.settings["spacing"] || 4) + "px",
          "float": "left"
        }
      }, container);
      // Create click handler.
      let component = this;
      this.elements[this.entity.id + "_tool_" + item_index].addEventListener("click", function(event) {
        let name = event.target.frankus_id;
        component.sel_text = component.elements[name].title;
        if (component.handler) {
          component.handler(component, event);
        }
      }, false);
    }
  }

  /**
   * @see cMenu:On
   *
   * #Note:# Only the selected text from the label is set.
   */
  On(name, handler) {
    this.handler = handler;
  }

}

// **************************************************************************
// Image Button
// **************************************************************************

/**
 * This is a button with an image as a background. The properties are as
 * follows:
 *
 * - label - The text to display on the button.
 * - image - The file to load the button image from.
 * - hover - The hover image which is optional.
 * - link - The page to go to when clicked.
 * - font - The font to use for the button.
 * - size - The size of the font in pixels.
 * - color - The color of the label.
 * - popup - The text to display on the hover popup.
 * - orientation - Can be set to "down" to display popup under button.
 * - links - A list of links to display in drop menu. Also affected by orientation.
 */
class cImage_Button extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.hov_loaded = false;
    this.handlers = [];
    this.Create();
  }

  Create() {
    let component = this;
    let image = new cImage();
    image.on_load = function() {
      let layout = component.Create_Element({
        id: component.entity.id,
        type: "div",
        text: component.settings["label"],
        css: {
          "position": "absolute",
          "left": String(component.entity.x + 1) + "px",
          "top": String(component.entity.y + 1) + "px",
          "width": String(component.entity.width - 2) + "px",
          "height": String(component.entity.height - 2) + "px",
          "background-image": Get_Image(component.settings["image"], true),
          "background-repeat": "no-repeat",
          "text-align": "center",
          "line-height": String(component.entity.height - 2) + "px",
          "font-family": component.settings["font"] || "Regular, sans-serif",
          "font-size": String(component.settings["size"] || 24) + "px",
          "font-weight": "bold",
          "color": component.settings["color"] || "white",
          "cursor": String(Get_Image("Cursor.pic", true) + ", default")
        }
      }, component.container);
      let orientation = (component.settings["orientation"] == "down") ? component.settings["orientation"] : "normal";
      let popup = component.Create_Element({
        id: component.entity.id + "_popup",
        type: "div",
        text: component.settings["popup"],
        css: {
          "position": "absolute",
          "left": (orientation == "down") ? String(component.entity.x) + "px" : String(component.entity.x + component.entity.width) + "px",
          "top": (orientation == "down") ? String(component.entity.y + component.entity.height) + "px" : String(component.entity.y) + "px",
          "width": "150px",
          "height": "70px",
          "color": "black",
          "background-color": "white",
          "padding": "4px",
          "border": "1px solid #9DC4CF",
          "border-radius": "10px",
          "overflow": "hidden",
          "font-size": "14px",
          "z-index": "10",
          "display": "none"
        }
      }, component.container);
      let drop_menu = component.Create_Element({
        id: component.entity.id + "_drop_menu",
        type: "div",
        css: {
          "position": "absolute",
          "left": (orientation == "down") ? String(component.entity.x) + "px" : String(component.entity.x + component.entity.width) + "px",
          "top": (orientation == "down") ? String(component.entity.y + component.entity.height) + "px" : String(component.entity.y) + "px",
          "width": "158px",
          "height": "auto",
          "border": "1px solid silver",
          "background-color": "#ECF2FF",
          "display": "none"
        },
        subs: [
          {
            id: component.entity.id + "_menu_title",
            type: "div",
            text: component.settings["label"],
            css: {
              "width": "calc(100% - 8px)",
              "height": "24px",
              "line-height": "24px",
              "font-size": "20px",
              "border": "1px solid silver",
              "margin": "1px",
              "padding": "2px",
              "text-align": "center",
              "font-weight": "bold",
              "background-color": "#BDCEF1"
            }
          }
        ]
      }, component.container);
      // Add links.
      if (component.settings["links"]) {
        let links = component.settings["links"].split(/;/);
        let link_count = links.length;
        for (let link_index = 0; link_index < link_count; link_index++) {
          let pair = links[link_index].split(/:/);
          let label = pair[0];
          let page = pair[1];
          let menu_item = component.Create_Element({
            id: component.entity.id + "_menu_item_" + link_index,
            type: "div",
            text: label,
            css: {
              "width": "calc(100% - 8px)",
              "height": "24px",
              "line-height": "24px",
              "font-size": "16px",
              "border": "1px solid silver",
              "margin": "1px",
              "padding": "2px",
              "text-align": "center"
            }
          }, component.entity.id + "_drop_menu");
          menu_item.frankus_link = page;
          menu_item.addEventListener("click", function(event) {
            let element = event.currentTarget;
            let link = element.frankus_link;
            drop_menu.style.display = "none";
            if (link.match(/^\[[^\]]+\]$/)) {
              let url = http + link.replace(/^\[([^\]]+)\]$/, "$1");
              window.open(url);
            }
            else {
              if (frankus_layout) {
                frankus_layout.Flip_Page(link);
              }
            }
          }, false);
          menu_item.addEventListener("mouseover", function(event) {
            let element = event.currentTarget;
            element.style.backgroundColor = "yellow";
          }, false);
          menu_item.addEventListener("mouseout", function(event) {
            let element = event.currentTarget;
            element.style.backgroundColor = "transparent";
          }, false);
        }
      }
      let hov_image = null;
      if (component.settings["hover"]) {
        hov_image = new cImage();
        hov_image.on_load = function() {
          component.hov_loaded = true;
        };
        hov_image.Load(Get_Image(component.settings["hover"], false));
      }
      layout.addEventListener("mouseover", function(event) {
        if (component.hov_loaded) {
          layout.style.backgroundImage = 'url("' + hov_image.Get_Data_URL() + '")';
        }
        if (component.settings["popup"]) {
          component.elements[component.entity.id + "_popup"].style.display = "block";
        }
      }, false);
      layout.addEventListener("mouseout", function(event) {
        if (component.hov_loaded) {
          layout.style.backgroundImage = 'url("' + image.Get_Data_URL() + '")';
        }
        if (component.settings["popup"]) {
          component.elements[component.entity.id + "_popup"].style.display = "none";
        }
      }, false);
      if (component.settings["link"]) {
        layout.addEventListener("click", function(event) {
          if (frankus_layout) {
            frankus_layout.Flip_Page(component.settings["link"]);
          }
        }, false);
      }
      if (component.settings["links"]) {
        layout.addEventListener("click", function(event) {
          let menu = component.elements[component.entity.id + "_drop_menu"];
          if (menu.style.display == "none") {
            menu.style.display = "block";
            if (component.settings["popup"]) {
              component.elements[component.entity.id + "_popup"].style.display = "none";
            }
          }
          else {
            menu.style.display = "none";
          }
        }, false);
      }
      // Process handlers here.
      let handler_count = component.handlers.length;
      for (let handler_index = 0; handler_index < handler_count; handler_index++) {
        let handler = component.handlers[handler_index];
        component.elements[component.entity.id].frankus_handler = handler.handler;
        component.elements[component.entity.id].addEventListener(handler.name, function(event) {
          // Call handler here.
          event.target.frankus_handler(component, event);
        }, false);
      }
    };
    image.on_not_found = function() {
      let layout = component.Create_Element({
        id: component.entity.id,
        type: "div",
        text: "No image loaded.",
        css: {
          "position": "absolute",
          "left": String(component.entity.x + 1) + "px",
          "top": String(component.entity.y + 1) + "px",
          "width": String(component.entity.width - 2) + "px",
          "height": String(component.entity.height - 2) + "px",
          "line-height": String(component.entity.height - 2) + "px",
          "text-align": "center",
          "color": "black",
          "font-family": "Regular, sans-serif",
          "font-size": "16px"
        }
      }, component.container);
    };
    image.Load(Get_Image(this.settings["image"], false));
  }

  On(name, handler) {
    if (this.elements[this.entity.id] != undefined) { // Possible cache loading.
      let component = this;
      this.elements[this.entity.id].addEventListener(name, function(event) {
        handler(component, event);
      }, false);
    }
    else { // Network loading.
      this.handlers.push({
        name: name,
        handler: handler
      });
    }
  }

}

// **************************************************************************
// Label
// **************************************************************************

/**
 * This is a simple label that you can place anywhere on the screen.
 * The settings are as follows:
 *
 * - label - The text to display on the label.
 * - font - The font to use for the label.
 * - size - The size of the font in pixels.
 * - color - The color of the text on the label.
 * - center - Whether the text is centered. Set to "on" or "off".
 * - bold - Turn on bolding or not. Set to "on" or "off".
 */
class cLabel extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"].replace(/\(c\)/g, ","), // Replace commas.
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) +"px",
        "font-family": this.settings["font"] || "Regular",
        "font-size": String(this.settings["size"] || 20) + "px",
        "color": this.settings["color"] || "black",
        "text-align": (this.settings["center"] == "off") ? "left" : "center",
        "line-height": String(this.entity.height - 2) + "px",
        "font-weight": (this.settings["bold"] == "on") ? "bold" : "normal"
      }
    }, this.container);
  }

}

// **************************************************************************
// Marquee
// **************************************************************************

/**
 * This is a scrolling marquee. The properties are as follows:
 *
 * - delay - The scroll speed delay.
 * - speed - The speed of the scroll.
 * - label - The text to be displayed.
 * - font - The font to be used.
 * - size - The size of the font.
 * - color - The color of the text.
 */
class cMarquee extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.timer = null;
    this.pos = this.entity.width;
    this.Create();
  }

  Create() {
    let size = this.settings["size"] || "16";
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_marquee",
          type: "div",
          text: this.settings["label"],
          css: {
            "position": "absolute",
            "left": String(this.entity.width) + "px",
            "top": "1px",
            "width": String(this.settings["label"].length * parseInt(size)) + "px",
            "height": String(this.entity.height - 2) + "px",
            "font-family": this.settings["font"] || "Regular",
            "font-size": size + "px",
            "color": this.settings["color"] || "black"
          }
        }
      ]
    }, this.container);
    // Set up the timer.
    this.Set_Timer();
  }

  /**
   * Sets up the timer and scrolling.
   */
  Set_Timer() {
    let component = this;
    this.timer = setInterval(function() {
      let marquee = component.elements[component.entity.id + "_marquee"];
      component.pos -= component.settings["speed"];
      if (component.pos < -marquee.clientWidth) {
        component.pos = component.entity.width;
      }
      marquee.style.left = String(component.pos) + "px";
    }, this.settings["delay"]);
  }

  /**
   * Pause execution of the timer.
   */
  Pause() {
    clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Resume the execution of the timer.
   */
  Resume() {
    this.Set_Timer();
  }

}

// **************************************************************************
// Tool Palette
// **************************************************************************

/**
 * A tool palette is a collection of tools arranged in rows and columns,
 * like on a grid. The data is formatted like the menu.
 * @see cMenu:constructor
 *
 * Properties are as follows:
 *
 * - items - The list of items to appear in the tool palette.
 * - file - A file containing the list of items. These are line separated.
 * - columns - The number of columns.
 * - scale - How big the icons should be. This can be in percent or pixels.
 * - filter - Set this to "on" to turn on the search filter.
 * - labels - Option to turn on labels.
 */
class cTool_Palette extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.item_selected = "";
    this.items = [];
    this.timer = null;
    this.sel_text = "";
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_tool_area",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        this.Make_Form(this.entity.id + "_form", [
          this.Make_Edit(this.entity.id + "_editor", this.settings),
          this.Make_Button(this.entity.id + "_save", {
            "left": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Save",
            "bg-color": "lightgreen",
            "opacity": "0.5"
          }),
          this.Make_Button(this.entity.id + "_cancel", {
            "right": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Cancel",
            "bg-color": "lightblue",
            "opacity": "0.5"
          })
        ]),
        {
          id: this.entity.id,
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": (this.settings["filter"] == "on") ? "calc(100% - 24px)" : "100%",
            "overflow-y": "scroll",
            "background-color": this.settings["bg-color"] || "white"
          }
        },
        this.Make_Button(this.entity.id + "_edit", {
          "right": 16,
          "bottom": (this.settings["filter"] == "on") ? 29 : 5,
          "width": 64,
          "height": 32,
          "label": "Edit",
          "bg-color": "lightgreen",
          "opacity": "0.5"
        }),
        {
          id: this.entity.id + "_search_area",
          type: "div",
          css: {
            "width": "100%",
            "height": "24px",
            "position": "absolute",
            "left": "0",
            "bottom": "0",
            "background-color": "white",
            "display": (this.settings["filter"] == "on") ? "block": "none"
          },
          subs: [
            this.Make_Form(this.entity.id + "_search_form", [
              this.Make_Field(this.entity.id + "_search", {
                "type": "text",
                "fg-color": "black",
                "bg-color": "white",
                "height": 24,
                "label": "Search terms."
              })
            ])
          ]
        }
      ]
    }, this.container);
    // Set up handlers for buttons.
    let component = this;
    this.elements[this.entity.id + "_edit"].addEventListener("click", function(event) {
      component.Hide(component.entity.id + "_edit");
      component.Hide(component.entity.id);
      component.Hide(component.entity.id + "_search_area");
      component.elements[component.entity.id + "_editor"].focus();
      component.elements[component.entity.id + "_editor"].setSelectionRange(0, 0);
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      component.Show(component.entity.id + "_edit");
      component.Show(component.entity.id);
      if (component.settings["filter"] == "on") {
        component.Show(component.entity.id + "_search_area");
      }
      let items = Split(component.elements[component.entity.id + "_editor"].value);
      component.items = items.slice(0);
      component.Load_Tools(items, component.elements[component.entity.id]);
      if (component.settings["file"]) {
        let save_file = new cFile("Toolbar/" + component.settings["file"]);
        save_file.data = component.elements[component.entity.id + "_editor"].value;
        save_file.Write();
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      component.Show(component.entity.id + "_edit");
      component.Show(component.entity.id);
      if (component.settings["filter"] == "on") {
        component.Show(component.entity.id + "_search_area");
      }
      component.elements[component.entity.id + "_editor"].value = component.items.join("\n");
    }, false);
    this.elements[this.entity.id + "_search"].addEventListener("keydown", function(event) {
      if (component.timer) {
        clearTimeout(component.timer);
      }
      component.timer = setTimeout(function() {
        let items = component.Search_Tools(component.elements[component.entity.id + "_search"].value);
        component.Load_Tools(items, component.elements[component.entity.id]);
        component.timer = null; // Make timer free.
      }, 500);
    }, false);
    if (this.settings["items"]) {
      let items = this.settings["items"].split(/\s*;\s*/);
      this.items = items.slice(0);
      this.Load_Tools(items, this.elements[this.entity.id]);
      // Set editor data.
      this.elements[this.entity.id + "_editor"].value = items.join("\n");
    }
    else if (this.settings["file"]) {
      let component = this;
      let tool_file = new cFile("Toolbar/" + this.settings["file"]);
      tool_file.on_read = function() {
        let items = tool_file.lines;
        component.items = items.slice(0);
        component.Load_Tools(items, component.elements[component.entity.id]);
        component.elements[component.entity.id + "_editor"].value = items.join("\n");
      };
      tool_file.Read();
    }
  }

  /**
   * Loads the tool palette with the tools.
   * @param items An array of pairs to load. Format is image:label.
   * @param container The container to load the items into.
   */
  Load_Tools(items, container) {
    this.item_selected = "";
    this.Remove_Elements(container);
    // Item Format:
    //
    // image:label
    let entity_w = this.entity.width - 2;
    let width = (this.settings["columns"]) ? Math.floor(entity_w / parseInt(this.settings["columns"])) : Math.floor(entity_w / 2);
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let options = item.split(/\s*:\s*/);
      let image = options[0];
      let label = options[1];
      let layout = this.Create_Element({
        id: this.entity.id + "_tool_" + item_index,
        type: "div",
        attrib: {
          title: label
        },
        css: {
          "width": String(width - 10) + "px",
          "height": String(width- 10) + "px",
          "background-image": Get_Image(image, true),
          "background-repeat": "no-repeat",
          "background-position": "center center",
          "background-size": (this.settings["scale"]) ? String(this.settings["scale"]) + " " + String(this.settings["scale"]): "100% 100%",
          "cursor": String(Get_Image("Cursor.pic", true) + ", default"),
          "float": "left",
          "margin-right": "2px",
          "margin-bottom": "5px",
          "position": "relative"
        },
        subs: [
          {
            id: this.entity.id + "_tool_label_" + item_index,
            type: "div",
            text: label,
            css: {
              "position": "absolute",
              "font-size": "10px",
              "text-align": "center",
              "width": String(width - 10) + "px",
              "height": "12px",
              "bottom": "-8px",
              "display": (this.settings["labels"] == "on") ? "block" : "none",
              "overflow": "hidden"
            }
          }
        ]
      }, container);
      // Create click handler.
      let component = this;
      this.elements[this.entity.id + "_tool_" + item_index].addEventListener("click", function(event) {
        let name = event.target.frankus_id;
        component.sel_text = component.elements[name].title;
        component.item_selected = name;
        if (component.handler) {
          component.handler(component, event);
        }
      }, false);
    }
  }

  /**
   * Searches the tools and returns only the items in the search.
   * @param search The search string.
   * @return The tool items to display.
   */
  Search_Tools(search) {
    let items = [];
    if (search.length > 0) {
      let terms = search.split(/\s+/);
      let search_exp = new RegExp(terms.join("|"), "i");
      let item_count = this.items.length;
      for (let item_index = 0; item_index < item_count; item_index++) {
        let item = this.items[item_index];
        if (item.match(search_exp)) {
          items.push(item);
        }
      }
    }
    else {
      items = this.items.slice(0);
    }
    return items;
  }

  /**
   * @see cMenu:On
   *
   * #Note:# Only the selected text from the label is set.
   */
  On(name, handler) {
    this.handler = handler;
  }

  /**
   * Loads a tool palette from an external file.
   * @param name The name of the file to load the tool palette from.
   */
  Load_External(name) {
    let component = this;
    let tool_file = new cFile("Toolbar/" + name + ".txt");
    tool_file.on_read = function() {
      let items = tool_file.lines;
      component.items = items.slice(0);
      component.Load_Tools(items, component.elements[component.entity.id]);
      component.elements[component.entity.id + "_editor"].value = items.join("\n");
    };
    tool_file.Read();
  }

  /**
   * Loads a tool palette from a list.
   * @param list The list of tool items in menu format. 
   */
  Load_From_List(list) {
    this.items = list.slice(0);
    this.Load_Tools(list, this.elements[this.entity.id]);
    this.elements[this.entity.id + "_editor"].value = list.join("\n");
  }

  /**
   * Saves the tool palette to a file.
   * @param name The name of the file to save to.
   */
  Save(name) {
    let save_file = new cFile("Toolbar/" + name + ".txt");
    save_file.data = this.elements[this.entity.id + "_editor"].value;
    save_file.Write();
  }

  /**
   * Adds an item to the tool palette.
   * @param item The item to add in menu format. 
   */
  Add_Item(item) {
    this.items.push(item);
    this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
    this.Load_Tools(this.items, this.elements[this.entity.id]);
  }

  /**
   * Removes an item given the index.
   * @param index The index of the item. 
   */
  Remove_Item(index) {
    if (this.items[index] != undefined) {
      this.items.splice(index, 1);
      this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
      this.Load_Tools(this.items, this.elements[this.entity.id]);
    }
  }

  /**
   * Gets the index of the selected item.
   * @return The index of the selected item.
   */
  Get_Selected_Index() {
    let index = -1;
    if (this.item_selected.length > 0) {
      index = parseInt(this.item_selected.split(/_tool_/).pop());
    }
    return index;
  }

  /**
   * Clears out the tool palette.
   */
  Clear() {
    this.items = [];
    this.elements[this.entity.id + "_editor"].value = "";
    this.Load_Tools(this.items, this.elements[this.entity.id]);
  }

}

// **************************************************************************
// Grid View
// **************************************************************************

/**
 * A grid view is a table-like component which allows values
 * to be entered or selected from letious controls.
 *
 * Properties are as follows:
 *
 * - file - A file to load the table from. It is tab delimited. You
 *          can create this file from a spreadsheet.
 * - fg-color - The color of the text in the grid.
 * - bg-color - The background color of the grid.
 *
 * The table data is formatted as follows:
 *
 * - Each cell is tab delimited while rows are delimited by new lines.
 * - Cells may contain a value which can be textual or numeric. If the
 *   value is within brackets then it is editable. Multiple values can
 *   be separated by commas.
 *
 */
class cGrid_View extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.row_count = 0;
    this.col_count = 0;
    this.Create();
  }

  Create() {
    let grid_area = this.Create_Element({
      id: this.entity.id + "_grid_area",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow-y": "scroll",
        "background-color": (this.settings["bg-color"]) ? this.settings["bg-color"] : "silver"
      }
    }, this.container);
    // Load up table.
    if (this.settings["file"]) {
      this.Load_Table(this.settings["file"]);
    }
    else if (this.settings["rows"] && this.settings["columns"]) {
      this.Create_Blank_Table(parseInt(this.settings["rows"]), parseInt(this.settings["columns"]));
    }
  }

  /**
   * Loads a table from a file.
   * @param name The name of the table file to load.
   */
  Load_Table(name) {
    // Now load the new table.
    let component = this;
    let grid_file = new cFile("Grid/" + name);
    grid_file.on_read = function() {
      component.Build_View(grid_file.data);
    };
    grid_file.Read();
  }

  /**
   * Creates a blank table of rows and columns.
   * @param rows The number of rows in the table.
   * @param columns The number of columns in the table.
   */
  Create_Blank_Table(rows, columns) {
    let data = [];
    for (let row_index = 0; row_index < rows; row_index++) {
      let cols = [];
      for (let col_index = 0; col_index < columns; col_index++) {
        cols.push("");
      }
      data.push(cols.join("\t"));
    }
    this.Build_View(data.join("\n"));
  }

  /**
   * Gets the value of a cell at a specific coordinate.
   * @param x The column coordinate.
   * @param y The row coordinate.
   * @return The value at the location.
   * @throws An error if the coordinate are invalid.
   */
  Get_Value(x, y) {
    let value = "";
    if (this.elements[this.entity.id + "_cell_field_" + y + "_" + x] != undefined) {
      value = this.elements[this.entity.id + "_cell_field_" + y + "_" + x].value;
    }
    else {
      throw new Error("Invalid coordinates for cell value.");
    }
    return value;
  }

  /**
   * Sets a value to a specific cell given the coordinates.
   * @param x The x coordinate of the cell. 
   * @param y The y coordinate of the cell. 
   * @param value The value to set at the cell.
   * @throws An error if the cell does not exist.
   */
  Set_Value(x, y, value) {
    if (this.elements[this.entity.id + "_cell_field_" + y + "_" + x] != undefined) {
      this.elements[this.entity.id + "_cell_field_" + y + "_" + x].value = value;
    }
    else {
      throw new Error("Invalid coordinates for cell value.");
    }
  }

  /**
   * Gets the tab delimited data from the table.
   * @return The table data string from all the cells.
   */
  Get_Table_Data() {
    let data = [];
    let row_count = this.row_count;
    let col_count = this.col_count;
    for (let row_index = 0; row_index < row_count; row_index++) {
      let row = [];
      for (let col_index = 0; col_index < col_count; col_index++) {
        row.push(this.Get_Value(col_index, row_index));
      }
      data.push(row.join("\t"));
    }
    return data.join("\n");
  }

  /**
   * Sets the data to the existing cells of the table.
   * @param data The tab delimited table data.
   */
  Set_Table_Data(data) {
    let rows = Split(data);
    let row_count = (rows.length > this.row_count) ? this.row_count : rows.length;
    this.Clear(); // Clear out old data.
    for (let row_index = 0; row_index < row_count; row_index++) {
      let columns = rows[row_index].split(/\t/);
      let col_count = (columns.length > this.col_count) ? this.col_count : columns.length;
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.Set_Value(col_index, row_index, columns[col_index]);
      }
    }
  }

  /**
   * Clears out the grid view.
   */
  Clear() {
    let row_count = this.row_count;
    let col_count = this.col_count;
    for (let row_index = 0; row_index < row_count; row_index++) {
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.Set_Value(col_index, row_index, "");
      }
    }
  }

  /**
   * Builds a grid view using tab delimited data.
   * @param data The tab delimited table data.
   * @throws An error if the column count is invalid.
   */
  Build_View(data) {
    // Clear out container of any table.
    this.Remove_Elements(this.elements[this.entity.id + "_grid_area"]);
    // Build up grid.
    let rows = Split(data);
    let row_count = rows.length;
    this.row_count = row_count; // Record the row count.
    for (let row_index = 0; row_index < row_count; row_index++) {
      let cells = rows[row_index].split(/\t/);
      let cell_count = cells.length;
      if (this.col_count > 0) {
        if (cell_count != this.col_count) {
          throw "Column size is not consistent.";
        }
      }
      this.col_count = cell_count; // Record the cell count.
      let cell_width = 100 / cell_count;
      let row_element = this.Create_Element({
        id: this.entity.id + "_row_" + row_index,
        type: "div",
        css: {
          "width": "calc(100% - 2px)",
          "border": "1px dotted black",
          "border-bottom": (row_index == (row_count - 1)) ? "1px dotted black" : "0",
          "height": "24px"
        }
      }, this.entity.id + "_grid_area");
      for (let cell_index = 0; cell_index < cell_count; cell_index++) {
        let cell = cells[cell_index];
        let cell_element = this.Create_Element({
          id: this.entity.id + "_cell_" + row_index + "_" + cell_index,
          type: "div",
          css: {
            "width": "calc(" + cell_width + "% - 1px)",
            "height": "100%",
            "border-right": (cell_index == (cell_count - 1)) ? "0" : "1px dotted black",
            "float": "left",
            "line-height": "24px",
            "position": "relative"
          },
          subs: [
            this.Make_Form(this.entity.id + "_cell_form_" + row_index + "_" + cell_index, [
              this.Make_Field(this.entity.id + "_cell_field_" + row_index + "_" + cell_index, {
                "type": "text",
                "fg-color": "black",
                "bg-color": "transparent",
                "height": 24,
                "value": cell,
                "border": "none"
              })
            ])
          ]
        }, row_element);
      }
    }
  }

}

// **************************************************************************
// Comic Book Reader
// **************************************************************************

/**
 * This component allows comics to be read page by page with the click
 * of a button.
 *
 * Properties are as follows:
 *
 * name - The base name of the comic files. i.e. "Trail_Hogs"
 */
class cComic_Reader extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.page_no = 1;
    this.Create();
  }
  
  Create() {
    let page_area = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_image",
          type: "img",
          attrib: {
            "width": "100%",
            "height": "100%",
            "src": this.Get_Page_Image()
          },
          css: {
            "width": "100%",
            "height": "100%"
          }
        },
        {
          id: this.entity.id + "_page_no",
          type: "div",
          text: "1",
          css: {
            "position": "absolute",
            "right": "4px",
            "top": "4px",
            "width": "24px",
            "height": "24px",
            "background-color": "black",
            "border-radius": "12px",
            "color": "white",
            "font-size": "12px",
            "text-align": "center",
            "line-height": "24px",
            "font-weight": "bold"
          }
        }
      ]
    }, this.container);
    let component = this;
    this.elements[this.entity.id + "_image"].addEventListener("error", function(event) {
      if (component.page_no > 1) {
        component.Go_To_Page(-1); // Go back to last good page.
      }
    }, false);
    this.elements[this.entity.id + "_image"].addEventListener("load", function(event) {
      // Store page position.
      localStorage.setItem(component.settings["name"] + "_comic_page", component.page_no);
    }, false);
    this.Remember_Page();
  }
  
  /**
   * Remembers the last page you were on and goes to it otherwise
   * it goes to the first page.
   */
  Remember_Page() {
    // Load saved page.
    if (localStorage.getItem(this.settings["name"] + "_comic_page") != null) {
      let page_no = parseInt(localStorage.getItem(this.settings["name"] + "_comic_page"));
      this.Move_To_Page(page_no);
    }
    else {
      this.Move_To_Page(1);
    }
  }
  
  /**
   * Goes to a page forwards or backwards depending on provided
   * value.
   * @param direction 1 or -1 for proper navigation.
   */
  Go_To_Page(direction) {
    this.page_no += direction;
    if (this.page_no < 1) {
      this.page_no = 1;
    }
    this.elements[this.entity.id + "_image"].src = this.Get_Page_Image();
    this.elements[this.entity.id + "_page_no"].innerHTML = this.page_no;
  }
  
  /**
   * Goes directly to a page given the page number.
   * @param page_no The page number to go to.
   */
  Move_To_Page(page_no) {
    this.page_no = parseInt(page_no);
    if (this.page_no < 1) {
      this.page_no = 1;
    }
    this.elements[this.entity.id + "_image"].src = this.Get_Page_Image();
    this.elements[this.entity.id + "_page_no"].innerHTML = this.page_no;
  }
  
  /**
   * Gets the page image.
   * @return The page image file.
   */
  Get_Page_Image() {
    return Get_Image(this.settings["name"] + "_Page_" + this.page_no + ".png", false, "Books");
  }
  
  /**
   * Sets the name of the comic to load.
   * @param name The name of the comic. This resets the page number.
   */
  Set_Name(name) {
    this.settings["name"] = name;
    this.Remember_Page();
  }

}

// **************************************************************************
// Code Editor
// **************************************************************************

/**
 * This is a code editor component, complete with a browser used
 * for Frankus's Code Bank.
 * 
 * Properties are as follows:
 * 
 * - file - A file to load at runtime.
 */
class cCode_Editor extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.GRAPHIC_W = 16;
    this.CHAR_W = 8;
    this.CHAR_H = 16;
    this.TAB_CHAR = "  "; // 2 Spaces
    this.lines = [];
    this.cursor_x = 0;
    this.cursor_y = 0;
    this.shift_start = -1;
    this.shift_end = -1;
    this.shift_mode = 0; // Shift key was held down.
    this.columns = 0;
    this.rows = 0;
    this.selection_started = false;
    this.opened_file = "";
    this.code_files = {
      "js": true,
      "cpp": true,
      "hpp": true,
      "h": true,
      "c": true,
      "xml": true,
      "html": true,
      "css": true,
      "script": true,
      "clsh": true,
      "pl": true,
      "sh": true,
      "java": true,
      "json": true,
      "txt": true,
      "init": true,
      "pic": true,
      "ent": true,
      "map": true,
      "bkg": true,
      "scene": true,
      "py": true,
      "bm": true,
      "txt": true,
      "rc": true,
      "bat": true,
      "asm": true,
      "prgm": true,
      "mov": true
    };
    this.selection_start = {
      x: -1,
      y: -1
    };
    this.selection_end = {
      x: -1,
      y: -1
    };
    this.keywords = {
      "clsh": [
        "define",
        "as",
        "label",
        "let",
        "list",
        "alloc",
        "test",
        "set",
        "to",
        "at",
        "move",
        "remark",
        "end",
        "and",
        "or",
        "rem",
        "cat",
        "rand",
        "sin",
        "cos",
        "tan",
        "eq",
        "ne",
        "lt",
        "gt",
        "le",
        "ge",
        "stop",
        "output",
        "call",
        "return",
        "import",
        "var"
      ],
      "script": [
        "define",
        "as",
        "label",
        "let",
        "list",
        "alloc",
        "test",
        "set",
        "to",
        "at",
        "move",
        "remark",
        "end",
        "and",
        "or",
        "rem",
        "cat",
        "rand",
        "sin",
        "cos",
        "tan",
        "eq",
        "ne",
        "lt",
        "gt",
        "le",
        "ge",
        "stop",
        "output",
        "call",
        "return",
        "import",
        "var"
      ],
      "cpp": [
        "alignas",
        "alignof",
        "and",
        "and_eq",
        "asm",
        "atomic_cancel",
        "atomic_commit",
        "atomic_noexcept",
        "auto",
        "bitand",
        "bitor",
        "bool",
        "break",
        "case",
        "catch",
        "char",
        "char8_t",
        "char16_t",
        "char32_t",
        "class",
        "compl",
        "concept",
        "const",
        "consteval",
        "constexpr",
        "constinit",
        "const_cast",
        "continue",
        "co_await",
        "co_return",
        "co_yield",
        "decltype",
        "default",
        "delete",
        "do",
        "double",
        "dynamic_cast",
        "else",
        "enum",
        "explicit",
        "export",
        "extern",
        "false",
        "float",
        "for",
        "friend",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "mutable",
        "namespace",
        "new",
        "noexcept",
        "not",
        "not_eq",
        "nullptr",
        "operator",
        "or",
        "or_eq",
        "private",
        "protected",
        "public",
        "reflexpr",
        "register",
        "reinterpret_cast",
        "requires",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "static_assert",
        "static_cast",
        "struct",
        "switch",
        "synchronized",
        "template",
        "this",
        "thread_local",
        "throw",
        "true",
        "try",
        "typedef",
        "typeid",
        "typename",
        "union",
        "unsigned",
        "using",
        "virtual",
        "void",
        "volatile",
        "wchar_t",
        "while",
        "xor",
        "xor_eq"
      ],
      "hpp": [
        "alignas",
        "alignof",
        "and",
        "and_eq",
        "asm",
        "atomic_cancel",
        "atomic_commit",
        "atomic_noexcept",
        "auto",
        "bitand",
        "bitor",
        "bool",
        "break",
        "case",
        "catch",
        "char",
        "char8_t",
        "char16_t",
        "char32_t",
        "class",
        "compl",
        "concept",
        "const",
        "consteval",
        "constexpr",
        "constinit",
        "const_cast",
        "continue",
        "co_await",
        "co_return",
        "co_yield",
        "decltype",
        "default",
        "delete",
        "do",
        "double",
        "dynamic_cast",
        "else",
        "enum",
        "explicit",
        "export",
        "extern",
        "false",
        "float",
        "for",
        "friend",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "mutable",
        "namespace",
        "new",
        "noexcept",
        "not",
        "not_eq",
        "nullptr",
        "operator",
        "or",
        "or_eq",
        "private",
        "protected",
        "public",
        "reflexpr",
        "register",
        "reinterpret_cast",
        "requires",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "static_assert",
        "static_cast",
        "struct",
        "switch",
        "synchronized",
        "template",
        "this",
        "thread_local",
        "throw",
        "true",
        "try",
        "typedef",
        "typeid",
        "typename",
        "union",
        "unsigned",
        "using",
        "virtual",
        "void",
        "volatile",
        "wchar_t",
        "while",
        "xor",
        "xor_eq"
      ],
      "c": [
        "auto",
        "break",
        "case",
        "char",
        "const",
        "continue",
        "default",
        "do",
        "double",
        "else",
        "enum",
        "extern",
        "float",
        "for",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "register",
        "restrict",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "struct",
        "switch",
        "typedef",
        "union",
        "unsigned",
        "void",
        "volatile",
        "while",
        "_Alignas",
        "_Alignof",
        "_Atomic",
        "_Bool",
        "_Complex",
        "_Generic",
        "_Imaginary",
        "_Noreturn",
        "_Static_assert",
        "_Thread_local"
      ],
      "h": [
        "auto",
        "break",
        "case",
        "char",
        "const",
        "continue",
        "default",
        "do",
        "double",
        "else",
        "enum",
        "extern",
        "float",
        "for",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "register",
        "restrict",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "struct",
        "switch",
        "typedef",
        "union",
        "unsigned",
        "void",
        "volatile",
        "while",
        "class",
        "public",
        "private",
        "protected",
        "_Alignas",
        "_Alignof",
        "_Atomic",
        "_Bool",
        "_Complex",
        "_Generic",
        "_Imaginary",
        "_Noreturn",
        "_Static_assert",
        "_Thread_local",
        "namespace",
        "bool",
        "virtual"
      ],
      "js": [
        "abstract",
        "arguments",
        "await",
        "boolean",
        "break",
        "byte",
        "case",
        "catch",
        "char",
        "class",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "double",
        "else",
        "enum",
        "eval",
        "export",
        "extends",
        "false",
        "final",
        "finally",
        "float",
        "for",
        "function",
        "goto",
        "if",
        "implements",
        "import",
        "in",
        "instanceof",
        "int",
        "interface",
        "let",
        "long",
        "native",
        "new",
        "null",
        "package",
        "private",
        "protected",
        "public",
        "return",
        "short",
        "static",
        "super",
        "switch",
        "synchronized",
        "this",
        "throw",
        "throws",
        "transient",
        "true",
        "try",
        "typeof",
        "var",
        "void",
        "volatile",
        "while",
        "with",
        "yield",
        "self"
      ],
      "py": [
        "and",
        "as",
        "assert",
        "break",
        "class",
        "continue",
        "def",
        "del",
        "elif",
        "else",
        "except",
        "False",
        "finally",
        "for",
        "from",
        "global",
        "if",
        "import",
        "in",
        "is",
        "lambda",
        "None",
        "nonlocal",
        "not",
        "or",
        "pass",
        "raise",
        "return",
        "True",
        "try",
        "while",
        "with",
        "yield"
      ]
    };
    this.key_map = {
      "Space":        "  ", // Space
      "Digit0":       "0)", // Numbers
      "Digit1":       "1!",
      "Digit2":       "2@",
      "Digit3":       "3#",
      "Digit4":       "4$",
      "Digit5":       "5%",
      "Digit6":       "6^",
      "Digit7":       "7&",
      "Digit8":       "8*",
      "Digit9":       "9(",
      "KeyA":         "aA", // Letters
      "KeyB":         "bB",
      "KeyC":         "cC",
      "KeyD":         "dD",
      "KeyE":         "eE",
      "KeyF":         "fF",
      "KeyG":         "gG",
      "KeyH":         "hH",
      "KeyI":         "iI",
      "KeyJ":         "jJ",
      "KeyK":         "kK",
      "KeyL":         "lL",
      "KeyM":         "mM",
      "KeyN":         "nN",
      "KeyO":         "oO",
      "KeyP":         "pP",
      "KeyQ":         "qQ",
      "KeyR":         "rR",
      "KeyS":         "sS",
      "KeyT":         "tT",
      "KeyU":         "uU",
      "KeyV":         "vV",
      "KeyW":         "wW",
      "KeyX":         "xX",
      "KeyY":         "yY",
      "KeyZ":         "zZ",
      "Backquote":    "`~", // Special Characters
      "Minus":        "-_",
      "Equal":        "=+",
      "BracketLeft":  "[{",
      "BracketRight": "]}",
      "Backslash":    "\\|",
      "Semicolon":    ";:",
      "Quote":        "'\"",
      "Comma":        ",<",
      "Period":       ".>",
      "Slash":        "/?"
    };
    this.Create();
  }

  Create() {
    // Add offscreen text element for input. Here so it is not visible.
    let input = this.Create_Element({
      id: this.entity.id + "_text_input_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 10) + "px",
        "top": String(this.entity.y + 10) + "px",
        "width": "64px",
        "height": "32px"
      },
      subs: [
        {
          id: this.entity.id + "_text_input",
          type: "textarea",
          attrib: {
            rows: 5,
            cols: 25,
            wrap: "off"
          },
          css: {
            "position": "absolute",
            "width": "64px",
            "height": "32px",
            "cursor": Get_Image("Cursor.pic", true) + ", default"
          }
        }
      ]
    }, this.container);
    let text_metrics = this.Create_Element({
      id: this.entity.id + "_text_metric",
      type: "canvas",
      attrib: {
        width: 100,
        height: 100
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 10) + "px",
        "top": String(this.entity.y + 10) + "px",
        "width": "100px",
        "height": "100px",
        "color": "transparent"
      }
    }, this.container);
    // Augment character width.
    let text_canvas = text_metrics.getContext("2d");
    text_canvas.font = "16px monospace";
    this.CHAR_W = text_canvas.measureText("X").width;
    // Create the editor layout.
    let edit = this.Create_Element({
      id: this.entity.id + "_border",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-color": "white"
      },
      subs: [
        {
          id: this.entity.id + "_viewport",
          type: "div",
          css: {
            "position": "absolute",
            "left": "4px",
            "top": "4px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "color": "black",
            "background-color": "white",
            "font-family": "monospace",
            "font-size": "16px",
            "white-space": "pre",
            "line-height": "1em",
            "overflow": "hidden"
          }
        },
        {
          id: this.entity.id + "_cursor_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "4px",
            "top": "4px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "color": "red",
            "background-color": "transparent",
            "font-family": "monospace",
            "font-size": "16px",
            "white-space": "pre",
            "line-height": "1em",
            "overflow": "hidden",
            "opacity": "0.5",
            "cursor": String(Get_Image("Lettering.pic", true) + ", default")
          }
        },
        this.Make_Loading_Sign(),
        this.Make_Saving_Sign()
      ]
    }, this.container);
    // Resize the viewport.
    this.columns = Math.floor((this.entity.width - 8 - 2) / this.CHAR_W);
    this.rows = Math.floor((this.entity.height - 8 - 2) / this.CHAR_H);
    // Add blank line.
    this.lines.push("");
    // Render this line.
    this.Render();
    // Initialize handlers.
    let component = this;
    this.Init_Loading_Click();
    this.Init_Saving_Click();
    this.elements[this.entity.id + "_cursor_area"].addEventListener("click", function(event) {
      component.elements[component.entity.id + "_text_input"].focus();
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("mousedown", function(event) {
      let mouse_x = (event.offsetX != undefined) ? event.offsetX : event.layerX;
      let mouse_y = (event.offsetY != undefined) ? event.offsetY : event.layerY;
      component.selection_start.x = Math.floor(mouse_x / component.CHAR_W);
      component.selection_start.y = Math.floor(mouse_y / component.CHAR_H);
      component.shift_start = component.selection_start.y;
      component.selection_started = true;
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("mouseup", function(event) {
      let mouse_x = (event.offsetX != undefined) ? event.offsetX : event.layerX;
      let mouse_y = (event.offsetY != undefined) ? event.offsetY : event.layerY;
      component.selection_end.x = Math.floor(mouse_x / component.CHAR_W);
      component.selection_end.y = Math.floor(mouse_y / component.CHAR_H);
      let selection_width = (component.selection_end.x - component.selection_start.x) + 1;
      let selection_height = (component.selection_end.y - component.selection_start.y) + 1;
      if ((component.selection_start.x != -1) && (component.selection_start.y != -1)) {
        if ((selection_width == 1) && (selection_height == 1)) {
          component.selection_start.x = -1;
          component.selection_start.y = -1;
          // Set cursor coordinates.
          let viewport_coords = component.Get_Viewport_Coords();
          component.cursor_x = viewport_coords.x + component.selection_end.x;
          component.cursor_y = viewport_coords.y + component.selection_end.y;
          component.Validate_Cursor();
        }
        else {
          component.Copy_Selection();
        }
        component.Render();
      }
      component.shift_end = component.selection_end.y;
      component.selection_started = false;
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("mousemove", function(event) {
      if (component.selection_started) {
        let mouse_x = (event.offsetX != undefined) ? event.offsetX : event.layerX;
        let mouse_y = (event.offsetY != undefined) ? event.offsetY : event.layerY;
        component.selection_end.x = Math.floor(mouse_x / component.CHAR_W);
        component.selection_end.y = Math.floor(mouse_y / component.CHAR_H);
        if ((component.selection_start.x != -1) && (component.selection_start.y != -1)) {
          component.Render();
        }
      }
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("wheel", function(event) {
      let scroll = (event.deltaY != undefined) ? event.deltaY : 0;
      if (scroll < 0) {
        if (component.cursor_y >= component.rows) {
          component.cursor_y -= component.rows; // Scroll one screen up.
        }
      }
      else if (scroll > 0) {
        if (component.cursor_y < (component.lines.length - component.rows)) {
          component.cursor_y += component.rows;
        }
      }
      component.Render();
    }, false);
    this.elements[this.entity.id + "_text_input"].addEventListener("keydown", function(event) {
      let key = event.code;
      if (key == "Enter") { // Return/Enter
        // Count off indenting spaces in previous line.
        let padding = component.lines[component.cursor_y].match(/^\s+/);
        if (!padding) {
          padding = ""; // We need to do component to avoid an issue with arrays not liking NULL values.
        }
        else {
          padding = padding[0];
        }
        // If the cursor is at the beginning of the file insert before otherwise insert after.
        if ((component.cursor_x == 0) && (component.cursor_y == 0)) {
          let before = component.lines.slice(0, component.cursor_y);
          let after = component.lines.slice(component.cursor_y);
          component.lines = before.concat(padding, after);
        }
        else {
          let before = component.lines.slice(0, component.cursor_y + 1);
          let after = component.lines.slice(component.cursor_y + 1);
          component.lines = before.concat(padding, after);
          component.cursor_y++;
        }
        component.cursor_x = padding.length;
      }
      else if (key == "Backspace") { // Backspace
        if ((component.selection_start.x != -1) && (component.selection_start.y != -1)) {
          let number_of_lines = component.lines.length;
          let viewport_coords = component.Get_Viewport_Coords();
          for (let line_y = component.selection_start.y; line_y <= component.selection_end.y; line_y++) {
            if (line_y < number_of_lines) {
              let spaces = component.lines[viewport_coords.y + line_y].substring(0, 2);
              if (spaces == component.TAB_CHAR) { // Don't unindent without spaces.
                component.lines[viewport_coords.y + line_y] = component.lines[viewport_coords.y + line_y].substring(component.TAB_CHAR.length);
              }
            }
          }
          // Deselect the area.
          component.selection_start.x = -1;
          component.selection_start.y = -1;
          component.Render();
        }
        else {
          // Does not delete last character if out of bounds.
          if (component.cursor_x > 0) {
            // Delete
            let before = component.lines[component.cursor_y].slice(0, component.cursor_x - 1);
            let after = component.lines[component.cursor_y].slice(component.cursor_x);
            component.lines[component.cursor_y] = before + after;
            component.cursor_x--;
          }
          else {
            // Take the entire line and move it to the previous line.
            if (component.cursor_y > 0) { // Make sure there are lines.
              let prev_line = component.lines[component.cursor_y];
              // Delete component line.
              let before = component.lines.slice(0, component.cursor_y);
              let after = component.lines.slice(component.cursor_y + 1);
              component.lines = before.concat(after);
              component.cursor_y--; // Decrease cursor position.
              let current_length = component.lines[component.cursor_y].length;
              // Add the lines.
              component.lines[component.cursor_y] += prev_line;
              // Place x cursor at end of previous line.
              component.cursor_x = current_length;
            }
          }
        }
      }
      else if (key == "Delete") { // Delete
        if ((component.selection_start.x != -1) && (component.selection_start.y != -1)) {
          // We'll delete the selection.
          let viewport_coords = component.Get_Viewport_Coords();
          let number_of_lines = component.selection_end.y - component.selection_start.y + 1;
          if (number_of_lines > 0) {
            component.lines.splice(viewport_coords.y + component.selection_start.y, number_of_lines);
            // Deselect the area.
            component.selection_start.x = -1;
            component.selection_start.y = -1;
            component.Render();
          }
        }
        else {
          // We'll delete an entire line here.
          if (component.cursor_y > 0) { // Not the first line.
            if (component.cursor_y == (component.lines.length - 1)) { // Last line.
              component.lines = component.lines.slice(0, component.lines.length - 1);
              component.cursor_y--; // Decrease cursor y coordinate.
            }
            else { // Other line but not first.
              let before = component.lines.slice(0, component.cursor_y);
              let after = component.lines.slice(component.cursor_y + 1);
              component.lines = before.concat(after);
            }
          }
          else { // First line.
            if (component.lines.length > 1) {
              component.lines = component.lines.slice(component.cursor_y + 1);
            }
            else {
              component.lines[component.cursor_y] = ""; // Just clear it out.
            }
          }
        }
        component.cursor_x = 0; // Reset cursor.
      }
      else if (key == "ArrowLeft") { // Left
        if (component.cursor_x > 0) {
          component.cursor_x--;
        }
      }
      else if (key == "ArrowRight") { // Right
        // We can move one character out of bounds.
        if (component.cursor_x < component.lines[component.cursor_y].length) {
          component.cursor_x++;
        }
      }
      else if (key == "ArrowUp") { // Up
        // Don't change cursor x position unless we do so.
        if (component.cursor_y > 0) {
          component.cursor_y--;
          if (component.lines[component.cursor_y].length > 0) {
            if (component.cursor_x >= component.lines[component.cursor_y].length) {
              component.cursor_x = component.lines[component.cursor_y].length - 1;
            }
          }
          else {
            component.cursor_x = 0;
          }
        }
      }
      else if (key == "ArrowDown") { // Down
        if (component.cursor_y < (component.lines.length - 1)) {
          component.cursor_y++;
          if (component.lines[component.cursor_y].length > 0) {
            if (component.cursor_x >= component.lines[component.cursor_y].length) {
              component.cursor_x = component.lines[component.cursor_y].length - 1;
            }
          }
          else {
            component.cursor_x = 0;
          }
        }
      }
      else if (key == "Home") { // Home
        component.cursor_x = 0;
      }
      else if (key == "End") { // End
        if (component.lines[component.cursor_y].length > 0) {
          component.cursor_x = component.lines[component.cursor_y].length - 1;
        }
      }
      else if (key == "Tab") { // Tab
        if ((component.selection_start.x != -1) && (component.selection_start.y != -1)) {
          let number_of_lines = component.lines.length;
          let viewport_coords = component.Get_Viewport_Coords();
          for (let line_y = component.selection_start.y; line_y <= component.selection_end.y; line_y++) {
            if (line_y < number_of_lines) {
              component.lines[viewport_coords.y + line_y] = component.TAB_CHAR + component.lines[viewport_coords.y + line_y];
            }
          }
          // Deselect the area.
          component.selection_start.x = -1;
          component.selection_start.y = -1;
          component.Render();
        }
        else { // No lines selected.
          let before = component.lines[component.cursor_y].slice(0, component.cursor_x);
          let after = component.lines[component.cursor_y].slice(component.cursor_x);
          component.lines[component.cursor_y] = before + component.TAB_CHAR + after;
          component.cursor_x += component.TAB_CHAR.length;
        }
      }
      else if (key == "PageUp") { // Page Up
        if (component.cursor_y >= component.rows) {
          component.cursor_y -= component.rows; // Scroll one screen up.
        }
      }
      else if (key == "PageDown") { // Page Down
        if (component.cursor_y < (component.lines.length - component.rows)) {
          component.cursor_y += component.rows;
        }
      }
      else if (key.match(/Shift/))  { // Shift
        component.shift_mode = 1;
      }
      else { // Character Keys
        if (component.lines.length == 0) { // Insert blank line.
          component.lines.push("");
          component.cursor_x = 0;
          component.cursor_y = 0;
        }
        let before = component.lines[component.cursor_y].slice(0, component.cursor_x);
        let after = component.lines[component.cursor_y].slice(component.cursor_x);
        // Whoa? Do we have an actual character?
        if (component.key_map[key] != undefined) {
          let character = component.key_map[key].substring(component.shift_mode, component.shift_mode + 1);
          component.lines[component.cursor_y] = before + character + after;
          component.cursor_x++;
        }
      }
      // Render here.
      component.Render();
    }, false);
    this.elements[this.entity.id + "_text_input"].addEventListener("keyup", function(event) {
      let key = event.code;
      if (key.match(/Shift/)) {
        component.shift_mode = 0;
      }
    }, false);
    // Load up the default file if it exists.
    if (this.settings["file"] != undefined) {
      let file = new cFile(this.settings["file"]);
      file.on_read = function() {
        let lines = file.lines;
        component.Load({
          name: component.settings["file"],
          lines: lines.slice(0)
        })
      };
      file.Read();
    }
  }

  /**
   * Loads a file into the editor.
   * @param file The file to load into the editor.
   */
  Load(file) {
    // Check for code file.
    let ext = cFile.Get_Extension(file.name);
    if (this.code_files[ext] != undefined) {
      let untabbed_lines = file.lines.slice(0); // Create copy of lines.
      let line_count = untabbed_lines.length;
      if (line_count > 0) {
        let parts = file.name.split(/\//);
        this.opened_file = parts.pop(); // No path information.
        this.lines = [];
        for (let line_index = 0; line_index < line_count; line_index++) {
          // Convert all tabs to spaces.
          let line = untabbed_lines[line_index].replace(/\t/g, this.TAB_CHAR);
          this.lines.push(line);
        }
        this.cursor_x = 0;
        this.cursor_y = 0;
        // Render
        this.Render();
      }
      else { // Assign blank line.
        this.opened_file = "";
        this.lines = [ "" ];
        this.cursor_x = 0;
        this.cursor_y = 0;
        // Render
        this.Render();
      }
    }
    else {
      this.opened_file = "";
      this.lines = [ "" ];
      this.cursor_x = 0;
      this.cursor_y = 0;
      // Render
      this.Render();
    }
  }

  /**
   * Saves a file from the editor.
   * @param file The name of the file to save.
   */
  Save(file) {
    // Now save the code.
    file.lines = this.lines.slice(0);
  }

  /**
   * Clears out the editor.
   */
  Clear() {
    // Clear out the rest.
    this.lines = [ "" ];
    this.cursor_x = 0;
    this.cursor_y = 0;
    // Clear selection.
    this.selection_start.x = -1;
    this.selection_start.y = -1;
    this.selection_started = false;
    // Render.
    this.Render();
  }

  /**
   * Renders the editor viewport.
   */
  Render() {
    let viewport_coords = this.Get_Viewport_Coords();
    let html = "";
    let cursor_dx = this.cursor_x - viewport_coords.x;
    let cursor_dy = this.cursor_y - viewport_coords.y;
    let cursor_disp = "";
    for (let screen_y = 0; screen_y < this.rows; screen_y++) {
      let line_index = viewport_coords.y + screen_y;
      // Check for valid line index.
      if (line_index < this.lines.length) {
        html += String(this.lines[line_index].substring(viewport_coords.x, viewport_coords.x + this.columns) + "\n");
      }
      // Render the cursor.
      for (let screen_x = 0; screen_x < this.columns; screen_x++) {
        if ((this.selection_start.x == -1) && (this.selection_start.y == -1)) {
          // Do cursor highlighting.
          if ((cursor_dx == screen_x) && (cursor_dy == screen_y)) {
            cursor_disp += "&block;";
          }
          else {
            cursor_disp += " ";
          }
        }
        else if ((screen_x >= this.selection_start.x) && (screen_x <= this.selection_end.x) &&
                (screen_y >= this.selection_start.y) && (screen_y <= this.selection_end.y)) {
          cursor_disp += "&block;";
        }
        else {
          cursor_disp += " ";
        }
      }
      cursor_disp += "\n";
    }
    // Replace entities.
    html = html.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
    // Highlight syntax.
    html = this.Highlight_Syntax(html);
    // Update viewport display.
    this.elements[this.entity.id + "_viewport"].innerHTML = html;
    // Update cursor display.
    this.elements[this.entity.id + "_cursor_area"].innerHTML = cursor_disp;
  }

  /**
   * Gets the viewport coordinates. The return object looks like this:
   * %
   * {
   *   x: 0,
   *   y: 0,
   *   half_screen_x: 0,
   *   half_screen_y: 0
   * }
   * %
   * @return The object containing viewport coordinates.
   */
  Get_Viewport_Coords() {
    let viewport_x = 0;
    let half_screen_x = Math.floor(this.columns / 2);
    if ((this.cursor_x >= 0) && (this.cursor_x < half_screen_x)) {
      viewport_x = 0;
    }
    else {
      viewport_x = this.cursor_x - half_screen_x;
    }
    let viewport_y = 0;
    let half_screen_y = Math.floor(this.rows / 2);
    if ((this.cursor_y >= 0) && (this.cursor_y < half_screen_y)) {
      viewport_y = 0;
    }
    else {
      viewport_y = this.cursor_y - half_screen_y;
    }
    return {
      x: viewport_x,
      y: viewport_y,
      half_screen_x: half_screen_x,
      half_screen_y: half_screen_y
    };
  }

  /**
   * Maps all code to letious line addresses.
   * @param file The name of the file to map.
   * @return The hash representing the code map.
   */
  Code_Map(file) {
    let parts = file.name.split(/\//);
    let fname = parts.pop(); // No path info.
    let ext = fname.replace(/^\w+\./, "");
    let map = {};
    // Add label to start of file.
    let label = "- start of file -";
    map[label] = 0;
    let class_name = "";
    // Parse out all subprograms.
    let line_count = this.lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      // Parse out labels.
      if (line.match(/^\s*label\s+\w+\s*$/)) {
        label = line.replace(/^\s*label\s+(\w+)\s*$/, "$1");
        map[label] = line_index;
      }
      if (line.match(/^\s*label\s+\w+\.\S+\s*$/)) { // A sub-label.
        label = line.replace(/^\s*label\s+(\w+\.\S+)\s*$/, "$1");
        map[label] = line_index;
      }
      // Parse out JavaScript functions.
      if (ext.match(/js/)) {
        if (line.match(/^\s*function\s+\w+\([^\)]*\)\s*\{\s*$/)) {
          label = line.replace(/^\s*function\s+(\w+)\([^\)]*\)\s*\{\s*$/, "$1");
          map[label] = line_index;
        }
        // Parse out JavaScript classes and methods.
        if (line.match(/^\s*class\s+\w+\s+(extends\s+[A-Za-z0-9_.]+\s+|)\{\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\s+(extends\s+[A-Za-z0-9_.]+\s+|)\{\s*$/, "[$1]");
          map[label] = line_index;
          class_name = label;
        }
        // Static class function.
        if (line.match(/^\s*(static\s+|)\w+\([^\)]*\)\s+\{\s*$/)) {
          label = line.replace(/^\s*(static\s+|)(\w+)\([^\)]*\)\s+\{\s*$/, "$2");
          let inside_routine = line.replace(/^\s*(static\s+|)\w+\(([^\)]*)\)\s+\{\s*$/, "$1");
          if (!inside_routine.match(/function/)) {
            if (class_name.length > 0) {
              map[class_name + ":" + label] = line_index;
            }
            else {
              map[label] = line_index;
            }
          }
        }
        // Prototype class function.
        if (line.match(/^\s*\w+:\s+function\([^\)]*\)\s+\{\s*$/)) {
          label = line.replace(/^\s*(\w+):\s+function\([^\)]*\)\s+\{\s*$/, "$1");
          map[label] = line_index;
        }
      }
      // Parse C/C++ functions and methods.
      if (ext.match(/h|c|cpp|hpp/)) {
        // Global function.
        if (line.match(/^\s*\S+\s+\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*\S+\s+(\w+)\([^\)]*\)(\s+\{|)\s*$/, "$1");
          map[label] = line_index;
        }
        // Class function.
        if (line.match(/^\s*\S+\s+\w+::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*\S+\s+(\w+)::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Constructor
        if (line.match(/^\s*\w+::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*(\w+)::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Destructor
        if (line.match(/^\s*\w+::~\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*(\w+)::(~\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Constructor calling superclass constructor.
        if (line.match(/^\s*\w+::\w+\([^\)]*\)\s+:\s+\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*(\w+)::(\w+)\([^\)]*\)\s+:\s+\w+\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class function.
        if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class constructor.
        if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class destructor.
        if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::~\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(~\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class operator.
        if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::operator\S+\s+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::operator(\S+)\s+\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Parse C++ classes.
        if (line.match(/^\s*class\s+\w+\s+\{\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\s+\{\s*$/, "[$1]");
          map[label] = line_index;
        }
        // Class inheritance.
        if (line.match(/^\s*class\s+\w+\s+:\s+public\s+\w+\s+\{\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\s+:\s+public\s+\w+\s+\{\s*$/, "[$1]");
          map[label] = line_index;
        }
        // Structure.
        if (line.match(/^\s*struct\s+\w+\s+\{\s*$/)) {
          label = line.replace(/^\s*struct\s+(\w+)\s+\{\s*$/, "[$1]");
          map[label] = line_index;
        }
      }
      // Parse Python functions and methods.
      if (ext.match(/py/)) {
        if (line.match(/^\s*def\s+\w+\([^\)]*\):\s*$/)) {
          label = line.replace(/^\s*def\s+(\w+)\([^\)]*\):\s*$/, "$1");
          map[label] = line_index;
        }
        // Parse out Python classes.
        if (line.match(/^\s*class\s+\w+\(?[^\)]*\)?:\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\(?[^\)]*\)?:\s*$/, "[$1]");
          map[label] = line_index;
        }
      }
    }
    // Add label to end of file.
    label = "- end of file -";
    map[label] = line_count - 1;
    return map;
  }

  /**
   * Goes to a particular line.
   * @param The line number to go to. It is zero based.
   */
  Go_To_Line(line_no) {
    this.cursor_x = 0;
    this.cursor_y = line_no;
    this.Render();
  }

  /**
   * Searches for a string and goes to the line.
   * @param search_str The search string. Regex can be used.
   */
  Search(search_str) {
    let line_count = this.lines.length;
    for (let line_index = this.cursor_y; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      if (line.match(new RegExp(search_str))) {
        this.Go_To_Line(line_index);
        this.Render();
        break;
      }
    }
  }

  /**
   * Highlights syntax given code.
   * @param code The code string to highlight.
   * @return The formatted code with HTML.
   */
  Highlight_Syntax(code) {
    // Replace all keywords.
    let name = this.opened_file;
    if (this.opened_file.match(/^\w+\.\w+$/)) { // Make sure there is extension.
      let ext = this.opened_file.replace(/^\w+\./, "");
      if (this.keywords[ext] != undefined) {
        // Replace C-Lesh comment.
        code = code.replace(/(\bremark\b\s+)(.*)(\s+\bend\b)/mg, "$1<comment>$2</comment>$3");
        /*
        code = code.replace(/^remark/g, "remark<comment>")
                  .replace(/(\s+remark)/g, "$1<comment>")
                  .replace(/end$/g, "</comment>end")
                  .replace(/(end\s+)/g, "</comment>$1");
        */
        // Replace C style comment.
        code = code.replace(/(\/\/\s+)(.*)(\n)/g, "<comment>$1$2</comment>$3");
        // Replace C style multiline comment.
        code = code.replace(/(\/\*)/g, "<comment>$1")
                  .replace(/(\*\/)/g, "$1</comment>");
        // Replace Perl style comment.
        code = code.replace(/(#\s+)(.*)(\n)/g, "<comment>$1$2</comment>$3");
        // Now replace keywords.
        let keyword_count = this.keywords[ext].length;
        let end = "(\\s+|\\r|\\n|\\[|\\}|\\[|\\{|\\(|\\)|\\.|\\;|\\,|\\:|\\*|\\-|\\!|\\&)";
        for (let keyword_index = 0; keyword_index < keyword_count; keyword_index++) {
          let keyword = this.keywords[ext][keyword_index];
          code = code.replace(new RegExp("^" + keyword + end, "g"), "<keyword>" + keyword + "</keyword>$1")
                     .replace(new RegExp(end + keyword + "$", "g"), "$1<keyword>" + keyword + "</keyword>")
                     .replace(new RegExp(end + keyword + end, "g"), "$1<keyword>" + keyword + "</keyword>$2");
        }
        // Replace strings entities.
        code = code.replace(/\\'/g, "\\&apos;")
                   .replace(/\\"/g, "\\&quot;");
        // Replace strings, single and double quoted.
        code = code.replace(/'([^'\n\r]*)'/g, "<string>&apos;$1&apos;</string>")
                   .replace(/"([^"\n\r]*)"/g, '<string>&quot;$1&quot;</string>');
        // Replace namespaces and addresses.
        code = code.replace(/(\s+|\[)(\w+)(\.\w+)/g, "$1<namespace>$2</namespace>$3")
                   .replace(/(#\S+)/g, "<address>$1</address>");
        // Replace markers with real HTML.
        code = code.replace(/<keyword>/g, '<span class="frankus_keyword">')
                   .replace(/<comment>/g, '<span class="frankus_comment">')
                   .replace(/<string>/g, '<span class="frankus_string">')
                   .replace(/<namespace>/g, '<span class="frankus_namespace">')
                   .replace(/<address>/g, '<span class="frankus_address">')
                   .replace(/(<\/keyword>|<\/comment>|<\/string>|<\/namespace>|<\/address>)/g, "</span>");
      }
    }
    return code;
  }

  /**
   * Copies a selection using the saved selection coordinates.
   */
  Copy_Selection() {
    if ((this.selection_start.x != -1) && (this.selection_start.y != -1)) { // We have a selection.
      let viewport_coords = this.Get_Viewport_Coords();
      let line_count = this.selection_end.y - this.selection_start.y + 1;
      let copy_lines = [];
      for (let y = this.selection_start.y; y <= this.selection_end.y; y++) {
        let line_y = y + viewport_coords.y;
        if (line_y < 0) {
          line_y = 0;
        }
        if (line_y > (this.lines.length - 1)) {
          line_y = this.lines.length - 1;
        }
        let line = this.lines[line_y];
        let end_x = this.selection_end.x;
        if (end_x < 0) {
          end_x = 0;
        }
        if (end_x > (line.length - 1)) {
          end_x = line.length - 1;
        }
        let segment = line.slice(this.selection_start.x + viewport_coords.x, end_x + viewport_coords.x + 1);
        if (line_count > 1) { // Do this if the number of lines is more than 1.
          segment = line; // Copy whole line.
        }
        copy_lines.push(segment);
      }
      localStorage.setItem("copy_lines", copy_lines.join("\n"));
    }
  }

  /**
   * Validates if the cursor is in the right area.
   */
  Validate_Cursor() {
    // Validate cursor coordinates.
    if (this.cursor_y >= this.lines.length) {
      this.cursor_y = this.lines.length - 1;
    }
    if (this.cursor_y < 0) {
      this.cursor_y = 0;
    }
    if (this.cursor_x >= this.lines[this.cursor_y].length) {
      this.cursor_x = this.lines[this.cursor_y].length - 1;
    }
    if (this.cursor_x < 0) {
      this.cursor_x = 0;
    }
  }

  /**
   * Copies an entire routine.
   */
  Copy_Routine() {
    let line_count = this.lines.length;
    let start_line = this.cursor_y;
    let copy_lines = [];
    for (let line_index = start_line; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      if (line.match(/^\s*$/)) { // All spaces?
        break;
      }
      copy_lines.push(line);
    }
    localStorage.setItem("copy_lines", copy_lines.join("\n"));
  }

  /**
   * Pastes a selection at the current location.
   * @param external_data Optional parameter with data passed externally.
   */
  Paste(external_data) {
    let data = (external_data) ? external_data.replace(/\t/g, this.TAB_CHAR) : localStorage.getItem("copy_lines");
    if (data) {
      let copy_lines = Split(data);
      if (copy_lines.length == 1) {
        // Do string insert.
        let before = this.lines[this.cursor_y].substring(0, this.cursor_x);
        let after = this.lines[this.cursor_y].substring(this.cursor_x);
        this.lines[this.cursor_y] = before + copy_lines[0] + after;
        this.Render();
      }
      else {
        let before = this.lines.slice(0, this.cursor_y);
        let after = this.lines.slice(this.cursor_y);
        this.lines = before.concat(copy_lines, after);
        this.Render();
      }
    }
  }

}

// **************************************************************************
// Frame
// **************************************************************************

/**
 * A subframe inside of a page where other HTML pages can be loaded.
 */
class cFrame extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_frame",
      type: "iframe",
      attrib: {
        src: "",
        title: "API Documentation"
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px", 
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "margin": "0",
        "padding": "0",
        "border": "none"
      }
    }, this.container);
  }

  /**
   * Loads an HTML page into the frame.
   * @param name The name of the HTML page.
   */
  Load(name) {
    this.elements[this.entity.id + "_frame"].src = name + ".html";
  }

}

// **************************************************************************
// Bump Map Editor
// **************************************************************************

/**
 * Allows editing of bump maps.
 */
class cBump_Map_Editor extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.canvas = null;
    this.box = {
      left: 0,
      top: 0,
      right: 15,
      bottom: 15
    };
    this.sprite = new Image();
    this.sprite_loaded = false;
    this.corner_hit = "";
    this.Create();
  }

  Create() {
    this.canvas = this.Create_Element({
      id: this.entity.id,
      type: "canvas",
      attrib: {
        width: this.entity.width - 2,
        height: this.entity.height - 2
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      }
    }, this.container);
    this.surface = this.canvas.getContext("2d");
    this.Render();
    let component = this;
    this.canvas.addEventListener("mousedown", function(event) {
      let mouse_x = event.offsetX;
      let mouse_y = event.offsetY;
      component.corner_hit = "";
      if ((mouse_x >= (component.box.left - 4)) && (mouse_x <= (component.box.left + 4)) && (mouse_y >= (component.box.top - 4)) && (mouse_y <= (component.box.top + 4))) {
        // We're in left-top box.
        component.corner_hit = "left-top";
        let width = component.box.right - component.box.left + 1;
        let height = component.box.bottom - component.box.top + 1;
        component.box.left = mouse_x;
        component.box.top = mouse_y;
        component.box.right = component.box.left + width - 1;
        component.box.bottom = component.box.top + height - 1;
        component.Render();
      }
      else if ((mouse_x >= (component.box.right - 4)) && (mouse_x <= (component.box.right + 4)) && (mouse_y >= (component.box.top - 4)) && (mouse_y <= (component.box.top + 4))) {
        // We're in right-top box.
        component.corner_hit = "right-top";
        if (component.box.right > component.box.left) {
          component.box.right = mouse_x;
          component.Render();
        }
      }
      else if ((mouse_x >= (component.box.right - 4)) && (mouse_x <= (component.box.right + 4)) && (mouse_y >= (component.box.bottom - 4)) && (mouse_y <= (component.box.bottom + 4))) {
        // We're in right-bottom box.
        component.corner_hit = "right-bottom";
        if ((component.box.right > component.box.left) && (component.box.bottom > component.box.top)) {
          component.box.right = mouse_x;
          component.box.bottom = mouse_y;
          component.Render();
        }
      }
      else if ((mouse_x >= (component.box.left - 4)) && (mouse_x <= (component.box.left + 4)) && (mouse_y >= (component.box.bottom - 4)) && (mouse_y <= (component.box.bottom + 4))) {
        // We're in left-bottom box.
        component.corner_hit = "left-bottom";
        if (component.box.bottom > component.box.top) {
          component.box.bottom = mouse_y;
          component.Render();
        }
      }
    }, false);
    this.canvas.addEventListener("mouseup", function(event) {
      component.corner_hit = ""; // Release corner.
    }, false);
    this.canvas.addEventListener("mouseout", function(event) {
      component.corner_hit = ""; // Release corner.
    }, false);
    this.canvas.addEventListener("mouseleave", function(event) {
      component.corner_hit = ""; // Release corner.
    }, false);
    this.canvas.addEventListener("mousemove", function(event) {
      let mouse_x = event.offsetX;
      let mouse_y = event.offsetY;
      if (component.corner_hit == "left-top") {
        let width = component.box.right - component.box.left + 1;
        let height = component.box.bottom - component.box.top + 1;
        component.box.left = mouse_x;
        component.box.top = mouse_y;
        component.box.right = component.box.left + width - 1;
        component.box.bottom = component.box.top + height - 1;
        component.Render();
      }
      else if (component.corner_hit == "right-top") {
        if (component.box.right > component.box.left) {
          component.box.right = mouse_x;
          component.Render();
        }
      }
      else if (component.corner_hit == "right-bottom") {
        if ((component.box.right > component.box.left) && (component.box.bottom > component.box.top)) {
          component.box.right = mouse_x;
          component.box.bottom = mouse_y;
          component.Render();
        }
      }
      else if (component.corner_hit == "left-bottom") {
        if (component.box.bottom > component.box.top) {
          component.box.bottom = mouse_y;
          component.Render();
        }
      }
    }, false);
  }

  /**
   * Renders the rectangle onto the canvas.
   */
  Render() {
    this.surface.fillStyle = "white";
    this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.sprite_loaded) {
      this.surface.drawImage(this.sprite, 0, 0);
    }
    this.surface.fillStyle = "lime";
    this.surface.globalAlpha = 0.5;
    let width = this.box.right - this.box.left + 1;
    let height = this.box.bottom - this.box.top + 1;
    this.surface.fillRect(this.box.left, this.box.top, width, height);
    // Draw corners.
    this.surface.globalAlpha = 1.0;
    this.surface.strokeStyle = "blue";
    this.surface.strokeRect(this.box.left - 4, this.box.top - 4, 9, 9);
    this.surface.strokeRect(this.box.left - 4, this.box.bottom - 4, 9, 9);
    this.surface.strokeRect(this.box.right - 4, this.box.top - 4, 9, 9);
    this.surface.strokeRect(this.box.right - 4, this.box.bottom - 4, 9, 9);
  }

  /**
   * Loads a bump map.
   * @param bump_map The bump map object.
   */
  Load(bump_map) {
    this.box.left = bump_map.left;
    this.box.top = bump_map.top;
    this.box.right = bump_map.right;
    this.box.bottom = bump_map.bottom;
    this.Render();
  }

  /**
   * Saves a bump map.
   * @param bump_map The bump map object to save to.
   */
  Save(bump_map) {
    bump_map.left = this.box.left;
    bump_map.top = this.box.top;
    bump_map.right = this.box.right;
    bump_map.bottom = this.box.bottom;
    this.Render();
  }

  /**
   * Loads a sprite into the background.
   * @param name The name of the sprite.
   */
  Load_Sprite(name) {
    let component = this;
    this.sprite_loaded = false;
    this.sprite.addEventListener("load", function(event) {
      component.sprite_loaded = true;
      component.Render();
    }, false);
    this.sprite.src = Get_Image(name + ".png", false, "Graphics");
  }

  /**
   * Clears out the bump map editor.
   */
  Clear() {
    this.surface.fillStyle = "white";
    this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

}

// **************************************************************************
// Sound Editor
// **************************************************************************

/**
 * A component that allows you to edit sound tracks.
 * 
 * Properties are as follows:
 * 
 * file - The file containing the names of the sound samples.
 */
class cSound_Editor extends cComponent {

  DEFAULT_ROWS = 10;
  DEFAULT_COLS = 10 * 4; // 1/4 second beat.
  CELL_W = 16;
  CELL_H = 16;

  constructor(entity, settings, container) {
    super(entity, settings, container);
    // Allocate grid size for 10 second track which will be default. There
    // will be 5 tracks by default.
    this.grid = [];
    for (let row_index = 0; row_index < this.DEFAULT_ROWS; row_index++) {
      let row = [];
      for (let col_index = 0; col_index < this.DEFAULT_COLS; col_index++) {
        row.push("");
      }
      this.grid.push(row);
    }
    this.pos = 0.0; // In seconds.
    this.scroll_x = 0;
    this.scroll_y = 0;
    this.sound_palette = {};
    this.timer = null;
    this.sounds_loaded = false;
    this.sound_block_loaded = false;
    this.sound_block = null;
    this.sel_sound = "";
    this.Create();
  }

  Create() {
    let component = this;
    this.canvas = this.Create_Element({
      id: this.entity.id,
      type: "canvas",
      attrib: {
        width: this.entity.width - 26,
        height: this.entity.height - 26
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 26) + "px",
        "height": String(this.entity.height - 26) + "px"
      }
    }, this.container);
    this.surface = this.canvas.getContext("2d");
    // Create scrollers.
    let h_scroller_form = this.Create_Element({
      id: this.entity.id + "_h_scroller_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + (this.entity.height - 2) - 24) + "px",
        "width": String(this.entity.width - 26) + "px",
        "height": "24px",
        "margin": "0",
        "padding": "0",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_h_scroller",
          type: "input",
          attrib: {
            type: "range",
            min: 0,
            max: this.DEFAULT_COLS * 10, // 100 seconds.
            step: 1,
            value: 0
          },
          css: {
            "width": "100%",
            "height": "100%",
            "margin": "0",
            "padding": "0",
            "cursor": Get_Image("Cursor.pic", true) + ", default",
            "background-image": Get_Image("Range.pic", true)
          }
        }
      ]
    }, this.container);
    this.h_scroller = h_scroller_form.firstChild;
    this.h_scroller.addEventListener("input", function(event) {
      component.scroll_x = event.target.value * component.CELL_W;
      component.Render();
    }, false);
    let v_scroller_form = this.Create_Element({
      id: this.entity.id + "_v_scroller_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + (this.entity.width - 2) - 24) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": "24px",
        "height": String(this.entity.height - 26) + "px",
        "margin": "0",
        "padding": "0",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_v_scroller",
          type: "input",
          attrib: {
            type: "range",
            min: 0,
            max: this.DEFAULT_ROWS,
            step: 1,
            value: 0
          },
          css: {
            "width": String(this.entity.height - 26) + "px",
            "height": "24px",
            "transform": "rotate(90deg) translate(0, -24px)",
            "transform-origin": "0 0",
            "margin": "0",
            "padding": "0",
            "cursor": Get_Image("Cursor.pic", true) + ", default",
            "background-image": Get_Image("Range.pic", true)
          }
        }
      ]
    }, this.container);
    this.v_scroller = v_scroller_form.firstChild;
    this.v_scroller.addEventListener("input", function(event) {
      component.scroll_y = event.target.value * component.CELL_H;
      component.Render();
    }, false);
    // Add the sound stack.
    this.sound_stack = this.Create_Element({
      id: this.entity.id + "_sound_stack",
      type: "div",
      css: {
        "position": "absolute",
        "left": "-2000px",
        "top": "0"
      }
    }, this.container);
    // Add default sound block icon.
    this.sound_block = new cImage();
    this.sound_block.on_load = function() {
      component.sound_block_loaded = true;
    };
    this.sound_block.Load(Get_Image("Sound_Block.pic", false));
    // Add mouse handlers for canvas.
    this.canvas.addEventListener("click", function(event) {
      let mouse_x = event.offsetX;
      let mouse_y = event.offsetY;
      // Check to see which cell was clicked.
      let row_count = component.grid.length;
      for (let row_index = 0; row_index < row_count; row_index++) {
        let row = component.grid[row_index];
        let col_count = row.length;
        for (let col_index = 0; col_index < col_count; col_index++) {
          let sound = row[col_index];
          let bump_map = {
            left: col_index * (component.CELL_W + 1) - component.scroll_x,
            top: row_index * (component.CELL_H + 1) - component.scroll_y,
            right: (col_index * (component.CELL_W + 1)) + component.CELL_W - component.scroll_x,
            bottom: (row_index * (component.CELL_H + 1)) + component.CELL_H - component.scroll_y
          };
          if ((mouse_x >= bump_map.left) && (mouse_x <= bump_map.right) && (mouse_y >= bump_map.top) && (mouse_y <= bump_map.bottom)) {
            if (sound.length > 0) {
              row[col_index] = "";
            }
            else {
              row[col_index] = component.sel_sound;
              component.Play_Sound(component.sel_sound);
            }
            component.Render();
            break;
          }
        }
      }
    }, false);
  }

  /**
   * Loads the sound palette.
   * @param name The name of the sound palette.
   */
  Load_Sound_Palette(name) {
    let component = this;
    this.sounds_loaded = false;
    let pal_file = new cFile("Sounds/" + name + ".txt");
    pal_file.on_read = function() {
      let sounds = pal_file.lines;
      // Clean out sound stack.
      component.Remove_Elements(component.sound_stack);
      component.Load_Sound(sounds, 0, function() {
        component.sounds_loaded = true;
      });
    };
    pal_file.Read();
  }

  /**
   * Loads a collection of sounds into the sound stack.
   * @param sounds The array of sounds to be loaded. 
   * @param index The index of the sound in the array to load. 
   * @param on_load Called when all the sounds have been loaded. 
   */
  Load_Sound(sounds, index, on_load) {
    let component = this;
    if (index < sounds.length) {
      let name = sounds[index];
      let icon = new cImage();
      icon.on_load = function() {
        let audio = component.Create_Element({
          id: component.entity.id + "_sound_" + name,
          type: "audio",
          subs: [
            {
              id: component.entity.id + "_sound_source_wav_" + name,
              type: "source",
              attrib: {
                src: "Sounds/" + name + ".wav",
                type: "audio/wav"
              }
            }
          ]
        }, component.sound_stack);
        component.sound_palette[name] = {
          icon: icon,
          sound: audio
        };
        // Try to force loading of the sound.
        audio.load();
        if (frankus_layout.browser.name == "firefox") {
          component.Load_Sound(sounds, index + 1, on_load);
        }
        else {
          audio.addEventListener("canplaythrough", function() {
            component.Load_Sound(sounds, index + 1, on_load);
          }, false);
        }
      };
      icon.Load(Get_Image(name + ".pic", false));
    }
    else {
      on_load();
    }
  }

  /**
   * Renders the sound grid.
   */
  Render() {
    if (this.sounds_loaded) {
      // Clear the canvas.
      this.surface.globalAlpha = 1.0;
      this.surface.fillStyle = "white";
      this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
      // Grab grid dimensions.
      let row_count = this.grid.length;
      let col_count = this.grid[0].length;
      // Draw black box.
      this.surface.fillStyle = "black";
      this.surface.fillRect(0 - this.scroll_x, 0 - this.scroll_y, col_count * (this.CELL_W + 1) + 1, row_count * (this.CELL_H + 1) + 1);
      // Draw the grid boxes and icons.
      for (let row_index = 0; row_index < row_count; row_index++) {
        for (let col_index = 0; col_index < col_count; col_index++) {
          let x = col_index * (this.CELL_W + 1) + 1 - this.scroll_x;
          let y = row_index * (this.CELL_H + 1) + 1 - this.scroll_y;
          let sound = this.grid[row_index][col_index];
          if (this.sound_block_loaded) {
            this.surface.drawImage(this.sound_block.Get_Canvas(), x, y);
          }
          if (this.sound_palette[sound] != undefined) {
            this.surface.drawImage(this.sound_palette[sound].icon.Get_Canvas(), x, y);
          }
        }
      }
      // Highlight current position.
      this.surface.fillStyle = "yellow";
      this.surface.globalAlpha = 0.5;
      let pos = Math.floor(this.pos * 4) * (this.CELL_W + 1) + 1 - this.scroll_x;
      this.surface.fillRect(pos, 0 - this.scroll_y, this.CELL_W, (this.CELL_H + 1) * row_count + 1);
    }
  }

  /**
   * Sets the position in seconds or fractions of.
   * @param pos The position in fractional seconds. This is a string.
   */
  Set_Position(pos) {
    this.pos = parseFloat(pos);
    let time_end = this.grid[0].length * 0.25;
    if (this.pos < 0.0) {
      this.pos = 0.0;
    }
    if (this.pos >= time_end) {
      this.pos = time_end - 0.25;
    }
    this.Render();
  }

  /**
   * Plays the sound tracks.
   * @param on_play Called for every note played on the track. The time is passed in.
   */
  Play(on_play) {
    if (!this.timer && this.sounds_loaded) { // Track stopped?
      let component = this;
      let time_end = this.grid[0].length * 0.25;
      this.timer = setInterval(function() {
        if (component.pos < time_end) {
          // Play the audio column.
          let track_count = component.grid.length;
          let col_index = Math.floor(component.pos * 4);
          for (let track_index = 0; track_index < track_count; track_index++) {
            let sound = component.grid[track_index][col_index];
            component.Play_Sound(sound);
          }
          component.Render();
          on_play(component.pos);
          component.pos += 0.25;
        }
        else {
          component.Stop();
          component.pos = 0.0;
          component.Render();
        }
      }, 250); // 1/4 a second interval.
    }
  }

  /**
   * Stops the track.
   */
  Stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.Render();
    }
  }

  /**
   * Clears the track.
   */
  Clear() {
    this.Stop();
    this.pos = 0.0;
    let row_count = this.grid.length;
    for (let row_index = 0; row_index < row_count; row_index++) {
      let col_count = this.grid[row_index].length;
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.grid[row_index][col_index] = "";
      }
    }
    this.Render();
  }

  /**
   * Resizes the track to the time length.
   * @param time_length The length of time to resize the track to. 
   */
  Resize(time_length) {
    let row_count = this.grid.length;
    let col_count = Math.floor(time_length * 4);
    for (let row_index = 0; row_index < row_count; row_index++) {
      this.grid[row_index] = [];
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.grid[row_index].push("");
      }
    }
    this.Render();
  }

  /**
   * Loads a track from a file.
   * @param name The name of the track.
   * @param on_load Called when the track is loaded the track time length is passed in.
   * @param on_error Called if the track was not loaded.
   */
  Load_Track(name, on_load, on_error) {
    let component = this;
    // Stop the track if it is playing.
    this.Stop();
    this.pos = 0.0;
    let track_file = new cFile("Tracks/" + name + ".txt");
    track_file.on_read = function() {
      let tracks = track_file.lines;
      let track_count = tracks.length;
      // Recreate grid to accomodate track.
      component.grid = [];
      let time_length = 0.0;
      for (let track_index = 0; track_index < track_count; track_index++) {
        let sounds = tracks[track_index].split(/,/);
        let sound_count = sounds.length;
        time_length = sound_count * 0.25;
        component.grid.push([]);
        for (let sound_index = 0; sound_index < sound_count; sound_index++) {
          let sound = sounds[sound_index];
          component.grid[track_index].push(sound);
        }
      }
      component.Render();
      // Callback with time passed in.
      on_load(time_length);
    };
    track_file.on_not_found = function() {
      on_error();
    };
    track_file.Read();
  }

  /**
   * Saves a track into a file.
   * @param name The name of the file to save the track into.
   */
  Save_Track(name) {
    let track_count = this.grid.length;
    let save_file = new cFile("Tracks/" + name + ".txt");
    for (let track_index = 0; track_index < track_count; track_index++) {
      let track = this.grid[track_index];
      save_file.Add(track.join(","));
    }
    save_file.on_write = function() {
      console.log(save_file.message);
    };
    save_file.Write();
  }

  /**
   * Gets the time length of the track.
   * @return The length of in seconds.
   */
  Get_Time_Length() {
    return (this.grid[0].length * 0.25);
  }

  /**
   * Plays a sound sample from the sound palette.
   * @param name The name of the sound.
   */
  Play_Sound(name) {
    if (this.sound_palette[name] != undefined) {
      let sound = this.sound_palette[name].sound;
      sound.currentTime = 0;
      sound.play();
    }
  }

}

// **************************************************************************
// Message Board
// **************************************************************************

/**
 * Creates a fully functional message board. The board may be read but only
 * written if the editor code is provided. The properties are as follows:
 *
 * - font - The font to use for the forum.
 */
class cBoard extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.current_thread = "";
    this.current_post = "";
    this.rendering = false;
    this.Create();
  }
  
  Create() {
    let board = this.Create_Element({
      id: this.entity.id + "_topic_board",
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "background-color": "#f7fbff"
      },
      subs: [
        {
          id: this.entity.id + "_topic_area",
          type: "div",
          css: {
            "margin": "1px",
            "margin-top": "32px",
            "padding": "4px",
            "width": "calc(100% - 10px)",
            "height": "calc(100% - 41px)",
            "overflow-y": "scroll",
            "overflow-x": "hidden",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": "16px",
            "color": "black",
            "background-color": "white"
          }
        },
        this.Make_Button(this.entity.id + "_new_topic", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "New Topic"
        }),
        this.Make_Button(this.entity.id + "_reply_post", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Reply"
        }),
        this.Make_Button(this.entity.id + "_disp_topics", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Topics"
        })
      ]
    }, this.container);
    let component = this;
    // Create handlers for buttons.
    this.elements[this.entity.id + "_new_topic"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Toggle_Topic_Form(true);
      }
    }, false);
    this.elements[this.entity.id + "_reply_post"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Toggle_Post_Form(true);
      }
    }, false);
    this.elements[this.entity.id + "_disp_topics"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Toggle_Board(true);
      }
    }, false);
    let reply_box = this.Create_Element({
      id: this.entity.id + "_topic_reply_box",
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "background-color": "#f7fbff",
        "display": "none"
      },
      subs: [
        {
          id: this.entity.id + "_screen_name_area",
          type: "div",
          css: {
            "margin": "1px",
            "margin-top": "32px",
            "width": "calc(100% - 2px)",
            "height": "32px",
            "position": "relative"
          },
          subs: [
            this.Make_Form(this.entity.id + "_screen_name_form", [
              this.Make_Field(this.entity.id + "_screen_name", {
                "label": "Enter screen name.",
                "height": 24
              })
            ])
          ]
        },
        {
          id: this.entity.id + "_reply_area",
          type: "div",
          css: {
            "margin": "1px",
            "margin-top": "1px",
            "width": "calc(100% - 2px)",
            "height": "calc(100% - 34px)",
            "position": "relative"
          },
          subs: [
            {
              id: this.entity.id + "_topic_form_area",
              type: "div",
              css: {
                "width": "100%",
                "height": "30px",
                "position": "relative",
                "display": "none"
              },
              subs: [
                this.Make_Form(this.entity.id + "_topic_form", [
                  this.Make_Field(this.entity.id + "_topic_title", {
                    "label": "Enter topic here.",
                    "height": 24
                  })
                ])
              ]
            },
            {
              id: this.entity.id + "_post_form_area",
              type: "div",
              css: {
                "width": "100%",
                "height": "calc(100% - 96px)",
                "position": "relative",
                "display": "none"
              },
              subs: [
                this.Make_Form(this.entity.id + "_post_form", [
                  this.Make_Edit(this.entity.id + "_topic_post", {
                    "label": "Type in post here."
                  })
                ])
              ]
            }
          ]
        },
        this.Make_Button(this.entity.id + "_post_topic", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Post"
        }),
        this.Make_Button(this.entity.id + "_cancel_topic", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Cancel"
        }),
        this.Make_Button(this.entity.id + "_post_reply", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Post"
        }),
        this.Make_Button(this.entity.id + "_cancel_reply", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Cancel"
        }),
        this.Make_Button(this.entity.id + "_post_edit", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Edit"
        }),
        this.Make_Button(this.entity.id + "_cancel_edit", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Cancel"
        })
      ]
    }, this.container);
    // Add handlers for buttons.
    this.elements[this.entity.id + "_post_topic"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Post_Topic(component.elements[component.entity.id + "_screen_name"],
                             component.elements[component.entity.id + "_topic_title"],
                             component.elements[component.entity.id + "_topic_post"],
                             function() {
                               component.Toggle_Topic_Form(false);
                               component.Toggle_Board(true);
                             });
      }
    }, false);
    this.elements[this.entity.id + "_cancel_topic"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Toggle_Topic_Form(false);
        component.Toggle_Board(true);
      }
    }, false);
    this.elements[this.entity.id + "_post_reply"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Post_Reply(component.current_thread,
                             component.elements[component.entity.id + "_screen_name"],
                             component.elements[component.entity.id + "_topic_title"],
                             component.elements[component.entity.id + "_topic_post"],
                             function() {
                               component.Toggle_Post_Form(false);
                               component.Toggle_Thread(true, component.current_thread);
                             });
      }
    }, false);
    this.elements[this.entity.id + "_cancel_reply"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Toggle_Post_Form(false);
        component.Toggle_Thread(true, component.current_thread);
      }
    }, false);
    this.elements[this.entity.id + "_post_edit"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Post_Edit(component.current_post,
                            component.elements[component.entity.id + "_screen_name"],
                            component.elements[component.entity.id + "_topic_post"],
                            function() {
                              component.Toggle_Edit_Form(false);
                              component.Toggle_Thread(true, component.current_thread);
                            });
      }
    }, false);
    this.elements[this.entity.id + "_cancel_edit"].addEventListener("click", function(event) {
      if (!component.rendering) {
        component.Toggle_Edit_Form(false);
        component.Toggle_Thread(true, component.current_thread);
      }
    }, false);
    // Display the topics.
    this.Display_Topics();
  }
  
  /**
   * Removes the loaded topics allowing for garbage collection.
   */
  Remove_Topics(container) {
    let items = container.childNodes.slice(0);
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let id = item.id;
      container.removeChild(item);
      // Remove element reference for garbage collection.
      delete this.elements[id];
    }
  }
  
  /**
   * Displays all topics in the message board.
   */
  Display_Topics() {
    let component = this;
    // Show and hide necessary buttons.
    this.Show(this.entity.id + "_new_topic");
    this.Hide(this.entity.id + "_disp_topics");
    this.Hide(this.entity.id + "_reply_post");
    this.rendering = true;
    let topics_file = new cFile("Board/Topics.txt");
    topics_file.on_read = function() {
      component.Remove_Elements(component.elements[component.entity.id + "_topic_area"]);
      let topics = topics_file.lines;
      topics.reverse();
      let topic_count = topics.length;
      for (let topic_index = 0; topic_index < topic_count; topic_index++) {
        let topic = topics[topic_index].split(/:/);
        let title = topic[0];
        let thread = topic[1];
        let status = topic[2];
        if (status == "deleted") {
          continue; // This topic is not to be displayed.
        }
        // Create topic link.
        let topic_link = component.Create_Element({
          id: component.entity.id + "_topic_link_" + topic_index,
          type: "div",
          text: title,
          css: {
            "width": "calc(100% - 2px)",
            "height": "24px",
            "margin": "1px",
            "color": "black",
            "position": "relative",
            "cursor": String(Get_Image("Cursor.pic", true) + ", default"),
            "margin-bottom": "0",
            "border-bottom": "1px dashed #bfdcfd",
            "position": "relative"
          },
          subs: [
            {
              id: component.entity.id + "_topic_delete_" + topic_index,
              type: "div",
              css: {
                "position": "absolute",
                "right": "4px",
                "top": "4px",
                "width": "16px",
                "height": "16px",
                "background-image": Get_Image("Clear.pic", true),
                "cursor": String(Get_Image("Cursor.pic", true) + ", default")
              }
            }
          ]
        }, component.entity.id + "_topic_area");
        topic_link.frankus_thread_id = thread;
        // Add handlers for topic link.
        topic_link.addEventListener("click", function(event) {
          if (!component.rendering) {
            let link = event.target;
            if (link.frankus_thread_id) {
              component.current_thread = link.frankus_thread_id;
              component.Display_Posts(link.frankus_thread_id);
            }
          }
        }, false);
        // Add for topic delete.
        component.elements[component.entity.id + "_topic_delete_" + topic_index].frankus_thread_id = thread;
        component.elements[component.entity.id + "_topic_delete_" + topic_index].addEventListener("click", function(event) {
          if (!component.rendering) {
            let link = event.target;
            component.Update_Topic(link.frankus_thread_id, "deleted");
            event.stopPropagation();
          }
        }, false);
      }
      component.rendering = false;
    };
    topics_file.on_not_found = function() {
      component.Remove_Elements(component.elements[component.entity.id + "_topic_area"]);
      component.elements[component.entity.id + "_topic_area"].innerHTML = "No topics to display.";
      component.rendering = false;
    };
    topics_file.Read();
  }
  
  /**
   * Updates the status of a topic.
   * @param thread_id The ID of the thread associated with the topic.
   * @param status The status of the topic.
   */
  Update_Topic(thread_id, status) {
    let component = this;
    this.rendering = true;
    let topics_file = new cFile("Board/Topics.txt");
    topics_file.on_read = function() {
      let topics = topics_file.lines;
      let topic_count = topics.length;
      for (let topic_index = 0; topic_index < topic_count; topic_index++) {
        let topic = topics[topic_index].split(/:/);
        let title = topic[0];
        let thread = topic[1];
        let topic_status = topic[2];
        if (thread == thread_id) {
          topic_status = status;
          topic = title + ":" + thread + ":" + topic_status;
          topics[topic_index] = topic;
          break;
        }
      }
      // Write out changes.
      let save_file = new cFile("Board/Topics.txt");
      save_file.lines = topics.join("\n");
      save_file.on_write = function() {
        // Reload the topics display.
        component.Toggle_Board(true);
        component.rendering = false;
      };
      save_file.on_not_found = function() {
        component.Toggle_Board(true);
        component.rendering = false;
      };
      save_file.Write();
    };
    topics_file.Read();
  }
  
  /**
   * Displays the posts associated with the topic.
   * @param thread_id The ID of the thread with the posts.
   */
  Display_Posts(thread_id) {
    let component = this;
    this.Show(this.entity.id + "_disp_topics");
    this.Show(this.entity.id + "_reply_post");
    this.Hide(this.entity.id + "_new_topic");
    this.rendering = true;
    let thread_file = new cFile("Board/Thread_" + thread_id + ".txt");
    thread_file.on_read = function() {
      component.Remove_Elements(component.elements[component.entity.id + "_topic_area"]);
      // Extract posts from thread.
      let posts = thread_file.lines;
      component.Render_Post(posts, 0);
    };
    thread_file.on_not_found = function() {
      component.Remove_Elements(component.elements[component.entity.id + "_topic_area"]);
      component.elements[component.entity.id + "_topic_area"].innerHTML = "No posts.";
      component.rendering = false;
    };
    thread_file.Read();
  }
  
  /**
   * Renders a post, one at a time, from an array.
   * @param posts The array of posts.
   * @param index The current index of the post.
   */
  Render_Post(posts, index) {
    if (index < posts.length) {
      let post = posts[index].split(/:/);
      let title = post[0];
      let author = post[1];
      let post_id = post[2];
      let component = this;
      let post_file = new cFile("Board/Post_" + post_id + ".txt");
      post_file.on_read = function() {
        let body = post_file.data;
        // Do the actual rendering of the post.
        let post_board = component.Create_Element({
          id: component.entity.id + "_post_board_" + index,
          type: "div",
          text: "@" + title + "@" + "*by " + author + "*\n\n" + body,
          css: {
            "padding": "4px",
            "margin": "1px",
            "margin-bottom": "8px",
            "width": "calc(100% - 10px)",
            "background-color": "#f7fbff",
            "color": "black",
            "box-shadow": "2px 2px 2px gray",
            "overflow": "auto",
            "position": "relative"
          },
          subs: [
            component.Make_Button(component.entity.id + "_edit_post_" + index, {
              "label": "Edit",
              "bg-color": "#3a654f",
              "fg-color": "white",
              "right": 4,
              "top": 4,
              "width": 50,
              "height": 20,
              "opacity": 0.7
            })
          ]
        }, component.entity.id + "_topic_area");
        // Attach post ID.
        component.elements[component.entity.id + "_edit_post_" + index].frankus_post_id = post_id;
        // Handle edit click event.
        component.elements[component.entity.id + "_edit_post_" + index].addEventListener("click", function(event) {
          if (!component.rendering) {
            let pboard = event.target;
            if (pboard.frankus_post_id) {
              component.current_post = pboard.frankus_post_id;
              component.Toggle_Edit_Form(true, pboard.frankus_post_id);
            }
          }
        }, false);
        // Display the next post.
        component.Render_Post(posts, index + 1);
      };
      post_file.on_not_found = function() {
        component.rendering = false; // Error so rendering stopped.
      };
      post_file.Read();
    }
    else {
      this.rendering = false;
    }
  }
  
  /**
   * Toggles the message board display.
   * @param show True to show, false to hide.
   */
  Toggle_Board(show) {
    if (show) {
      this.Show(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_new_topic");
      this.Hide(this.entity.id + "_topic_reply_box");
      this.Hide(this.entity.id + "_reply_post");
      this.Hide(this.entity.id + "_disp_topics");
      this.Display_Topics();
    }
    else {
      this.Hide(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Toggles the thread to display.
   * @param show True to show, false to hide.
   * @param thread_id The ID of the thread to display.
   */
  Toggle_Thread(show, thread_id) {
    if (show) {
      this.Show(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_reply_post");
      this.Show(this.entity.id + "_disp_topics");
      this.Hide(this.entity.id + "_new_topic");
      this.Hide(this.entity.id + "_topic_reply_box");
      this.Display_Posts(thread_id);
    }
    else {
      this.Hide(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Toggles the topic form.
   * @param show True to show, false to hide.
   */
  Toggle_Topic_Form(show) {
    if (show) {
      this.Show(this.entity.id + "_topic_reply_box");
      this.Show(this.entity.id + "_topic_form_area");
      this.Show(this.entity.id + "_post_form_area");
      this.Show(this.entity.id + "_post_topic");
      this.Show(this.entity.id + "_cancel_topic");
      this.Hide(this.entity.id + "_topic_board");
      this.Hide(this.entity.id + "_post_reply");
      this.Hide(this.entity.id + "_cancel_reply");
      this.Hide(this.entity.id + "_post_edit");
      this.Hide(this.entity.id + "_cancel_edit");
      // Set screen name.
      let screen_name = localStorage.getItem("screen_name");
      if (screen_name) {
        this.elements[this.entity.id + "_screen_name"].value = screen_name;
      }
      else {
        this.elements[this.entity.id + "_screen_name"].value = "";
      }
      // Clear out fields.
      this.elements[this.entity.id + "_topic_title"].value = "";
      this.elements[this.entity.id + "_topic_post"].value = "";
    }
    else {
      this.Hide(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Toggles the post form.
   * @param show True to show, false to hide.
   */
  Toggle_Post_Form(show) {
    if (show) {
      this.Show(this.entity.id + "_topic_reply_box");
      this.Show(this.entity.id + "_post_form_area");
      this.Show(this.entity.id + "_topic_form_area");
      this.Show(this.entity.id + "_post_reply");
      this.Show(this.entity.id + "_cancel_reply");
      this.Hide(this.entity.id + "_topic_board");
      this.Hide(this.entity.id + "_post_topic");
      this.Hide(this.entity.id + "_cancel_topic");
      this.Hide(this.entity.id + "_post_edit");
      this.Hide(this.entity.id + "_cancel_edit");
      // Set screen name.
      let screen_name = localStorage.getItem("screen_name");
      if (screen_name) {
        this.elements[this.entity.id + "_screen_name"].value = screen_name;
      }
      else {
        this.elements[this.entity.id + "_screen_name"].value = "";
      }
      // Clear out fields.
      this.elements[this.entity.id + "_topic_title"].value = "";
      this.elements[this.entity.id + "_topic_post"].value = "";
    }
    else {
      this.Hide(this.entity.id + "_topic_reply_box");
    }
  }

  /**
   * Toggles a post form but with edit buttons and content displayed.
   * @param show True to show, false to hide.
   * @param post_id Identifies the post to edit.
   */  
  Toggle_Edit_Form(show, post_id) {
    if (show) {
      this.Show(this.entity.id + "_topic_reply_box");
      this.Show(this.entity.id + "_post_form_area");
      this.Show(this.entity.id + "_post_edit");
      this.Show(this.entity.id + "_cancel_edit");
      this.Hide(this.entity.id + "_topic_board");
      this.Hide(this.entity.id + "_topic_form_area");
      this.Hide(this.entity.id + "_post_reply");
      this.Hide(this.entity.id + "_cancel_reply");
      this.Hide(this.entity.id + "_post_topic");
      this.Hide(this.entity.id + "_cancel_topic");
      // Set screen name.
      let screen_name = localStorage.getItem("screen_name");
      if (screen_name) {
        this.elements[this.entity.id + "_screen_name"].value = screen_name;
      }
      else {
        this.elements[this.entity.id + "_screen_name"].value = "";
      }
      // Load post.
      let component = this;
      this.rendering = true;
      let post_file = new cFile("Board/Post_" + post_id + ".txt");
      post_file.on_read = function() {
        let body = post_file.data;
        component.elements[component.entity.id + "_topic_post"].value = body;
        component.rendering = false;
      };
      post_file.on_not_found = function() {
        component.elements[component.entity.id + "_topic_post"].value = "";
        component.rendering = false;
      };
      post_file.Read();
    }
    else {
      this.Hide(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Posts a new topic to the board. Validation is performed too.
   * @param screen_name A screen name of your choosing to identify yourself.
   * @param topic_title A short description of the topic.
   * @param topic_post The body of the topic. This will be the first post.
   * @param on_post Called when topic is done posting.
   */
  Post_Topic(screen_name, topic_title, topic_post, on_post) {
    if ((screen_name.value.length > 0) && (topic_title.value.length > 0) && (topic_post.value.length > 0)) {
      localStorage.setItem("screen_name", screen_name.value);
      // Generate thread id and post id.
      let date = new Date();
      let thread_id = String_To_Hex(topic_title.value + date.getTime());
      let post_id = String_To_Hex(topic_title.value + date.getTime());
      // Add to topics file.
      this.rendering = true;
      let topics_file = new cFile("Board/Topics.txt");
      let component = this;
      topics_file.on_read = function() {
        let topics = topics_file.lines;
        topics.push(topic_title.value + ":" + thread_id + ":active");
        let topics_save = new cFile("Board/Topics.txt");
        topics_save.lines = topics;
        topics_save.on_write = function() {
          let thread_save = new cFile("Board/Thread_" + thread_id + ".txt");
          thread_save.data = topic_title.value + ":" + screen_name.value + ":" + post_id;
          thread_save.on_write = function() {
            let post_save = new cFile("Board/Post_" + post_id + ".txt");
            post_save.data = topic_post.value;
            post_save.on_write = function() {
              on_post();
              component.rendering = false;
            };
            post_save.on_not_found = function() {
              on_post();
              component.rendering = false;
            };
            post_save.Write();
          };
          thread_save.on_not_found = function() {
            on_post();
            component.rendering = false;
          };
          thread_save.Write();
        };
        topics_save.on_not_found = function() {
          on_post();
          component.rendering = false;
        };
        topics_save.Write();
      };
      topics_file.on_not_found = function() {
        let topics_save = new cFile("Board/Topics.txt", topic_title.value + ":" + thread_id + ":active");
        topics_save.on_write = function() {
          let thread_save = new cFile("Board/Thread_" + thread_id + ".txt");
          thread_save.data = topic_title.value + ":" + screen_name.value + ":" + post_id;
          thread_save.on_write = function() {
            let post_save = new cFile("Board/Post_" + post_id + ".txt");
            post_save.data = topic_post.value;
            post_save.on_write = function() {
              on_post();
              component.rendering = false;
            };
            post_save.on_not_found = function() {
              on_post();
              component.rendering = false;
            };
            post_save.Write();
          };
          thread_save.on_not_found = function() {
            on_post();
            component.rendering = false;
          };
          thread_save.Write();
        };
        topics_save.on_not_found = function() {
          on_post();
          component.rendering = false;
        };
        topics_save.Write();
      };
      topics_file.Read();
    }
    else {
      if (screen_name.value.length == 0) {
        screen_name.focus();
      }
      if (topic_title.value.length == 0) {
        topic_title.focus();
      }
      if (topic_post.value.length == 0) {
        topic_post.focus();
      }
    }
  }
  
  /**
   * Posts a new reply to a thread. Validation is performed too.
   * @param thread_id The ID of the thread to post to.
   * @param screen_name A screen name of your choosing to identify yourself.
   * @param topic_title A short description of the reply.
   * @param topic_post The body of the reply.
   * @param on_post Called when reply is done posting.
   */
  Post_Reply(thread_id, screen_name, topic_title, topic_post, on_post) {
    if ((screen_name.value.length > 0) && (topic_title.value.length > 0) && (topic_post.value.length > 0)) {
      localStorage.setItem("screen_name", screen_name.value);
      // Generate post id.
      let date = new Date();
      let post_id = String_To_Hex(topic_title.value + date.getTime());
      this.rendering = true;
      let thread_file = new cFile("Board/Thread_" + thread_id + ".txt");
      let component = this;
      thread_file.on_read = function() {
        let posts = thread_file.lines;
        posts.push(topic_title.value + ":" + screen_name.value + ":" + post_id);
        let thread_save = new cFile("Board/Thread_" + thread_id + ".txt");
        thread_save.lines = posts;
        thread_save.on_write = function() {
          let post_save = new cFile("Board/Post_" + post_id + ".txt");
          post_save.data = topic_post.value;
          post_save.on_write = function() {
            on_post();
            component.rendering = false;
          };
          post_save.on_not_found = function() {
            on_post();
            component.rendering = false;
          };
          post_save.Write();
        };
        thread_save.on_not_found = function() {
          on_post();
          component.rendering = false;
        };
        thread_save.Write();
      };
      thread_file.on_not_found = function() {
        on_post();
        component.rendering = false;
      };
      thread_file.Read();
    }
    else {
      if (screen_name.value.length == 0) {
        screen_name.focus();
      }
      if (topic_title.value.length == 0) {
        topic_title.focus();
      }
      if (topic_post.value.length == 0) {
        topic_post.focus();
      }
    }
  }
  
  /**
   * Updates a post. Validation is performed too.
   * @param post_id The ID of the post to edit.
   * @param screen_name A screen name of your choosing to identify yourself.
   * @param topic_post The body of the post.
   * @param on_post Called when post is complete.
   */
  Post_Edit(post_id, screen_name, topic_post, on_post) {
    if ((screen_name.value.length > 0) && (topic_post.value.length > 0)) {
      localStorage.setItem("screen_name", screen_name.value);
      this.rendering = true;
      let component = this;
      let post_save = new cFile("Board/Post_" + post_id + ".txt");
      post_save.data = topic_post.value;
      post_save.on_write = function() {
        on_post();
        component.rendering = false;
      };
      post_save.on_not_found = function() {
        on_post();
        component.rendering = false;
      };
      post_save.Write();
    }
    else {
      if (screen_name.value.length == 0) {
        screen_name.focus();
      }
      if (topic_post.value.length == 0) {
        topic_post.focus();
      }
    }
  }

}

// **************************************************************************
// Chat
// **************************************************************************

/**
 * Creates a chat. This consists of a chat display pane 
 * and a write box. Again, like the message board you must
 * input the editor code to write to it.
 */
class cChat extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.timer = null;
    this.queried_files = [ "refresh" ];
    this.Create();
  }
  
  Create() {
    let chat_outer = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px"
      },
      subs: [
        {
          id: this.entity.id + "_message_box",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "calc(100% - 10px)",
            "height": "calc(100% - 104px - 10px)",
            "padding": "5px",
            "overflow": "scroll",
            "background-color": "#FDFEFE",
            "font": this.settings["font"] || "Regular, sans-serif"
          }
        },
        {
          id: this.entity.id + "_screen_name_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "calc(100% - 104px)",
            "width": "100%",
            "height": "24px",
          },
          subs: [
            this.Make_Form(this.entity.id + "_screen_name_form", [
              this.Make_Field(this.entity.id + "_screen_name", {
                "label": "Screen Name",
                "height": 24
              })
            ])
          ]
        },
        {
          id: this.entity.id + "_message_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "calc(100% - 104px + 24px)",
            "width": "100%",
            "height": "56px",
          },
          subs: [
            this.Make_Form(this.entity.id + "_message_form", [
              this.Make_Edit(this.entity.id + "_message", {
                "label": "Type in your message here."
              })
            ])
          ]
        },
        {
          id: this.entity.id + "_post_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "calc(100% - 104px + 24px + 56px)",
            "width": "100%",
            "height": "24px"
          },
          subs: [
            this.Make_Button(this.entity.id + "_post", {
              "label": "Post",
              "top": 0,
              "right": 0,
              "fg-color": "white",
              "bg-color": "lightblue",
              "width": 80,
              "height": 24
            }),
            this.Make_Button(this.entity.id + "_clear", {
              "label": "Clear",
              "top": 0,
              "left": 0,
              "fg-color": "white",
              "bg-color": "lightgreen",
              "width": 80,
              "height": 24
            })
          ]
        }
      ]
    }, this.container);
    let component = this;
    let message_box = this.elements[this.entity.id + "_message"];
    let screen_name = this.elements[this.entity.id + "_screen_name"];
    screen_name.addEventListener("focus", function(event) {
      screen_name.select();
    }, false);
    this.elements[this.entity.id + "_post"].addEventListener("click", function(event) {
      clearInterval(component.timer);
      component.Post_Message(message_box, screen_name, function(message) {
        console.log(message);
        component.Display_Chats();
        message_box.value = "";
        // Save the screen name.
        localStorage.setItem("screen_name", screen_name.value);
        component.timer = setInterval(function() {
          component.Display_Chats();
        }, 5000);
      }, function(error) {
        console.log(error);
      });
    }, false);
    this.elements[this.entity.id + "_clear"].addEventListener("click", function(event) {
      message_box.value = "";
    }, false);
    // Set up chat display.
    this.Display_Chats();
    this.timer = setInterval(function() {
      component.Display_Chats();
    }, 5000);
    // Load screen name value.
    if (localStorage.getItem("screen_name") != null) {
      screen_name.value = localStorage.getItem("screen_name");
    }
  }
  
  /**
   * Pauses the execution of the timer.
   */
  Pause() {
    clearInterval(this.timer);
    // this.timer = null;
  }
  
  /**
   * Resumes execution of the timer.
   */
  Resume() {
    let component = this;
    this.timer = setInterval(function() {
      component.Display_Chats();
    }, 5000);
  }
  
  /**
   * Posts a message to the chat.
   * @param message The message object to post to.
   * @param screen_name The screen name object identifying the user.
   * @param on_post Called if the message was posted. The success message is passed in.
   * @param on_error Called if the message was not posted. The error message is passed in.
   */
  Post_Message(message, screen_name, on_post, on_error) {
    if ((message.value.length > 0) && (screen_name.value.length > 0)) {
      let date = new Date();
      let time_stamp = date.getTime();
      let post_id = "Chat_" + time_stamp;
      let body = "@" + screen_name.value + "@" + message.value;
      let save_file = new cFile("Chat/" + post_id + ".txt");
      save_file.data = body;
      save_file.on_write = on_post;
      save_file.on_not_found = on_error;
      save_file.Write();
    }
  }
  
  /**
   * Displays all entered chats that are recent.
   */
  Display_Chats() {
    let component = this;
    cFile.Query_Files("@Chat_", "Chat", function(files) {
      // Scrub files.
      let file_count = files.length;
      files.sort(function(a, b) {
        b = parseInt(b.replace(/^Chat_/, "").replace(/\.txt$/, ""));
        a = parseInt(a.replace(/^Chat_/, "").replace(/\.txt$/, ""));
        return b - a;
      });
      files.reverse();
      files = files.slice(0, 50);
      if (component.queried_files.length != files.length) {
        component.queried_files = files.slice(0);
        component.Remove_Elements(component.elements[component.entity.id + "_message_box"]);
        component.Display_Chat(files, 0, function() {
          setTimeout(function() {
            component.elements["chat_message_box"].scrollTop = component.elements["chat_message_box"].scrollHeight;
          }, 500);
        });
      }
    });
  }
  
  /**
   * Displays a chat from a file using the index.
   * @param files The files containing the chats.
   * @param index The index of the chat.
   * @param on_display Called when the chat is done displaying.
   */
  Display_Chat(files, index, on_display) {
    if (index < files.length) {
      let file = files[index];
      let component = this;
      let chat_file = new cFile("Chat/" + file);
      chat_file.on_read = function() {
        let panel = component.Create_Element({
          id: component.entity.id + "_panel_" + index,
          type: "div",
          text: chat_file.data,
          css: {
            "margin-bottom": "16px",
            "border-bottom": "1px dashed gray",
            "padding-bottom": "8px"
          }
        }, component.entity.id + "_message_box");
        component.Display_Chat(files, index + 1, on_display);
      };
      chat_file.on_not_found = function() {
        let error_box = component.Create_Element({
          id: component.entity.id + "_error_box_" + index,
          type: "div",
          text: "Could not load chat.",
          css: {
            "color": "red",
            "font-weight": "bold",
            "margin-bottom": "16px",
            "border-bottom": "1px dashed gray",
            "padding-bottom": "8px"
          }
        }, component.entity.id + "_message_box");
        component.Display_Chat(files, index + 1, on_display);
      };
      chat_file.Read();
    }
    else {
      on_display();
    }
  }

}

// **************************************************************************
// Screen
// **************************************************************************

/**
 * The screen component is used to create video games. It connects with a
 * server and starts the game - there is only graphics, sound, and controller
 * input on the client side. The game itself is ran on the server as a headless
 * game.
 */
class cScreen extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.width = this.entity.width;
    this.height = this.entity.height;
    this.graphics = {};
    this.sounds = {};
    this.tracks = {};
    this.graphic_names = [];
    this.sound_names = [];
    this.track_names = [];
    this.image_count = 0;
    this.sound_count = 0;
    this.track_count = 0;
    this.sprites = {};
    this.sprite_names = [];
    this.loaded = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_canvas",
          type: "canvas",
          attrib: {
            width: this.entity.width - 2,
            height: this.entity.height - 2
          },
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": String(this.entity.width - 2) + "px",
            "height": String(this.entity.height - 2) + "px",
            "background-color": this.settings["color"] || "black"
          }
        },
        {
          id: this.entity.id + "_images",
          type: "div",
          css: {
            "position": "absolute",
            "left": "-2000px",
            "top": "0"
          }
        },
        {
          id: this.entity.id + "_sounds",
          type: "div",
          css: {
            "position": "absolute",
            "left": "-2000px",
            "top": "2000px"
          }
        },
        {
          id: this.entity.id + "_tracks",
          type: "div",
          css: {
            "position": "absolute",
            "left": "-2000px",
            "top": "4000px"
          }
        }
      ]
    }, this.container);
  }
  
  /**
   * Loads a graphic from a file.
   * @param name The name of the graphic to load.
   */
  Load_Graphic(name) {
    let graphic = this.Create_Element({
      id: this.entity.id + "_image_" + name,
      type: "img",
      attrib: {
        src: Get_Image(name + ".png", false)
      }
    }, this.elements[this.entity.id + "_images"]);
    this.graphics[name] = graphic; // Store graphic reference.
    this.graphic_names.push(name);
    let component = this;
    graphic.on_load = function() {
      component.image_count++;
    };
  }
  
  /**
   * Loads a sound from a file.
   * @param name The name of the sound to load.
   */
  Load_Sound(name) {
    let sound = this.Create_Element({
      id: this.entity.id + "_sound_" + name,
      type: "audio",
      subs: [
        {
          id: this.entity.id + "_sound_source_" + name,
          type: "source",
          attrib: {
            src: $http + location.host + "/Sounds/" + name + ".mp3",
            type: "audio/mpeg"
          }
        }
      ]
    }, this.elements[this.entity.id + "_sounds"]);
    this.sounds[name] = sound;
    this.sound_names.push(name);
    sound.load(); // Try loading sound.
    if (frankus_layout.browser.name == "firefox") {
      this.sound_count++;
    }
    else {
      sound.addEventListener("canplaythrough", function() {
        this.sound_count++;
      }, false);
    }
  }
  
  /**
   * Loads a track by name.
   * @param name The name of the track to load.
   */
  Load_Track(name) {
    let track = this.Create_Element({
      id: this.entity.id + "_track_" + name,
      type: "audio",
      attrib: {
        loop: "true"
      },
      subs: [
        {
          id: this.entity.id + "_track_source_" + name,
          type: "source",
          attrib: {
            src: http + location.host + "/Sounds/" + name + ".mp3",
            type: "audio/mpeg"
          }
        }
      ]
    }, this.elements[this.entity.id + "_tracks"]);
    this.tracks[name] = track;
    this.track_names.push(name);
    track.load(); // Try loading sound track.
    if (frankus_layout.browser.name == "firefox") {
      this.track_count++;
    }
    else {
      sound.addEventListener("canplaythrough", function() {
        this.track_count++;
      }, false);
    }
  }
  
  /**
   * Loads a list of graphics from a file.
   * @param file The file to load graphics from.
   */
  Load_Graphics(file) {
    let component = this;
    let gfx_file = new cFile("Screen/" + file);
    gfx_file.on_read = function() {
      let graphics = gfx_file.lines;
      let gfx_count = graphics.length;
      for (let gfx_index = 0; gfx_index < gfx_count; gfx_index++) {
        let name = graphics[gfx_index];
        component.Load_Graphic(name);
      }
    };
    gfx_file.Read();
  }
  
  /**
   * Loads a sprite sheet from a file.
   * @param file The file to load the sprite sheet from.
   */
  Load_Sprite_Sheet(file) {
    let base_name = file.replace(/\.\w+$/, "");
    let component = this;
    let sprite_file = new cFile("Screen/" + file);
    sprite_file.on_read = function() {
      this.Load_Graphic(base_name + ".png");
      let sprites = sprite_file.lines;
      let sprite_count = sprites.length;
      for (let sprite_index = 0; sprite_index < sprite_count; sprite_index++) {
        let sprite = sprites[sprite_index].split(/,/);
        if (sprite.length == 5) {
          let name = sprite[0];
          let x = parseInt(sprite[1]); 
          let y = parseInt(sprite[2]);
          let width = parseInt(sprite[3]);
          let height = parseInt(sprite[4]);
          component.sprites[name] = {
            x: x,
            y: y,
            width: width,
            height: height
          };
          component.sprite_names.push(name);
        }
      }
    };
    sprite_file.Read();
  }
  
  /**
   * Loads a list of sounds from a file.
   * @param file The file to load sounds from.
   */
  Load_Sounds(file) {
    let component = this;
    let sound_file = new cFile("Sounds/" + file);
    sound_file.on_read = function() {
      let sounds = sound_file.lines;
      let sound_count = graphics.length;
      for (let sound_index = 0; sound_index < sound_count; sound_index++) {
        let name = sounds[sound_index];
        component.Load_Sound(name);
      }
    };
    sound_file.Read();
  }
  
  /**
   * Loads a list of sound tracks from a file.
   * @param file The file to load sound tracks from.
   */
  Load_Tracks(file) {
    let component = this;
    let track_file = new cFile("Tracks/" + file);
    track_file.on_read = function() {
      let tracks = track_file.lines;
      let track_count = tracks.length;
      for (let track_index = 0; track_index < track_count; track_index++) {
        let name = tracks[track_index];
        component.Load_Track(name);
      }
    };
    track_file.Read();
  }
  
  /**
   * Checks if resources are loaded or not.
   * @return True if all resources are loaded, false otherwise.
   */
  Are_Resources_Loaded() {
    return ((this.image_count == this.graphic_names.length) && (this.sound_count == this.sound_names.length) && (this.track_count == this.track_names.length));
  }
  
  /**
   * Draws a graphic to the screen.
   * @param name The name of the graphic to draw.
   * @param x The x coordinate of the graphic.
   * @param y The y coordinate of the graphic.
   * @param scale The scale of the graphic.
   * @param angle The angle to rotate the graphic.
   * @param flip_x True if flipped horizontally, false otherwise.
   * @param flip_y True if flipped vertically, false otherwise.
   */
  Draw_Graphic(name, x, y, scale, angle, flip_x, flip_y) {
    if (this.graphics[name] != undefined) {
      let graphic = this.graphics[name];
      let canvas = this.elements[this.entity.id + "_canvas"];
      if (flip_x || flip_y || (angle != 0) || (scale > 1)) {
        let origin_x = x;
        let origin_y = y;
        let image_x = 0;
        let image_y = 0;
        let scale_x = 1 * scale;
        let scale_y = 1 * scale;
        let width = graphic.width;
        let height = graphic.height;
        if (flip_x) {
          image_x = -width * scale;
          scale_x = -1 * scale;
          angle *= -1;
        }
        if (flip_y) {
          image_y = -height * scale;
          scale_y = -1 * scale;
        }
        if (angle != 0) {
          origin_x += Math.floor(width / 2);
          origin_y += Math.floor(height / 2);
          image_x = -Math.floor(width / 2);
          image_y = -Math.floor(height / 2);
        }
        canvas.save();
        canvas.translate(origin_x, origin_y);
        canvas.scale(scale_x, scale_y);
        canvas.rotate(angle * (Math.PI / 180));
        canvas.drawImage(entity, image_x, image_y);
        canvas.restore();
      }
      else {
        canvas.drawImage(entity, x, y);
      }
    }
  }
  
  /**
   * Draws a sprite to the screen.
   * @param name The name of the sprite to draw.
   * @param x The x coordinate of the sprite.
   * @param y The y coordinate of the sprite.
   * @param scale The scale of the sprite.
   * @param angle The angle of the sprite.
   * @param flip_x True to flip horizonally, false not to flip.
   * @param flip_y True to flip vertically, false not to flip.
   */
  Draw_Sprite(name, x, y, scale, angle, flip_x, flip_y) {
    if (this.sprites[name] != undefined) {
      let sprite = this.sprites[name];
      let canvas = this.elements[this.entity.id + "_canvas"];
      if (flip_x || flip_y || (angle != 0) || (scale > 1)) {
        let origin_x = x;
        let origin_y = y;
        let image_x = 0;
        let image_y = 0;
        let scale_x = 1 * scale;
        let scale_y = 1 * scale;
        let width = sprite.width;
        let height = sprite.height;
        if (flip_x) {
          image_x = -width * scale;
          scale_x = -1 * scale;
          angle *= -1;
        }
        if (flip_y) {
          image_y = -height * scale;
          scale_y = -1 * scale;
        }
        if (angle != 0) {
          origin_x += Math.floor(width / 2);
          origin_y += Math.floor(height / 2);
          image_x = -Math.floor(width / 2);
          image_y = -Math.floor(height / 2);
        }
        canvas.save();
        canvas.translate(origin_x, origin_y);
        canvas.scale(scale_x, scale_y);
        canvas.rotate(angle * (Math.PI / 180));
        canvas.drawImage(entity, sprite.x, sprite.y, sprite.width, sprite.height, image_x, image_y, sprite.width, sprite.height);
        canvas.restore();
      }
      else {
        canvas.drawImage(entity, sprite.x, sprite.y, sprite.width, sprite.height, x, y, sprite.width, sprite.height);
      }
    }
  }
  
  /**
   * Plays a loaded sound.
   * @param name The name of the sound to play.
   */
  Play_Sound(name) {
    let sound = this.sounds[name];
    if (sound != undefined) {
      if (sound.readState > 0) {
        sound.currentTime = 0;
        let promise = sound.play();
        promise.catch(function(reason) {
          if (sound.readyState > 0) {
            sound.play();
          }
        });
      }
    }
  }
  
  /**
   * Plays a sound track by name, stopping the previous track.
   * @param name The name of the sound track to play.
   */
  Play_Track(name) {
    // Stop any other track that may be playing.
    let tracks = Object.keys(this.tracks);
    let track_count = tracks.length;
    for (let track_index = 0; track_index < track_count; track_index++) {
      let n = tracks[track_index];
      let t = this.tracks[n];
      if (n != name) {
        t.pause();
      }
    }
    let track = this.tracks[name];
    if (track != undefined) {
      if (track.readyState > 0) { // Can the track be played at all?
        track.currentTime = 0;
        let promise = track.play();
        if (promise) {
          promise.catch(function(reason) {
            if (track.readyState > 0) {
              // Try to play track if something went wrong.
              track.play();
            }
          });
        }
      }
    }
  }
  
  /**
   * Stops a track of the given name.
   * @param name The name of the track to stop.
   */
  Stop_Track(name) {
    let track = this.tracks[name];
    if (track != undefined) {
      track.pause();
    }
  }
  
}

// **************************************************************************
// Uploader
// **************************************************************************

/**
 * The uploader allows uploading of files to the server if the editor code is
 * set.
 */
class cUploader extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.folder = "Upload";
    this.callback = function() {
      console.log("Files are uploaded.");
    };
    this.mime = {};
    this.loaded = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        {
          id: this.entity.id,
          type: "input",
          attrib: {
            type: "file",
            multiple: ""
          },
          css: {
            "visibility": "hidden",
            "width": "100%"
          }
        },
        this.Make_Button(this.entity.id + "_upload", {
          "left": 0,
          "top": 0,
          "width": this.entity.width - 2,
          "height": this.entity.height - 2,
          "label": "Upload",
          "bg-color": "lightgreen"
        })
      ]
    }, this.container);
    // Handle uploads.
    let component = this;
    this.elements[this.entity.id + "_upload"].addEventListener("click", function(event) {
      if (component.loaded) {
        component.elements[component.entity.id].click(); // Invoke click on file browser.
      }
    }, false);
    this.elements[this.entity.id].addEventListener("change", function(event) {
      let files = component.elements[component.entity.id].files;
      component.Handle_File(files, 0, component.callback);
    }, false);
    // Load MIME types.
    let mime_file = new cFile("Config/Mime.txt");
    mime_file.on_read = function() {
      let records = mime_file.lines;
      let rec_count = records.length;
      for (let rec_index = 0; rec_index < rec_count; rec_index++) {
        let record = records[rec_index].split(/=/);
        if (record.length == 2) {
          let ext = record[0];
          let pair = record[1].split(/,/);
          if (pair.length == 2) {
            let mime_type = pair[0];
            let binary = (pair[1] == "true");
            component.mime[ext] = {
              type: mime_type,
              binary: binary
            };
          }
        }
      }
      component.loaded = true;
    };
    mime_file.Read();
  }

  /**
   * Handles a file upload given a list of files.
   * @param files The file objects.
   * @param index The index of the file to upload.
   * @param on_upload Called when all the files have been uploaded.
   */
  Handle_File(files, index, on_upload) {
    try {
      if (index < files.length) {
        let component = this;
        let file = files[index];
        let name = file.name;
        let ext = cFile.Get_Extension(name);
        let mime = component.mime[ext];
        Check_Condition((mime != undefined), "File type " + ext + " is not defined.");
        let reader = new FileReader();
        reader.onload = function(event) {
          let data = (!mime.binary) ? event.target.result : event.target.result.split(/,/).pop(); // We're getting the Base64 string.
          let save_file = new cFile(component.folder + "/" + name);
          save_file.data = data;
          save_file.on_write = function() {
            console.log(save_file.message);
            component.Handle_File(files, index + 1, on_upload);
          };
          save_file.Write();
        };
        if (!mime.binary) { // Read text files as text only!
          reader.readAsText(file);
        }
        else {
          reader.readAsDataURL(file);
        }
      }
      else {
        on_upload();
      }
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Sets the folder for the uploader.
   * @param folder The folder to set.
   */
  Set_Folder(folder) {
    this.folder = folder;
  }

  On(name, handler) {
    if (name == "upload") {
      this.callback = handler;
    }
  }

}

// **************************************************************************
// Poll
// **************************************************************************

/**
 * Creates a poll reader to read results from a poll and to
 * display them. The properties are as follows:
 *
 * - file - The file to read the results from. These are counts per line.
 * - labels - A list of labels for the data. They are separated with semicolons.
 * - title - The title that goes in the title bar.
 */
class cPoll extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }
  
  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_title",
          type: "div",
          text: this.settings["title"] || "poll",
          css: {
            "width": "calc(100% - 10px)",
            "height": "14px",
            "line-height": "14px",
            "text-align": "center",
            "font-weight": "bold",
            "color": "black",
            "padding": "4px",
            "border": "1px solid black",
            "font-size": "12px",
            "background-color": "silver"
          }
        },
        {
          id: this.entity.id + "_body",
          type: "div",
          css: {
            "width": "calc(100% - 10px)",
            "height": "calc(100% - 34px)",
            "padding": "4px",
            "border": "1px solid black",
            "border-top": "0"
          }
        }
      ]
    }, this.container);
    this.Reload();
  }
  
  /**
   * Reloads the poll results.
   */
  Reload() {
    let component = this;
    let poll_file = new cFile("Poll/" + this.settings["file"]);
    poll_file.on_read = function() {
      let results = poll_file.lines;
      let labels = component.settings["labels"].split(/;/);
      if (labels.length == results.length) { // They must match!
        let result_count = results.length;
        let total = 0;
        // Find total.
        for (let result_index = 0; result_index < result_count; result_index++) {
          let result = parseInt(results[result_index]);
          total += result;
        }
        // Now find percents.
        component.Remove_Elements(component.elements[component.entity.id + "_body"]);
        for (let result_index = 0; result_index < result_count; result_index++) {
          let result = results[result_index];
          let percent = Math.floor((result / total) * 100);
          let label = labels[result_index];
          // Render the percent.
          let percent_disp = component.Create_Element({
            id: component.entity.id + "_" + label,
            type: "div",
            text: label + "... " + String(percent) + "%",
            css: {
              "width": "100%",
              "height": "16px",
              "line-height": "16px",
              "margin-bottom": "1px"
            }
          }, component.entity.id + "_body");
        }
      }
    };
    poll_file.Read();
  }

}

// **************************************************************************
// Counter
// **************************************************************************
  
/**
 * This is a counter that records new visitors that come to the site.
 * It logs the date as well results can be categorized.
 */
class cCounter extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
    let component = this;
    this.Save_Statistics(function() {
      component.Query_Statistics(function(stats) {
        let record = [
          Format("#Today:# " + stats.today),
          Format("#Month:# " + stats.month),
          Format("#Total:# " + stats.total)
        ];
        component.elements[component.entity.id + "_body"].innerHTML = record.join("<br />");
      });
    });
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_title",
          type: "div",
          text: "Visitor Statistics",
          css: {
            "width": "calc(100% - 10px)",
            "height": "14px",
            "line-height": "14px",
            "text-align": "center",
            "font-weight": "bold",
            "color": "black",
            "padding": "4px",
            "border": "1px solid black",
            "font-size": "12px",
            "background-color": "silver"
          }
        },
        {
          id: this.entity.id + "_body",
          type: "div",
          css: {
            "width": "calc(100% - 10px)",
            "height": "calc(100% - 34px)",
            "padding": "4px",
            "border": "1px solid black",
            "border-top": "0"
          }
        }
      ]
    }, this.container);
  }
  
  /**
   * Grabs the statistics from the server.
   * %
   * {
   *   today,
   *   month,
   *   total
   * }
   * %
   * @param on_stats Called when the stats are ready. Stats are passed into callback.
   */
  Query_Statistics(on_stats) {
    let counter_file = new cFile("Counter/Counter.txt");
    counter_file.on_read = function() {
      let records = counter_file.lines;
      let rec_count = records.length;
      let stats = {
        today: 0,
        month: 0,
        total: rec_count
      };
      let date = new Date();
      let year = date.getFullYear();
      let day = date.getDate();
      let month = date.getMonth() + 1;
      for (let rec_index = 0; rec_index < rec_count; rec_index++) {
        let record = records[rec_index];
        if (record.match(/^\d+\-\d+\-\d{4}$/)) {
          let tripplet = record.split(/\-/);
          let rec_month = parseInt(tripplet[0]);
          let rec_day = parseInt(tripplet[1]);
          let rec_year = parseInt(tripplet[2]);
          if ((rec_month == month) && (rec_year == year)) {
            stats.month++;
          }
          if ((rec_day == day) && (rec_month == month) && (rec_year == year)) {
            stats.today++;
          }
        }
      }
      // Callback here.
      on_stats(stats);
    };
    counter_file.on_not_found = function() {
      // Callback here.
      on_stats({
        today: 0,
        month: 0,
        total: 0
      });
    };
    counter_file.Read();
  }
  
  /**
   * Saves the statistics of the user who visited the page.
   * @param on_save Called when the statistics have been saved or don't need to.
   */
  Save_Statistics(on_save) {
    let recorded = localStorage.getItem("count_recorded");
    if (recorded != "yes") {
      let date = new Date();
      let year = date.getFullYear();
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let record = String(month) + "-" + String(day) + "-" + String(year);
      let counter_file = new cFile("Counter/Counter.txt");
      counter_file.on_read = function() {
        let records = counter_file.lines;
        records.push(record);
        let save_file = new cFile("Counter/Counter.txt");
        save_file.lines = records;
        save_file.on_write = function() {
          localStorage.setItem("count_recorded", "yes");
          // Callback here.
          on_save();
        };
        save_file.Write();
      };
      counter_file.Read();
    }
    else { // Already recorded, call handler anyways.
      on_save();
    }
  }

}

// **************************************************************************
// Visitor Chart
// **************************************************************************

/**
 * This is a chart control to display visitor usage.
 */
class cVisitor_Chart extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }
  
  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow": "scroll"
      },
      subs: [
        {
          id: this.entity.id + "_title",
          type: "div",
          text: "Visitors Per Month",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": "24px",
            "text-align": "center",
            "font-weight": "bold",
            "line-height": "24px",
            "font-size": "20px"
          }
        }
      ]
    }, this.container);
    // Load up the counter.
    this.Load_Counter();
  }
  
  /**
   * Loads the counter into the chart.
   */
  Load_Counter() {
    let component = this;
    let counter_file = new cFile("Counter/Counter.txt");
    counter_file.on_read = function() {
      let records = counter_file.lines;
      let rec_count = records.length;
      let months = {};
      let month_labels = [];
      for (let rec_index = 0; rec_index < rec_count; rec_index++) {
        let record = records[rec_index];
        if (record.match(/^\d+\-\d+\-\d{4}$/)) {
          let tripplet = record.split(/\-/);
          let rec_month = parseInt(tripplet[0]);
          let rec_day = parseInt(tripplet[1]);
          let rec_year = parseInt(tripplet[2]);
          let month_label = rec_month + "-" + rec_year;
          if (months[month_label] == undefined) {
            months[month_label] = 1;
            month_labels.push(month_label);
          }
          else {
            months[month_label]++;
          }
        }
      }
      // Render the bars.
      let month_count = month_labels.length;
      for (let month_index = 0; month_index < month_count; month_index++) {
        let month = month_labels[month_index];
        let count = months[month];
        let pair = month.split(/-/);
        let m = pair[0];
        let y = pair[1];
        // Make a drop shadow first.
        let shadow = component.Create_Element({
          id: component.entity.id + "_shadow_" + month_index,
          type: "div",
          css: {
            "position": "absolute",
            "left": (month_index == 0) ? "1px" : String((month_index * 52) + 1) + "px",
            "bottom": "15px",
            "width": "48px",
            "height": String(count) + "px",
            "background-color": "black",
            "text-align": "center"
          }
        }, component.entity.id);
        // Now create the bar.
        let bar = component.Create_Element({
          id: component.entity.id + "_bar_" + month_index,
          type: "div",
          css: {
            "position": "absolute",
            "left": String(month_index * 52) + "px",
            "bottom": "16px",
            "width": "48px",
            "height": String(count) + "px",
            "background-color": "lime",
            "text-align": "center"
          },
          subs: [
            {
              id: component.entity.id + "_label_" + month_index,
              type: "div",
              text: m + "/" + y,
              css: {
                "position": "absolute",
                "bottom": "-16px",
                "left": "0",
                "width": "48px",
                "height": "16px",
                "line-height": "16px",
                "text-align": "center",
                "font-size": "10px",
                "font-weight": "bold"
              }
            },
            {
              id: component.entity.id + "_count_" + month_index,
              type: "div",
              text: String(count),
              css: {
                "position": "absolute",
                "top": "-16px",
                "left": "0",
                "width": "48px",
                "height": "16px",
                "line-height": "16px",
                "text-align": "center",
                "font-size": "10px"
              }
            }
          ]
        }, component.entity.id);
      }
    };
    counter_file.Read();
  }
  
}

/**
 * The link is basically a hyperlink. The following
 * properties can be set:
 *
 * - label - The text to display for the link.
 * - href - Can point to a page or an external link.
 * - color - The color of the hyperlink.
 * - hover - The color when the link is hovered.
 */
class cLink extends cComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }
  
  Create() {
    let link = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"],
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "text-align": "center",
        "line-height": String(this.entity.height - 2) + "px",
        "color": this.settings["color"],
        "font-weight": "bold"
      }
    }, this.container);
    let component = this;
    link.addEventListener("mouseover", function(event) {
      link.style.color = component.settings["hover"];
    }, false);
    link.addEventListener("mouseout", function(event) {
      link.style.color = component.settings["color"];
    }, false);
    link.addEventListener("click", function(event) {
      let link = component.settings["href"];
      if (link.match(/^\[[^\]]+\]$/)) {
        let url = http + link.replace(/^\[([^\]]+)\]$/, "$1");
        window.open(url);
      }
      else {
        if (frankus_layout) {
          frankus_layout.Flip_Page(link);
        }
      }
    }, false);
  }

}

/**
 * The terminal is a shell used for Frankus the Nerd to
 * do some system administration stuff. The following
 * properties can be set:
 *
 * - width - The width of the terminal in characters.
 * - height - The height of the terminal in characters.
 * - letter-w - The width of a letter.
 * - letter-h - The height of a letter.
 * - bg-color - The background color.
 * - fg-color - The foreground_color.
 */
class cTerminal extends cComponent {

  MAX_LINES_ON_SCREEN = 200;

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.width = parseInt(this.settings["width"]);
    this.height = parseInt(this.settings["height"]);
    this.letter_w = parseInt(this.settings["letter-w"]);
    this.letter_h = parseInt(this.settings["letter-h"]);
    this.fg_color = this.settings["fg-color"];
    this.bg_color = this.settings["bg-color"];
    this.status = "output";
    this.lines = [ "" ];
    this.scroll_x = 0;
    this.scroll_y = 0;
    this.timer = null;
    this.blink = true;
    this.input_buffer = [];
    this.on_read = null;
    this.shift_mode = 0;
    this.loading = false;
    this.key_map = {
      "Space":        "  ", // Space
      "Digit0":       "0)", // Numbers
      "Digit1":       "1!",
      "Digit2":       "2@",
      "Digit3":       "3#",
      "Digit4":       "4$",
      "Digit5":       "5%",
      "Digit6":       "6^",
      "Digit7":       "7&",
      "Digit8":       "8*",
      "Digit9":       "9(",
      "KeyA":         "aA", // Letters
      "KeyB":         "bB",
      "KeyC":         "cC",
      "KeyD":         "dD",
      "KeyE":         "eE",
      "KeyF":         "fF",
      "KeyG":         "gG",
      "KeyH":         "hH",
      "KeyI":         "iI",
      "KeyJ":         "jJ",
      "KeyK":         "kK",
      "KeyL":         "lL",
      "KeyM":         "mM",
      "KeyN":         "nN",
      "KeyO":         "oO",
      "KeyP":         "pP",
      "KeyQ":         "qQ",
      "KeyR":         "rR",
      "KeyS":         "sS",
      "KeyT":         "tT",
      "KeyU":         "uU",
      "KeyV":         "vV",
      "KeyW":         "wW",
      "KeyX":         "xX",
      "KeyY":         "yY",
      "KeyZ":         "zZ",
      "Backquote":    "`~", // Special Characters
      "Minus":        "-_",
      "Equal":        "=+",
      "BracketLeft":  "[{",
      "BracketRight": "]}",
      "Backslash":    "\\|",
      "Semicolon":    ";:",
      "Quote":        "'\"",
      "Comma":        ",<",
      "Period":       ".>",
      "Slash":        "/?"
    };
    this.Create();
  }
  
  Create() {
    // Add offscreen text element for input. Here so it is not visible.
    let input = this.Create_Element({
      id: this.entity.id + "_text_input_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 10) + "px",
        "top": String(this.entity.y + 10) + "px",
        "width": "64px",
        "height": "32px"
      },
      subs: [
        {
          id: this.entity.id + "_text_input",
          type: "textarea",
          attrib: {
            rows: 5,
            cols: 25,
            wrap: "off"
          },
          css: {
            "position": "absolute",
            "width": "64px",
            "height": "32px"
          }
        }
      ]
    }, this.container);
    let terminal_window = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
      },
      subs: [
        {
          id: this.entity.id + "_viewport",
          type: "canvas",
          attrib: {
            width: this.entity.width - 10,
            height: this.entity.height - 10
          },
          css: {
            "position": "absolute",
            "left": "4px",
            "top": "4px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)"
          }
        }
      ]
    }, this.container);
    this.canvas = this.elements[this.entity.id + "_viewport"];
    this.surface = this.canvas.getContext("2d");
    this.surface.font = String(this.letter_h - 2) + "px monospace";
    let component = this;
    this.elements[this.entity.id + "_text_input"].addEventListener("keydown", function(event) {
      let key = event.code;
      component.Process_Keys(key);
      component.Read_Input();
      component.Render();
    });
    this.elements[this.entity.id + "_text_input"].addEventListener("keyup", function(event) {
      let key = event.code;
      if (key.match(/Shift/)) {
        component.shift_mode = 0;
      }
    }, false);
    this.elements[this.entity.id + "_viewport"].addEventListener("click", function(event) {
      component.elements[component.entity.id + "_text_input"].focus();
    }, false);
    this.timer = setInterval(function() {
      if (component.blink) {
        component.blink = false;
      }
      else {
        component.blink = true;
      }
      // Read input and render.
      component.Read_Input();
      component.Render();
    }, 500);
  }

  /**
   * Writes a letter to the line buffer.
   * @param letter The letter to write.
   */
  Write_Letter(letter) {
    if (letter == '\n') {
      this.lines.push(""); // Push in new line.
      if (this.lines.length > this.height) {
        this.scroll_y = this.lines.length - this.height + 1;
      }
    }
    else {
      this.lines[this.lines.length - 1] += letter;
    }
  }

  /**
   * Writes a string to the terminal.
   * @param text The text to output to the terminal.
   */
  Write_String(text) {
    let letter_count = text.length;
    for (let letter_index = 0; letter_index < letter_count; letter_index++) {
      this.Write_Letter(text.charAt(letter_index));
    }
  }

  /**
   * Sets the color of the terminal text.
   * @param color The new color.
   */
  Set_Color(color) {
    this.surface.fillStyle = color;
  }

  /**
   * This clears out the terminal.
   */
  Clear() {
    this.lines = [ "" ];
    this.status = "output";
    this.scroll_x = 0;
    this.scroll_y = 0;
  }

  /**
   * Reads input from the user. Stops when enter is hit.
   */
  Read_Input() {
    if ((this.status != "input") && !this.loading) {
      this.status = "input";
      this.Set_Color(this.fg_color);
      this.Write_String(": ");
    }
  }

  /**
   * Processes keys.
   * @param key The key that was read.
   */
  Process_Keys(key) {
    switch (key) {
      case "Enter":
        if (this.status == "input") {
          this.Write_Letter('\n');
          this.Set_Error_Mode(false);
          if (this.on_read) {
            this.loading = true;
            this.on_read(this, this.Buffer_To_String());
          }
        }
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.shift_mode = 1;
        break;
      case "Backspace":
        this.Backspace();
        break;
      case "ArrowLeft":
        if (this.scroll_x > 0) {
          this.scroll_x--;
        }
        break;
      case "ArrowRight":
        this.scroll_x++;
        break;
      case "ArrowUp":
        if (this.scroll_y > 0) {
          this.scroll_y--;
        }
        break;
      case "ArrowDown":
        this.scroll_y++;
        break;
      default: // Any character.
        if (this.key_map[key] != undefined) {
          let letter = this.key_map[key].substring(this.shift_mode, this.shift_mode + 1);
          if ((letter >= ' ') && (letter <= '~')) { // Data characters.
            if (this.status == "input") {
              this.Write_Letter(letter);
              this.input_buffer.push(letter);
            }
          }
        }
    }
  }

  /**
   * Renders the terminal screen.
   */
  Render() {
    // Fill screen with background color.
    this.Set_Color(this.bg_color);
    this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.Set_Color(this.fg_color);
    // Render current screenfull of lines.
    let line_count = this.lines.length;
    let start = (this.lines.length > this.MAX_LINES_ON_SCREEN) ? this.lines.length - this.MAX_LINES_ON_SCREEN : 0;
    for (let row_index = start; row_index < line_count; row_index++) {
      let line = this.lines[row_index];
      let letter_count = line.length;
      for (let letter_index = 0; letter_index < letter_count; letter_index++) {
        let letter = line.charAt(letter_index);
        this.surface.fillText(letter, (letter_index - this.scroll_x) * this.letter_w, (row_index - this.scroll_y) * this.letter_h + this.letter_h);
      }
    }
    // Draw the cursor.
    if (this.status == "input") {
      if (this.blink) {
        let x = (this.lines[this.lines.length - 1].length > 0) ? this.lines[this.lines.length - 1].length - 1 : 0;
        let y = this.lines.length - 1;
        this.surface.fillRect((x + 1 - this.scroll_x) * this.letter_w, (y - this.scroll_y) * this.letter_h, this.letter_w, this.letter_h);
      }
    }
  }

  /**
   * Backspaces a character out.
   */
  Backspace() {
    if (this.status == "input") {
      if (this.input_buffer.length > 0) {
        let line = this.lines[this.lines.length - 1];
        if (line.length > 2) { // Compensate for marker output.
          this.lines[this.lines.length - 1] = line.substring(0, line.length - 1); // Remove character.
          this.input_buffer.pop(); // Remove from input buffer as well.
        }
      }
    }
  }

  /**
   * Converts the buffer to a string.
   * @return The text from the buffer.
   */
  Buffer_To_String() {
    let text = "";
    while (this.input_buffer.length > 0) {
      let letter = this.input_buffer.shift();
      text += letter;
    }
    return text;
  }

  /**
   * Sets the error mode.
   * @param error If true then error mode is set, otherwise it is set to output.
   */
  Set_Error_Mode(error) {
    if (error) {
      this.status = "error";
      this.Set_Color("red");
    }
    else {
      this.status = "output";
      this.Set_Color(this.fg_color);
    }
  }

  /**
   * Stops the output from loading.
   */
  Stop_Loading() {
    this.loading = false;
  }

  On(name, handler) {
    if (name == "read") {
      this.on_read = handler;
    }
  }

}

/**
 * This is a component that lets you draw. A number of tools
 * can be attached to it externally.
 */
class cPaint extends cComponent {

  MAX_IMAGE_W = 640;
  MAX_IMAGE_H = 640;
  MIN_IMAGE_W = 8;
  MIN_IMAGE_H = 8;

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.layer_names = [];
    this.layers = {};
    this.image_meta = {
      x: 0,
      y: 0,
      width: this.MIN_IMAGE_W,
      height: this.MIN_IMAGE_H,
      zoom: 1
    };
    this.tools = {};
    this.sel_layer = "";
    this.sel_tool = "";
    this.surface = null;
    this.canvas = null;
    this.color_picker = null;
    this.layer_props = [
      "name",
      "x",
      "y",
      "width",
      "height",
      "angle",
      "scale"
    ];
    this.update_layer_props = [
      "name",
      "x",
      "y",
      "width",
      "height",
      "angle",
      "scale",
      "visible"
    ];
    this.empty_layer = {
      name: "",
      x: 0,
      y: 0,
      width: 16,
      height: 16,
      angle: 0,
      scale: 1,
      canvas: null,
      surface: null,
      visible: "on",
      url: ""
    };
    this.update_empty_layer = {
      name: "",
      x: 0,
      y: 0,
      width: 16,
      height: 16,
      angle: 0,
      scale: 1,
      visible: "on",
      url: ""
    };
    this.image_props = [
      "x",
      "y",
      "width",
      "height",
      "zoom"
    ];
    this.Create();
  }
  
  Create() {
    let paint_box = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-image": Get_Image("Checkers.pic", true),
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_canvas",
          type: "canvas",
          attrib: {
            width: this.MIN_IMAGE_W,
            height: this.MIN_IMAGE_H
          },
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": this.MIN_IMAGE_W + "px",
            "height": this.MIN_IMAGE_H + "px",
            "cursor": Get_Image("Brush.pic", true) + ", default"
          }
        }
      ]
    }, this.container);
    // Create layer stack.
    let layer_stack = this.Create_Element({
      id: this.entity.id + "_layer_stack",
      type: "div",
      css: {
        "position": "absolute",
        "left": "-2000px", // Not rendered onscreen.
        "top": "0",
        "width": this.MAX_IMAGE_W + "px",
        "height": this.MAX_IMAGE_H + "px"
      }
    }, this.container);
    this.canvas = this.elements[this.entity.id + "_canvas"];
    this.surface = this.canvas.getContext("2d");
    // Set up mouse processing.
    let component = this;
    this.elements[this.entity.id + "_canvas"].addEventListener("mousedown", function(event) {
      let x = event.offsetX;
      let y = event.offsetY;
      let button = event.button;
      component.Process_Mouse(x, y, button, true);
    }, false);
    this.elements[this.entity.id + "_canvas"].addEventListener("mouseup", function(event) {
      let x = event.offsetX;
      let y = event.offsetY;
      component.Process_Mouse(x, y, "up", true);
    }, false);
    this.elements[this.entity.id + "_canvas"].addEventListener("mouseover", function(event) {
      let x = event.offsetX;
      let y = event.offsetY;
      let button = event.button;
      component.Process_Mouse(x, y, button, true);
    }, false);
    this.elements[this.entity.id + "_canvas"].addEventListener("mouseout", function(event) {
      component.Process_Mouse(NO_VALUE_FOUND, NO_VALUE_FOUND, NO_VALUE_FOUND, false);
    }, false);
  }
  
  /**
   * Processes the mouse.
   * @param x The x coordinate of the mouse.
   * @param y The y coordinate of the mouse.
   * @param button The mouse button that was pressed.
   * @param capture If the mouse was captured or not.
   */
  Process_Mouse(x, y, button, capture) {
    let real_x = Math.floor(x * this.zoom);
    let real_y = Math.floor(y * this.zoom);
    if (capture) {
      
    }
  }
  
  /**
   * Adds a layer given the descriptor. The descriptor is
   * as follows:
   * %
   * {
   *   name: "",
   *   x: 0,
   *   y: 0,
   *   width: 0,
   *   height: 0,
   *   angle: 0,
   *   scale: 1,
   *   url: ""
   * }
   * %
   * @param descr The layer descriptor.
   */
  Add_Layer(descr) {
    Check_Object_Properties(descr, this.layer_props);
    let template = Object.assign({}, this.empty_layer);
    let layer = Object.assign(template, descr);
    Check_Condition((this.layers[layer.name] == undefined), "Layer " + layer.name + " already exists.");
    Check_Condition(((layer.width >= this.MIN_IMAGE_W) && (layer.width <= this.MAX_IMAGE_W)), "Layer width is too big or too small.");
    Check_Condition(((layer.height >= this.MIN_IMAGE_H) && (layer.height <= this.MAX_IMAGE_H)), "Layer height is too big or too small.");
    // Create canvas and assign surface for layer.
    let canvas = this.Create_Element({
      id: this.entity.id + "_" + layer.name,
      type: "canvas",
      attrib: {
        width: layer.width,
        height: layer.height
      },
      css: {
        "position": "absolute",
        "left": layer.x + "px",
        "top": layer.y + "px",
        "width": layer.width + "px",
        "height": layer.height + "px"
      }
    }, this.entity.id + "_layer_stack");
    layer.canvas = canvas;
    layer.surface = canvas.getContext("2d");
    if (layer.url.length > 0) { // Load up external picture.
      this.Load_URL(layer);
    }
    this.layers[layer.name] = layer;
    this.layer_names.push(layer.name);
    this.Render();
  }
  
  /**
   * Deletes a layer by name.
   * @param name The name of the layer to delete.
   */
  Delete_Layer(name) {
    let layer_count = this.layer_names.length;
    for (let layer_index = 0; layer_index < layer_count; layer_index++) {
      let n = this.layer_names[layer_index];
      if (n == name) { // Found!
        this.layer_names.splice(layer_index, 1);
        delete this.layers[name];
        // Remove canvas.
        this.Remove_Element(this.elements[this.entity.id + "_" + name]);
        if (this.sel_layer == name) {
          this.sel_layer = "";
        }
        break;
      }
    }
    this.Render();
  }
  
  /**
   * Updates a layer given the descriptor. The descriptor is as follows:
   * %
   * {
   *   name: "",
   *   x: 0,
   *   y: 0,
   *   width: 16,
   *   height: 16,
   *   angle: 0,
   *   scale: 1,
   *   visible: "on",
   *   url: ""
   * }
   * %
   * 
   * @param name The name of the layer to update.
   * @param descr The descriptor of the layer.
   * @throws An error if properties are missing from the descriptor.
   */
  Update_Layer(name, descr) {
    if (this.layers[name] != undefined) {
      Check_Object_Properties(descr, this.update_layer_props);
      let template = Object.assign({}, this.update_empty_layer);
      this.layers[name] = Object.assign(template, descr);
      Check_Condition(((layer.width >= this.MIN_IMAGE_W) && (layer.width <= this.MAX_IMAGE_W)), "Layer width is too big or too small.");
      Check_Condition(((layer.height >= this.MIN_IMAGE_H) && (layer.height <= this.MAX_IMAGE_H)), "Layer height is too big or too small.");
      let layer = this.layers[name];
      if (layer.name != name) {
        this.layers[layer.name] = Object.assign({}, layer);
        delete this.layers[name];
        layer = this.layers[layer.name];
        layer.canvas.id = this.entity.id + "_" + layer.name;
        this.elements[layer.canvas.id] = layer.canvas;
        // Delete old reference to canvas.
        delete this.elements[this.entity.id + "_" + name];
      }
      layer.canvas.style.left = layer.x + "px";
      layer.canvas.style.top = layer.y + "px";
      layer.canvas.style.width = layer.width + "px";
      layer.canvas.style.height = layer.height + "px";
      layer.canvas.width = layer.width;
      layer.canvas.height = layer.height;
      if (layer.url.length > 0) {
        this.Load_URL(layer);
      }
      this.Render();
    }
  }
  
  /**
   * Reorders layers given a new stack of names.
   * @param new_stack The new stack of names.
   * @throws An error if any layers are missing.
   */
  Reorder_Layers(new_stack) {
    Check_Condition((new_stack.length == this.layer_names.length), "Layer stack is missing layers.");
    // Check to see if layers are on new stack. Throw an error if they are not.
    let name_count = new_stack.length;
    for (let name_index = 0; name_index < name_count; name_index++) {
      let name = new_stack[name_index];
      let index = this.layer_names.indexOf(name);
      Check_Condition((index != NO_VALUE_FOUND), "Missing layer " + name + ".");
    }
    this.layer_names = new_stack; // Assign to new stack.
    this.Render();
  }
  
  /**
   * Renders the layer stack.
   */
  Render() {
    let layer_count = this.layer_names.length;
    // Render from bottom up.
    for (let layer_index = layer_count - 1; layer_index >= 0; layer_index--) {
      let name = this.layer_names[layer_index];
      this.Render_Layer(name);
    }
    // Draw grid if zoom is large.
    if (this.image_meta.zoom >= 4) {
      this.surface.save();
      this.surface.strokeStyle = "black";
      this.surface.lineWidth = 1;
      let row_count = Math.floor(this.canvas.width / this.image_meta.zoom) + 1;
      let column_count = Math.floor(this.canvas.height / this.image_meta.zoom) + 1;
      for (let y = 0; y < row_count; y++) {
        this.surface.moveTo(0, y * this.image_meta.zoom);
        this.surface.lineTo(this.canvas.width - 1, y * this.image_meta.zoom);
        this.surface.stroke();
      }
      for (let x = 0; x < column_count; x++) {
        this.surface.moveTo(x * this.image_meta.zoom, 0);
        this.surface.lineTo(x * this.image_meta.zoom, this.canvas.height - 1);
        this.surface.stroke();
      }
      this.surface.restore();
    }
  }
  
  /**
   * Render layer by name.
   * @param name The name of the layer to render.
   */
  Render_Layer(name) {
    let layer = this.layers[name];
    if (layer != undefined) {
      if (layer.visible == "on") {
        this.surface.save();
        let scale = layer.scale * this.image_meta.zoom;
        if (scale < 1) {
          this.surface.translate(((layer.canvas.width / 2) + layer.x) * scale, ((layer.canvas.height / 2) + layer.y) * scale);
        }
        else {
          this.surface.translate((layer.canvas.width / 2) + layer.x, (layer.canvas.height / 2) + layer.y);
        }
        this.surface.scale(scale, scale);
        this.surface.rotate(layer.angle * (Math.PI / 180));
        this.surface.drawImage(layer.canvas, -(layer.canvas.width / 2), -(layer.canvas.height / 2));
        this.surface.restore();
      }
    }
  }
  
  /**
   * Loads an image from a URL.
   * @param layer The associated layer.
   */
   Load_URL(layer) {
    let image = new Image(layer.width, layer.height);
    let component = this;
    image.addEventListener("load", function(event) {
      component.Clear_Layer(layer);
      layer.surface.drawImage(image, 0, 0);
    }, false);
    image.src = layer.url; // Can be external.
  }
  
  /**
   * Loads an image from a file.
   * @param name The name of the file.
   * @throws An error if the image has errors.
   */
  Load_Image(name) {
    let file = new cFile(name + ".pix");
    let component = this;
    file.on_read = function() {
      try {
        component.Clear_Image();
        // Read image meta data.
        let image_meta = {};
        file.Get_Object(image_meta);
        Check_Object_Properties(image_meta, component.image_props);
        Object.assign(component.image_meta, image_meta);
        component.Update_Image();
        // Skip palette.
        let palette_start = file.Get_Line();
        Check_Condition((palette_start == "palette"), "Missing palette start tag.");
        while (file.Has_More_Lines()) {
          let entry = file.Get_Line();
          if (entry == "end") {
            break;
          }
          else {
            let record = entry.split(/,/);
            Check_Condition((record.length == 5), "Invalid palette entry.");
          }
        }
        // Load up the image layers.
        while (file.Has_More_Lines()) {
          let layer_meta = {};
          file.Get_Object(layer_meta);
          component.Add_Layer(layer_meta);
          // Read pixel info.
          let layer = component.layers[layer_meta.name];
          let image_data = layer.surface.createImageData(layer_meta.width, layer_meta.height);
          let row_count = layer_meta.height;
          for (let y = 0; y < row_count; y++) {
            let scanline = file.Get_Line();
            Check_Condition((scanline.length == layer_meta.width), "Invalid scanline size.");
            let column_count = scanline.length;
            for (let x = 0; x < column_count; x++) {
              let letter = scanline.charAt(x);
              if (component.color_picker) {
                let color = component.color_picker.colors[letter];
                if (color) {
                  let offset = ((column_count * y) + x) * 4; // RGBA
                  image_data.data[offset + 0] = parseInt(color.red);
                  image_data.data[offset + 1] = parseInt(color.green);
                  image_data.data[offset + 2] = parseInt(color.blue);
                  image_data.data[offset + 3] = Math.floor(parseFloat(color.alpha) * 255);
                }
              }
            }
          }
          layer.surface.putImageData(image_data, 0, 0);
        }
        component.Render();
      }
      catch (error) {
        console.log(error.message);
      }
    };
    file.Read();
  }
  
  /**
   * Saves an image to a file.
   * @param name The name of the file.
   * @throws An error if the color picker was not added or color is not found.
   */
  Save_Image(name) {
    Check_Condition(this.color_picker, "Color picker was not added.");
    let file = new cFile(name + ".pix");
    file.Add_Object(this.image_meta);
    // Store palette.
    file.Add("palette");
    let color_count = this.color_picker.color_names.length;
    for (let color_index = 0; color_index < color_count; color_index++) {
      let letter = this.color_picker.color_names[color_index];
      let color = this.color_picker.colors[letter];
      file.Add(letter + "," + color.red + "," + color.green + "," + color.blue + "," + color.alpha);
    }
    file.Add("end");
    let layer_count = this.layer_names.length;
    for (let layer_index = 0; layer_index < layer_count; layer_index++) {
      let layer_name = this.layer_names[layer_index];
      let layer = Exclude_Object_Properties(this.layers[layer_name], [ "canvas", "surface" ]);
      file.Add_Object(layer);
      let image_data = this.layers[layer_name].getImageData(0, 0, layer.width, layer.height);
      for (let y = 0; y < layer.height; y++) {
        let scanline = "";
        for (let x = 0; x < layer.width; x++) {
          let offset = ((y * layer.width) + x) * 4;
          let red = image_data.data[offset + 0];
          let green = image_data.data[offset + 1];
          let blue = image_data.data[offset + 2];
          let alpha_v = image_data.data[offset + 3] / 255;
          let alpha = alpha_v.toFixed(1);
          let hash = [ red, green, blue, alpha ].join(":");
          let pixel = this.color_picker.color_hashes[hash];
          Check_Condition((pixel != undefined), "Color " + hash + " not defined.");
          scanline += pixel;
        }
        file.Add(scanline);
      }
    }
    file.on_write = function() {
      console.log("Saved out layer " + name + ".");
    };
    file.Write();
  }
  
  /**
   * Clears out a layer with a transparent color.
   * @param layer The layer to clear.
   */
  Clear_Layer(layer) {
    layer.surface.save();
    layer.surface.fillStyle = "rgba(0, 0, 0, 0)";
    layer.surface.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.surface.restore();
  }
  
  /**
   * Clears the whole image.
   */
  Clear_Image() {
    this.surface.save();
    this.fillStyle = "rgba(0, 0, 0, 0)";
    this.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.surface.restore();
    this.image_meta.width = this.MIN_IMAGE_W;
    this.image_meta.height = this.MIN_IMAGE_H;
    this.image_meta.x = 0;
    this.image_meta.y = 0;
    this.image_meta.zoom = 1;
    this.Update_Image();
    // Remove all layers.
    let layer_count = this.layer_names.length;
    for (let layer_index = 0; layer_index < layer_count; layer_index++) {
      let name = this.layer_names[layer_index];
      this.Delete_Layer(name);
    }
    this.Render();
  }
  
  /**
   * Updates the image.
   * @throws An error if something is invalid.
   */
  Update_Image() {
    Check_Condition(((this.image_meta.width >= this.MIN_IMAGE_W) && (this.image_meta.width <= this.MAX_IMAGE_W)), "Invalid image width.");
    Check_Condition(((this.image_meta.height >= this.MIN_IMAGE_H) && (this.image_meta.height <= this.MAX_IMAGE_H)), "Invalid image height.");
    this.canvas.width = this.image_meta.width * this.image_meta.zoom;
    this.canvas.height = this.image_meta.height * this.image_meta.zoom;
    this.canvas.style.width = String(this.image_meta.width * this.image_meta.zoom) + "px";
    this.canvas.style.height = String(this.image_meta.height * this.image_meta.zoom) + "px";
    this.canvas.style.left = this.image_meta.x + "px";
    this.canvas.style.top = this.image_meta.y + "px";
    this.Render();
  }
  
  /**
   * Attaches a color picker to the paint component. 
   * @param color_picker The color picker component.
   */
  Attach_Color_Picker(color_picker) {
    this.color_picker = color_picker;
  }

}

/**
 * This is a color picker where you can pick colors for painting
 * or something else. The properties are as follows:
 *
 * - file - The file to load/save the colors to.
 */
class cColor_Picker extends cComponent {

  COLOR_W = 32;
  COLOR_H = 32;
  MAX_COLORS = 93; // All ASCII characters.
  PADDING = 2;
  GROW = 16;

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.colors = {};
    this.color_names = [];
    this.color_hashes = {};
    this.color_x = 0;
    this.color_y = 0;
    this.sel_color = '';
    this.Create();
  }
  
  Create() {
    let color_container = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_color_board",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": "100%",
            "overflow": "scroll",
            "background-image": Get_Image("Checkers.pic", true),
            "cursor": Get_Image("Brush.pic", true)
          }
        },
        {
          id: this.entity.id + "_color_editor",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": "100%",
            "background-color": "white",
            "display": "none"
          },
          subs: [
            this.Make_Form(this.entity.id + "_color_ranger", [
              {
                id: this.entity.id + "_red",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "255",
                  value: "0",
                  step: "1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Get_Image("Cursor.pic", true) + ", default",
                  "background-image": Get_Image("Range.pic", true)
                }
              },
              {
                id: this.entity.id + "_green",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "255",
                  value: "0",
                  step: "1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Get_Image("Cursor.pic", true) + ", default",
                  "background-image": Get_Image("Range.pic", true)
                }
              },
              {
                id: this.entity.id + "_blue",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "255",
                  value: "0",
                  step: "1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Get_Image("Cursor.pic", true) + ", default",
                  "background-image": Get_Image("Range.pic", true)
                }
              },
              {
                id: this.entity.id + "_alpha",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "1",
                  value: "0",
                  step: "0.1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Get_Image("Cursor.pic", true) + ", default",
                  "background-image": Get_Image("Range.pic", true)
                }
              },
              this.Make_Field(this.entity.id + "_letter", {
                "type": "text",
                "object-width": "32px",
                "object-height": "32px"
              })
            ]),
            {
              id: this.entity.id + "_preview",
              type: "div",
              css: {
                "position": "absolute",
                "right": "5px",
                "top": "5px",
                "width": "64px",
                "height": "64px",
                "background-color": "transparent"
              }
            },
            this.Make_Button(this.entity.id + "_save", {
              "label": "Save",
              "bg-color": "lightgreen",
              "right": 74,
              "top": 5,
              "width": 64,
              "height": 24,
              "position": "absolute"
            }),
            this.Make_Button(this.entity.id + "_cancel", {
              "label": "Cancel",
              "bg-color": "lightblue",
              "right": 74,
              "top": 34,
              "width": 64,
              "height": 24,
              "position": "absolute"
            })
          ]
        }
      ]
    }, this.container);
    // Handler color rangers.
    let component = this;
    this.elements[this.entity.id + "_red"].addEventListener("input", function(event) {
      let red = event.target.value;
      let green = component.elements[component.entity.id + "_green"].value;
      let blue = component.elements[component.entity.id + "_blue"].value;
      let alpha = component.elements[component.entity.id + "_alpha"].value;
      component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_green"].addEventListener("input", function(event) {
      let green = event.target.value;
      let red = component.elements[component.entity.id + "_red"].value;
      let blue = component.elements[component.entity.id + "_blue"].value;
      let alpha = component.elements[component.entity.id + "_alpha"].value;
      component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_blue"].addEventListener("input", function(event) {
      let blue = event.target.value;
      let green = component.elements[component.entity.id + "_green"].value;
      let red = component.elements[component.entity.id + "_red"].value;
      let alpha = component.elements[component.entity.id + "_alpha"].value;
      component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_alpha"].addEventListener("input", function(event) {
      let alpha = event.target.value;
      let green = component.elements[component.entity.id + "_green"].value;
      let blue = component.elements[component.entity.id + "_blue"].value;
      let red = component.elements[component.entity.id + "_red"].value;
      component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_color_board"].addEventListener("dblclick", function(event) {
      component.elements[component.entity.id + "_letter"].value = "";
      component.elements[component.entity.id + "_red"].value = 0;
      component.elements[component.entity.id + "_green"].value = 0;
      component.elements[component.entity.id + "_blue"].value = 0;
      component.elements[component.entity.id + "_alpha"].value = 0;
      component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(0, 0, 0, 0)";
      component.Show(component.entity.id + "_color_editor");
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      let letter = component.elements[component.entity.id + "_letter"].value;
      if (letter.length == 1) {
        let code = letter.charCodeAt(0);
        if ((code > 32) && (code < 127)) { // ! to ~
          let alpha = component.elements[component.entity.id + "_alpha"].value;
          let green = component.elements[component.entity.id + "_green"].value;
          let blue = component.elements[component.entity.id + "_blue"].value;
          let red = component.elements[component.entity.id + "_red"].value;
          component.Add(letter, red, green, blue, alpha);
          if (component.settings["file"]) {
            component.Save(component.settings["file"]);
          }
          component.Hide(component.entity.id + "_color_editor");
        }
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      component.elements[component.entity.id + "_letter"].value = "";
      component.elements[component.entity.id + "_red"].value = 0;
      component.elements[component.entity.id + "_green"].value = 0;
      component.elements[component.entity.id + "_blue"].value = 0;
      component.elements[component.entity.id + "_alpha"].value = 0;
      component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(0, 0, 0, 0)";
      component.Hide(component.entity.id + "_color_editor");
    }, false);
    // Load palette if present.
    if (this.settings["file"]) {
      this.Load(this.settings["file"]);
    }
  }
  
  /**
   * Adds a new color to the picker.
   * @param letter The associated letter.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   * @param alpha The alpha component. Range from 0 to 1.
   */
  Add(letter, red, green, blue, alpha) {
    if (this.colors[letter] == undefined) {
      if (this.color_names.length < this.MAX_COLORS) {
        this.color_names.push(letter);
        let color_id = this.color_names.length - 1;
        this.colors[letter] = {
          red: parseInt(red),
          green: parseInt(green),
          blue: parseInt(blue),
          alpha: parseFloat(alpha),
          id: color_id
        };
        // Calculate color hash.
        let hash = [ red, green, blue, alpha ].join(":");
        this.color_hashes[hash] = letter;
        let color = this.Create_Element({
          id: this.entity.id + "_color_" + color_id,
          type: "div",
          css: {
            "position": "absolute",
            "left": this.color_x + "px",
            "top": this.color_y + "px",
            "width": this.COLOR_W + "px",
            "height": this.COLOR_H + "px",
            "background-color": "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")",
            "box-shadow": "1px 1px 1px gray",
            "border-radius": "2px solid black"
          }
        }, this.entity.id + "_color_board");
        this.color_x += (this.COLOR_W + this.PADDING);
        let limit = this.entity.width - 2 - this.COLOR_W;
        if (this.color_x >= limit) {
          this.color_x = 0;
          this.color_y += (this.COLOR_H + this.PADDING);
        }
        color.frankus_id = letter;
        let component = this;
        color.addEventListener("click", function(event) {
          component.Select_Color(event.target.frankus_id);
          event.stopPropagation();
        }, false);
        color.addEventListener("dblclick", function(event) {
          let entry = component.colors[event.target.frankus_id];
          component.elements[component.entity.id + "_red"].value = entry.red;
          component.elements[component.entity.id + "_green"].value = entry.green;
          component.elements[component.entity.id + "_blue"].value = entry.blue;
          component.elements[component.entity.id + "_alpha"].value = entry.alpha;
          component.elements[component.entity.id + "_letter"].value = event.target.frankus_id;
          component.elements[component.entity.id + "_preview"].style.backgroundColor = "rgba(" + entry.red + ", " + entry.green + ", " + entry.blue + ", " + entry.alpha + ")";
          component.Show(component.entity.id + "_color_editor");
          event.stopPropagation();
        }, false);
      }
    }
  }
  
  /**
   * Selects a color to be used.
   * @param selected_color The value of the selected color.
   */
  Select_Color(selected_color) {
    this.sel_color = selected_color;
    let color = this.colors[selected_color];
    let brush_image = new cImage();
    let component = this;
    brush_image.on_load = function() {
      if (color.alpha > 0.0) {
        brush_image.Fill_Colored(0, 0, 10, 10, {
          red: color.red,
          green: color.green,
          blue: color.blue,
          alpha: color.alpha
        });
      }
      let url = brush_image.Get_Data_URL();
      component.elements[component.entity.id + "_color_board"].style.cursor = 'url("' + url + '"), default';
    };
    brush_image.Load(Get_Image("Brush.pic", false));
  }
  
  /**
   * Loads the colors from a palette.
   * @param name The name of the palette.
   */
  Load(name) {
    let file = new cFile("Palette/" + name + ".txt");
    let component = this;
    file.on_read = function() {
      while (file.Has_More_Lines()) {
        let line = file.Get_Line();
        let parts = line.split(/,/);
        if (parts.length == 5) { // letter,red,green,blue,alpha
          let letter = parts[0];
          if (letter.length == 1) {
            let code = letter.charCodeAt(0);
            if ((code > 32) && (code < 127)) { // ! to ~
              let red = parts[1];
              let green = parts[2];
              let blue = parts[3];
              let alpha = parts[4];
              component.Add(letter, red, green, blue, alpha);
            }
          }
        }
      }
    };
    file.Read();
  }
  
  /**
   * Saves colors to a palette file.
   * @param name The name of the palette file.
   */
  Save(name) {
    let file = new cFile("Palette/" + name + ".txt");
    let color_count = this.color_names.length;
    for (let color_index = 0; color_index < color_count; color_index++) {
      let letter = this.color_names[color_index];
      let color = this.colors[letter];
      file.Add(letter + "," + color.red + "," + color.green + "," + color.blue + "," + color.alpha);
    }
    file.Write();
  }
  
}

// *****************************************************************************
// Utility Functions
// *****************************************************************************

/**
 * Splits text into lines regardless of the line endings.
 * @param data The text to be split.
 * @return An array of string representing the lines.
 */
function Split(data) {
  let lines = data.split(/\r\n|\r|\n/);
  // Remove any carrage return at the end.
  let line_count = lines.length;
  let blanks = 0;
  for (let line_index = line_count - 1; line_index >= 0; line_index--) { // Start from back.
    let line = lines[line_index];
    if (line.length == 0) {
      blanks++;
    }
    else {
      break;
    }
  }
  return lines.slice(0, line_count - blanks);
}

/**
 * Checks a condition to see if it passes otherwise an error is thrown.
 * @param condition The condition to check. 
 * @param error An error message for the condition fails.
 * @throws An error if the condition fails. 
 */
function Check_Condition(condition, error) {
  if (!condition) {
    throw new Error(error);
  }
}

/**
 * Converts a string into hex format.
 * @param string The string to convert.
 * @return The hex string.
 */
function String_To_Hex(string) {
  let hex_str = "";
  let length = string.length;
  for (let ch_index = 0; ch_index < length; ch_index++) {
    let ch_value = string.charCodeAt(ch_index);
    let hex_value = ch_value.toString(16).toUpperCase();
    if (hex_value.length == 1) {
      hex_value = "0" + hex_value;
    }
    hex_str += hex_value;
  }
  return hex_str;
}

/**
 * Converts hex to a string.
 * @param hex_str The hex string.
 * @return The restored string.
 */
function Hex_To_String(hex_str) {
  let string = "";
  let length = hex_str.length;
  for (let hex_index = 0; hex_index < length; hex_index += 2) {
    let hex_value = hex_str.substr(hex_index, 2);
    let ch_value = String.fromCharCode(parseInt(hex_value, 16));
    string += ch_value;
  }
  return string;
}

/**
 * Determines if a point is in a box.
 * @param point The point to test.
 * @param box The box.
 * @return True if the point is in the box, false otherwise.
 */
function Is_Point_In_Box(point, box) {
  let result = false;
  if ((point.x >= box.left) && (point.x <= box.right) && (point.y >= box.top) && (point.y <= box.bottom)) {
    result = true;
  }
  return result;
}

/**
 * Grabs the code of a single character.
 * @param character The character to grab the code of.
 * @return The numeric code of the character.
 */
function Get_Char_Code(character) {
  return character.charCodeAt(0);
}

/**
 * Determines if a browser is mobile or not.
 * @return True if the browser is mobile, false otherwise.
 */
function Is_Mobile() {
  return (screen.width <= 450);
}

/**
 * Gets the image by name.
 * @param name The name of the image to fetch.
 * @param quote If true then url will be quoted with url() modifier.
 * @param folder The folder to get the image from. This is optional. Default is "Images".
 * @return The image URL string.
 */
function Get_Image(name, quote, folder) {
  if (folder == undefined) {
    folder = "Images";
  }
  let url = folder + "/" + name;
  if (quote) {
    url = 'url("' + url + '")';
  }
  return url;
}

/**
 * Parses the search portion of the URL.
 * @param url The URL to parse.
 * @return A hash of name/value pairs.
 */
function Parse_URL(url) {
  let params = {};
  let pairs = url.substr(1).split(/&/);
  let pair_count = pairs.length;
  for (let pair_index = 0; pair_index < pair_count; pair_index++) {
    let pair = pairs[pair_index].split(/=/);
    if (pair.length == 2) {
      let name = pair[0];
      let value = decodeURIComponent(pair[1]);
      params[name] = value;
    }
  }
  return params;
}

/**
 * Unquotes a URL string.
 * @param url The quoted URL string.
 * @return The unquoted URL.
 */
function Unquote_URL(url) {
  return url.replace(/^url\("/, "").replace(/"\).*$/, "");
}

/**
 * Converts a binary string to a number.
 * @param binary The binary string.
 * @return The number.
 */
function Binary_To_Number(binary) {
  let digit_count = binary.length;
  let number = 0;
  for (let digit_index = 0; digit_index < digit_count; digit_index++) {
    let digit = parseInt(binary.charAt(digit_index));
    let bit_value = Math.pow(2, digit_count - digit_index - 1);
    number += (bit_value * digit);
  }
  return Math.floor(number);
}

/**
 * Formats text according to Wiki format.
 * @param text The wiki text to format into HTML.
 * @return HTML generated from wiki text.
 */
function Format(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/>/g, "&gt;")
             .replace(/</g, "&lt;")
             .replace(/\*{2}/g, "&ast;")
             .replace(/#{2}/g, "&num;")
             .replace(/@{2}/g, "&commat;")
             .replace(/\${2}/g, "&dollar;")
             .replace(/%{2}/g, "&percnt;")
             .replace(/\^{2}/g, "&Hat;")
             .replace(/\|{2}/g, "&vert;")
             .replace(/#([^#]+)#/g, "<b>$1</b>")
             .replace(/\*([^*]+)\*/g, "<i>$1</i>")
             .replace(/@([^@]+)@/g, "<h1>$1</h1>")
             .replace(/\$([^$]+)\$/g, "<h2>$1</h2>")
             .replace(/\^([^\^]+)\^/g, '<div class="table_head">$1</div>')
             .replace(/\|([^\|]+)\|/g, '<div class="table_data">$1</div>')
             .replace(/%([^%]+)%/g, "<code><pre>$1</pre></code>")
             .replace(/`([^`]+)`/g, "<!-- $1 -->")
             .replace(/(http:\/\/\S+|https:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>')
             .replace(/image:\/\/(\S+)/g, '<img src="Pictures/$1" />')
             .replace(/picture:\/\/(\S+)/g, '<img src="Upload/$1" />')
             .replace(/progress:\/\/(\d+)/g, '<div class="progress"><div class="percent_complete" style="width: $1%;">$1% Complete</div></div>')
             .replace(/video:\/\/(\S+)/g, '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>')
             .replace(/download:\/\/(\S+)/g, '<a href="Upload/$1">$1</a>')
             .replace(/\r\n|\r|\n/g, "<br />");
}

/**
 * Flushes out an object's properties without
 * deleting the object itself.
 * @param object The object.
 */
function Clear_Object(object) {
  for (let property in object) {
    delete object[property];
  }
}

/**
 * Loads an object from the inspector.
 * @param object The object.
 * @param grid The grid component.
 */
function Load_Object_From_Grid(object, grid) {
  Clear_Object(object);
  let data = grid.Get_Table_Data();
  let rows = Split(data);
  let row_count = rows.length;
  for (let row_index = 0; row_index < row_count; row_index++) {
    let columns = rows[row_index].split(/\t/);
    let name = columns[0];
    let value = columns[1];
    if (name.length > 0) { // Ignore blank names.
      object[name] = value;
    }
  }
}

/**
 * Saves an object to the inspector.
 * @param object The object.
 * @param grid The grid component.
 */
function Save_Object_To_Grid(object, grid) {
  let data = [];
  for (let name in object) {
    let value = object[name];
    data.push(name + "\t" + value);
  }
  grid.Set_Table_Data(data.join("\n"));
}

/**
 * Checks to see if certain properties exist in the
 * object.
 * @param object The object.
 * @param properties The properties that should be on the object.
 * @throws An error if the object is missing properties.
 */
function Check_Object_Properties(object, properties) {
  let prop_count = properties.length;
  for (let prop_index = 0; prop_index < prop_count; prop_index++) {
    let name = properties[prop_index];
    Check_Condition((object[name] != undefined), "Missing property " + name + ".");
  }
}

/**
 * Excludes named object properties.
 * @param object The object to exclude the properties from.
 * @param properties The list of properties to exclude.
 * @return The object without the excluded properties.
 */
function Exclude_Object_Properties(object, properties) {
  let object_without_excluded = Object.assign({}, object);
  let prop_count = properties.length;
  for (let prop_index = 0; prop_index < prop_count; prop_index++) {
    let property = properties[prop_index];
    if (object_without_excluded[property] != undefined) {
      delete object_without_excluded[property];
    }
  }
  return object_without_excluded;
}
