// ============================================================================
// Frankus Library (Definitions)
// Programmed by Francois Lamini
// ============================================================================

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <chrono>
#include <cstdlib>
#include <cmath>
#include <cstring>

namespace Frankus {

  const int NO_VALUE_FOUND = -1;
  const int TAKE_NO_JUMP = -1;
  const int BLINK_RATE = 500;

  enum eValue_Type {
    eVALUE_NUMBER,
    eVALUE_STRING
  };

  enum eSignal {
    eSIGNAL_NONE,
    eSIGNAL_LEFT,
    eSIGNAL_RIGHT,
    eSIGNAL_UP,
    eSIGNAL_DOWN,
    eSIGNAL_BACKSPACE,
    eSIGNAL_DELETE,
    eSIGNAL_ENTER,
    eSIGNAL_TAB,
    eSIGNAL_MOUSE,
    eSIGNAL_START,
    eSIGNAL_SELECT,
    eSIGNAL_A,
    eSIGNAL_B,
    eSIGNAL_X,
    eSIGNAL_Y,
    eSIGNAL_L,
    eSIGNAL_R
  };

  enum eButton {
    eBUTTON_NONE,
    eBUTTON_LEFT,
    eBUTTON_RIGHT,
    eBUTTON_UP
  };

  enum eStatus {
    eSTATUS_IDLE,
    eSTATUS_RUNNING,
    eSTATUS_OUTPUT,
    eSTATUS_INPUT,
    eSTATUS_ERROR,
    eSTATUS_DONE
  };

  enum eDraw_Mode {
    eDRAW_NORMAL,
    eDRAW_FLIPPED_X,
    eDRAW_FLIPPED_Y
  };

  struct sPoint {
    int x;
    int y;
  };

  struct sRectangle {
    int left;
    int top;
    int right;
    int bottom;
  };

  struct sSignal {
    int code;
    sPoint coords;
    int button;
  };

  struct sLetter {
    int letter;
    int red;
    int blue;
    int green;
  };

  struct sToken {
    std::string token;
    int line_no;
    std::string source;
  };

  struct sColor {
    int red;
    int green;
    int blue;
  };

  class cError {

    public:
      std::string message;

      cError(std::string message);
      void Print();

  };

  template <typename T> class cArray {

    public:
      enum Settings {
        BLOCK_SIZE = 64,
        TABLE_INCR = 10
      };

      T** items;
      int pointer;
      int block_count;
      int table_size;

      cArray();
      cArray(const cArray& other);
      cArray(cArray& other);
      ~cArray();
      cArray& operator= (const cArray& other);
      cArray& operator= (cArray& other);
      T& operator[] (int index);
      void Add(T item);
      T& Add();
      T Remove(int index);
      void Push(T item);
      T Pop();
      void Unshift(T item);
      T Shift();
      void Insert(T item, int index);
      int Count();
      void Alloc_Block();
      void Copy(cArray& other);
      void Copy(const cArray& other);
      void Print();
      void Init();
      void Reallocate_Table();
      void Free();
      int Get_Size();
      void Clear();
      T& Peek_Front();
      T& Peek_Back();

  };

  typedef cArray<sLetter> tLine;

  template <typename K, typename V> class cHash {

    public:
      cArray<K> keys;
      cArray<V> values;

      void Add(K key, V value);
      void Remove(K key);
      V& operator[](K key);
      int Get_Hash_Key(K key);
      void Clear();
      int Count();
      bool Does_Key_Exist(K key);

  };

  class cValue {

    public:
      int type;
      int number;
      std::string string;

      cValue();
      cValue(int number);
      cValue(std::string string);
      void Set_Number(int number);
      void Set_String(std::string string);
      cValue& operator=(const cValue& other);
      void operator=(const int number);
      void operator=(const std::string string);
      void Convert_To_Number();
      void Convert_To_String();

  };

  typedef cHash<std::string, cValue> tObject;
  typedef cArray<tObject> tObject_List;

  class cList {

    public:
      cArray<int> items;

      cList();
      cList(int size);
      int& operator[](int index);
      cList& operator=(const cList& other);
      void Clear();
      void Add(int value);
      void Remove(int index);
      int Count();

  };

  class cMatrix {

    public:
      int width;
      int height;
      cArray<cList> rows;

      cMatrix();
      cMatrix(int width, int height);
      cList& operator[](int index);
      cList& operator=(const cList& other);
      void Clear();
      void Resize(int width, int height);

  };

  class cTable {

    public:
      int width;
      int height;
      int row_pointer;
      int col_pointer;
      int** rows;

      cTable(int width, int height);
      ~cTable();
      void Move_To_Next_Row();
      int Read_Column();
      void Move_To_Column(int index);
      void Write_Column(int value);
      void Rewind();
      cTable& operator=(cTable& other);
      void Clear();
      void Move_To_Row(int index);
      void Load_From_File(std::string name);
      void Save_To_File(std::string name);
      void Resize(int width, int height);
      void Dump();

  };

  class cPicture_Processor {

    public:
      int width;
      int height;
      int palette_size;
      sColor* palette;
      int** screen;

      cPicture_Processor(int width, int height);
      ~cPicture_Processor();
      void Load_Palette(std::string name);
      void Draw_Picture(cTable& picture, int x, int y, int mode);
      void Clear_Screen(sColor color);
      int Scan_Palette(sColor color);
      void Dump();

  };

  class cIO_Control {

    public:
      cArray<sSignal> signal_buffer;
      bool use_canvas;
      int width;
      int height;

      cIO_Control();
      sSignal Read_Signal();
      sSignal Read_Key();
      void Add_Key(int key);
      void Add_Mouse(int button, int x, int y);
      virtual void Draw_Image(std::string name, int x, int y, int width, int height, int angle, bool flip_x, bool flip_y);
      virtual void Draw_Canvas(int x, int y, int width, int height);
      virtual void Output_Text(std::string text, int x, int y, int red, int green, int blue);
      virtual void Box(int x, int y, int width, int height, int red, int green, int blue);
      virtual void Frame(int x, int y, int width, int height, int red, int green, int blue);
      virtual void Play_Sound(std::string name);
      virtual void Play_Music(std::string name);
      virtual void Silence();
      void Timeout(int delay);
      virtual void Refresh();
      virtual void Color(int red, int green, int blue);
      virtual void Update_Display(cPicture_Processor* pp);
      void Load(std::string name, cArray<tObject>& objects);
      void Save(std::string name, cArray<tObject>& objects);
      void Load(std::string name, cMatrix& matrix);
      void Save(std::string name, cMatrix& matrix);
      int Get_Random_Number(int lower, int upper);
      virtual int Get_Text_Width(std::string text);
      virtual int Get_Text_Height(std::string text);
      virtual void Set_Canvas_Mode();
      void Set_Screen_Target();
      void Set_Canvas_Target();
      virtual int Get_Image_Width(std::string name);
      virtual int Get_Image_Height(std::string name);
      virtual cArray<std::string> Get_File_List(std::string path);
      virtual std::string Get_Current_Folder();
      virtual std::string Get_File_Extension(std::string path);
      virtual std::string Get_File_Title(std::string path);
      virtual std::string Get_File_Name(std::string path);
      virtual void Set_Transparency(float value);

  };

  class cFile {

    public:
      cArray<std::string> lines;
      std::string name;
      int pointer;

      cFile(std::string name);
      void Read();
      void Write();
      void Add(std::string line);
      void Add(int number);
      void Add(tObject& object);
      void Remove(int index);
      int Count();
      std::string operator[](int index);
      std::string Get_Line();
      void operator>>(int& number);
      void operator>>=(tObject& object);
      void Clear();
      bool Has_More_Lines();

  };

  class cConfig {

    public:
      cHash<std::string, cValue> config;

      cConfig(std::string name);
      int Get_Property(std::string name);
      std::string Get_Text_Property(std::string name);

  };

  class cTerminal {

    public:
      int width;
      int height;
      int letter_w;
      int letter_h;
      int red;
      int green;
      int blue;
      cArray<tLine> lines;
      cIO_Control* io;
      int status;
      cArray<int> input_buffer;
      int counter;
      std::chrono::time_point<std::chrono::system_clock> time_stamp;
      int scroll_x;
      int scroll_y;

      cTerminal(int width, int height, int letter_w, int letter_h, cIO_Control* io);
      void Write_Letter(int letter);
      void Write_String(std::string text);
      void Set_Color(int red, int green, int blue);
      void Clear();
      void Read_Input();
      void Process_Keys();
      void Render();
      void Backspace();
      virtual void On_Read(std::string text);
      std::string Buffer_To_String();
      void Set_Error_Mode(bool error);

  };

  class cParameters {

    public:
      cHash<std::string, cValue> params;

      cParameters(int argc, char** argv, cArray<std::string> names);
      cValue& operator[] (std::string name);

  };

  class cBump_Map {

    public:
      sRectangle rect;

      cBump_Map();
      cBump_Map(int x, int y, int width, int height);
      cBump_Map(cFile& file, int tile_size);
      bool Is_Touching_Left(cBump_Map& bump_map);
      bool Is_Touching_Right(cBump_Map& bump_map);
      bool Is_Touching_Top(cBump_Map& bump_map);
      bool Is_Touching_Bottom(cBump_Map& bump_map);
      bool Is_Touching_Top_Left_Corner(cBump_Map& bump_map);
      bool Is_Touching_Bottom_Left_Corner(cBump_Map& bump_map);
      bool Is_Touching_Top_Right_Corner(cBump_Map& bump_map);
      bool Is_Touching_Bottom_Right_Corner(cBump_Map& bump_map);
      bool Is_Inside(cBump_Map& bump_map);
      bool Is_In_X_Range(cBump_Map& bump_map);
      bool Is_In_Y_Range(cBump_Map& bump_map);

  };

  template <typename T> class cPointer {

    public:
      T* pointer;

      cPointer();
      ~cPointer();
      void Init(T* pointer);

  };

  template <typename T> class cArray_Pointer {

    public:
      T* pointer;

      cArray_Pointer();
      ~cArray_Pointer();
      void Init(T* pointer);

  };

  class cLayout {

    public:
      cHash<std::string, tObject> components;
      std::string sel_component;
      std::string clicked;
      int width;
      int height;
      int cell_w;
      int cell_h;
      int red;
      int green;
      int blue;
      char** grid;
      cIO_Control* io;
      sPoint mouse_coords;
      sPoint mouse_down_coords;
      sPoint mouse_up_coords;
      sPoint mouse_over_coords;
      bool not_clicked;
      int key;
      std::string mouse_over;
      std::string mouse_down;
      std::string mouse_up;
      int button;

      cLayout(std::string config, cIO_Control* io);
      ~cLayout();
      void Clear_Grid();
      void Parse_Grid(cFile& file);
      void Parse_Layout(std::string name);
      bool Has_Entity();
      void Parse_Entity();
      void Parse_Box(tObject& entity);
      void Parse_Field(tObject& entity);
      void Parse_Panel(tObject& entity);
      void Parse_Button(tObject& entity);
      void Parse_Properties(cFile& file);
      void Render();
      virtual void On_Component_Init(tObject& entity);
      virtual void On_Component_Render(tObject& entity);
      sRectangle Get_Entity_Dimensions(tObject& entity);
      bool Is_Identifier(char letter);
      void Clear();

  };

  class cPage : public cLayout {
    
    public:
      cHash<std::string, tObject_List> sprite_layers;
      cHash<std::string, tObject> sprite_palette;
    
      cPage(std::string config, cIO_Control* io);
      void On_Component_Init(tObject& entity);
      void On_Component_Render(tObject& entity);
      virtual void On_Init();
      void Init_Field(tObject& entity);
      void Render_Field(tObject& entity);
      void Init_Grid_View(tObject& entity);
      void Render_Grid_View(tObject& entity);
      void Render_Label(tObject& entity);
      void Init_List(tObject& entity);
      void Render_List(tObject& entity);
      void Render_Button(tObject& entity);
      virtual void On_Button_Click(tObject& entity);
      void Init_Toolbar(tObject& entity);
      void Render_Toolbar(tObject& entity);
      virtual void On_List_Click(tObject& entity, std::string text);
      virtual void On_Toolbar_Click(tObject& entity, std::string label);
      void Scroll_Component(tObject& entity);
      void Clear_Grid(tObject& entity);
      sRectangle Parse_Rectangle(std::string text);
      std::string Get_Grid_Cell(tObject& entity, int x, int y);
      void Set_Grid_Cell(tObject& entity, int x, int y, std::string value);
      void Add_List_Item(tObject& entity, std::string value);
      void Remove_List_Item(tObject& entity, int index);
      int Get_List_Item_Count(tObject& entity);
      std::string Get_List_Item(tObject& entity, int index);
      void Clear_List(tObject& entity);
      void Add_Toolbar_Item(tObject& entity, std::string value);
      void Remove_Toolbar_Item(tObject& entity, int index);
      int Get_Toolbar_Item_Count(tObject& entity);
      void Clear_Toolbar(tObject& entity);
      void Init_Bump_Map_Editor(tObject& entity);
      void Render_Bump_Map_Editor(tObject& entity);
      sRectangle Get_Box_Coords(tObject& entity);
      void Set_Box_Coords(tObject& entity, sRectangle box);
      void Refresh_Bump_Map_Editor(tObject& entity);
      void Load_Bump_Map(tObject& entity, tObject& bump_map);
      void Save_Bump_Map(tObject& entity, tObject& bump_map);
      void Load_Sprite_For_Bump_Map(tObject& entity, std::string name);
      void Clear_Bump_Map_Editor(tObject& entity);
      void Init_Map_Editor(tObject& entity);
      void Render_Map_Editor(tObject& entity);
      void Load_Sprite_Palette(std::string name, tObject& entity);
      void Clear_Level(tObject& entity);
      void Load_Level(std::string name, tObject& entity);
      void Save_Level(std::string name, tObject& entity);
      void Process_Map_Editor_Keys(tObject& entity);
      void Process_Map_Editor_Mouse(tObject& entity);
      void Set_Timer(tObject& entity);
      int Select_Sprite(sPoint coords, tObject& entity);
      int Create_Sprite(sPoint coords, tObject& entity);
      void Render_Sprites(tObject& entity);
      void Destar_Sprite(tObject& sprite);
      cArray<std::string> Get_Level_List();
      virtual void On_Sprite_Click(tObject& entity, tObject& sprite);
      virtual void On_Sprite_Move(tObject& entity, tObject& sprite);
      virtual void On_Sprite_Resize(tObject& entity, tObject& sprite);
      virtual void On_Sprite_Nudge(tObject& entity, tObject& sprite);
      virtual void On_Sprite_Delete(tObject& entity, tObject sprite);
      void Load_Object_From_Grid(tObject& object, std::string name);
      void Save_Object_To_Grid(tObject& object, std::string name);

  };

  class cPage_Manager {

    public:
      cHash<std::string, cPointer<cPage> > pages;
      std::string sel_page;

      tObject& operator[] (std::string ref);
      void Render();
      void Go_To_Page(std::string name);
      void Add_Page(cPage* page, std::string name);

  };

  cArray<std::string> Parse_Sausage_Text(std::string text, std::string delimiter);
  int Text_To_Number(std::string text);
  std::string Number_To_Text(int number);
  cArray<std::string> Parse_C_Lesh_Line(std::string line);
  std::string C_Lesh_String_To_Cpp_String(std::string text);
  bool Is_Point_In_Box(sPoint point, sRectangle box);
  std::string Join(cArray<std::string>& tokens, std::string glue);
  void Check_Condition(bool condition, std::string message);

}