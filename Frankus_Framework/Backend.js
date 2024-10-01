// =============================================================================
// Frankus JavaScript Library (Backend)
// Programmed by Francois Lamini
// =============================================================================

let fs = require("fs");
let path = require("path");
let child_process = require("child_process");
let http = require("http");
let https = require("https");
let querystring = require("querystring");
let url = require("url");
let readline = require("readline");
let crypto = require("crypto");
let png = require(__dirname + "/PNG_File/png");

// *****************************************************************************
// File Implementation
// *****************************************************************************

class cFile {

  static startup = process.cwd();
  static saved_startup = process.cwd();
  static script_root = __dirname;

  /**
   * Creates a file module.
   * @param name The name of the file.
   * @param absolute If true then the file path is local to the script. Optional.
   */
  constructor(name, absolute) {
    this.file = name;
    this.absolute = absolute;
    this.lines = [];
    this.data = "";
    this.message = "";
    this.error = "";
    this.pointer = 0;
    this.buffer = null;
  }

  /**
   * Reads the contents of the file.
   */
  Read() {
    try {
      this.data = fs.readFileSync(cFile.Get_Local_Path(this.file, this.absolute), "utf8");
      this.lines = Split(this.data);
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Reads binary data. Only the buffer is populated.
   */
  Read_Binary() {
    try {
      this.buffer = fs.readFileSync(cFile.Get_Local_Path(this.file, this.absolute));
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Streams the file to a write stream to prevent memory exhaustion.
   * @param write_stream The write stream to push the data to.
   */
  Read_Stream(write_stream) {
    let file_stream = fs.createReadStream(cFile.Get_Local_Path(this.file, this.absolute));
    file_stream.pipe(write_stream);
  }

  /**
   * Writes the contents of a file.
   */
  Write() {
    this.data = this.lines.join("\n");
    this.Write_From_Data();
  }

  /**
   * Writes the file from the data.
   */
  Write_From_Data() {
    try {
      fs.writeFileSync(cFile.Get_Local_Path(this.file, this.absolute), this.data);
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Writes binary data.
   */
  Write_Binary() {
    this.buffer = Buffer.from(this.data, "base64");
    this.Write_From_Buffer();
  }

  /**
   * Writes the data from the buffer.
   */
  Write_From_Buffer() {
    try {
      fs.writeFileSync(cFile.Get_Local_Path(this.file, this.absolute), this.buffer);
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Adds a line to the file.
   * @param line The line to add.
   */
  Add(line) {
    this.lines.push(line);
  }

  /**
   * Adds a bunch of lines to the file.
   * @param lines The list of lines to add.
   */
  Add_Lines(lines) {
    this.lines = this.lines.concat(lines);
  }

  /**
   * Adds an object to the file.
   * @param object The object to add to the file.
   */
  Add_Object(object) {
    this.Add("object");
    for (let field in object) {
      let value = object[field];
      this.Add(field + "=" + value);
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
    Check_Condition((line == "object"), "Object identifier missing.");
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
   * Sorts the lines according to the order.
   * @param ascending If true then the lines are sorted ascending.
   * @param numeric If true then the lines are sorted as numbers.
   */
  Sort_Lines(ascending, numeric) {
    this.lines.sort(function(a, b) {
      let diff = 0;
      if (numeric) {
        let n1 = parseInt(a);
        let n2 = parseInt(b);
        diff = (ascending) ? n1 - n2 : n2 - n1;
      }
      else {
        diff = (ascending) ? a - b : b - a;
      }
      return diff;
    });
  }

  /**
   * Modifies lines of data.
   * @param on_mod Called when lines needs modding. Passed in line, return modded line.
   */
  Mod_Data(on_mod) {
    let line_count = this.lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      this.lines[line_index] = on_mod(line);
    }
  }

  /**
   * Gets the extension of the given file.
   * @param file The file path.
   * @return The file extension without the dot.
   */
  static Get_Extension(file) {
    return (file.match(/\w+\.\w+$/)) ? cFile.Escape_Path(file).split(path.sep).pop().replace(/^\w+\./, "") : "";
  }

  /**
   * Gets the name of a file.
   * @param file The file to get the name of.
   * @return The name of the file.
   */
  static Get_File_Name(file) {
    return cFile.Escape_Path(file).split(path.sep).pop();
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
   * Gets the local path given the folder.
   * @param folder The folder path.
   * @param absolute Determines if the script path is used. Optional.
   * @return The platform depend OS path.
   */
  static Get_Local_Path(folder, absolute) {
    let folders = cFile.startup.split(path.sep).concat(cFile.Escape_Path(folder).split(path.sep));
    if (absolute) {
      folders = cFile.script_root.split(path.sep).concat(cFile.Escape_Path(folder).split(path.sep));
    }
    let new_folders = [];
    let folder_count = folders.length;
    for (let folder_index = 0; folder_index < folder_count; folder_index++) {
      if (folders[folder_index] == "up") {
        // Remove previous folder.
        new_folders.pop();
      }
      else if (folders[folder_index] == "root") {
        // Clear all folders until path is same as saved startup.
        let dir = new_folders.join(path.sep);
        let saved_startup = (absolute) ? cFile.script_root : cFile.saved_startup;
        while (dir != saved_startup) {
          if (new_folders.length > 0) {
            new_folders.pop();
            dir = new_folders.join(path.sep);
          }
          else {
            break;
          }
        }
      }
      else if (folders[folder_index] == "clear") {
        while (new_folders.length > 0) { // Clear out entire contents of new_folders.
          new_folders.pop();
        }
      }
      else {
        new_folders.push(folders[folder_index]);
      }
    }
    return new_folders.join(path.sep);
  }

  /**
   * Escapes a folder path to platform independent path separators.
   * @param folder The folder path.
   * @return The path that is platform independent.
   */
  static Escape_Path(folder) {
    return folder.replace(/(\/|\\)/g, path.sep);
  }

  /**
   * Creates a new folder.
   * @param folder The folder to create.
   * @param absolute If set then the folder is created relative to the script.
   */
  static Create_Folder(folder, absolute) {
    try {
      let dest = cFile.Get_Local_Path(folder, absolute);
      fs.mkdirSync(dest, {
        recursive: true
      });
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Queries a group of files in a directory or a group of folders.
   * @param folder The folder to look for files.
   * @param search The search string. Used Frankus wildcards.
   * @param absolute If set looks for files relative to the script.
   * @return The list of files in the folder.
   */
  static Query_Files(folder, search, absolute) {
    let file_list = [];
    try {
      folder = cFile.Escape_Path(folder);
      // Remove trailing slash.
      folder = (folder[folder.length - 1] == path.sep) ? folder.substr(0, folder.length - 1) : folder;
      let dest = cFile.Get_Local_Path(folder, absolute);
      let files = fs.readdirSync(dest);
      // Process files to determine if they are directories.
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = files[file_index];
        let dir = path.join(dest, file);
        let stats = fs.lstatSync(dir);
        if (!stats.isDirectory()) {
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
        else { // Directory read.
          if (search == "folders") {
            if ((file.indexOf(".") == -1) && (file.indexOf("..") == -1)) {
              file_list.push(file);
            }
          }
        }
      }
    }
    catch (error) {
      console.log(error.message);
    }
    return file_list;
  }

  /**
   * Grabs the list of files from the folder including the subfolders.
   * @param folder The folder to look in.
   * @param exclude An optional parameter to exclude a list of folders.
   * @param absolute If set get the file and folder list relative to the script.
   * @return The list of files and folders.
   */
  static Get_File_And_Folder_List(folder, exclude, absolute) {
    let file_list = [];
    try {
      let files = fs.readdirSync(cFile.Get_Local_Path(folder, absolute));
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = path.join(cFile.Escape_Path(folder), files[file_index]);
        let stats = fs.statSync(cFile.Get_Local_Path(file, absolute));
        if (stats.isDirectory()) {
          let skip_folder = false;
          if (exclude != undefined) {
            let exclude_count = exclude.length;
            for (let exclude_index = 0; exclude_index < exclude_count; exclude_index++) {
              if (cFile.Escape_Path(exclude[exclude_index]).indexOf(file) != -1) { // Check for pattern match.
                skip_folder = true;
                break;
              }
            }
          }
          if (!skip_folder) {
            file_list.push(file);
            var sub_file_list = cFile.Get_File_And_Folder_List(file, exclude);
            file_list = file_list.concat(sub_file_list);
          }
        }
        else {
          file_list.push(file);
        }
      }
    }
    catch (error) {
      console.log(error.message);
    }
    return file_list;
  }

  /**
   * Changes to a specific folder.
   * @param folder The folder to change to.
   */
  static Change_Folder(folder) {
    cFile.startup = cFile.Get_Local_Path(folder);
  }

  /**
   * Reverts back to the original startup folder.
   */
  static Revert_Folder() {
    cFile.startup = cFile.saved_startup;
  }

  /**
   * Gets the modification time of a file.
   * @param file The file to get the modification time for.
   * @return The modification time of the file.
   */
  static Get_File_Modified_Time(file) {
    let modification_time = "";
    try {
      let stats = fs.statSync(cFile.Get_Local_Path(file));
      modification_time = stats.mtime;
    }
    catch (error) {
      console.log(error.message);
    }
    return modification_time;
  }

  /**
   * Converts a path to a URL path.
   * @param file The file to convert.
   * @return The URL file path.
   */
  static To_URL_Path(file) {
    return cFile.Escape_Path(file).replace(path.sep, "/");
  }

  /**
   * Checks to see if a file exists.
   * @param file The file to check.
   * @return True if the file exists, false otherwise.
   */
  static Does_File_Exist(file) {
    let exists = false;
    try {
      exists = fs.existsSync(cFile.Get_Local_Path(file));
    }
    catch (error) {
      console.log(error.message);
    }
    return exists;
  }

  /**
   * Copies a file from source to dest.
   * @param source The source file to copy.
   * @param dest The destination file.
   * @param absolute If set then the source path is relative to the script.
   */
  static Copy_File(source, dest, absolute) {
    try {
      fs.copyFileSync(cFile.Get_Local_Path(source, absolute), cFile.Get_Local_Path(dest));
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Gets the size of a file.
   * @param file The file to get the size for.
   * @return The file size in bytes.
   */
  static Get_File_Size(file) {
    let file_size = 0;
    try {
      let stats = fs.statSync(cFile.Get_Local_Path(file));
      file_size = stats.size;
    }
    catch (error) {
      console.log(error.message);
    }
    return file_size;
  }

  /**
   * Deletes a file.
   * @param file The name of the file to delete.
   */
  static Delete_File(file) {
    try {
      fs.unlinkSync(cFile.Get_Local_Path(file));
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Determines if a file name is a file.
   * @param file The file to test.
   * @return True if it is a file name, false otherwise.
   */
  static Is_File_Name(file) {
    return file.match(/\w+\.\w+$/);
  }

  /**
   * Determines if a file is a folder.
   * @param file The name of the file.
   */
  static Is_Folder(file) {
    return !file.match(/\w+\.\w+$/);
  }

}

// *****************************************************************************
// Config Implementation
// *****************************************************************************

class cConfig {

  /**
   * Creates a new config module.
   * @param name The name of the config file.
   */
  constructor(name) {
    this.config = {};
    this.name = name;
    this.properties = [];
    let file = new cFile("Config/" + name + ".txt", true);
    file.Read();
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
        this.config[name] = value;
        this.properties.push(name);
      }
    }
  }

  /**
   * Gets a numeric property value.
   * @param name The name of the property.
   * @return The value of the property.
   * @throws An error if the property does not exist.
   */
  Get_Property(name) {
    Check_Condition((this.config[name] != undefined), "Property value " + name + " does not exist.");
    return this.config[name];
  }

  /**
   * Determines if a property exists.
   * @param name The name of the property.
   * @return True if the property exists, false otherwise.
   */
  Has_Property(name) {
    return (this.config[name] != undefined);
  }

  /**
   * Sets the property of the config file.
   * @param name The name of the property to set.
   * @param value The value of the property to set.
   */
  Set_Property(name, value) {
    this.config[name] = value;
    this.properties.push(name);
  }

  /**
   * Saves the config file.
   */
  Save() {
    let file = new cFile("Config/" + this.name + ".txt", true);
    for (let property in this.config) {
      let value = this.config[property];
      file.Add(property + "=" + value);
    }
    file.Write();
  }

}

// *****************************************************************************
// MIME Reader Implementation
// *****************************************************************************

class cMime_Reader extends cConfig {

  /**
   * Creates an MIME reader.
   * @param name The name of the MIME file.
   * @throws An error if the MIME file is not formatted correctly.
   */
  constructor(name) {
    super(name);
    this.mime = {};
    let prop_count = this.properties.length;
    for (let prop_index = 0; prop_index < prop_count; prop_index++) {
      let property = this.properties[prop_index];
      let data = this.Get_Property(property);
      let pair = data.split(",");
      Check_Condition((pair.length == 2), "Mime data not formatted correctly.");
      this.mime[property] = {
        type: pair[0],
        binary: (pair[1] == "true") ? true : false
      };
    }
  }

  /**
   * Gets the MIME type associated with the given extension.
   * @param ext The extension associated with the MIME type.
   * @throws An error if the MIME type is invalid.
   */
  Get_Mime_Type(ext) {
    Check_Condition((this.mime[ext] != undefined), "MIME type " + ext + " is not defined.");
    return this.mime[ext];
  }

  /**
   * Determines if an MIME type exists.
   * @param ext The extension to check.
   * @return True if the MIME type exists, false otherwise.
   */
  Has_Mime_Type(ext) {
    return (this.mime[ext] != undefined);
  }

}

// *****************************************************************************
// Shell Implementation
// *****************************************************************************

class cShell {

  static working_folder = "";

  /**
   * Creates a shell to execute commands.
   */
  constructor() {
    this.command_log = [];
    this.command = null;
  }

  /**
   * Executes a command in the terminal.
   * @param command The command to run.
   * @param on_close Called when the command closes.
   */
  Execute_Command(command, on_close) {
    let params = command.split(/\s+/);
    let op = params.shift();
    if (op == "folder") {
      if (params.length == 1) {
        let folder = params[0];
        if (cShell.working_folder.length == 0) {
          cShell.working_folder = folder;
        }
        else {
          cShell.working_folder += String("/" + folder);
        }
      }
      on_close();
    }
    else if (op == "where") {
      if (params.length == 0) {
        this.command_log.push(cShell.working_folder);
      }
      on_close();
    }
    else if (op == "version") {
      if (params.length == 0) {
        this.command_log.push("Frankus Terminal v1.0");
      }
      on_close();
    }
    else {
      this.command = child_process.spawn(op, params, {
        cwd: cFile.Get_Local_Path(cShell.working_folder)
      });
      let component = this;
      this.command.stdout.on("data", function(data) {
        component.command_log.push(data.toString("utf8"));
      });
      this.command.stderr.on("data", function(data) {
        component.command_log.push("Error: " + data.toString("utf8"));
      });
      this.command.on("close", function(code) {
        let log = new cLog(op);
        log.Log(component.command_log.join("\n"));
        on_close();
      });
      this.command.on("error", function(error) {
        component.command_log.push(error.message);
        let log = new cLog(op);
        log.Log(component.command_log.join("\n"));
      });
    }
  }

  /**
   * Executes a batch of commands.
   * @param commands The list of commands to execute.
   */
  Execute_Batch(commands, index, on_done) {
    if (index < commands.length) {
      let component = this;
      this.Execute_Command(commands[index], function() {
        component.Execute_Batch(commands, index + 1, on_done);
      });
    }
    else {
      on_done();
    }
  }

  /**
   * Closes the currently running command. Might not work in batch mode.
   */
  Close() {
    if (this.command) {
      this.command.kill();
    }
  }

}

// *****************************************************************************
// Log Implementation
// *****************************************************************************

class cLog extends cFile {

  /**
   * Creates a new log.
   * @param name The name of the log to create.
   */
  constructor(name) {
    super("Logs/" + name + "_Log.txt", true);
  }

  /**
   * Logs a message with the current time and date.
   * @param message The message to log.
   */
  Log(message) {
    super.Add(message);
    super.Write(); // Save log on write.
  }

  /**
   * Prints out the contents of the log.
   */
  Print() {
    let line_count = this.lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      console.log(this.lines[line_index]);
    }
  }

}

// *****************************************************************************
// Command Line Implementation
// *****************************************************************************

class cCommand {

  /**
   * Creates a new command line interpreter.
   * @param args Command line arguments passed to the script.
   */
  constructor(args) {
    this.command = args;
    this.on_done = null;
  }

  /**
   * Grabs a single parameter from the list of parameters.
   * @param params The parameters.
   * @param message The error message to report.
   * @return The parameter text.
   * @throws An error if there are no more parameters.
   */
  Get_Param(params, message) {
    Check_Condition((params.length > 0), message);
    return params.shift();
  }

  /**
   * Interprets a single command entered in by the user.
   * @param command The command to interpret.
   */
  Interpret(command) {
    try {
      let op = this.Get_Param(command, "Missing command.");
      let status = this.On_Interpret(op, command);
      if (status == "error") {
        throw new Error("Invalid command " + op + ".");
      }
    }
    catch (error) {
      this.Done(error.message);
    }
  }

  /**
   * Called when a command needs to be interpreted.
   * @param op The operation code of the command.
   * @param params The parameters of the command.
   * @return The status of the command. Pass "error" if there is an error.
   */
  On_Interpret(op, params) {
    // To be implemented in app.
  }

  /**
   * Runs the Frankus command interpreter.
   */
  Run() {
    Frankus_Logo();
    // Process command.
    this.Interpret(this.command);
  }

  /**
   * Called when the command is complete.
   * @param message The message to pass in. Optional.
   */
  Done(message) {
    if (message) {
      console.log(message);
    }
    if (this.on_done) {
      this.on_done();
    }
  }

}

// *****************************************************************************
// Binary Tree Implementation
// *****************************************************************************

class cBinary_Tree {

  /**
   * Creates a new binary tree.
   */
  constructor() {
    this.root = {
      left: null,
      right: null,
      data: null
    };
  }

  /**
   * Adds data to a node which is empty.
   * @param data The data to add.
   * @param node The node to add data to. This optional, defaults to root.
   */
  Add(data, node) {
    if (node == undefined) {
      node = this.root;
    }
    if (node.data == null) {
      node.data = data;
    }
    else {
      if (data < node.data) {
        // Add to left.
        if (node.left == null) {
          node.left = {
            left: null,
            right: null,
            data: data
          };
        }
        else {
          this.Add(data, node.left);
        }
      }
      else if (data >= node.data) {
        // Add to right.
        if (node.right == null) {
          node.right = {
            left: null,
            right: null,
            data: data
          };
        }
        else {
          this.Add(data, node.right);
        }
      }
    }
  }

  /**
   * Tries to find data in node.
   * @param data The data to find.
   * @param node The node to find the data in. This optional, defaults to root.
   * @return True if the data was found, false otherwise.
   */
  Find_Data(data, node) {
    let found = false;
    if (node == undefined) {
      node = this.root;
    }
    if (node.data == null) {
      found = false;
    }
    else {
      if (data == node.data) {
        found = true;
      }
      else {
        if (data < node.data) {
          // Search left.
          if (node.left) {
            found = this.Find_Data(data, node.left);
          }
        }
        else { // data > node.data
          if (node.right) {
            found = this.Find_Data(data, node.right);
          }
        }
      }
    }
    return found;
  }

  /**
   * Clears out a binary tree.
   */
  Clear() {
    this.root = {
      left: null,
      right: null,
      data: null
    };
  }

}

// *****************************************************************************
// Bucket Search Implementation
// *****************************************************************************

class cBucket {

  /**
   * Creates a new bucket search.
   * @param bucket_size The size of the buckets.
   */
  constructor(bucket_size) {
    this.indexes = [];
    this.buckets = [];
    this.bucket_size = bucket_size;
    this.count = 0;
  }

  /**
   * Adds an item to the bucket search.
   * @param item The item to add.
   */
  Add(item) {
    if (this.count == 0) {
      this.buckets.push([]);
      this.indexes.push({
        low: item,
        high: -1 // Not full.
      });
      this.buckets[0].push(item);
      this.count++;
    }
    else {
      if ((this.count % this.bucket_size) == 0) {
        // Set high value of previous index.
        let last_index = this.indexes[this.indexes.length - 1];
        let last_bucket = this.buckets[this.buckets.length - 1];
        last_index.high = last_bucket[last_bucket.length - 1];
        // Add new bucket and index.
        this.buckets.push([]);
        this.indexes.push({
          low: item,
          high: -1
        });
      }
      let index = Math.floor(this.count / this.bucket_size);
      this.buckets[index].push(item);
      this.count++;
    }
  }

  /**
   * Finds an item in the bucket search.
   * @param item The item to find.
   * @return True if the item is found, false otherwise.
   */
  Find_Data(item) {
    let found = false;
    let bucket_count = this.buckets.length;
    for (let bucket_index = 0; bucket_index < bucket_count; bucket_index++) {
      let index = this.indexes[bucket_index];
      let bucket = this.buckets[bucket_index];
      if ((item >= index.low) && ((item <= index.high) || (index.high == -1))) { // We're in range or in last bucket.
        let item_count = bucket.length;
        for (let item_index = 0; item_index < item_count; item_index++) {
          if (item == bucket[item_index]) {
            found = true;
            break;
          }
        }
      }
    }
    return found;
  }

}

// *****************************************************************************
// Code Bank Implementation
// *****************************************************************************

class cCode_Bank {

  /**
   * Creates a new code bank.
   * @param name The name of the file to load for the code bank.
   */
  constructor(name) {
    this.name = name;
    this.bank = {};
    this.Load(name);
  }

  /**
   * Loads a code bank by name.
   * @param name The name of the code bank file.
   * @throws An error if the bank is not correctly formatted.
   */
  Load(name) {
    let cb_file = new cFile("Code_Banks/" + name + ".txt", true);
    cb_file.Read();
    while (cb_file.Has_More_Lines()) {
      let file_meta = {
        "lines": []
      };
      cb_file.Get_Object(file_meta);
      Check_Condition((file_meta["name"] != undefined), "Missing file name.");
      Check_Condition((file_meta["type"] != undefined), "Missing file type.");
      file_meta["name"] = this.Convert_To_Bank_Path(file_meta["name"]); // Make sure we have bank path.
      if (file_meta["type"] == "code") {
        Check_Condition((file_meta["count"] != undefined), "Missing number of lines.");
        let line_count = file_meta["count"];
        for (let line_index = 0; line_index < line_count; line_index++) {
          let line = cb_file.Get_Line();
          file_meta["lines"].push(line);
        }
        this.bank[file_meta["name"]] = file_meta;
      }
      else if (file_meta["type"] == "link") {
        this.bank[file_meta["name"]] = file_meta; // Just link info.
      }
      else {
        throw new Error("Unknown file type " + file_meta["type"] + ".");
      }
    }
  }

  /**
   * Saves the code bank to a named file.
   * @throws An error if something went wrong.
   */
  Save() {
    let cb_file = new cFile("Code_Banks/" + this.name + ".txt", true);
    for (let file in this.bank) {
      let file_meta = this.bank[file];
      let meta_data = {
        "name": file,
        "type": file_meta["type"]
      };
      if (file_meta["type"] == "code") {
        meta_data["count"] = file_meta["count"];
        cb_file.Add_Object(meta_data);
        let lines = file_meta["lines"].slice(0);
        cb_file.Add_Lines(lines);
      }
      else if (file_meta["type"] == "link") {
        cb_file.Add_Object(meta_data);
      }
    }
    cb_file.Write();
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
   * Puts a file in the code bank.
   * @param name The name of the file to put.
   * @param type The type of file. ("code" or "link")
   * @param data The file data.
   * @throws An error if the type is not correct.
   */
  Put(name, type, data) {
    name = this.Convert_To_Bank_Path(name);
    Check_Condition(((type == "code") || (type == "link")), "Not code or link.");
    this.bank[name] = {
      "name": name,
      "type": type,
    };
    if (type == "code") {
      let lines = Split(data);
      this.bank[name]["count"] = lines.length;
      this.bank[name]["lines"] = lines;
    }
  }

  /**
   * Deletes a file in the bank.
   * @param name The name of the file.
   * @throws An error if the file was not found.
   */
  Delete(name) {
    name = this.Convert_To_Bank_Path(name);
    Check_Condition((this.bank[name] != undefined), name + " was not found.");
    delete this.bank[name];
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
        files.push(file);
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

  /**
   * Creates a code bank from a directory path.
   * @param dir The root directory.
   * @throws An error if something went wrong.
   */
  Create_From_Directory_Path(dir) {
    let mime = new cMime_Reader("Mime");
    let file_list = cFile.Get_File_And_Folder_List(dir, []);
    let file_count = file_list.length;
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = file_list[file_index];
      if (cFile.Is_File_Name(file)) {
        let ext = cFile.Get_Extension(file);
        if (mime.Has_Mime_Type(ext)) {
          let mime_entry = mime.Get_Mime_Type(ext);
          if (mime_entry.binary) {
            this.Put(file, "link", "");
            console.log("Added link " + file + ".");
          }
          else {
            let new_file = new cFile(file);
            new_file.Read();
            if (new_file.error.length == 0) {
              this.Put(file, "code", new_file.data);
              console.log("Added code " + file + ".");
            }
          }
        }
      }
    }
    this.Save();
  }

}

// **************************************************************************
// PNG To Picture Implementation
// **************************************************************************

class cPNG_To_Picture extends cCommand {

  MAX_COLORS = 94;
  RANGE = 10;

  /**
   * Creates a new PNG to picture converter.
   * @param argv The arguments passed to the script.
   */
  constructor(argv) {
    super(argv);
    this.config = new cConfig("Png_To_Pic");
    try {
      this.base_folder = this.config.Get_Property("base-folder");
    }
    catch (error) {
      this.base_folder = "Paint";
    }
  }

  On_Interpret(op, params) {
    let status = "";
    if (op == "list") {
      let files = cFile.Query_Files(this.base_folder, "folders");
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = files[file_index];
        console.log(file);
      }
      this.Done("");
    }
    else if (op == "list-pictures") {
      let project = this.Get_Param(params, "Missing project name.");
      let files = cFile.Query_Files(this.base_folder + "/" + project, "folders");
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = files[file_index];
        console.log(project + " -> " + file);
      }
      this.Done();
    }
    else if (op == "list-layers") {
      let project = this.Get_Param(params, "Missing project name.");
      let image = this.Get_Param(params, "Missing image name");
      let files = cFile.Query_Files(this.base_folder + "/" + project + "/" + image, "all");
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = files[file_index];
        console.log(project + " -> " + image + " -> " + file);
      }
      this.Done();
    }
    else if (op == "convert-to-pic") {
      let project = this.Get_Param(params, "Missing project name.");
      let image = this.Get_Param(params, "Missing image name");
      let files = cFile.Query_Files(this.base_folder + "/" + project + "/" + image, "*png");
      let component = this;
      this.Convert_To_Pic(project, image, files, 0, function() {
        component.Done("Image conversion complete!");
      });
    }
    else if (op == "convert-to-png") {
      let project = this.Get_Param(params, "Missing project name.");
      let image = this.Get_Param(params, "Missing image name");
      let files = cFile.Query_Files(this.base_folder + "/" + project + "/" + image, "*pic");
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = files[file_index];
        this.Convert_To_PNG(project, image, file);
        console.log("Converted " + file + ".");
      }
      this.Done();
    }
    else if (op == "batch-convert-to-pic") {
      let project = this.Get_Param(params, "Missing project name.");
      let files = cFile.Query_Files(this.base_folder + "/" + project, "folders");
      let component = this;
      this.Batch_Convert_To_Pic(project, files, 0, function() {
        component.Done("Batch converted!");
      });
    }
    else if (op == "batch-convert-to-png") {
      let project = this.Get_Param(params, "Missing project name.");
      let images = cFile.Query_Files(this.base_folder + "/" + project, "folders");
      let image_count = images.length;
      for (let image_index = 0; image_index < image_count; image_index++) {
        let image = images[image_index];
        let files = cFile.Query_Files(this.base_folder + "/" + project + "/" + image, "*pic");
        let file_count = files.length;
        for (let file_index = 0; file_index < file_count; file_index++) {
          let file = files[file_index];
          this.Convert_To_PNG(project, image, file);
          console.log("Converted " + file + ".");
        }
      }
      this.Done();
    }
    else if (op == "change-folder") {
      let folder = this.Get_Param(params, "Missing folder name.");
      this.config.Set_Property("base-folder", folder);
      this.config.Save();
      this.Done();
    }
    else {
      status = "error";
    }
    return status;
  }

  /**
   * Converts an image in a project to a picture.
   * @param project The name of the associated project.
   * @param images The images in the project.
   * @param index The index of the image to convert.
   * @param on_convert Called when the batch is done converting.
   */
  Batch_Convert_To_Pic(project, images, index, on_convert) {
    if (index < images.length) {
      let files = cFile.Query_Files(this.base_folder + "/" + project + "/" + images[index], "*png");
      let component = this;
      this.Convert_To_Pic(project, images[index], files, 0, function() {
        console.log(images[index] + " conversion complete!");
        component.Batch_Convert_To_Pic(project, images, index + 1, on_convert);
      });
    }
    else {
      on_convert();
    }
  }

  /**
   * Converts a PNG file to PIC format.
   * @param project The name of the associated project.
   * @param image The name of the associated image.
   * @param files The list of PNG files to convert.
   * @param index The index of the file to convert.
   * @param on_complete Called when the conversion is complete.
   */
  Convert_To_Pic(project, image, files, index, on_complete) {
    if (index < files.length) {
      let png_file = new png.PNG({});
      let reader = fs.createReadStream(cFile.Get_Local_Path(this.base_folder + "/" + project + "/" + image + "/" + files[index]));
      let component = this;
      png_file.on("parsed", function() {
        console.log("Converting " + files[index] + "...");
        try {
          component.Generate_Picture(project, image, files[index], this.width, this.height, this.data);
          cFile.Delete_File(component.base_folder + "/" + project + "/" + image + "/" + files[index]); // Delete PNG file.
        }
        catch (error) {
          console.log(error.message);
        }
        console.log("Done.");
        component.Convert_To_Pic(project, image, files, index + 1, on_complete);
      });
      reader.pipe(png_file);
    }
    else {
      on_complete();
    }
  }

  /**
   * Generates a PIC file.
   * @param project The associated project.
   * @param image The associated image.
   * @param file The name of the PNG file.
   * @param width The width of the PNG file.
   * @param height The height of the PNG file.
   * @param data The image data.
   * @throws An error if the image has too many colors.
   */
  Generate_Picture(project, image, file, width, height, data) {
    let color_hashes = {};
    let palette = new Array(this.MAX_COLORS).fill("");
    let colors = [];
    let scanlines = [];
    let letter = 32; // Ordinal value of letter.
    let pic_name = file.replace(/\.png$/, ".pic");
    let pic_file = new cFile(this.base_folder + "/" + project + "/" + image + "/" + pic_name);
    pic_file.Add("--- Frankus Picture ---");
    pic_file.Add_Object({
      width: width,
      height: height
    });
    // Add initial color.
    palette[0] = "0,0,0,0.0"; // Transparent color.
    letter++;
    for (let y = 0; y < height; y++) {
      let scanline = "";
      for (let x = 0; x < width; x++) {
        let offset = ((y * width) + x) * 4; // RGBA
        let red = data[offset + 0];
        let green = data[offset + 1];
        let blue = data[offset + 2];
        let alpha_v = data[offset + 3] / 255;
        // let alpha = ((alpha_v > 0.0) && (alpha_v < 1.0)) ? 1.0 : alpha_v.toFixed(1); // No more than 1 decimal digit.
        let alpha = alpha_v.toFixed(1);
        let color_hash = [ red, green, blue, alpha ].join(",");
        let pixel = '';
        if ((red == undefined) || (green == undefined) || (blue == undefined) || (data[offset + 3] == undefined)) {
          red = 0;
          green = 0;
          blue = 0;
          alpha = 0.0; // Hide color.
          color_hash = [ red, green, blue, alpha ].join(",");
        }
        if (alpha == 0.0) { // Don't add color in if not visible.
          pixel = ' ';
        }
        else {
          let index = letter - 32;
          if (index < this.MAX_COLORS) {
            if (color_hashes[color_hash] == undefined) {
              // Look to see if we can find similar color.
              // let color_index = this.Find_Similar_Color(colors, red, green, blue);
              // if (color_index == -1) {
              pixel = String.fromCharCode(letter);
              palette[index] = color_hash;
              // Add in color.
              color_hashes[color_hash] = pixel;
              colors.push({
                red: red,
                green: green,
                blue: blue,
                alpha: alpha
              });
              letter++;
              // }
              // else {
                // let color = colors[color_index];
                // let col_hash = [ color.red, color.green, color.blue, color.alpha ].join(",");
                // pixel = color_hashes[col_hash];
              // }
            }
            else { // Color defined.
              pixel = color_hashes[color_hash];
            }
          }
          else { // Palette filled up.
            // Find replacement color.
            // let color_index = this.Find_Similar_Color(colors, red, green, blue);
            // if (color_index == -1) {
            throw new Error("Too many colors in " + file + " to make a Frankus picture.");
            // }
            // else { // Found color!
              // let color = colors[color_index];
              // let col_hash = [ color.red, color.green, color.blue, color.alpha ].join(",");
              // pixel = color_hashes[col_hash];
            // }
          }
        }
        // Write scanline pixel.
        scanline += pixel;
      }
      scanlines.push(scanline);
    }
    pic_file.Add_Lines(palette);
    pic_file.Add_Lines(scanlines);
    pic_file.Write();
  }

  /**
   * Converts a PIC file to PNG format.
   * @param project The name of the associated project.
   * @param image The name of the associated image.
   * @param file The name of the PIC file to convert.
   */
  Convert_To_PNG(project, image, file) {
    let pic_file = new cFile(this.base_folder + "/" + project + "/" + image + "/" + file);
    pic_file.Read();
    if (pic_file.error.length == 0) {
      try {
        let signature = pic_file.Get_Line();
        Check_Condition((signature == "--- Frankus Picture ---"), "Invalid Frankus picture.");
        let meta = {};
        pic_file.Get_Object(meta);
        Check_Condition((meta["width"] != undefined), "Missing picture width.");
        Check_Condition((meta["height"] != undefined), "Missing picture height.");
        // Read palette.
        let palette = new Array(this.MAX_COLORS).fill(null);
        for (let pal_index = 0; pal_index < this.MAX_COLORS; pal_index++) {
          let entry = pic_file.Get_Line().split(",");
          if (entry.length == 4) {
            let red = parseInt(entry[0]);
            let green = parseInt(entry[1]);
            let blue = parseInt(entry[2]);
            let alpha = parseFloat(entry[3]);
            palette[pal_index] = {
              red: red,
              green: green,
              blue: blue,
              alpha: alpha
            };
          }
        } // Don't break! Read all blank lines!
        // Create PNG.
        let png_file = new png.PNG({
          width: meta.width,
          height: meta.height,
          bitDepth: 8,
          colorType: 6,
          inputColorType: 6,
          inputHasAlpha: true
        });
        let buffer = Buffer.alloc(meta.width * meta.height * 4);
        let bitmap = new Uint8Array(buffer.buffer);
        // Read pixel data.
        for (let y = 0; y < meta.height; y++) {
          let scanline = pic_file.Get_Line();
          // let pix_data = [];
          for (let x = 0; x < meta.width; x++) {
            let index = scanline.charCodeAt(x) - 32;
            let entry = palette[index];
            let offset = ((y * meta.width) + x) * 4;
            bitmap[offset + 0] = entry.red;
            bitmap[offset + 1] = entry.green;
            bitmap[offset + 2] = entry.blue;
            bitmap[offset + 3] = Math.floor(entry.alpha * 255);
          }
        }
        png_file.data = buffer;
        let png_name = file.replace(/\.pic$/, ".png");
        png_file.pack().pipe(fs.createWriteStream(cFile.Get_Local_Path(this.base_folder + "/" + project + "/" + image + "/" + png_name)));
        // Delete PIC file.
        cFile.Delete_File(this.base_folder + "/" + project + "/" + image + "/" + file);
      }
      catch (error) {
        console.log(error.message);
      }
    }
    else {
      console.log("Cannot convert " + file + " to PNG.");
    }
  }

  /**
   * Looks for a similar color in a list of colors
   * @param colors The array of added colors.
   * @param red The red component. 
   * @param green The green component.
   * @param blue The blue component.
   * @return The index of the color or -1 if no color was found.
   */
  Find_Similar_Color(colors, red, green, blue) {
    // Find replacement color.
    let color_count = colors.length;
    let index = -1;
    for (let color_index = 0; color_index < color_count; color_index++) {
      let color = colors[color_index];
      let lower_r = color.red - this.RANGE;
      let upper_r = color.red + this.RANGE;
      let lower_g = color.green - this.RANGE;
      let upper_g = color.green + this.RANGE;
      let lower_b = color.blue - this.RANGE;
      let upper_b = color.blue + this.RANGE;
      if (((red >= lower_r) && (red <= upper_r)) && ((green >= lower_g) && (green <= upper_g)) && ((blue >= lower_b) && (blue <= upper_b))) {
        index = color_index;
        break;
      }
    }
    return index;
  }

}

// *****************************************************************************
// Coder Doc Implementation
// *****************************************************************************

class cCoder_Doc {

  /**
   * Creates a new documentation generator.
   * @param project The associated project.
   */
  constructor(project) {
    this.project = project;
    this.docs_folder = "";
    this.copy_file_list = [
      "Coder_Doc.css",
      "Regular.ttf",
      "Regular_Bold.ttf",
      "Regular_Italic.ttf"
    ];
    this.copy_file_locs = [
      "Coder_Doc/",
      "Fonts/",
      "Fonts/",
      "Fonts/"
    ];
  }

  /**
   * Processes a source code file and generates HTML code.
   * @param file The file to process the source.
   */
  Process_Source_File(file) {
    let title = cFile.Get_File_Title(file);
    let ext = cFile.Get_Extension(file);
    let file_reader = new cFile(file);
    file_reader.Read();
    let lines = file_reader.lines;
    let line_count = lines.length;
    let body = [];
    let function_list = [];
    let class_list = [];
    let comment = [];
    let function_hash = {};
    let class_hash = {};
    let last_class = "";
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = lines[line_index];
      if (line.match(/^\s*\/\*{2}/)) { // Beginning of JavaDoc comment.
        comment.push("\n");
      }
      else if (line.match(/^\s*\*\s+/)) { // Middle of JavaDoc comment.
        let trimmed_line = line.replace(/^\s*\*\s/, "") + "\n";
        comment.push(trimmed_line);
      }
      else if (line.match(/^\s*\*\//)) { // End of JavaDoc comment.
        comment.push("\n");
      }
      else if (line.match(/^\s*\*$/)) { // Empty line in comment.
        comment.push("\n");
      }
      else if (line.match(/^\s*function\s+\w+/)) { // JavaScript function.
        let function_def = line.replace(/^\s*function\s+/, "")
                              .replace(/\s*\{\s*$/, "");
        let function_name = function_def.replace(/\([^\)]*\)/, "");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*class\s+\w+/) && (ext == "js")) { // Class declaration.
        let class_name = line.replace(/^\s*class\s+(\w+).*$/, "$1");
        last_class = class_name;
        comment.unshift("@" + class_name + "@");
        comment.unshift("anchor://" + String_To_Hex(class_name) + " ");
        class_list.push('<a href="#' + String_To_Hex(class_name) + '">' + class_name + '</a><br />');
        console.log("Added class " + class_name + ".");
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*(\w+|static\s+\w+)\(/) && line.match(/\)\s*\{$/) && !line.match(/function/) && (ext == "js")) { // Class member function.
        let class_function_def = line.replace(/^\s*/, "")
                                     .replace(/static\s+/, "")
                                     .replace(/\s*\{\s*$/, "");
        let class_function_name = class_function_def.replace(/\([^\)]*\)/, "");
        comment.unshift("$" + class_function_def + "$ ");
        // Make sure member functions do not match eachother or global functions.
        comment.unshift("anchor://" + String_To_Hex(last_class + class_function_name) + " ");
        class_list.push('<a href="#' + String_To_Hex(last_class + class_function_name) + '">&nbsp;&nbsp;&rdsh;' + class_function_name + '</a><br />');
        console.log("Added class function " + class_function_name + ".");
        class_hash[last_class + ":" + class_function_name] = String_To_Hex(last_class + class_function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\w+:\s+function\([^\)]*\)\s*\{$/) && (ext == "js")) { // Prototype function member.
        let function_def = line.replace(/^\s*(\w+):\s+function\(([^\)]*)\)\s*\{\s*$/, "$1($2)");
        let function_name = line.replace(/^\s*(\w+):\s+function\([^\)]*\)\s*\{\s*$/, "$1");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        function_hash[function_name] = String_To_Hex(function_name);
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*var\s+\$\w+/)) { // Global variable.
        let global_def = line.replace(/^\s*var\s+\$(\w+)\s+=\s+\S+;?.*$/, "$1");
        comment.unshift("$" + global_def + "$\n");
        console.log("Added global variable " + global_def + ".");
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\S+\s+\w+\([^\)]*\)(\s+\{|)\s*$/) && ext.match(/cpp|hpp/)) { // C++ routine.
        let function_def = line.replace(/^\s*(\S+\s+\w+\([^\)]*\))(\s+\{|)\s*$/, "$1");
        let function_name = line.replace(/^\s*\S+\s+(\w+)\([^\)]*\)(\s+\{|)\s*$/, "$1");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class function.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+<[^>]*>::\w+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class constructor.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+(\w+<[^>]*>::\w+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::~\w+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class destructor.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+(\w+<[^>]*>::~\w+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(~\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::operator\S+\s+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class operator.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+<[^>]*>::operator\S+\s+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::operator(\S+)\s+\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\S+\s+[^:]+::[^\(]+\([^\)]*\)(\s+\{|)\s*$/) && ext.match(/cpp|hpp/)) { // C++ class method.
        let function_def = line.replace(/^\s*(\S+\s+[^:]+::[^\(]+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*\S+\s+([^:]+)::([^\(]+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\w+::\w+\([^\)]*\)(\s+\{|\s+:\s*|\s+:\s+\w+\([^\)]*\)\s+\{)\s*$/) && ext.match(/cpp|hpp/)) { // C++ constructor.
        let function_def = line.replace(/^\s*\w+::(\w+\([^\)]*\))(\s+\{|\s+:\s*|\s+:\s+\w+\([^\)]*\)\s+\{)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*(\w+)::(\w+)\([^\)]*\)(\s+\{|\s+:\s*|\s+:\s+\w+\([^\)]*\)\s+\{)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\w+::~\w+\([^\)]*\)\s+\{\s*$/) && ext.match(/cpp|hpp/)) { // C++ destructor.
        let function_def = line.replace(/^\s*(\w+)::(~\w+)\([^\)]*\)\s+\{\s*$/, "[$1]:$2");
        let function_name = function_def;
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
    }
    // Replace all hashes with codes.
    let formatted_body = Format(body.join(""));
    let hash_keys = formatted_body.match(/hash=\w+:?\w*/g);
    if (hash_keys) {
      let hash_key_count = hash_keys.length;
      for (let hash_index = 0; hash_index < hash_key_count; hash_index++) {
        let hash_key = hash_keys[hash_index].replace(/^hash=/, "");
        let code = "#";
        if (hash_key.match(/:/)) {
          code += class_hash[hash_key];
        }
        else { // Function hash.
          code += function_hash[hash_key];
        }
        if (code) {
          formatted_body = formatted_body.replace(/hash=\w+:?\w*/, code);
        }
      }
    }
    // Process the template here.
    this.Process_Template("Module_Template.html", title + "_" + ext + ".html", {
      title: title,
      api_list: function_list.join("\n") + class_list.join("\n"),
      api_body: formatted_body
    });
  }

  /**
   * Processes a wiki file.
   * @param file The file to process.
   */
  Process_Wiki_File(file) {
    let doc = cFile.Get_File_Title(file);
    let file_reader = new cFile(file);
    file_reader.Read();
    let wiki = Format(file_reader.data);
    this.Process_Template("Wiki_Template.html", doc + ".html", {
      document: doc,
      wiki_body: wiki
    });
    console.log("Processed file " + file + " into " + doc + ".");
  }

  /**
   * Processes a template into an HTML file.
   * @param template_name The name of the template file to be processed.
   * @param output_name The name of the output file.
   * @param config The config hash with the template variables.
   */
  Process_Template(template_name, output_name, config) {
    let file_reader = new cFile("Coder_Doc/" + template_name, true);
    file_reader.Read();
    let template = file_reader.data;
    // Replace all template variables.
    for (let variable in config) {
      let value = config[variable];
      template = template.replace(new RegExp("%" + variable + "%", "g"), value);
    }
    // Write out template to file.
    let file_writer = new cFile(this.docs_folder + "/" + output_name);
    file_writer.data = template;
    file_writer.Write_From_Data();
  }

  /**
   * Processes the code into docs.
   * @return The output of the debug log.
   */
  Process_Code() {
    // Set project and documents folder.
    cFile.Change_Folder(this.project);
    this.docs_folder = "Docs";
    // Check for document folder.
    cFile.Create_Folder(this.docs_folder);
    console.log("Created " + this.docs_folder + " folder.");
    // Copy files into documents folder.
    let def_file_count = this.copy_file_list.length;
    for (let file_index = 0; file_index < def_file_count; file_index++) {
      let file = this.copy_file_list[file_index];
      let loc = this.copy_file_locs[file_index];
      let source = "root/" + loc + file;
      let dest = this.docs_folder + "/" + file;
      cFile.Copy_File(source, dest, true);
      console.log("Copied file " + file + ".");
    }
    // Now process the files.
    let files = cFile.Get_File_And_Folder_List("", [ "PNG_File", "Programming" ]);
    let file_count = files.length;
    let file_list = [];
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = files[file_index];
      let file_title = cFile.Get_File_Title(file);
      let ext = cFile.Get_Extension(file);
      if (ext.match(/js|cpp|hpp/)) { // Look for code files.
        this.Process_Source_File(file);
        file_list.push('<a href="' + file_title + '_' + ext + '.html">' + file + '</a>');
        console.log("File " + file + " added to index.");
      }
      else if (file == "Readme.txt") { // Process Readme file too.
        this.Process_Wiki_File(file);
        file_list.push('<a href="' + file_title + '.html">' + file + '</a>');
      }
    }
    // Process the Files index first.
    this.Process_Template("Files_Template.html", "Files.html", {
      file_list: file_list.join("<br />")
    });
    cFile.Revert_Folder();
  }

}

// *****************************************************************************
// Project Implementation
// *****************************************************************************

class cProject {

  /**
   * Creates a new project tool.
   * @param name The name of the project to manage.
   */
  constructor(project) {
    this.project = project;
    this.config = null;
    this.mime = new cMime_Reader("Mime");
  }
  
  /**
   * Uploads a file to a server.
   * @param name The name of the file to upload.
   * @param on_upload Called when the file is uploaded.
   * @param on_error Called if there was an error. A message is passed in.
   */
  Upload_File(name, on_upload, on_error) {
    let file = new cFile(name);
    let ext = cFile.Get_Extension(name);
    if (this.mime.Has_Mime_Type(ext)) {
      if (this.config) {
        try {
          let mime_entry = this.mime.Get_Mime_Type(ext);
          let post = {
            data: "",
            code: ""
          };
          let secure = this.config.Get_Property("secure");
          let protocol = null;
          if (secure == "on") {
            protocol = https;
            post.code = this.config.Get_Property("code");
          }
          else {
            protocol = http;
          }
          if (mime_entry.binary) {
            file.Read_Binary();
            post.data = file.buffer.toString("base64");
          }
          else {
            file.Read();
            post.data = file.data;
          }
          let post_data = querystring.stringify(post);
          let options = {
            hostname: this.config.Get_Property("server"),
            port: this.config.Get_Property("port"),
            path: "/" + cFile.To_URL_Path(name),
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(post_data)
            }
          };
          if (secure == "on") {
            options.rejectUnauthorized = false;
          }
          let request = protocol.request(options, function(response) {
            let status = response.statusCode;
            response.setEncoding("utf8");
            let chunk_str = "";
            response.on("data", function(chunk) {
              chunk_str += chunk;
            });
            response.on("end", function() {
              console.log(chunk_str);
              if (status == 200) {
                on_upload();
              }
              else {
                on_error("Got error code " + status + ".");
              }
            });
          });
          request.on("error", function(error) {
            on_error(error.message);
          });
          request.write(post_data);
          request.end();
        }
        catch (error) {
          on_error(error.message);
        }
      }
      else {
        on_error("Server config not set.");
      }
    }
    else {
      if (ext.length == 0) {
        on_error("Not uploading folder " + name + ".");
      }
      else {
        on_error("Unknown mime type " + ext + ".");
      }
    }
  }

  /**
   * Downloads a file from the server.
   * @param name The name of the file to download.
   * @param on_download Called when the file is downloaded.
   * @param on_error Called if there was an error. A message is passed in.
   */
  Download_File(name, on_download, on_error) {
    let file = new cFile(name);
    let ext = cFile.Get_Extension(name);
    if (this.mime.Has_Mime_Type(ext)) {
      let mime_entry = this.mime.Get_Mime_Type(ext);
      if (this.config) {
        try {
          let server = this.config.Get_Property("server") + ":" + this.config.Get_Property("port");
          let secure = this.config.Get_Property("secure");
          let protocol = null;
          let code = "";
          let prefix = "";
          if (secure == "on") {
            protocol = https;
            code = this.config.Get_Property("code");
            prefix = "https://";
          }
          else {
            protocol = http;
            prefix = "http://";
          }
          let options = {};
          if (secure == "on") {
            options.rejectUnauthorized = false;
          }
          protocol.get(prefix + server + "/" + cFile.To_URL_Path(name) + "?code=" + code, options, function(response) {
            let status = response.statusCode;
            if (status == 200) {
              if (!mime_entry.binary) {
                response.setEncoding("utf8");
              }
              let chunks = [];
              response.on("data", function(chunk) {
                chunks.push(chunk);
              });
              response.on("end", function() {
                if (mime_entry.binary) {
                  file.buffer = Buffer.concat(chunks);
                  file.Write_From_Buffer();
                }
                else {
                  file.data = chunks.join("");
                  file.Write_From_Data();
                }
                on_download();
              });
            }
            else {
              response.resume();
              on_error("Got error code " + status);
            }
          }).on("error", function(error) {
            on_error(error.message);
          });
        }
        catch (error) {
          on_error(error.message);
        }
      }
      else {
        on_error("Server config not set.");
      }
    }
    else {
      if (ext.length == 0) {
        on_error("Not downloading folder " + name + ".");
      }
      else {
        on_error("Unknown mime type " + ext + ".");
      }
    }
  }

  /**
   * Creates a folder on the server.
   * @param folder The folder to create.
   * @param on_create Called when the folder is created.
   * @param on_error Called if there is an error. A message is passed in.
   */
  Create_Folder(folder, on_create, on_error) {
    if (this.config) {
      try {
        let server = this.config.Get_Property("server") + ":" + this.config.Get_Property("port");
        let secure = this.config.Get_Property("secure");
        let protocol = null;
        let code = "";
        let prefix = "";
        if (secure == "on") {
          protocol = https;
          code = this.config.Get_Property("code");
          prefix = "https://";
        }
        else {
          protocol = http;
          prefix = "http://";
        }
        let options = {};
        if (secure == "on") {
          options.rejectUnauthorized = false;
        }
        protocol.get(prefix + server + "/create-folder?folder=" + encodeURIComponent(cFile.To_URL_Path(folder)) + "&code=" + code, options, function(response) {
          let status = response.statusCode;
          if (status == 200) {
            response.setEncoding("utf8");
            let chunk_str = "";
            response.on("data", function(chunk) {
              chunk_str += chunk;
            });
            response.on("end", function() {
              console.log(chunk_str);
              on_create();
            });
          }
          else {
            response.resume();
            on_error("Got error code " + status);
          }
        }).on("error", function(error) {
          on_error(error.message);
        });
      }
      catch (error) {
        on_error(error.message);
      }
    }
    else {
      on_error("Server config not set.");
    }
  }

  /**
   * Creates a folder from a file path.
   * @param file The file to create the folder from.
   * @param dirs A hash of created directories.
   */
  Create_Path_From_Name(file, dirs) {
    let dir = file.replace(/\w+\.\w+$/, "");
    if (dirs[dir] == undefined) {
      let folders = cFile.Escape_Path(file).split(path.sep);
      folders.pop(); // Remove file name.
      let new_dir = "";
      while (folders.length > 0) {
        let folder = folders.shift();
        new_dir += String(folder + path.sep);
        cFile.Create_Folder(new_dir);
      }
      dirs[dir] = true; // Mark are created.
    }
  }

  /**
   * Creates a path from a URL.
   * @param file The file URL.
   * @param dirs A hash of created directories.
   * @param on_create Called when the path is created or not.
   */
  Create_Path_From_URL(file, dirs, on_create) {
    let dir = file.replace(/\w+\.\w+$/, "");
    if (dirs[dir] == undefined) {
      this.Create_Folder(dir, function() {
        dirs[dir] = true;
        on_create();
      }, function(error) {
        console.log(error);
        on_create();
      });
    }
    else {
      on_create();
    }
  }

  /**
   * Uploads a file from a list.
   * @param files The list of files to upload.
   * @param index The index of the file to upload.
   * @param dirs The list of created folders.
   * @param on_upload Called when the files have been uploaded.
   */
  Upload_File_From_List(files, index, dirs, on_upload) {
    if (index < files.length) {
      let component = this;
      this.Create_Path_From_URL(files[index], dirs, function() {
        component.Upload_File(files[index], function() {
          console.log("Uploaded file " + files[index] + ".");
          component.Upload_File_From_List(files, index + 1, dirs, on_upload);
        }, function(error) {
          console.log(error);
          component.Upload_File_From_List(files, index + 1, dirs, on_upload);
        });
      });
    }
    else {
      on_upload();
    }
  }

  /**
   * Downloads a file from a list.
   * @param files The list of files to download.
   * @param index The index of the file to download.
   * @param on_download Called when all files have been downloaded.
   */
  Download_File_From_List(files, index, on_download) {
    if (index < files.length) {
      let dirs = {};
      this.Create_Path_From_Name(files[index], dirs);
      let component = this;
      this.Download_File(files[index], function() {
        console.log("Downloaded file " + files[index] + ".");
        component.Download_File_From_List(files, index + 1, on_download);
      }, function(error) {
        console.log(error);
        component.Download_File_From_List(files, index + 1, on_download);
      });
    }
    else {
      on_download();
    }
  }

  /**
   * Queries a list of files from the server.
   * @param folder The folder to look in.
   * @param search The search string.
   * @param on_query Called when the files are queried with the file list passed in.
   * @param on_error Called if there is an error. A message is passed in.
   */
  Query_Files(folder, search, on_query, on_error) {
    if (this.config) {
      try {
        let server = this.config.Get_Property("server") + ":" + this.config.Get_Property("port");
        let secure = this.config.Get_Property("secure");
        let protocol = null;
        let code = "";
        let prefix = "";
        if (secure == "on") {
          protocol = https;
          code = this.config.Get_Property("code");
          prefix = "https://";
        }
        else {
          protocol = http;
          prefix = "http://";
        }
        let options = {};
        if (secure == "on") {
          options.rejectUnauthorized = false;
        }
        protocol.get(prefix + server + "/query-files?folder=" + encodeURIComponent(cFile.To_URL_Path(folder)) + "&search=" + encodeURIComponent(search) + "&code=" + code, options, function(response) {
          let status = response.statusCode;
          if (status == 200) {
            response.setEncoding("utf8");
            let chunk_str = "";
            response.on("data", function(chunk) {
              chunk_str += chunk;
            });
            response.on("end", function() {
              let file_list = Split(chunk_str);
              on_query(file_list);
            });
          }
          else {
            response.resume();
            on_error("Got error code " + status);
          }
        }).on("error", function(error) {
          on_error(error.message);
        });
      }
      catch (error) {
        on_error(error.message);
      }
    }
    else {
      on_error("Server config not set.");
    }
  }

  /**
   * Grabs a list of files and folders from the server.
   * @param folder The folder to look in.
   * @param on_query Called when all files and folders have been queried. File list is passed in.
   */
  Get_File_And_Folder_List(folder, on_query) {
    let file_list = [];
    let component = this;
    this.Query_Files(folder, "folders", function(folders) {
      folders = folders.map(function(value, index, array) {
        return folder + path.sep + value; // Build path.
      });
      file_list = file_list.concat(folders);
      component.Query_From_Folders(folders, 0, function(folder_files) {
        file_list = file_list.concat(folder_files);
        component.Query_Files(folder, "all", function(files) {
          file_list = file_list.concat(files.map(function(value, index, array) {
            return folder + path.sep + value; // Build path.
          }));
          on_query(file_list);
        }, function(error) {
          console.log(error);
          on_query(file_list);
        });
      });
    }, function(error) {
      console.log(error);
      on_query(file_list);
    });
  }

  /**
   * Queries file and folders from a folder list.
   * @param folders The list of folders.
   * @param index The index of the folder to query from.
   * @param on_query Called when the list has been queried. File list is passed in.
   */
  Query_From_Folders(folders, index, on_query) {
    let file_list = [];
    if (index < folders.length) {
      let component = this;
      this.Get_File_And_Folder_List(folders[index], function(files) {
        file_list = file_list.concat(files);
        component.Query_From_Folders(folders, index + 1, function(folder_files) {
          file_list = file_list.concat(folder_files);
          on_query(file_list);
        });
      });
    }
    else {
      on_query(file_list);
    }
  }

  /**
   * Sets a new config file for the project.
   * @param name The name of the config file.
   */
  Set_Config(name) {
    this.config = new cConfig(name);
  }

}

// *****************************************************************************
// Project Command Implementation
// *****************************************************************************

class cProject_Command extends cCommand {

  /**
   * Creates a new project command line.
   * @param argv Passed in command line arguments.
   */
  constructor(argv) {
    super(argv);
  }

  On_Interpret(op, params) {
    let status = "";
    if (op == "download-project") {
      let name = this.Get_Param(params, "Missing project name.");
      let server = this.Get_Param(params, "Missing server name.");
      let project = new cProject(name);
      project.Set_Config(server);
      cFile.Create_Folder(name);
      let component = this;
      project.Get_File_And_Folder_List(name, function(file_list) {
        project.Download_File_From_List(file_list, 0, function() {
          component.Done("Project " + name + " was downloaded.");
        });
      });
    }
    else if (op == "upload-project") {
      let name = this.Get_Param(params, "Missing project name.");
      let server = this.Get_Param(params, "Missing server name.");
      let file_list = cFile.Get_File_And_Folder_List(name);
      let project = new cProject(name);
      project.Set_Config(server);
      let dirs = {};
      let component = this;
      project.Upload_File_From_List(file_list, 0, dirs, function() {
        component.Done("Project " + name + " was uploaded.");
      });
    }
    else if (op == "upload-file") {
      let name = this.Get_Param(params, "Missing name of file.");
      let server = this.Get_Param(params, "Missing server name.");
      let project = new cProject(name);
      project.Set_Config(server);
      let component = this;
      project.Upload_File(name, function() {
        component.Done("Uploaded " + name + ".");
      }, function(error) {
        component.Done(error);
      });
    }
    else if (op == "download-file") {
      let name = this.Get_Param(params, "Missing name of file.");
      let server = this.Get_Param(params, "Missing server name.");
      let project = new cProject(name);
      project.Set_Config(server);
      let component = this;
      project.Download_File(name, function() {
        component.Done("Downloaded " + name + ".");
      }, function(error) {
        component.Done(error);
      });
    }
    else {
      status = "error";
    }
    return status;
  }

}

// *****************************************************************************
// Ping Implementation
// *****************************************************************************

class cPing extends cCommand {

  /**
   * Creates a new Ping interface.
   * @param argv Passed in command line arguments.
   */
  constructor(argv) {
    super(argv);
    this.pairs = [];
    this.Load_Data("Query");
  }
  
  On_Interpret(op, params) {
    let status = "";
    if (op == "ping") {
      let server = this.Get_Param(params, "Server URL not specified.");
      let content_type = this.Get_Param(params, "Content type not specified.");
      let method = this.Get_Param(params, "Method not specified.");
      let component = this;
      this.Ping(server, content_type, method, function() {
        component.Done("Ping complete.");
      });
    }
    else if (op == "add") {
      let name = this.Get_Param(params, "Name missing.");
      let value = this.Get_Param(params, "Value missing.");
      this.pairs.push([ name, value.replace(/\\s/g, " ") ]); // Replace escaped space.
      this.Save_Data("Query");
      this.Done();
    }
    else if (op == "delete") {
      if (this.pairs.length > 0) {
        this.pairs.pop();
        this.Save_Data("Query");
      }
      this.Done();
    }
    else if (op == "clear") {
      this.pairs = [];
      this.Save_Data("Query");
      this.Done();
    }
    else if (op == "print") {
      let pair_count = this.pairs.length;
      for (let pair_index = 0; pair_index < pair_count; pair_index++) {
        let pair = this.pairs[pair_index];
        console.log(pair[0] + "=" + pair[1]);
      }
      this.Done();
    }
    else {
      status = "error";
    }
    return status;
  }
  
  /**
   * Pings a server. Prints the output.
   * @param server The server path to ping.
   * @param content_type The content-type for the output.
   * @param method The request method.
   * @param on_ouput Called when the contents of request are outputted.
   * @throws An error if unsupported protocol is used.
   */
  Ping(server, content_type, method, on_output) {
    let protocol = null;
    if (server.match(/^http/)) {
      protocol = http;
    }
    else if (server.match(/^https/)) {
      protocol = https;
    }
    else {
      throw new Error("Unsupported protocol.");
    }
    let url_path = new url.URL(server);
    if (method == "GET") {
      let component = this;
      protocol.get(server + "?" + this.Encode_Data("text"), function(response) {
        let status = response.statusCode;
        console.log("Status: " + status);
        console.log("Content-Type: " + content_type);
        response.setEncoding("utf8");
        let chunk_str = "";
        response.on("data", function(chunk) {
          chunk_str += (chunk);
        });
        response.on("end", function() {
          console.log("--- data ---");
          if (content_type.match(/json/)) {
            console.dir(JSON.parse(chunk_str));
          }
          else {
            console.log(chunk_str);
          }
          on_output();
          component.Done();
        });
      }).on("error", function(error) {
        console.log(error.message);
        on_output();
        component.Done();
      });
    }
    else if (method == "POST") {
      let post_data = "";
      if (content_type.match(/json/)) {
        post_data = this.Encode_Data("json");
      }
      else {
        post_data = this.Encode_Data("text");
      }
      let options = {
        hostname: url_path.hostname,
        port: url_path.port,
        path: url_path.pathname,
        method: method,
        headers: {
          "Content-Type": content_type,
          "Content-Length": Buffer.byteLength(post_data)
        }
      };
      if (secure == "on") {
        options.rejectUnauthorized = false;
      }
      let component = this;
      let request = protocol.request(options, function(response) {
        let status = response.statusCode;
        console.log("Status: " + status);
        console.log("Content-Type: " + response.headers["content-type"]);
        response.setEncoding("utf8");
        let chunk_str = "";
        response.on("data", function(chunk) {
          chunk_str += chunk;
        });
        response.on("end", function() {
          console.log("--- data ---");
          if (response.headers["content-type"].match(/json/)) {
            console.dir(JSON.parse(chunk_str));
          }
          else {
            console.log(chunk_str);
          }
          on_output();
          component.Done();
        });
      });
      request.on("error", function(error) {
        console.log(error.message);
        on_output();
        component.Done();
      });
      request.write(post_data);
      request.end();
    }
  }
  
  /**
   * Encodes data into a query string or post data.
   * @param type The type of data to encode.
   * @return The encoded data.
   */
  Encode_Data(type) {
    let pair_count = this.pairs.length;
    let encoded_pairs = [];
    for (let pair_index = 0; pair_index < pair_count; pair_index++) {
      let pair = this.pairs[pair_index];
      let name = (type == "json") ? '"' + pair[0] + '"' : pair[0];
      let value = (type == "json") ? '"' + pair[1] + '"' : encodeURIComponent(pair[1]);
      if (type == "json") {
        encoded_pairs.push(name + ": " + value);
      }
      else {
        encoded_pairs.push(name + "=" + value);
      }
    }
    let encoded_data = (type == "json") ? JSON.stringify(JSON.parse("{ " + encoded_pairs.join(", ") + " }")) : encoded_pairs.join("&");
    return encoded_data;
  }

  /**
   * Loads the data from a file.
   * @param name The name of the file to load from.
   */
  Load_Data(name) {
    let file = new cFile("Ping/" + name + ".txt");
    file.Read();
    while (file.Has_More_Lines()) {
      let line = file.Get_Line();
      let pair = line.split(/=/);
      if (pair.length == 2) {
        this.pairs.push(pair);
      }
    }
  }

  /**
   * Saves the data to a file.
   * @param name The name of the file to save to.
   */
  Save_Data(name) {
    let file = new cFile("Ping/" + name + ".txt");
    let pair_count = this.pairs.length;
    for (let pair_index = 0; pair_index < pair_count; pair_index++) {
      let pair = this.pairs[pair_index];
      file.Add(pair.join("="));
    }
    file.Write();
  }

}

// *****************************************************************************
// Admin Tool Implementation
// *****************************************************************************

class cAdmin_Tool extends cCommand {

  /**
   * Creates a new admin tool command.
   * @param argv Passed in command line arguments.
   */
  constructor(argv) {
    super(argv);
    this.keys = [];
    this.permissions = [];
    this.ip_addresses = [];
    this.requests = [];
    this.Load_Keys("Keys");
    this.Load_Permissions("Permissions");
    this.Load_IP_Addresses("Blacklisted");
    this.Load_Requests("Bad_Requests");
  }

  On_Interpret(op, params) {
    let status = "";
    if (op == "new-key") {
      let name = this.Get_Param(params, "Missing your name.");
      let access_level = this.Get_Param(params, "Missing access level.");
      let key = this.Generate_Key(name);
      let key_descr = {
        "code": key,
        "access_level": access_level
      };
      this.keys.push(key_descr);
      this.Save_Keys("Keys");
      this.Done("Added new key " + key + ".");
    }
    else if (op == "list-keys") {
      let key_count = this.keys.length;
      for (let key_index = 0; key_index < key_count; key_index++) {
        let key_descr = this.keys[key_index];
        console.log("Key #" + key_index);
        Print_Object(key_descr);
        console.log("");
      }
      this.Done();
    }
    else if (op == "delete-key") {
      let key_index = this.Get_Param(params, "Missing key index");
      if (this.keys[key_index] != undefined) {
        this.keys.splice(key_index, 1);
        this.Save_Keys("Keys");
        console.log("Deleted key #" + key_index + ".");
      }
      this.Done();
    }
    else if (op == "edit-key") {
      let key_index = this.Get_Param(params, "Missing key index.");
      if (this.keys[key_index] != undefined) {
        let access_level = this.Get_Param(params, "Missing access level.");
        this.keys[key_index]["access_level"] = access_level;
        this.Save_Keys("Keys");
        console.log("Updated key #" + key_index + ".");
      }
      this.Done();
    }
    else if (op == "new-permission") {
      let pattern = this.Get_Param(params, "Missing pattern.");
      let read_access = this.Get_Param(params, "Missing read access.");
      let write_access = this.Get_Param(params, "Missing write access.");
      let perm_obj = {
        "pattern": pattern,
        "read": read_access,
        "write": write_access
      };
      this.permissions.push(perm_obj);
      this.Save_Permissions("Permissions");
      this.Done("Added new permission " + pattern + ".");
    }
    else if (op == "list-permissions") {
      let perm_count = this.permissions.length;
      for (let perm_index = 0; perm_index < perm_count; perm_index++) {
        let perm_obj = this.permissions[perm_index];
        console.log("Permission #" + perm_index);
        Print_Object(perm_obj);
        console.log("");
      }
      this.Done();
    }
    else if (op == "query-permissions") {
      let perm_pattern = this.Get_Param(params, "Missing pattern.");
      let perm_count = this.permissions.length;
      for (let perm_index = 0; perm_index < perm_count; perm_index++) {
        let perm_obj = this.permissions[perm_index];
        if (perm_obj["pattern"].indexOf(perm_pattern) != -1) {
          console.log("Permission #" + perm_index);
          Print_Object(perm_obj);
          console.log("");
        }
      }
      this.Done();
    }
    else if (op == "delete-permission") {
      let perm_index = this.Get_Param(params, "Missing permission index.");
      if (this.permissions[perm_index] != undefined) {
        this.permissions.splice(perm_index, 1);
        this.Save_Permissions("Permissions");
        console.log("Deleted permission #" + perm_index + ".");
      }
      this.Done();
    }
    else if (op == "edit-permission") {
      let perm_index = this.Get_Param(params, "Missing permission index.");
      if (this.permissions[perm_index] != undefined) {
        let read_access = this.Get_Param(params, "Missing read access.");
        let write_access = this.Get_Param(params, "Missing write access.");
        this.permissions[perm_index]["read"] = read_access;
        this.permissions[perm_index]["write"] = write_access;
        this.Save_Permissions("Permissions");
        console.log("Updated permission #" + perm_index + ".");
      }
      this.Done();
    }
    else if (op == "new-ip-address") {
      let ip_address = this.Get_Param(params, "Missing IP address.");
      this.ip_addresses.push(ip_address);
      this.Save_IP_Addresses("Blacklisted");
      this.Done("Added IP address " + ip_address + ".");
    }
    else if (op == "list-ip-addresses") {
      let ip_count = this.ip_addresses.length;
      for (let ip_index = 0; ip_index < ip_count; ip_index++) {
        let ip_address = this.ip_addresses[ip_index];
        console.log("IP Address #" + ip_index);
        console.log(ip_address);
        console.log("");
      }
      this.Done();
    }
    else if (op == "delete-ip-address") {
      let ip_index = this.Get_Param(params, "Missing IP address index.");
      if (this.ip_addresses[ip_index] != undefined) {
        this.ip_addresses.splice(ip_index, 1);
        this.Save_IP_Addresses("Blacklisted");
        console.log("Deleted IP address #" + ip_index + ".");
      }
      this.Done();
    }
    else if (op == "new-request") {
      let request = this.Get_Param(params, "Missing request.");
      this.requests.push(request);
      this.Save_Requests("Bad_Requests");
      this.Done("Added request " + request + ".");
    }
    else if (op == "delete-request") {
      let request_index = this.Get_Param(params, "Missing request index.");
      if (this.requests[request_index] != undefined) {
        this.requests.splice(request_index, 1);
        this.Save_Requests("Bad_Requests");
        console.log("Deleted request #" + request_index + ".");
      }
      this.Done();
    }
    else if (op == "list-requests") {
      let request_count = this.requests.length;
      for (let request_index = 0; request_index < request_count; request_index++) {
        let request = this.requests[request_index];
        console.log("Request #" + request_index);
        console.log(request);
        console.log("");
      }
      this.Done();
    }
    else {
      status = "error";
    }
    return status;
  }

  /**
   * Generates a key given your name.
   * @param name Your name.
   * @return The generated key.
   */
  Generate_Key(name) {
    let sum = 0;
    let letter_count = name.length;
    for (let letter_index = 0; letter_index < letter_count; letter_index++) {
      let letter_code = name.charCodeAt(letter_index);
      sum += letter_code;
    }
    return Number_To_Binary(sum);
  }

  /**
   * Loads the keys from a file.
   * @param name The name of the file.
   * @throws An error if the key is missing certain fields.
   */
  Load_Keys(name) {
    let key_file = new cFile("Config/" + name + ".txt", true);
    key_file.Read();
    if (key_file.error.length == 0) {
      while (key_file.Has_More_Lines()) {
        let key_descr = {};
        key_file.Get_Object(key_descr);
        Check_Condition((key_descr["code"] != undefined), "Key code not present.");
        Check_Condition((key_descr["access_level"] != undefined), "Access level not present.");
        this.keys.push(key_descr);
      }
    }
  }

  /**
   * Saves the keys to a file.
   * @param name The name of the file.
   */
  Save_Keys(name) {
    let key_file = new cFile("Config/" + name + ".txt", true);
    let key_count = this.keys.length;
    for (let key_index = 0; key_index < key_count; key_index++) {
      let key_descr = this.keys[key_index];
      key_file.Add_Object(key_descr);
    }
    key_file.Write();
  }

  /**
   * Loads up the permission patterns.
   * @param name The name of the file to load from.
   * @throws An error if permission is missing something.
   */
  Load_Permissions(name) {
    let perm_file = new cFile("Config/" + name + ".txt", true);
    perm_file.Read();
    if (perm_file.error.length == 0) {
      while (perm_file.Has_More_Lines()) {
        let perm_obj = {};
        perm_file.Get_Object(perm_obj);
        Check_Condition((perm_obj["pattern"] != undefined), "Missing pattern!");
        Check_Condition((perm_obj["read"] != undefined), "Missing read access.");
        Check_Condition((perm_obj["write"] != undefined), "Missing write access.");
        this.permissions.push(perm_obj);
      }
    }
  }

  /**
   * Saves the permissions to a file.
   * @param name The name of the file.
   */
  Save_Permissions(name) {
    let perm_file = new cFile("Config/" + name + ".txt", true);
    let perm_count = this.permissions.length;
    for (let perm_index = 0; perm_index < perm_count; perm_index++) {
      let perm_obj = this.permissions[perm_index];
      perm_file.Add_Object(perm_obj);
    }
    perm_file.Write();
  }
  
  /**
   * Loads a list of banned IP addresses.
   * @param name The name of the file to load.
   */
  Load_IP_Addresses(name) {
    let ip_file = new cFile("Config/" + name + ".txt", true);
    ip_file.Read();
    if (ip_file.error.length == 0) {
      while (ip_file.Has_More_Lines()) {
        let ip_address = ip_file.Get_Line();
        this.ip_addresses.push(ip_address);
      }
    }
  }
  
  /**
   * Saves the list of IP addresses to a file.
   * @param name The name of the file.
   */
  Save_IP_Addresses(name) {
    let ip_file = new cFile("Config/" + name + ".txt", true);
    let ip_count = this.ip_addresses.length;
    for (let ip_index = 0; ip_index < ip_count; ip_index++) {
      let ip_address = this.ip_addresses[ip_index];
      ip_file.Add(ip_address);
    }
    ip_file.Write();
  }

  /**
   * Loads request patterns from a file.
   * @param name The name of the file.
   */
  Load_Requests(name) {
    let requests_file = new cFile("Config/" + name + ".txt", true);
    requests_file.Read();
    if (requests_file.error.length == 0) {
      while (requests_file.Has_More_Lines()) {
        let request = requests_file.Get_Line();
        this.requests.push(request);
      }
    }
  }

  /**
   * Saves the requests to a file.
   * @param name The name of the file to save to.
   */
  Save_Requests(name) {
    let requests_file = new cFile("Config/" + name + ".txt", true);
    let request_count = this.requests.length;
    for (let request_index = 0; request_index < request_count; request_index++) {
      let request = this.requests[request_index];
      requests_file.Add(request);
    }
    requests_file.Write();
  }

}

// *****************************************************************************
// Compiler Implementation
// *****************************************************************************

class cCompiler {

  /**
   * Creates a new compiler associated with a project.
   * @param project The name of the project.
   */
  constructor(project) {
    this.project = project;
  }

  /**
   * Processes a makefile.
   * @param name The name of the makefile.
   * @param on_compile Called when compilation is finished.
   * @throws An error if something is not configured correctly.
   */
  Process_Makefile(name, on_compile) {
    let makefile = new cFile("Makefiles/" + name + ".txt", true);
    makefile.Read();
    if (makefile.error.length == 0) {
      let compiler_info = {};
      makefile.Get_Object(compiler_info);
      Check_Condition((compiler_info["compiler"] != undefined), "Missing compiler command.");
      Check_Condition((compiler_info["output"] != undefined), "Output option is missing.");
      Check_Condition((compiler_info["library"] != undefined), "Library option is missing.");
      Check_Condition((compiler_info["include"] != undefined), "Include option is missing.");
      // Read include paths.
      let include_paths = [];
      while (makefile.Has_More_Lines()) {
        let include_path = makefile.Get_Line();
        if (include_path == "end") {
          break;
        }
        else {
          include_paths.push(cFile.Get_Local_Path(include_path));
        }
      }
      // Read library paths.
      let library_paths = [];
      while (makefile.Has_More_Lines()) {
        let library_path = makefile.Get_Line();
        if (library_path == "end") {
          break;
        }
        else {
          library_paths.push(library_path);
        }
      }
      // Read libraries.
      let libraries = [];
      while (makefile.Has_More_Lines()) {
        let library = makefile.Get_Line();
        if (library == "end") {
          break;
        }
        else {
          libraries.push(library);
        }
      }
      // Read resource make commands.
      let res_makers = [];
      while (makefile.Has_More_Lines()) {
        let res_maker = makefile.Get_Line();
        if (res_maker == "end") {
          break;
        }
        else {
          res_makers.push(res_maker);
        }
      }
      // Read resources.
      let resources = [];
      while (makefile.Has_More_Lines()) {
        let resource = makefile.Get_Line();
        if (resource == "end") {
          break;
        }
        else {
          resources.push(resource);
        }
      }
      // Do compilation.
      if (cFile.Does_File_Exist(this.project + ".cpp")) {
        let shell = new cShell();
        let compile_cmd = [
          compiler_info["compiler"],
          compiler_info["output"],
          this.project,
          this.project + ".cpp",
          library_paths.map(function(value, index, array) { return compiler_info["library"] + value }).join(" "),
          include_paths.map(function(value, index, array) { return compiler_info["include"] + value }).join(" "),
          resources.join(" "),
          libraries.join(" ")
        ];
        let batch = res_makers.concat([ compile_cmd.join(" ") ]);
        shell.Execute_Batch(batch, 0, function() {
          console.log("Compilation complete!");
          on_compile();
        });
      }
    }
  }

  /**
   * Generates a resource file list.
   */
  Generate_Resources() {
    let file_list = cFile.Get_File_And_Folder_List("");
    // Filter out files to extract images, sounds, and music tracks.
    let file_count = file_list.length;
    let files = [];
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = cFile.Get_File_Name(file_list[file_index]);
      let ext = cFile.Get_Extension(file_list[file_index]);
      if (ext.match(/png|bmp|mp3|pic|wav/)) {
        files.push(file);
      }
    }
    let file = new cFile("Resources.txt");
    file.Add_Lines(files);
    file.Write();
  }
  
  /**
   * Creates an Electron JS app.
   * @throws An error if Electron is not installed.
   */
  Create_Electron_App() {
    Check_Condition(cFile.Does_File_Exist("Programming/Electron"), "Missing Electron.");
    cFile.Copy_File("Programming/Electron/Electron.js", this.project + "/Electron.js");
    cFile.Copy_File("Programming/Electron/package.json", this.project + "/package.json");
    console.log("Copied Electron into " + this.project + ".");
  }

}

// *****************************************************************************
// Compile Command Implementation
// *****************************************************************************

class cCompile_Command extends cCommand {

  /**
   * Creates a new compile command line.
   * @param argv Passed in command line arguments.
   */
  constructor(argv) {
    super(argv);
  }

  On_Interpret(op, params) {
    let status = "";
    let name = this.Get_Param(params, "Missing project name.");
    let compiler = new cCompiler(name);
    if (op == "generate-resources") {
      compiler.Generate_Resources();
      this.Done();
    }
    else if (op == "build-with-cpp") {
      let makefile = this.Get_Param(params, "Missing compiler name.");
      let component = this;
      compiler.Process_Makefile(makefile, function() {
        component.Done("Compilation complete!");
      });
    }
    else if (op == "build-electron") {
      compiler.Create_Electron_App();
      this.Done();
    }
    else {
      status = "error";
    }
    return status;
  }

}

// *****************************************************************************
// Server Implementation
// *****************************************************************************

class cServer {

  /**
   * Creates a new server.
   * @param name The name of the server.
   */
  constructor(name) {
    let component = this;
    this.mime = new cMime_Reader("Mime");
    this.config = new cConfig(name);
    this.log = new cLog(name);
    this.services = new cE_Services(this);
    this.rewrite_rules = {};
    this.Load_Rewrite_Rules("Rewrite_Rules");
    let secure = this.config.Get_Property("secure");
    if (secure == "on") {
      let certificate = this.config.Get_Property("certificate");
      this.auth = new cAuth();
      this.auth.Load_Keys("Keys");
      this.auth.Load_Permissions("Permissions");
      this.auth.Load_IP_Addresses("Blacklisted");
      this.auth.Load_Requests("Bad_Requests");
      let key_file = new cFile("Certificates/" + certificate + ".key", true);
      let cert_file = new cFile("Certificates/" + certificate + ".crt", true);
      key_file.Read();
      cert_file.Read();
      this.server = https.createServer({
        key: key_file.data,
        cert: cert_file.data
      }, function(request, response) {
        try {
          component.Handle_Request(request, response);
        }
        catch (error) {
          component.log.Log(request.socket.remoteAddress + " -> " + error.message);
          if (error.message.match(/blocked/)) {
            request.socket.destroy(); // Kill the socket, avoid flooding.
          }
          else {
            component.End_Response(401, error.message, response);
          }
        }
      });
      this.server.on("drop", function(data) {
        component.log.Log(data.remoteAddress + " dropped.");
      });
      // Don't let connection count get too high.
      this.server.maxConnections = this.config.Get_Property("max-connections");
    }
    else {
      this.auth = null;
      this.server = http.createServer(function(request, response) {
        try {
          component.Handle_Request(request, response);
        }
        catch (error) {
          component.log.Log(request.socket.remoteAddress + " -> " + error.message);
          component.End_Response(401, error.message, response);
        }
      });
    }
    this.server.on("dropRequest", function(request, socket) {
      component.log.Log("Request dropped.");
    });
    this.server.on("clientError", function(error, socket) {
      socket.destroy();
    });
  }

  /**
   * Reads a file from the server.
   * @param file The file to be processed.
   * @param response The response to be populated.
   * @param params Extra parameters passed to the file.
   * @throws An error if the file type is not found in the MIME table.
   */
  Read_File(file, response, params) {
    const TEN_MB = 10485760;
    let status = 0;
    let mime_type = "text/plain";
    let binary = false;
    let ext = cFile.Get_Extension(file);
    let mime = this.mime.Get_Mime_Type(ext);
    let input_file = new cFile(file);
    let file_size = cFile.Get_File_Size(file);
    if ((file_size > TEN_MB) && mime.binary) { // Really Large Files
      status = 200;
      mime_type = mime.type;
      response.writeHead(status, {
        "Content-Type": mime_type
      });
      input_file.Read_Stream(response);
    }
    else { // Smaller Files
      if (mime.binary) {
        input_file.Read_Binary();
      }
      else {
        input_file.Read();
      }
      if (input_file.error.length == 0) {
        status = 200;
        mime_type = mime.type;
        binary = mime.binary;
        response.writeHead(status, {
          "Content-Type": mime_type
        });
        if (binary) {
          response.end(input_file.buffer, "binary");
        }
        else {
          let text = input_file.data;
          response.end(text);
        }
      }
      else {
        this.log.Log(response.socket.remoteAddress + " -> " + input_file.error);
        status = 404;
        this.End_Response(status, input_file.error, response);
      }
    }
  }

  /**
   * Writes a file to the server.
   * @param file The file to write to the server.
   * @param response The server response object.
   * @param params The parameters passed to the file.
   */
  Write_File(file, response, params) {
    let status = 0;
    let message = "";
    try {
      let ext = cFile.Get_Extension(file);
      Check_Condition((params.data != undefined), "No data parameter passed.");
      let data = params.data;
      let output_file = new cFile(file);
      let mime = this.mime.Get_Mime_Type(ext);
      if (!mime.binary) { // Text file.
        // Save the file.
        output_file.data = data;
        output_file.Write_From_Data();
      }
      else { // Binary file.
        // Save the binary code.
        output_file.data = data;
        output_file.Write_Binary();
      }
      if (output_file.error.length == 0) {
        message = "Wrote " + file + ".";
        status = 200;
      }
      else {
        message = "Write Error: " + output_file.error;
        status = 404;
      }
    }
    catch (error) {
      message = "Write Error: " + error.message;
      status = 404;
    }
    this.End_Response(status, message, response);
  }

  /**
   * Loads rewrite rules from a file.
   * @param name The name of the file.
   * @throws An error if the rewrite rules are not formatted correctly.
   */
  Load_Rewrite_Rules(name) {
    let rewrite_file = new cFile("Config/" + name + ".txt", true);
    rewrite_file.Read();
    if (rewrite_file.error.length == 0) {
      while (rewrite_file.Has_More_Lines()) {
        let rule = rewrite_file.Get_Line();
        let pair = rule.split("->");
        Check_Condition((pair.length == 2), "Invalid rewrite rule.");
        let pattern = pair[0];
        let rewrite = pair[1];
        this.rewrite_rules[pattern] = rewrite;
      }
    }
  }

  /**
   * Gets the rewrite of a URL.
   * @param file The file URL.
   * @return The URL rewrite or the file if not found.
   */
  Get_URL_Rewrite(file) {
    let url = file;
    for (let pattern in this.rewrite_rules) {
      let rewrite = this.rewrite_rules[pattern];
      if (file == pattern) {
        url = rewrite;
      }
    }
    return url;
  }

  /**
   * Handles a request from the server.
   * @param request The request object that is passed in.
   * @param response The response object that is passed in.
   * @throws An error if something is wrong.
   */
  Handle_Request(request, response) {
    if (this.config.Has_Property("paused")) {
      let paused = this.config.Get_Property("paused");
      if (paused == "on") {
        throw new Error("Server is paused.");
      }
    }
    if (request.method == "GET") {
      let pair = request.url.split("?");
      let file = pair[0].substr(1);
      let params = querystring.parse((pair[1] == undefined) ? "" : pair[1]);
      // Process rewrites.
      file = this.Get_URL_Rewrite(file);
      if (this.auth) {
        this.auth.Validate_Remote_Connection(request.socket.remoteAddress);
        this.auth.Check_For_Bad_Request_Pattern(file);
        this.auth.Validate_Request(file, "GET", params.code || "");
      }
      if (file.match(/\w+\.\w+$/)) {
        this.Read_File(file, response, params);
      }
      else if (file.match(/^[a-z\-]+$/)) {
        this.services.Call(file, params, response);
      }
      else {
        this.End_Response(404, file + " is not a valid file or service.", response);
      }
    }
    else if (request.method == "POST") {
      let component = this;
      let data = "";
      request.on("data", function(chunk) {
        data += chunk;
      });
      request.on("end", function() {
        try {
          let params = querystring.parse(data);
          let file = request.url.substr(1);
          // Process URL rewrites.
          file = component.Get_URL_Rewrite(file);
          if (component.auth) {
            component.auth.Validate_Remote_Connection(request.socket.remoteAddress);
            component.auth.Check_For_Bad_Request_Pattern(file);
            component.auth.Validate_Request(file, "POST", params.code || "");
          }
          if (file.match(/\w+\.\w+$/)) {
            component.Write_File(file, response, params);
          }
          else {
            component.End_Response(401, "Cannot write to odd files.", response);
          }
        }
        catch (error) {
          component.log.Log(request.socket.remoteAddress + " (POST) -> " + error.message);
          component.End_Response(401, error.message, response);
        }
      });
    }
  }

  /**
   * Ends a server response.
   * @param status The status associated with response.
   * @param message The message.
   * @param response The server response.
   */
  End_Response(status, message, response) {
    // Write server output.
    response.writeHead(status, {
      "Content-Type": "text/plain"
    });
    response.end(message);
  }

  /**
   * Starts the server.
   */
  Start() {
    try {
      this.server.listen(this.config.Get_Property("port"));
    }
    catch (error) {
      this.log.Log(error.message);
    }
  }

  /**
   * Stops the server.
   * @param on_stop Called when the server is stopped.
   */
  Stop(on_stop) {
    this.server.close(function() {
      on_stop();
    });
  }

}

// *****************************************************************************
// Frankus Online Services
// *****************************************************************************

class cE_Services {

  /**
   * Creates a new e-services object.
   * @param server The server object.
   */
  constructor(server) {
    this.server = server;
    // The map of the services. Update to add new
    // services.
    this.e_services_map = {
      "create-folder": this.Create_Folder,
      "query-files": this.Query_Files,
      "coder-doc": this.Coder_Doc,
      "terminal": this.Terminal
    };
  }

  /**
   * Runs the Coder Doc documentation generator.
   * @param params The parameters for Coder Doc.
   * @param response The server response.
   */
  Coder_Doc(params, response) {
    try {
      Check_Condition((params.project != undefined), "Project not specified.");
      let name = params.project;
      let doc = new cCoder_Doc(name);
      doc.Process_Code();
      this.server.End_Response(200, "Generated documentation for " + name + ".", response);
    }
    catch (error) {
      this.server.End_Response(404, error.message, response);
    }
  }

  /**
   * Runs a terminal command.
   * @param params The parameters for the terminal.
   * @param response The server response.
   */
  Terminal(params, response) {
    try {
      Check_Condition((params.command != undefined), "Command not specified.");
      let command = params.command;
      let shell = new cShell();
      let component = this;
      shell.Execute_Command(command, function() {
        component.server.End_Response(200, shell.command_log.join("\n"), response);
      });
    }
    catch (error) {
      this.server.End_Response(404, error.message, response);
    }
  }

  /**
   * Creates a new folder if one does not exist.
   * @param params The parameter object with the passed in folder.
   * @param response The response object.
   */
  Create_Folder(params, response) {
    let folder = params.folder || "";
    cFile.Create_Folder(folder);
    let message = "Created folder: " + folder;
    this.server.End_Response(200, message, response);
  }

  /**
   * Queries a group of files in a directory or a group of folders.
   * @param params The parameter object containing the folder and search.
   * @param response The server response.
   */
  Query_Files(params, response) {
    let folder = params.folder || "";
    let search = params.search || "";
    let file_list = cFile.Query_Files(folder, search);
    let output = file_list.join("\n");
    this.server.End_Response(200, output, response);
  }

  /**
   * Calls a service by name.
   * @param name The name of the service to call.
   * @param params The parsed server parameters.
   * @param response The server response.
   * @throws An error if the service does not exist.
   */
  Call(name, params, response) {
    Check_Condition((this.e_services_map[name] != undefined), "E-service " + name + " is not defined.");
    let service = this.e_services_map[name].bind(this);
    service(params, response);
  }

}

// *****************************************************************************
// Authorizer Implementation
// *****************************************************************************

class cAuth {

  BOT_BLOCKER_TEXT = `
    .,*////////////*,,,,,,,,,,,**//////*,,,*/(##(,                              
 ,/(/,,,,,,,,,,,,,*/###((/////////////////////**,,,.                            
 .,**/////////////////////////////*,,,,,,,,,,,*(###/.                     *(/,  
 .,,.                                            .,.  *################/, *%(,  
 ,/#####(/,,,,,,,,,,,,,,,,*/////////////////*,,,,,,.  /%&&&&&&&&&&&&&&&(, *(/,  
 .*//////////////////**,,,,,,,,,,,,,,,**///////////,. *################/, *(/,  
 .,,.                                            .,.  ,((((((((((((((((*. *(/,  
 *#%%%%%%%%%%%(/**,,,,,**/////////#%%%%(*,,*/(##(/*.                      ,/*.  
 *#%%%(***/(%%%%#(///(%%%%%%%(*,,*(%%%%#///////////,.                           
 *#%%%%#(/,/#%%%#(/#%%%%(*/#%%%%##%%%%%%%#/,,,,,,.                              
 *#%%%/.   *#%%%/../%%%#* ,(%%%(../%%%#*                                        
 *#%%%%%%%%%%#*   ./%%%#* ,(%%%(../%%%#*                                        
 *#%%%/.   *#%%%/../%%%#* ,(%%%(../%%%#*                                        
 *#%%%/.   *#%%%/../%%%#* ,(%%%(../%%%#*                                        
 *#%%%/.   *#%%%/../%%%#* ,(%%%(../%%%#*                                        
 *#%%%%%%%%%%%%%/.   ,#%%%%%#*   ./%%%%%%(,                                     
                                                                                
 *#%%%%%%%%/.   ,##*                             /%(,                           
 *##*   ./%/.   ,##*                             /%(,                           
 *##*   ./%/.   ,##*   ./%%%%%%(.   ,(%%%%%#*    /%(, /%%%%* ,(%%%%%%*    *%%%%%
 *#%%%%%#*      ,##*   ./%(../%(.   ,(#* ,(#*    /%(, /%(,   ,(%* ,(%*    *%(,  
 *##*   ./%/.   ,##*   ./%(../%(.   ,(#*         /%%%%%%(,   ,(%%%%%%*    *%(,  
 *##*   ./%/.   ,##*   ./%(../%(.   ,(#* ,(#*    /%(, /%(,   ,(%*         *%(,  
 *##*   ./%/.   ,##*   ./%(../%(.   ,(#* ,(#*    /%(, /%(,   ,(%* ,(%*    *%(,  
 *#%%%%%%%%/.   ,##*   ./%%%%%%(.   ,(%%%%%#*    /%(, /%%%%* ,(%%%%%%*    *%(,  

 You've been blocked with Bot Blocker!
  `;

  /**
   * Creates a new site authorizer.
   * @param server The name of the server.
   */
  constructor() {
    this.keys = [];
    this.permissions = [];
    // this.ip_addresses = new cBucket(256);
    this.ip_addresses = new cBinary_Tree();
    this.requests = [];
  }
  
  /**
   * Loads the keys from a file.
   * @param name The name of the file.
   * @throws An error if the key is missing certain fields.
   */
  Load_Keys(name) {
    let key_file = new cFile("Config/" + name + ".txt", true);
    key_file.Read();
    if (key_file.error.length == 0) {
      while (key_file.Has_More_Lines()) {
        let key_descr = {};
        key_file.Get_Object(key_descr);
        Check_Condition((key_descr["code"] != undefined), "Key code not present.");
        Check_Condition((key_descr["access_level"] != undefined), "Access level not present.");
        this.keys.push(key_descr);
      }
    }
  }
  
  /**
   * Loads up the permission patterns.
   * @param name The name of the file to load from.
   * @throws An error if permission is missing something.
   */
  Load_Permissions(name) {
    let perm_file = new cFile("Config/" + name + ".txt", true);
    perm_file.Read();
    if (perm_file.error.length == 0) {
      while (perm_file.Has_More_Lines()) {
        let perm_obj = {};
        perm_file.Get_Object(perm_obj);
        Check_Condition((perm_obj["pattern"] != undefined), "Missing pattern!");
        Check_Condition((perm_obj["read"] != undefined), "Missing read access.");
        Check_Condition((perm_obj["write"] != undefined), "Missing write access.");
        this.permissions.push(perm_obj);
      }
    }
  }
  
  /**
   * Loads a list of banned IP addresses.
   * @param name The name of the file to load.
   */
  Load_IP_Addresses(name) {
    let file = new cFile("Config/" + name + ".txt", true);
    file.Read();
    file.Mod_Data(function(line) {
      return line.replace(/\./g, ""); // Replace IP address points.
    });
    // file.Sort_Lines(true, true); // Must sort for bucket search to work.
    while (file.Has_More_Lines()) {
      let item = parseInt(file.Get_Line());
      this.ip_addresses.Add(item);
    }
  }

  /**
   * Loads request patterns from a file.
   * @param name The name of the file.
   */
  Load_Requests(name) {
    let requests_file = new cFile("Config/" + name + ".txt", true);
    requests_file.Read();
    if (requests_file.error.length == 0) {
      while (requests_file.Has_More_Lines()) {
        let request = requests_file.Get_Line();
        this.requests.push(request);
      }
    }
  }
  
  /**
   * Validates a request.
   * @param url The url from the request.
   * @param method The request method.
   * @param code The access code.
   * @throws An error if the request is invalid.
   */
  Validate_Request(url, method, code) {
    // First get user access.
    let access = 0; // Default access, anyone can access without code.
    let key_count = this.keys.length;
    for (let key_index = 0; key_index < key_count; key_index++) {
      let key_descr = this.keys[key_index];
      if (key_descr["code"] == code) {
        access = key_descr["access_level"];
        break;
      }
    }
    // Now check against permissions.
    let perm_count = this.permissions.length;
    for (let perm_index = 0; perm_index < perm_count; perm_index++) {
      let perm_obj = this.permissions[perm_index];
      let regex = new RegExp(perm_obj["pattern"], "");
      if (url.match(regex)) { // Found the pattern in URL.
        if (method == "GET") {
          Check_Condition((access >= perm_obj["read"]), "No read access for " + url + ".");
        }
        else if (method == "POST") {
          Check_Condition((access >= perm_obj["write"]), "No write access for " + url + ". (POST)");
        }
      }
    }
  }
  
  /**
   * Checks to see if a remote connection is banned.
   * @param ip_address The IP address of the connection.
   * @throws An error if the IP address if blacklisted.
   */
  Validate_Remote_Connection(ip_address) {
    ip_address = parseInt(ip_address.replace(/^:{2}\w+:/, "").replace(/\./g, "")); // Remove ::ffff: and dots.
    let found = this.ip_addresses.Find_Data(ip_address);
    Check_Condition(!found, this.BOT_BLOCKER_TEXT);
  }

  /**
   * Checks for a bad request pattern.
   * @param url The request URL.
   * @throws An error if the request is bad.
   */
  Check_For_Bad_Request_Pattern(url) {
    let request_count = this.requests.length;
    for (let request_index = 0; request_index < request_count; request_index++) {
      let request = this.requests[request_index];
      Check_Condition((url.indexOf(request) == -1), this.BOT_BLOCKER_TEXT);
    }
  }

}

// *****************************************************************************
// Daemon Implementation
// *****************************************************************************

class cDaemon {

  /**
   * Creates a daemon.
   * @param name The name of the server.
   */
  constructor(name) {
    this.config = new cConfig(name);
    this.shell = new cShell();
    this.needs_restart = false;
  }

  /**
   * Starts the daemon.
   */
  Start() {
    let command = this.config.Get_Property("command");
    let component = this;
    this.shell.Execute_Command(command, function() {
      component.On_Close();
    });
  }

  /**
   * Called when the shell was closed.
   */
  On_Close() {
    if (this.needs_restart) {
      this.Start(); // Restart the command.
      this.needs_restart = false; // Reset flag.
    }
  }

  /**
   * Checks for any changes in selected files.
   */
  Check_For_Changes() {
    let component = this;
    // Check for changes.
    let files = this.config.Get_Property("files").split(",");
    let file_count = files.length;
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = cFile.Get_Local_Path(files[file_index], true);
      fs.watchFile(file, {
        interval: component.config.Get_Property("timeout")
      }, function(current, prev) {
        let delta = current.mtime.getTime() - prev.mtime.getTime();
        if (delta > 0) {
          component.needs_restart = true;
          component.shell.Close(); // Close the command, wait for restart.
        }
      });
    }
  }

}

// *****************************************************************************
// Frankus Shell
// *****************************************************************************

class cFrankus_Shell {

  static done = false;

  /**
   * Creates a new Frankus shell.
   */
  constructor() {
    Frankus_Logo();
  }

  /**
   * Runs the Frankus shell.
   */
  Run() {
    this.shell = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "Frankus: "
    });
    let component = this;
    this.shell.on("line", function(line) {
      let args = line.split(/\s+/);
      if (args.length > 0) {
        try {
          // Do not allow certain commands.
          Check_Condition(!args[0].match(/^server|daemon$/), "Blocking commands not allowed in interactive shell.");
          cFrankus_Shell.Interpret(args, function() {
            if (cFrankus_Shell.done) {
              console.log("Done.");
              component.shell.close();
            }
            else {
              component.shell.prompt();
            }
          });
        }
        catch (error) {
          console.log(error.message);
          component.shell.prompt();
        }
      }
    });
    this.shell.prompt();
  }

  /**
   * Interprets the command line.
   * @param args The argument list.
   * @param on_done Called when the command is done.
   */
  static Interpret(args, on_done) {
    let command = args.shift();
    if (command == "project") {
      let project_Command = new cProject_Command(args);
      project_Command.on_done = on_done;
      project_Command.Run();
    }
    else if (command == "compile") {
      let compile_command = new cCompile_Command(args);
      compile_command.on_done = on_done;
      compile_command.Run();
    }
    else if (command == "admin") {
      let admin_tool_command = new cAdmin_Tool(args);
      admin_tool_command.on_done = on_done;
      admin_tool_command.Run();
    }
    else if (command == "png-to-pic") {
      let png_to_pic = new cPNG_To_Picture(args);
      png_to_pic.on_done = on_done;
      png_to_pic.Run();
    }
    else if (command == "coder-doc") {
      if (args.length == 1) {
        let project = args.shift();
        let doc = new cCoder_Doc(project);
        doc.Process_Code();
        on_done();
      }
    }
    else if (command == "ping") {
      let ping = new cPing(args);
      ping.on_done = on_done;
      ping.Run();
    }
    else if (command == "server") {
      if (args.length == 1) {
        let server_name = args.shift();
        let server = new cServer(server_name);
        server.Start();
      }
    }
    else if (command == "daemon") {
      if (args.length == 1) {
        let name = args.shift();
        let daemon = new cDaemon(name);
        daemon.Start();
        daemon.Check_For_Changes();
      }
    }
    else if (command == "code-bank") {
      if (args.length == 2) {
        let name = args.shift();
        let dir = args.shift();
        try {
          let code_bank = new cCode_Bank(name);
          code_bank.Create_From_Directory_Path(dir + "/" + name);
        }
        catch (error) {
          console.log(error.message);
        }
        on_done();
      }
    }
    else if (command == "crypt") {
      let crypt_command = new cCrypt_Command(args);
      crypt_command.on_done = on_done;
      crypt_command.Run();
    }
    else if (command == "book") {
      let book_command = new cBook_Command(args);
      book_command.Run();
      on_done();
    }
    else if (command == "backup") {
      let backup_command = new cBackup(args);
      backup_command.Run();
      on_done();
    }
    else if (command == "help") {
      let name = (args.length > 0) ? args.shift() : "";
      let help_file = new cFile("Commands.txt", true);
      help_file.Read();
      while (help_file.Has_More_Lines()) {
        let line = help_file.Get_Line();
        if (name.length > 0) {
          if (line.indexOf(name) == 2) {
            console.log(line.substr(2));
          }
        }
        else {
          console.log(line);
        }
      }
      on_done();
    }
    else if (command == "quit") {
      cFrankus_Shell.done = true;
      on_done();
    }
    else {
      console.log("Invalid command " + command + ".");
      on_done();
    }
  }

}

// *****************************************************************************
// Crypt Implementation
// *****************************************************************************

class cCrypt {

  /**
   * Creates a new crypt module.
   * @param name The name of the file to encrypt.
   * @param password The password to encrpyt/decrypt the file.
   * @param salt The salt string.
   */
  constructor(name, password, salt) {
    this.key = null;
    this.data = "";
    this.file = new cFile(name);
    this.file.Read();
    try {
      this.key = crypto.scryptSync(password, salt, 24);
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Encrypts data from the file passed into the crypt module.
   */
  Encrypt() {
    if (this.key) {
      try {
        Check_Condition(this.file.data.match(/\r\n|\r|\n/), "Cannot encrypt encrypted data.");
        let ini_vector = Buffer.alloc(16, 0);
        let cipher = crypto.createCipheriv("aes-192-cbc", this.key, ini_vector);
        let encrypted = cipher.update(this.file.data, "utf8", "hex");
        encrypted += cipher.final("hex");
        this.file.data = encrypted;
        this.file.Write_From_Data();
        console.log("Encypted " + this.file.file + ".");
      }
      catch (error) {
        console.log(error.message);
      }
    }
  }

  /**
   * Decrypts data froma the file passed into the crypt module.
   */
  Decrypt() {
    if (this.key) {
      try {
        Check_Condition(!this.file.data.match(/\r\n|\r|\n/), "Cannot decrypt decrypted data.");
        let ini_vector = Buffer.alloc(16, 0);
        let decipher = crypto.createDecipheriv("aes-192-cbc", this.key, ini_vector);
        let decrypted = decipher.update(this.file.data, "hex", "utf8"); // Data should be encrypted.
        decrypted += decipher.final("utf8");
        this.file.data = decrypted;
        this.file.Write_From_Data();
        console.log("Decrypted " + this.file.file + ".");
      }
      catch (error) {
        console.log(error.message);
      }
    }
  }

}

// *****************************************************************************
// Decrypt Command Implementation
// *****************************************************************************

class cCrypt_Command extends cCommand {

  /**
   * Creates a new crypt command.
   * @param args The arguments passed in.
   */
  constructor(args) {
    super(args);
  }

  On_Interpret(op, params) {
    let status = "";
    if (op == "encrypt") {
      let name = this.Get_Param(params, "Missing file name.");
      let password = this.Get_Param(params, "Missing password.");
      let salt = this.Get_Param(params, "Missing salt.");
      let crypt = new cCrypt(name, password, salt);
      crypt.Encrypt();
      this.Done();
    }
    else if (op == "decrypt") {
      let name = this.Get_Param(params, "Missing file name.");
      let password = this.Get_Param(params, "Missing password.");
      let salt = this.Get_Param(params, "Missing salt.");
      let crypt = new cCrypt(name, password, salt);
      crypt.Decrypt();
      this.Done();
    }
    else {
      status = "error";
    }
    return status;
  }

}

// *****************************************************************************
// Book Implementation
// *****************************************************************************

class cBook_Command extends cCommand {

  /**
   * Creates a new book command.
   * @param args The arguments passed in.
   */
  constructor(args) {
    super(args);
  }

  On_Interpret(op, params) {
    let status = "";
    if (op == "create-book") {
      let book_name = this.Get_Param(params, "Missing name of book.").replace(/\\s/g, " ");
      try {
        this.Scan_Book(book_name);
      }
      catch (error) {
        console.log(error.message);
      }
    }
    else if (op == "create-article") {
      let article_name = this.Get_Param(params, "Missing article name.").replace(/\\s/g, "_");
      try {
        this.Scan_Article(article_name);
      }
      catch (error) {
        console.log(error.message);
      }
    }
    else {
      status = "error";
    }
    return status;
  }

  /**
   * Scans a books by name and converts it to an HTML file.
   * @param name The name of the book.
   * @throws An error if the book is not found.
   */
  Scan_Book(name) {
    let topics_file = new cFile("Board\\Topics.txt", true);
    let found = false;
    topics_file.Read();
    while (topics_file.Has_More_Lines()) {
      let topic_record = topics_file.Get_Line().split(/:/);
      if (topic_record.length == 3) {
        let topic_name = topic_record[0];
        let topic_hash = topic_record[1];
        let active = topic_record[2];
        if (topic_name.indexOf(name) != -1) { // Found!
          let book_name = topic_name.replace(/\s/g, "_").replace(/\(|\)|\-/g, "");
          let html_file = new cFile("Html\\" + book_name + ".html", true);
          let thread_file = new cFile("Board\\Thread_" + topic_hash + ".txt", true);
          thread_file.Read();
          html_file.Add_Lines([
            "<!DOCTYPE html>",
            "<html>",
            "<head>",
            "<title>" + topic_name + "</title>",
            "</head>",
            "<body>"
          ]);
          while (thread_file.Has_More_Lines()) {
            let thread_record = thread_file.Get_Line().split(/:/);
            if (thread_record.length == 3) {
              let post_name = thread_record[0];
              let post_author = thread_record[1];
              let post_hash = thread_record[2];
              let post_file = new cFile("Board\\Post_" + post_hash + ".txt", true);
              post_file.Read();
              html_file.Add("<h1>" + post_name + "</h1>");
              while (post_file.Has_More_Lines()) {
                let line = post_file.Get_Line();
                if (line.match(/picture/)) {
                  let pic_url = line.replace(/^\s*/, "").replace(/\s*$/, "");
                  let pair = pic_url.split("//");
                  if (pair.length == 2) {
                    let picture = pair[1];
                    let pic_ext = cFile.Get_Extension(picture);
                    let pic_file = new cFile("Upload\\" + picture, true);
                    pic_file.Read_Binary();
                    let pic_hash = pic_file.buffer.toString("base64");
                    html_file.Add('<img src="data:image/' + pic_ext + ';base64,' + pic_hash + '" alt="Picture" />');
                  }
                }
                else {
                  html_file.Add(line);
                }
                html_file.Add("<br />");
              }
            }
          }
          html_file.Add_Lines([
            "</body>",
            "</html>"
          ]);
          html_file.Write();
          found = true;
          console.log("Converted " + topic_name + ".");
          break;
        }
      }
    }
    if (!found) {
      console.log("No book found under search string " + name + ".");
    }
  }

  /**
   * Scans an article by name for conversion to book.
   * @param name The name of the article to scan.
   * @throws An article if the book was not found.
   */
  Scan_Article(name) {
    let article_file = new cFile("Wiki\\" + name + ".txt", true);
    let html_file = new cFile("Html\\" + name + ".html", true);
    article_file.Read();
    html_file.Add_Lines([
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      "<title>" + name + "</title>",
      "</head>",
      "<body>"
    ]);
    if (article_file.error.length == 0) {
      let html = Format(article_file.data);
      let matches = html.match(/img\ssrc="[^"]+"/g);
      let match_count = matches.length;
      for (let match_index = 0; match_index < match_count; match_index++) {
        let match = matches[match_index];
        let pic_url = match.replace(/^img\ssrc="/, "").replace(/"$/, "");
        let pic_ext = cFile.Get_Extension(pic_url);
        let pic_file = new cFile(pic_url, true);
        pic_file.Read_Binary();
        if (pic_file.error.length == 0) {
          let pic_hash = pic_file.buffer.toString("base64");
          html = html.replace(pic_url, "data:image/" + pic_ext + ";base64," + pic_hash);
        }
      }
      html_file.Add(html);
    }
    html_file.Add_Lines([
      "</body>",
      "</html>"
    ]);
    html_file.Write();
  }

}

// *****************************************************************************
// Backup Implementation
// *****************************************************************************

class cBackup extends cCommand {

  /**
   * Creates a new backup command.
   * @param args The arguments passed into the command.
   */
  constructor(args) {
    super(args);
    this.config = new cConfig("Backup");
    this.mod_table = new cConfig("Modified");
  }

  On_Interpret(op, params) {
    let status = "";
    if (op == "manual") {
      let drive = this.Get_Param(params, "Missing drive.");
      this.Backup_Files(drive);
    }
    else {
      status = "error";
    }
  }

  /**
   * Backs up a list of files to a drive.
   * @param drive The drive to back up to.
   */
  Backup_Files(drive) {
    let root = this.config.Get_Property("root");
    let files = cFile.Get_File_And_Folder_List("clear/" + root);
    let file_count = files.length;
    cFile.Create_Folder("clear/" + drive + "/Frankus");
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = files[file_index];
      let dest = file.replace(root, drive + "/Frankus");
      if (cFile.Is_Folder(file)) {
        cFile.Create_Folder(dest);
        console.log("Created folder " + file + ".");
      }
      else {
        try {
          let table_mtime = this.mod_table.Get_Property(file);
          let current_mtime = cFile.Get_File_Modified_Time(file);
          if (table_mtime != current_mtime) {
            this.mod_table.Set_Property(file, current_mtime);
            this.mod_table.Save();
            cFile.Copy_File(file, dest);
            console.log("Copied " + file + " to " + dest + ".");
          }
        }
        catch (error) {
          let mtime = cFile.Get_File_Modified_Time(file);
          this.mod_table.Set_Property(file, mtime);
          this.mod_table.Save();
          cFile.Copy_File(file, dest);
          console.log("Copied " + file + " to " + dest + ".");
        }
      }
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
             .replace(/%([^%]+)%/g, '<div class="code"><pre>$1</pre></div>')
             .replace(/`([^`]+)`/g, "<!-- $1 -->")
             .replace(/(http:\/\/\S+|https:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>')
             .replace(/image:\/\/(\S+)/g, '<img src="Pictures/$1" alt="Image" />')
             .replace(/picture:\/\/(\S+)/g, '<img src="Upload/$1" alt="Picture" />')
             .replace(/progress:\/\/(\d+)/g, '<div class="progress"><div class="percent_complete" style="width: $1%;">$1% Complete</div></div>')
             .replace(/video:\/\/(\S+)/g, '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>')
             .replace(/download:\/\/(\S+)/g, '<a href="Upload/$1">$1</a>')
             .replace(/\r\n|\r|\n/g, "<br />");
}

/**
 * Displays the Frankus logo.
 */
function Frankus_Logo() {
  console.log(`
+----  +---+     +    +   |  |  /  |   |   ---
|      |   |    / \\   |\\  |  | /   |   |  /
+--    +--+    |   |  | \\ |  ++    |   |  +--+
|      |   \\   +---+  |  \\|  | \\   |   |     /
|      |   |   |   |  |   +  |  \\  \\___/  ---

--+--  |   |  +----
  |    |   |  |
  |    +---+  +---
  |    |   |  |
  |    |   |  +----

+   |  +----  +---+  +--+
|\\  |  |      |   |  |   \\
| \\ |  +---   +--+   |   |
|  \\|  |      |   \\  |   /
|   +  +----  |   |  +--+

                                                                                
                                                                                
                                                                                
       ******************************,                                          
      *&@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%,...                                  
     /@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&&%.                              
     /@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#,                          
     ,(&@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&(/*                     
      .#&@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@/,,                 
        (&&&&&@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@/               
               #@&, ,&@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&&,            
                ,(%%(((/,,,,,#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&/,,              
           *,   *&&&&&&&&&&&&(******////////(@@@@@@@@@%/////.                   
           #*      *#&&&&&&&&&&&&&&&&&&&&&&/,,,,,,,,,,/&&*                      
               (/ #&&&&&&&&&&&&&&&&&&&&&&&&*   *&&*.%&&&&*                      
        /%&&*  /%#. ,%&&&&&&&&&&&&&&&#.(##########(((###,                       
        (&&&&%(.   ,(&&&&&&&&&&&&&&&&( (&&&%%%%%%%&&%%%&&%%%,                   
        *///////*   .////////////////* (&&&%%&&&&%%%&%%&&&%%,                   
        (&&&&&&&&&&&&&&&&&&&&&&&&&&&&( (&&&%%&&&&%%&&%%&&&%%,                   
                                       (&&&&&&%%%%%%%%&&&&#                     
        (&&&&&&&&%.   (&&&&&&&&&&&&&&( (&&&&&&&&&&&&&*.,(#%&&&&&&&####.         
        (&&&&&&&&&(/, ,**%&&&&&&&&&&&%/***********///%&&&&&&&&&&&&&&&&(,        
        (&&&&&&&&&&(**#&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&%.         
        (&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&%%/           
         *&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&,    ,&&&&&/                      
           #&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&/. ..                                
           #&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&*          .*                        
            /&&&&&&&&&&&&&&&&&&&&&&&&&&&&%*,,,,/%*,/&/,,,(#                     
            /&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&#                     
             ,&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&/                      
              ,#&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&%.                       
               *(&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&#//.                          
                   *#&&&&&&&&&&&&&&&&&&&&&&&%###(                               
                                                                                


Software programmed by Francois Lamini.
              `); 
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
 * Converts a number to a binary string.
 * @param number The number.
 * @return The binary string.
 */
function Number_To_Binary(number) {
  // 2 | 10 -> 0
  // 2 | 5  -> 1
  // 2 | 2  -> 0
  // 2 | 1  -> 1
  // 2 | 0
  let binary = [];
  while (number > 0) {
    let remainder = number % 2;
    binary.unshift(remainder);
    number = Math.floor(number / 2);
  }
  return binary.join("");
}

/**
 * Prints an object.
 * @param object The object to print.
 */
function Print_Object(object) {
  for (let property in object) {
    let value = object[property];
    console.log(property + "=" + value);
  }
}

// *****************************************************************************
// Exports
// *****************************************************************************

module.exports = {
  cFile: cFile,
  cConfig: cConfig,
  cMime_Reader: cMime_Reader,
  cShell: cShell,
  cLog: cLog,
  cCommand: cCommand,
  cBinary_Tree: cBinary_Tree,
  cBucket: cBucket,
  cPNG_To_Picture: cPNG_To_Picture,
  cCoder_Doc: cCoder_Doc,
  cPing: cPing,
  cProject: cProject,
  cAdmin_Tool: cAdmin_Tool,
  cCompiler: cCompiler,
  cServer: cServer,
  cAuth: cAuth,
  cE_Services: cE_Services,
  cFrankus_Shell: cFrankus_Shell,
  cCrypt: cCrypt,
  cBackup: cBackup,
  Split: Split,
  Check_Condition: Check_Condition,
  String_To_Hex: String_To_Hex,
  Format: Format,
  Frankus_Logo: Frankus_Logo,
  Number_To_Binary: Number_To_Binary,
  Binary_To_Number: Binary_To_Number,
  Print_Object: Print_Object
};

// *****************************************************************************
// Entry Point
// *****************************************************************************

if (process.argv.length > 2) {
  let args = process.argv.slice(2);
  let option = args.shift();
  if (option == "-interactive") {
    let frankus_shell = new cFrankus_Shell();
    frankus_shell.Run();
  }
  else if (option == "-once") {
    cFrankus_Shell.Interpret(args, function() {
      console.log("Done.");
    });
  }
  else {
    console.log("Invalid switch.");
  }
}