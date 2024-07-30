// ============================================================================
// Allegro I/O Driver (Implementation)
// Programmed by Francois Lamini
// ============================================================================

#include "Allegro.h"

namespace Frankus {

  // **************************************************************************
  // Allegro I/O Implementation
  // **************************************************************************

  /**
   * Allocates a new Allegro I/O control.
   * @param title The title of the window.
   * @param width The width of the screen.
   * @param height The height of the screen.
   * @param scale The scale of the display.
   * @param font The name of the font to use.
   * @throws An error if Allegro could not be initialized.
   */
  cAllegro_IO::cAllegro_IO(std::string title, int width, int height, int scale, std::string font) {
    this->screen = NULL;
    this->canvas = NULL;
    this->display = NULL;
    this->font = NULL;
    this->event_queue = NULL;
    this->icon = NULL;
    this->timer = NULL;
    bool allegro_ok = al_init();
    if (!allegro_ok) {
      throw Frankus::cError("Could not initialize Allegro.");
    }
    bool keyboard_ok = al_install_keyboard();
    if (!keyboard_ok) {
      throw Frankus::cError("Could not initialize keyboard.");
    }
    bool mouse_ok = al_install_mouse();
    if (!mouse_ok) {
      throw Frankus::cError("Could not initialize mouse.");
    }
    bool image_ok = al_init_image_addon();
    if (!image_ok) {
      throw Frankus::cError("Could not initialize image.");
    }
    bool font_ok = al_init_font_addon();
    if (!font_ok) {
      throw Frankus::cError("Could not initialize font.");
    }
    bool ttf_ok = al_init_ttf_addon();
    if (!ttf_ok) {
      throw Frankus::cError("Could not initialize the TTF font.");
    }
    bool audio_ok = al_install_audio();
    if (!audio_ok) {
      throw Frankus::cError("Could not install audio.");
    }
    bool codec_ok = al_init_acodec_addon();
    if (!codec_ok) {
      throw Frankus::cError("Could not install audio codec.");
    }
    al_set_new_bitmap_flags(ALLEGRO_WINDOWED);
    al_set_new_window_title(title.c_str());
    this->display = al_create_display(width * scale, height * scale);
    if (!this->display) {
      throw Frankus::cError("Could not create display.");
    }
    al_set_new_bitmap_flags(ALLEGRO_MEMORY_BITMAP);
    this->screen = al_create_bitmap(width, height);
    if (!this->screen) {
      throw Frankus::cError("Could not create screen.");
    }
    this->canvas = al_create_bitmap(width, height);
    if (!this->canvas) {
      throw Frankus::cError("Could not create canvas.");
    }
    this->icon = al_load_bitmap("Icon.png");
    if (!this->icon) {
      throw Frankus::cError("Could not load window icon.");
    }
    al_set_display_icon(this->display, this->icon);
    this->font = al_load_font(std::string(font + ".ttf").c_str(), 14, 0);
    if (!this->font) {
      throw Frankus::cError("Could not load font.");
    }
    al_install_joystick();
    this->timer = al_create_timer(1.0 / 20.0);
    if (!this->timer) {
      throw Frankus::cError("Timer could not be created.");
    }
    this->event_queue = al_create_event_queue();
    al_register_event_source(this->event_queue, al_get_keyboard_event_source());
    al_register_event_source(this->event_queue, al_get_mouse_event_source());
    al_register_event_source(this->event_queue, al_get_joystick_event_source());
    al_register_event_source(this->event_queue, al_get_display_event_source(this->display));
    al_register_event_source(this->event_queue, al_get_timer_event_source(this->timer));
    this->playing_track = "";
    this->scale = scale;
    this->buttons_loaded = false;
    this->button_index = 0;
    this->mouse_axes_reg.code = eSIGNAL_NONE;
    this->mouse_btn_down_reg.code = eSIGNAL_NONE;
    this->mouse_btn_up_reg.code = eSIGNAL_NONE;
    this->width = width;
    this->height = height;
    this->alpha = 255;
  }

  /**
   * Frees the Allegro I/O control.
   */
  cAllegro_IO::~cAllegro_IO() {
    if (this->display) {
      al_destroy_display(this->display);
    }
    if (this->screen) {
      al_destroy_bitmap(this->screen);
    }
    if (this->canvas) {
      al_destroy_bitmap(this->canvas);
    }
    if (this->icon) {
      al_destroy_bitmap(this->icon);
    }
    if (this->font) {
      al_destroy_font(this->font);
    }
    if (this->event_queue) {
      al_destroy_event_queue(this->event_queue);
    }
    // Free images.
    int image_count = this->images.Count();
    for (int image_index = 0; image_index < image_count; image_index++) {
      al_destroy_bitmap(this->images.values[image_index]);
    }
    // Free the sounds.
    int sound_count = this->sounds.Count();
    for (int sound_index = 0; sound_index < sound_count; sound_index++) {
      al_destroy_sample(this->sounds.values[sound_index]);
    }
    // Free music tracks.
    int track_count = this->tracks.Count();
    for (int track_index = 0; track_index < track_count; track_index++) {
      sAllegro_Track& track = this->tracks.values[track_index];
      al_destroy_audio_stream(track.stream);
      al_destroy_mixer(track.mixer);
      al_destroy_voice(track.voice);
    }
    al_uninstall_audio();
    if (this->timer) {
      al_destroy_timer(this->timer);
    }
  }

  /**
   * Draws an image to the screen.
   * @param name The name of the image.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param width The width of the image.
   * @param height The height of the image.
   * @param angle The angle in degrees.
   * @param flip_x If set flips the image on the x-axis.
   * @param flip_y If set flips the image on the y-axis.
   * @throws An error if the image could not be drawn.
   */
  void cAllegro_IO::Draw_Image(std::string name, int x, int y, int width, int height, int angle, bool flip_x, bool flip_y) {
    if (this->images.Does_Key_Exist(name)) {
      this->Set_Canvas_Mode();
      ALLEGRO_BITMAP* image = this->images[name];
      int image_w = al_get_bitmap_width(image);
      int image_h = al_get_bitmap_height(image);
      float scale_x = (float)(width / image_w);
      float scale_y = (float)(height / image_h);
      float center_x = (float)(width / 2);
      float center_y = (float)(height / 2);
      int flags = 0;
      if (flip_x) {
        flags |= ALLEGRO_FLIP_HORIZONTAL;
      }
      if (flip_y) {
        flags |= ALLEGRO_FLIP_VERTICAL;
      }
      // Draw the image.
      if (angle > 0) {
        al_draw_scaled_rotated_bitmap(image, center_x, center_y, x, y, scale_x, scale_y, (float)angle * 3.14 / 180.0, flags);
      }
      else {
        al_draw_scaled_bitmap(image, 0, 0, image_w, image_h, x, y, width, height, flags);
      }
    }
    else {
      throw Frankus::cError("Could not draw image " + name + ".");
    }
  }

  /**
   * Draws the background canvas to the screen.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param width The width of the clipping rectangle.
   * @param height The height of the clipping rectangle.
   */
  void cAllegro_IO::Draw_Canvas(int x, int y, int width, int height) {
    al_set_target_bitmap(this->screen);
    al_draw_bitmap_region(this->canvas, 0, 0, width, height, x, y, 0);
  }

  /**
   * Plays a sound by name.
   * @param name The name of the sound to play.
   * @throws A error if the sound cannot be played.
   */
  void cAllegro_IO::Play_Sound(std::string name) {
    if (this->sounds.Does_Key_Exist(name)) {
      ALLEGRO_SAMPLE* sound = this->sounds[name];
      al_play_sample(sound, 1.0, 0.0, 1.0, ALLEGRO_PLAYMODE_ONCE, NULL);
    }
    else {
      throw Frankus::cError("Could not find sound " + name + ".");
    }
  }

  /**
   * Outputs text to the screen at the specified coordinate.
   * @param text The text to output.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   */
  void cAllegro_IO::Output_Text(std::string text, int x, int y, int red, int green, int blue) {
    this->Set_Canvas_Mode();
    al_draw_text(this->font, al_map_rgba((unsigned char)red, (unsigned char)green, (unsigned char)blue, this->alpha), x, y - 1, 0, text.c_str());
  }

  /**
   * Draws a box.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param width The width of the box.
   * @param height The height of the box.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   */
  void cAllegro_IO::Box(int x, int y, int width, int height, int red, int green, int blue) {
    this->Set_Canvas_Mode();
    al_draw_filled_rectangle(x, y, x + width - 1, y + height - 1, al_map_rgba((unsigned char)red, (unsigned char)green, (unsigned char)blue, this->alpha));
  }

  /**
   * Draw a frame.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param width The width of the box.
   * @param height The height of the box.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   */
  void cAllegro_IO::Frame(int x, int y, int width, int height, int red, int green, int blue) {
    this->Set_Canvas_Mode();
    al_draw_rectangle(x, y, x + width - 1, y + height - 1, al_map_rgba((unsigned char)red, (unsigned char)green, (unsigned char)blue, this->alpha), 1);
  }

  /**
   * Loads a list of resources from a resource file.
   * @param name The name of the resource file with the resource names.
   * @throws An error if the resources could not be loaded.
   */
  void cAllegro_IO::Load_Resources(std::string name) {
    std::ifstream resource_file(name + ".txt");
    if (resource_file) {
      while (!resource_file.eof()) {
        std::string file;
        std::getline(resource_file, file);
        if (resource_file.good()) {
          std::string::size_type pos = file.rfind(".");
          if (pos == std::string::npos) {
            throw Frankus::cError("File name not formatted correctly for " + file + ".");
          }
          std::string res_name = file.substr(0, pos);
          std::string ext = file.substr(pos);
          if (ext == ".png") {
            ALLEGRO_BITMAP* image = al_load_bitmap(file.c_str());
            if (image) {
              this->images[res_name] = image;
            }
            else {
              throw Frankus::cError("Could not load image " + file + ".");
            }
          }
          else if (ext == ".wav") {
            ALLEGRO_SAMPLE* sound = al_load_sample(file.c_str());
            if (sound) {
              this->sounds[res_name] = sound;
            }
            else {
              throw Frankus::cError("Could not load sound effect " + file + ".");
            }
          }
          else if (ext == ".ogg") {
            sAllegro_Track track;
            track.stream = al_load_audio_stream(file.c_str(), 4, 2048);
            if (track.stream) {
              // Create a mixer.
              track.mixer = al_create_mixer(44100, ALLEGRO_AUDIO_DEPTH_FLOAT32, ALLEGRO_CHANNEL_CONF_2);
              // Create a voice.
              track.voice = al_create_voice(44100, ALLEGRO_AUDIO_DEPTH_INT16, ALLEGRO_CHANNEL_CONF_2);
              // Attach mixer to voice.
              al_attach_mixer_to_voice(track.mixer, track.voice);
              // Attach stream to mixer.
              al_attach_audio_stream_to_mixer(track.stream, track.mixer);
              // Stop playback.
              al_set_audio_stream_playing(track.stream, false);
              this->tracks[res_name] = track;
            }
            else {
              throw Frankus::cError("Could not load sound track " + file + ".");
            }
          }
          else {
            throw Frankus::cError("Invalid resource type " + ext + ".");
          }
        }
      }
    }
    else {
      throw Frankus::cError("Could not load resources.");
    }
  }

  /**
   * Loads an image from a file.
   * @param name The name of the image.
   * @throws An error if the image could not be loaded.
   */
  void cAllegro_IO::Load_Image(std::string name) {
    ALLEGRO_BITMAP* image = al_load_bitmap(std::string(name + ".png").c_str());
    if (image) {
      this->images[name] = image;
    }
    else {
      throw Frankus::cError("Could not load image " + name + ".");
    }
  }

  /**
   * Processes messages for Allegro. This blocks.
   * @param on_process Called when the app needs to be processed.
   * @param on_key_process Called when the keys are processed.
   */
  void cAllegro_IO::Process_Messages(bool (*on_process)(void), bool (*on_key_process)(void)) {
    bool done = false;
    ALLEGRO_EVENT event;
    al_start_timer(this->timer);
    while (!done) {
      al_wait_for_event(this->event_queue, &event);
      switch (event.type) {
        case ALLEGRO_EVENT_KEY_DOWN: {
          if (event.keyboard.keycode == ALLEGRO_KEY_ESCAPE) { // Program break key.
            throw Frankus::cError("Program break!");
          }
          else if (event.keyboard.keycode == ALLEGRO_KEY_1) { // Go to next key.
            if (!this->buttons_loaded) {
              if (this->button_index < this->button_names.Count()) {
                this->button_index++;
                this->Display_Gamepad_Buttons();
                this->Timeout(150);
              }
              else {
                this->buttons_loaded = true;
              }
            }
          }
          else {
            this->Process_Keys(event.keyboard.keycode);
          }
          bool quit = on_key_process();
          if (quit) { // Stop if the app requests it.
            done = true;
          }
          break;
        }
        case ALLEGRO_EVENT_KEY_CHAR: {
          ALLEGRO_USTR* letter = al_ustr_new("");
          al_ustr_append_chr(letter, event.keyboard.unichar);
          const char* buffer = al_cstr(letter);
          if (std::strlen(buffer) == 1) {
            if ((buffer[0] >= ' ') && (buffer[0] <= '~')) { // Proper characters to read?
              this->Add_Key((int)buffer[0]);
            }
          }
          al_ustr_free(letter);
          bool quit = on_key_process();
          if (quit) { // Stop if the app requests it.
            done = true;
          }
          break;
        }
        case ALLEGRO_EVENT_MOUSE_AXES: {
          this->mouse_axes_reg.code = eSIGNAL_MOUSE;
          this->mouse_axes_reg.button = eBUTTON_NONE;
          this->mouse_axes_reg.coords.x = event.mouse.x / this->scale;
          this->mouse_axes_reg.coords.y = event.mouse.y / this->scale;
          break;
        }
        case ALLEGRO_EVENT_MOUSE_BUTTON_DOWN: {
          this->mouse_axes_reg.code = eSIGNAL_MOUSE;
          this->mouse_axes_reg.button = (int)event.mouse.button;
          this->mouse_axes_reg.coords.x = event.mouse.x / this->scale;
          this->mouse_axes_reg.coords.y = event.mouse.y / this->scale;
          break;
        }
        case ALLEGRO_EVENT_MOUSE_BUTTON_UP: {
          this->mouse_axes_reg.code = eSIGNAL_MOUSE;
          this->mouse_axes_reg.button = eBUTTON_UP;
          this->mouse_axes_reg.coords.x = event.mouse.x / this->scale;
          this->mouse_axes_reg.coords.y = event.mouse.y / this->scale;
          break;
        }
        case ALLEGRO_EVENT_DISPLAY_CLOSE: {
          done = true;
          break;
        }
        case ALLEGRO_EVENT_DISPLAY_SWITCH_IN: {
          al_resume_timer(this->timer);
          break;
        }
        case ALLEGRO_EVENT_DISPLAY_SWITCH_OUT: {
          al_stop_timer(this->timer);
          break;
        }
        case ALLEGRO_EVENT_JOYSTICK_CONFIGURATION: {
          al_reconfigure_joysticks();
          break;
        }
        case ALLEGRO_EVENT_JOYSTICK_AXIS: {
          if (this->buttons_loaded) {
            this->Process_Gamepad_Axis(event.joystick.axis, event.joystick.button);
          }
          break;
        }
        case ALLEGRO_EVENT_JOYSTICK_BUTTON_DOWN: {
          if (this->buttons_loaded) {
            this->Process_Gamepad_Buttons(event.joystick.button);
          }
          else {
            this->button_map[this->button_index] = event.joystick.button;
            this->Display_Gamepad_Buttons();
          }
          break;
        }
        case ALLEGRO_EVENT_TIMER: {
          bool quit = this->Step(on_process);
          if (quit) {
            done = true;
          }
          break;
        }
      }
    }
  }

  /**
   * Processes the keystrokes.
   * @param key The key to process.
   */
  void cAllegro_IO::Process_Keys(int key) {
    switch (key) {
      case ALLEGRO_KEY_LEFT: {
        this->Add_Key(eSIGNAL_LEFT);
        break;
      }
      case ALLEGRO_KEY_RIGHT: {
        this->Add_Key(eSIGNAL_RIGHT);
        break;
      }
      case ALLEGRO_KEY_UP: {
        this->Add_Key(eSIGNAL_UP);
        break;
      }
      case ALLEGRO_KEY_DOWN: {
        this->Add_Key(eSIGNAL_DOWN);
        break;
      }
      case ALLEGRO_KEY_BACKSPACE: {
        this->Add_Key(eSIGNAL_BACKSPACE);
        break;
      }
      case ALLEGRO_KEY_ENTER: {
        this->Add_Key(eSIGNAL_ENTER);
        break;
      }
      case ALLEGRO_KEY_DELETE: {
        this->Add_Key(eSIGNAL_DELETE);
        break;
      }
    }
  }

  /**
   * Plays a music track.
   * @param name The name of the music track.
   * @throws An error if the music cannot be played.
   */
  void cAllegro_IO::Play_Music(std::string name) {
    if (this->tracks.Does_Key_Exist(name)) {
      sAllegro_Track& track = this->tracks[name];
      this->playing_track = name;
      al_set_audio_stream_playmode(track.stream, ALLEGRO_PLAYMODE_LOOP);
      al_set_audio_stream_playing(track.stream, true);
    }
    else {
      throw Frankus::cError("Could not find track " + name + ".");
    }
  }

  /**
   * Stops all sounds and music.
   */
  void cAllegro_IO::Silence() {
    // Stop sounds.
    al_stop_samples();
    // Stop music.
    if (this->tracks.Does_Key_Exist(this->playing_track)) {
      sAllegro_Track& track = this->tracks[this->playing_track];
      al_set_audio_stream_playing(track.stream, false);
    }
  }

  /**
   * Refreshes the screen.
   */
  void cAllegro_IO::Refresh() {
    ALLEGRO_BITMAP* backbuffer = al_get_backbuffer(display);
    int screen_w = al_get_bitmap_width(this->screen);
    int screen_h = al_get_bitmap_height(this->screen);
    al_set_target_bitmap(backbuffer);
    int buffer_w = al_get_bitmap_width(backbuffer);
    int buffer_h = al_get_bitmap_height(backbuffer);
    al_draw_scaled_bitmap(this->screen, 0, 0, screen_w, screen_h, 0, 0, buffer_w, buffer_h, 0);
    al_flip_display();
  }

  /**
   * Colors the screen.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   */
  void cAllegro_IO::Color(int red, int green, int blue) {
    this->Set_Canvas_Mode();
    al_clear_to_color(al_map_rgb((unsigned char)red, (unsigned char)green, (unsigned char)blue));
  }

  /**
   * Loads the button names.
   * @param name The name of the file.
   * @throws An error if the button names could not be loaded.
   */
  void cAllegro_IO::Load_Button_Names(std::string name) {
    cFile file(name + ".txt");
    file.Read();
    while (file.Has_More_Lines()) {
      std::string line = file.Get_Line();
      this->button_names.Add(line);
    }
  }

  /**
   * Loads the button map.
   * @param name The button map.
   * @throws An error if the button map is not the correct size.
   */
  void cAllegro_IO::Load_Button_Map(std::string name) {
    try {
      cFile file(name + ".txt");
      file.Read();
      while (file.Has_More_Lines()) {
        int button_index = 0;
        file >> button_index;
        this->button_map.Add(button_index);
      }
      if (this->button_map.Count() != this->button_names.Count()) {
        throw cError("Button map is not correct size.");
      }
      this->buttons_loaded = true;
    }
    catch (cError error) {
      // Fill map with zeros.
      int button_count = this->button_names.Count();
      for (int button_index = 0; button_index < button_count; button_index++) {
        this->button_map.Add(0); // Add zeros.
      }
      // Display button selection.
      this->Display_Gamepad_Buttons();
    }
  }

  /**
   * Saves the button map.
   * @param name The name of the button map.
   * @throws An error if the map could not be saved.
   */
  void cAllegro_IO::Save_Button_Map(std::string name) {
    cFile file(name + ".txt");
    int button_count = this->button_map.Count();
    for (int button_index = 0; button_index < button_count; button_index++) {
      file.Add(this->button_map[button_index]);
    }
    file.Write();
  }

  /**
   * Processes the gamepad axis.
   * @param axis The axis to process.
   * @param pos The position.
   */
  void cAllegro_IO::Process_Gamepad_Axis(int axis, int pos) {
    if (axis == 0) { // X
      if (pos < 0) {
        this->Add_Key(eSIGNAL_LEFT);
      }
      else if (pos > 0) {
        this->Add_Key(eSIGNAL_RIGHT);
      }
    }
    else if (axis == 1) { // Y
      if (pos < 0) {
        this->Add_Key(eSIGNAL_UP);
      }
      else if (pos > 0) {
        this->Add_Key(eSIGNAL_DOWN);
      }
    }
  }

  /**
   * Processes gamepad buttons.
   * @param button The button number.
   */
  void cAllegro_IO::Process_Gamepad_Buttons(int button) {
    int button_count = this->button_map.Count();
    for (int button_index = 0; button_index < button_count; button_index++) {
      if (this->button_map[button_index] == button) {
        switch (button_index) {
          case eGAMEPAD_A: {
            this->Add_Key(eSIGNAL_A);
            break;
          }
          case eGAMEPAD_B: {
            this->Add_Key(eSIGNAL_B);
            break;
          }
          case eGAMEPAD_X: {
            this->Add_Key(eSIGNAL_X);
            break;
          }
          case eGAMEPAD_Y: {
            this->Add_Key(eSIGNAL_Y);
            break;
          }
          case eGAMEPAD_L: {
            this->Add_Key(eSIGNAL_L);
            break;
          }
          case eGAMEPAD_R: {
            this->Add_Key(eSIGNAL_R);
            break;
          }
          case eGAMEPAD_START: {
            this->Add_Key(eSIGNAL_START);
            break;
          }
          case eGAMEPAD_SELECT: {
            this->Add_Key(eSIGNAL_SELECT);
            break;
          }
        }
        break;
      }
    }
  }

  /**
   * Display gamepad buttons.
   */
  void cAllegro_IO::Display_Gamepad_Buttons() {
    al_set_target_bitmap(this->screen);
    al_clear_to_color(al_map_rgb(255, 255, 255));
    std::string text = "Press the " + this->button_names[this->button_index] + " button.";
    int text_width = al_get_text_width(this->font, text.c_str());
    int width = al_get_bitmap_width(this->screen);
    int height = al_get_bitmap_height(this->screen);
    int x = (width - text_width) / 2;
    int y = height / 2;
    al_draw_text(this->font, al_map_rgb(0, 0, 0), x, y, 0, text.c_str());
    al_draw_text(this->font, al_map_rgb(0, 0, 0), width - 1, height - 1, ALLEGRO_ALIGN_RIGHT, "Press 1 to set the button.");
    this->Refresh();
  }

  /**
   * Gets a list of files from a directory path.
   * @param path The path to browse.
   * @return A list of files in the folder.
   */
  cArray<std::string> cAllegro_IO::Get_File_List(std::string path) {
    cArray<std::string> files;
    ALLEGRO_FS_ENTRY* root = al_create_fs_entry(path.c_str());
    int mode = al_get_fs_entry_mode(root);
    if (mode & ALLEGRO_FILEMODE_ISDIR) {
      files.Push(path);
      bool result = al_open_directory(root);
      if (result) {
        ALLEGRO_FS_ENTRY* entry = al_read_directory(root);
        while (entry) {
          std::string file = al_get_fs_entry_name(entry);
          files.Push(file);
          entry = al_read_directory(root);
        }
        al_close_directory(root);
      }
    }
    else if (mode & ALLEGRO_FILEMODE_ISFILE) {
      files.Push(path);
    }
    al_destroy_fs_entry(root);
    return files;
  }

  /**
   * Updates the display using the picture processor's screen and palette.
   * @param pp The picture processor reference.
   */
  void cAllegro_IO::Update_Display(cPicture_Processor* pp) {
    ALLEGRO_LOCKED_REGION* region = al_lock_bitmap(this->screen, ALLEGRO_PIXEL_FORMAT_RGB_888, ALLEGRO_LOCK_READWRITE);
    if (region) {
      // Draw the screen.
      for (int y = 0; y < pp->height; y++) {
        for (int x = 0; x < pp->width; x++) {
          sColor color = pp->palette[pp->screen[y][x]];
          unsigned char* pixels = (unsigned char*)region->data;
          pixels[(y * region->pitch) + (region->pixel_size * x) + 0] = color.red;
          pixels[(y * region->pitch) + (region->pixel_size * x) + 1] = color.green;
          pixels[(y * region->pitch) + (region->pixel_size * x) + 2] = color.blue;
        }
      }
      al_unlock_bitmap(screen);
      // Draw screen to display.
      ALLEGRO_BITMAP* backbuffer = al_get_backbuffer(display);
      al_set_target_bitmap(backbuffer);
      int width = al_get_bitmap_width(backbuffer);
      int height = al_get_bitmap_height(backbuffer);
      al_draw_scaled_bitmap(this->screen, 0, 0, pp->width, pp->height, 0, 0, width, height, 0);
      al_flip_display();
    }
  }

  /**
   * Gets the width of the text.
   * @param text The text to measure.
   * @return The width of the text.
   */
  int cAllegro_IO::Get_Text_Width(std::string text) {
    return al_get_text_width(this->font, text.c_str());
  }

  /**
   * Gets the height of the text.
   * @param text The text to measure.
   * @return The height of the text.
   */
  int cAllegro_IO::Get_Text_Height(std::string text) {
    return al_get_font_line_height(this->font);
  }

  /**
   * Sets the canvas mode based on the flag.
   */
  void cAllegro_IO::Set_Canvas_Mode() {
    if (this->use_canvas) {
      al_set_target_bitmap(this->canvas);
    }
    else {
      al_set_target_bitmap(this->screen);
    }
  }

  /**
   * Gets the width of the image.
   * @param name The name of the image.
   * @return The width of the image in pixels.
   * @throws An error if the image does not exist.
   */
  int cAllegro_IO::Get_Image_Width(std::string name) {
    Check_Condition(this->images.Does_Key_Exist(name), "Image " + name + " does not exist.");
    return al_get_bitmap_width(this->images[name]);
  }

  /**
   * Gets the height of the image.
   * @param name The name of the image.
   * @return The height of the image in pixels.
   */
  int cAllegro_IO::Get_Image_Height(std::string name) {
    Check_Condition(this->images.Does_Key_Exist(name), "Image does not exist.");
    return al_get_bitmap_height(this->images[name]);
  }

  /**
   * Gets the current folder where the app is running.
   * @return The folder path.
   */
  std::string cAllegro_IO::Get_Current_Folder() {
    std::string current_folder = "";
    char* path = al_get_current_directory();
    current_folder = path;
    al_free(path);
    return current_folder;
  }

  /**
   * Gets the extension of a file based on the path.
   * @param path The file path.
   * @return The file extension.
   */
  std::string cAllegro_IO::Get_File_Extension(std::string path) {
    ALLEGRO_PATH* folder = al_create_path(path.c_str());
    std::string ext = std::string(al_get_path_extension(folder));
    if (ext.length() > 0) {
      ext = ext.substr(1);
    }
    al_destroy_path(folder);
    return ext;
  }

  /**
   * Gets the title of the file.
   * @param path The file path.
   * @return The file title which is the base name.
   */
  std::string cAllegro_IO::Get_File_Title(std::string path) {
    ALLEGRO_PATH* folder = al_create_path(path.c_str());
    std::string base_name = al_get_path_basename(folder);
    al_destroy_path(folder);
    return base_name;
  }

  /**
   * Gets the name of the file.
   * @param path The file path.
   * @return The name of the file.
   */
  std::string cAllegro_IO::Get_File_Name(std::string path) {
    ALLEGRO_PATH* folder = al_create_path(path.c_str());
    std::string name = al_get_path_filename(folder);
    al_destroy_path(folder);
    return name;
  }

  /**
   * Sets the frames per second for throttling of the processing
   * callback function.
   * @param fps The number of frames per second that the processing callback with run at. 
   */
  void cAllegro_IO::Set_FPS(int fps) {
    al_set_timer_speed(this->timer, 1.0 / (double)fps);
  }

  /**
   * Loads the resources from the file system. 
   */
  void cAllegro_IO::Load_Resources_From_Files() {
    cArray<std::string> files = this->Get_File_List(this->Get_Current_Folder());
    int file_count = files.Count();
    for (int file_index = 0; file_index < file_count; file_index++) {
      std::string file = files[file_index];
      std::string ext = this->Get_File_Extension(file);
      std::string name = this->Get_File_Title(file);
      if (ext == "png") {
        ALLEGRO_BITMAP* image = al_load_bitmap(file.c_str());
        if (image) {
          this->images[name] = image;
        }
        else {
          throw Frankus::cError("Could not load image " + file + ".");
        }
      }
      else if (ext == "wav") {
        ALLEGRO_SAMPLE* sound = al_load_sample(file.c_str());
        if (sound) {
          this->sounds[name] = sound;
        }
        else {
          throw Frankus::cError("Could not load sound effect " + file + ".");
        }
      }
      else if (ext == "ogg") {
        sAllegro_Track track;
        track.stream = al_load_audio_stream(file.c_str(), 4, 2048);
        if (track.stream) {
          // Create a mixer.
          track.mixer = al_create_mixer(44100, ALLEGRO_AUDIO_DEPTH_FLOAT32, ALLEGRO_CHANNEL_CONF_2);
          // Create a voice.
          track.voice = al_create_voice(44100, ALLEGRO_AUDIO_DEPTH_INT16, ALLEGRO_CHANNEL_CONF_2);
          // Attach mixer to voice.
          al_attach_mixer_to_voice(track.mixer, track.voice);
          // Attach stream to mixer.
          al_attach_audio_stream_to_mixer(track.stream, track.mixer);
          // Stop playback.
          al_set_audio_stream_playing(track.stream, false);
          this->tracks[name] = track;
        }
        else {
          throw Frankus::cError("Could not load sound track " + file + ".");
        }
      }
    }
  }

  /**
   * Consumes a the mouse registers. 
   */
  void cAllegro_IO::Consume_Mouse() {
    if (this->mouse_axes_reg.code == eSIGNAL_MOUSE) { // Register set.
      this->Add_Mouse(this->mouse_axes_reg.button, this->mouse_axes_reg.coords.x, this->mouse_axes_reg.coords.y);
      this->mouse_axes_reg.code = eSIGNAL_NONE;
    }
    if (this->mouse_btn_down_reg.code == eSIGNAL_MOUSE) { // Register set.
      this->Add_Mouse(this->mouse_btn_down_reg.button, this->mouse_btn_down_reg.coords.x, this->mouse_btn_down_reg.coords.y);
      this->mouse_btn_down_reg.code = eSIGNAL_NONE;
    }
    if (this->mouse_btn_up_reg.code == eSIGNAL_MOUSE) { // Register set.
      this->Add_Mouse(this->mouse_btn_up_reg.button, this->mouse_btn_up_reg.coords.x, this->mouse_btn_up_reg.coords.y);
      this->mouse_btn_up_reg.code = eSIGNAL_NONE;
    }
  }

  /**
   * Executes a single step of app execution.
   * @param on_process Callback for processing the app code.
   * @return True if the app needs to quit, false otherwise.
   */
  bool cAllegro_IO::Step(bool (*on_process)(void)) {
    this->Consume_Mouse();
    return on_process();
  }

  /**
   * Sets the alpha channel for the display.
   * @param value Can be 0 to 1.
   */
  void cAllegro_IO::Set_Transparency(float value) {
    this->alpha = (unsigned char)(255.0 * value);
  }

}