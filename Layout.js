// ============================================================================
// Frankus Layout Implementation 
// Programmed by Francois Lamini
// ============================================================================

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
      }, 1500); // Set a delay to sync DOM.
    }, function(error) {
      console.log("Browser Error: " + error);
    });
  }

}