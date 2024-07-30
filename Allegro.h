// ============================================================================
// Allegro I/O Driver (Definitions)
// Programmed by Francois Lamini
// ============================================================================

#include <allegro5/allegro.h>
#include <allegro5/allegro_image.h>
#include <allegro5/allegro_font.h>
#include <allegro5/allegro_ttf.h>
#include <allegro5/allegro_color.h>
#include <allegro5/allegro_primitives.h>
#include <allegro5/allegro_acodec.h>
#include <allegro5/allegro_audio.h>

namespace Frankus {

  enum eGamepad {
    eGAMEPAD_A,
    eGAMEPAD_B,
    eGAMEPAD_X,
    eGAMEPAD_Y,
    eGAMEPAD_L,
    eGAMEPAD_R,
    eGAMEPAD_START,
    eGAMEPAD_SELECT
  };

  struct sAllegro_Track {
    ALLEGRO_AUDIO_STREAM* stream;
    ALLEGRO_MIXER* mixer;
    ALLEGRO_VOICE* voice;
  };

  class cAllegro_IO : public cIO_Control {

    public:
      ALLEGRO_BITMAP* screen;
      ALLEGRO_BITMAP* canvas;
      ALLEGRO_DISPLAY* display;
      ALLEGRO_FONT* font;
      ALLEGRO_EVENT_QUEUE* event_queue;
      ALLEGRO_BITMAP* icon;
      ALLEGRO_TIMER* timer;
      std::string playing_track;
      cHash<std::string, ALLEGRO_SAMPLE*> sounds;
      cHash<std::string, sAllegro_Track> tracks;
      cHash<std::string, ALLEGRO_BITMAP*> images;
      cArray<std::string> button_names;
      cArray<int> button_map;
      bool buttons_loaded;
      int button_index;
      int scale;
      sSignal mouse_axes_reg;
      sSignal mouse_btn_down_reg;
      sSignal mouse_btn_up_reg;
      unsigned char alpha;

      cAllegro_IO(std::string title, int width, int height, int scale, std::string font);
      ~cAllegro_IO();
      void Draw_Image(std::string name, int x, int y, int width, int height, int angle, bool flip_x, bool flip_y);
      void Draw_Canvas(int x, int y, int width, int height);
      void Output_Text(std::string text, int x, int y, int red, int green, int blue);
      void Box(int x, int y, int width, int height, int red, int green, int blue);
      void Frame(int x, int y, int width, int height, int red, int green, int blue);
      void Play_Sound(std::string name);
      void Play_Music(std::string name);
      void Silence();
      void Load_Resources(std::string name);
      void Load_Image(std::string name);
      void Refresh();
      void Color(int red, int green, int blue);
      void Process_Messages(bool (*on_process)(void), bool (*on_key_process)(void));
      void Process_Keys(int key);
      void Load_Button_Names(std::string name);
      void Load_Button_Map(std::string name);
      void Save_Button_Map(std::string name);
      void Process_Gamepad_Axis(int axis, int pos);
      void Process_Gamepad_Buttons(int button);
      void Display_Gamepad_Buttons();
      cArray<std::string> Get_File_List(std::string path);
      void Update_Display(cPicture_Processor* pp);
      int Get_Text_Width(std::string text);
      int Get_Text_Height(std::string text);
      void Set_Canvas_Mode();
      int Get_Image_Width(std::string name);
      int Get_Image_Height(std::string name);
      std::string Get_Current_Folder();
      std::string Get_File_Extension(std::string path);
      std::string Get_File_Title(std::string path);
      std::string Get_File_Name(std::string path);
      void Set_FPS(int fps);
      void Load_Resources_From_Files();
      void Consume_Mouse();
      bool Step(bool (*on_process)(void));
      void Set_Transparency(float value);

  };

}