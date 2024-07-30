// =============================================================================
// Frankus JavaScript Library (Frontend)
// Programmed by Francois Lamini
// =============================================================================

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
   * Zips up a project folder.
   * @param project The project name.
   */
  static Zip(project) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          console.log(ajax.responseText);
          let name = project.split(/\//).pop();
          window.open("Download/" + name + ".zip");
        }
        else if (ajax.status == 404) {
          console.log(ajax.responseText);
        }
      }
    };
    ajax.open("GET", "zip?project=" + encodeURIComponent(project) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }
  
  /**
   * Zips up a project folder.
   * @param project The project name.
   */
  static Zip_Cpp_Project(project) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          console.log(ajax.responseText);
          let name = project.split(/\//).pop();
          window.open("Download/" + name + ".zip");
        }
        else if (ajax.status == 404) {
          console.log(ajax.responseText);
        }
      }
    };
    ajax.open("GET", "zip-cpp-project?project=" + encodeURIComponent(project) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }
  
  /**
   * Zips up a project folder.
   * @param project The project name.
   */
  static Zip_JavaScript_Project(project) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          console.log(ajax.responseText);
          let name = project.split(/\//).pop();
          window.open("Download/" + name + ".zip");
        }
        else if (ajax.status == 404) {
          console.log(ajax.responseText);
        }
      }
    };
    ajax.open("GET", "zip-js-project?project=" + encodeURIComponent(project) + "&code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }
  
  /**
   * Zips up the editor.
   */
  static Zip_Editor() {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          console.log(ajax.responseText);
          window.open("Download/Editor.zip");
        }
        else if (ajax.status == 404) {
          console.log(ajax.responseText);
        }
      }
    };
    ajax.open("GET", "zip-editor?code=" + encodeURIComponent(code), true);
    ajax.send(null);
  }

  /**
   * Archives the whole site.
   */
  static Archive_Site() {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          console.log(ajax.responseText);
          window.open("Download/Backup.zip?code=" + encodeURIComponent(code));
        }
        else if (ajax.status == 404) {
          console.log(ajax.responseText);
        }
      }
    };
    ajax.open("GET", "archive-site?code=" + encodeURIComponent(code), true);
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
    let file = new cFile(name + ".txt");
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
 * Loads a manifest file of a project.
 * @param project The name of the project.
 * @param on_load Called when the manifest is loaded. A list of files is passed in.
 */
function Load_Manifest(project, on_load) {
  let manifest_file = new cFile("Projects/" + project + "/Manifest.txt");
  manifest_file.on_read = function() {
    let files = [];
    while (manifest_file.Has_More_Lines()) {
      let file = cFile.Escape_Path(manifest_file.Get_Line());
      files.push(file);
    }
    on_load(files);
  };
  manifest_file.Read();
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