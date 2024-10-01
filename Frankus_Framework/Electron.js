// ============================================================================
// Electron Script
// Programmed by Francois Lamini
// ============================================================================

let electron = require("electron");
let frankus = require("./Backend");

// ****************************************************************************
// Electron Implementation
// ****************************************************************************

class cElectron {

  X_INCREMENT = 10;
  Y_INCREMENT = 10;

  generic_menu = [
    {
      label: "Navigation",
      submenu: [
        {
          label: "Go Back",
          click: function(item, window, event) {
            if (window.webContents.canGoBack()) {
              window.webContents.goBack();
            }
          }
        }
      ]
    },
    {
      label: "Sound",
      submenu: [
        {
          label: "Turn Off",
          click: function(item, window, event) {
            window.webContents.setAudioMuted(true);
          }
        },
        {
          label: "Turn On",
          click: function(item, window, event) {
            window.webContents.setAudioMuted(false);
          }
        }
      ]
    },
    {
      label: "Window",
      submenu: [
        {
          label: "Fullscreen",
          click: function(item, window, event) {
            window.setFullScreen(true);
          }
        },
        {
          type: "separator"
        },
        {
          label: "Reload",
          click: function(item, window, event) {
            window.reload();
          }
        },
        {
          label: "Clone",
          click: function(item, window, event) {
            let win_info = window.frankus_win_info;
            let id = window.frankus_instance.Get_New_Window_ID(win_info.name);
            window.frankus_instance.Create_Window(win_info.name + " " + id, win_info.url, win_info.width, win_info.height);
          }
        },
        {
          type: "separator"
        },
        {
          label: "Close",
          click: function(item, window, event) {
            window.close();
          }
        }
      ]
    },
    {
      label: "Debugger",
      submenu: [
        {
          label: "Web Inspector",
          click: function(item, window, event) {
            window.webContents.openDevTools({
              mode: "detach",
              title: "Web Inspector"
            });
          }
        },
        {
          type: "separator"
        },
        {
          label: "Close",
          click: function(item, window, event) {
            window.webContents.closeDevTools();
          }
        }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: function(item, window, event) {
            electron.dialog.showMessageBox(window, {
              message: "Frankus the Nerd Electron Shell",
              type: "info",
              title: "About",
              icon: frankus.cFile.Get_Local_Path("Images/Frankus_Head.png")
            });
          }
        }
      ]
    }
  ];

  /**
   * Creates a new Electron JS module.
   * @param server_name The name of the server.
   */
  constructor(server_name) {
    this.windows = {};
    this.server = null;
    this.name = server_name;
    this.x = 0;
    this.y = 0;
  }
  
  /**
   * Creates a new window.
   * @param name The name of the window.
   * @param url The URL of the window.
   * @param width The width of the window.
   * @param height The height of the window.
   */
  Create_Window(name, url, width, height) {
    if (this.windows[name] == undefined) {
      let win_info = {
        name: name,
        url: url,
        width: width,
        height: height
      };
      this.windows[name] = new electron.BrowserWindow({
        width: width,
        height: height,
        title: name,
        backgroundColor: "white",
        icon: frankus.cFile.Get_Local_Path("Images/Frankus_Head.png"),
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false
        }
      });
      this.windows[name].frankus_win_info = win_info;
      this.windows[name].frankus_instance = this;
      this.windows[name].setPosition(this.x, this.y);
      this.x += this.X_INCREMENT;
      this.y += this.Y_INCREMENT;
      const menu = electron.Menu.buildFromTemplate(this.generic_menu);
      this.windows[name].setMenu(menu);
      this.windows[name].loadURL(url);
      let component = this;
      this.windows[name].once("ready-to-show", function() {
        component.windows[name].setContentSize(width, height);
        component.windows[name].show();
      });
      this.windows[name].once("closed", function() {
        delete component.windows[name]; // Remove window reference.
      });
    }
  }
  
  /**
   * Creates client-server system for Electron.
   */
  Create() {
    // Create and start the server.
    this.server = new frankus.cServer(this.name);
    this.server.Start();
    // Create the windows.
    let config = new frankus.cConfig(this.name);
    if (config.Has_Property("windows")) {
      let windows = config.Get_Property("windows");
      if (typeof windows == "string") {
        windows = windows.split(/,/);
        let win_count = windows.length;
        for (let win_index = 0; win_index < win_count; win_index++) {
          let window_name = windows[win_index];
          if (config.Has_Property(window_name)) {
            let window = config.Get_Property(window_name);
            if (typeof window == "string") {
              let properties = window.split(/,/);
              if (properties.length == 4) {
                let win_name = properties[0];
                let url = properties[1];
                let width = parseInt(properties[2]);
                let height = parseInt(properties[3]);
                this.Create_Window(win_name, url, width, height);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Gets the ID of a new window.
   * @param name The name of the window to get the ID for.
   * @return The ID of the new window.
   */
  Get_New_Window_ID(name) {
    let id = 0;
    name = name.replace(/#\s\d+$/, "");
    for (let win_name in this.windows) {
      if (win_name.indexOf(name) != -1) {
        id++;
      }
    }
    return id;
  }
  
}

// **************** Constructor **********************
electron.app.whenReady().then(function() {
  let app = new cElectron("Local_Server");
  app.Create();
});

electron.app.on("window-all-closed", function() {
  electron.app.quit();
});
// ***************************************************