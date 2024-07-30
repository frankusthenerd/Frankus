// ============================================================================
// Frankus Library (Implementation)
// Programmed by Francois Lamini
// ============================================================================

#include "Frankus.h"

namespace Frankus {

  // **************************************************************************
  // Array Implementation
  // **************************************************************************

  /**
   * Creates a new array with the default size.
   */
  template <typename T> cArray<T>::cArray() {
    this->Init();
  }

  /**
   * Copies another array to this one.
   * @param other The other array.
   */
  template <typename T> cArray<T>::cArray(cArray<T>& other) {
    this->Init();
    this->Copy(other);
  }

  /**
   * Copies another array to this one.
   * @param other The other array.
   */
  template <typename T> cArray<T>::cArray(const cArray<T>& other) {
    this->Init();
    this->Copy(other);
  }

  /**
   * Assigns another array to this one.
   * @param other The other array.
   * @return This array.
   */
  template <typename T> cArray<T>& cArray<T>::operator= (cArray<T>& other) {
    this->Init();
    this->Copy(other);
    return *this;
  }

  /**
   * Assigns another array to this one.
   * @param other The other array.
   * @return This array.
   */
  template <typename T> cArray<T>& cArray<T>::operator= (const cArray<T>& other) {
    this->Init();
    this->Copy(other);
    return *this;
  }

  /**
   * Frees the array.
   */
  template <typename T> cArray<T>::~cArray() {
    this->Free();
  }

  /**
   * Adds an item to the array.
   * @param item The item.
   * @throws An error if we ran out of space.
   */
  template <typename T> void cArray<T>::Add(T item) {
    int size = this->Get_Size();
    if (this->pointer == size) { // Ran out of space?
      this->Alloc_Block();
    }
    (*this)[this->pointer++] = item;
  }

  /**
   * Extends the array by one item. The item is not initialized.
   * @return The reference to the item inside the array.
   */
  template <typename T> T& cArray<T>::Add() {
    int size = this->Get_Size();
    if (this->pointer == size) { // Ran out of space?
      this->Alloc_Block();
    }
    return (*this)[this->pointer++];
  }

  /**
   * Removes an item from the array.
   * @param index The index of the item to remove.
   * @return The item that was removed.
   */
  template <typename T> T cArray<T>::Remove(int index) {
    T item = (*this)[index];
    for (int item_index = index + 1; item_index < this->pointer; item_index++) {
      (*this)[item_index - 1] = (*this)[item_index];
    }
    this->pointer--;
    return item;
  }

  /**
   * Pushes an item onto the back of an array.
   * @param item The item to push.
   */
  template <typename T> void cArray<T>::Push(T item) {
    this->Add(item);
  }

  /**
   * Removes an item from the back of the array.
   * @return The item removed.
   */
  template <typename T> T cArray<T>::Pop() {
    return this->Remove(this->pointer - 1);
  }

  /**
   * Adds an item to the front of the array.
   * @param item The item to add.
   */
  template <typename T> void cArray<T>::Unshift(T item) {
    int size = this->Get_Size();
    if (this->pointer == size) { // Ran out of space?
      this->Alloc_Block();
    }
    // Shift everything over to make space.
    this->pointer++; // Increase size.
    for (int item_index = this->pointer - 1; item_index > 0; item_index--) {
      (*this)[item_index] = (*this)[item_index - 1];
    }
    (*this)[0] = item;
  }

  /**
   * Removes an item from the front of the array.
   * @return The item in the front of the array.
   */
  template <typename T> T cArray<T>::Shift() {
    return this->Remove(0);
  }

  /**
   * Inserts an item at the specified index into the array.
   * @param item The item to insert.
   * @param index The index to insert the item before.
   * @throws An error if there is no more space in the array or the index is invalid.
   */
  template <typename T> void cArray<T>::Insert(T item, int index) {
    int size = this->Get_Size();
    if (this->pointer == size) { // Ran out of space?
      this->Alloc_Block();
    }
    this->pointer++;
    for (int item_index = this->pointer - 1; item_index > index; item_index--) {
      (*this)[item_index] = (*this)[item_index - 1];
    }
    (*this)[index] = item;
  }

  /**
   * Gets the number of items in the array.
   * @return The number of items in the array.
   */
  template <typename T> int cArray<T>::Count() {
    return this->pointer;
  }

  /**
   * Allocates a new block and expands the table if necessary.
   */
  template <typename T> void cArray<T>::Alloc_Block() {
    this->Reallocate_Table();
    this->items[this->block_count++] = new T[BLOCK_SIZE];
  }

  /**
   * Reallocates the table to make room for more blocks if needed.
   */
  template <typename T> void cArray<T>::Reallocate_Table() {
    if (this->block_count == this->table_size) { // Not enough room?
      // Reallocate table.
      this->table_size += TABLE_INCR;
      T** table = new T* [this->table_size];
      // Copy entries to new table.
      for (int entry_index = 0; entry_index < this->block_count; entry_index++) {
        table[entry_index] = this->items[entry_index]; // Reassign block to new table.
      }
      if (this->items) {
        delete[] this->items; // Remove.
      }
      this->items = table; // Reassign.
    }
  }

  /**
   * Copies the internal array.
   * @param source The source array.
   */
  template <typename T> void cArray<T>::Copy(cArray<T>& other) {
    T** table = new T* [other.table_size];
    for (int entry_index = 0; entry_index < other.block_count; entry_index++) {
      table[entry_index] = new T[BLOCK_SIZE];
      for (int item_index = 0; item_index < BLOCK_SIZE; item_index++) {
        table[entry_index][item_index] = other.items[entry_index][item_index];
      }
    }
    this->Free();
    this->items = table;
    this->table_size = other.table_size;
    this->block_count = other.block_count;
    this->pointer = other.pointer;
  }

  /**
   * Copies the internal array.
   * @param source The source array.
   */
  template <typename T> void cArray<T>::Copy(const cArray<T>& other) {
    T** table = new T* [other.table_size];
    for (int entry_index = 0; entry_index < other.block_count; entry_index++) {
      table[entry_index] = new T[BLOCK_SIZE];
      for (int item_index = 0; item_index < BLOCK_SIZE; item_index++) {
        table[entry_index][item_index] = other.items[entry_index][item_index];
      }
    }
    this->Free();
    this->items = table;
    this->table_size = other.table_size;
    this->block_count = other.block_count;
    this->pointer = other.pointer;
  }

  /**
   * Accesses an item from the array.
   * @param index The index of the item.
   * @return The item.
   * @throws An error if the index is not valid.
   */
  template <typename T> T& cArray<T>::operator[] (int index) {
    Check_Condition(((index >= 0) && (index < this->pointer)), "Index is out of bounds.");
    int item_index = index % BLOCK_SIZE;
    int block_index = index / BLOCK_SIZE;
    return this->items[block_index][item_index];
  }

  /**
   * Prints out the array contents.
   */
  template <typename T> void cArray<T>::Print() {
    for (int item_index = 0; item_index < this->pointer; item_index++) {
      // std::cout << "[" << item_index << "]=" << (*this)[item_index] << std::endl;
    }
  }

  /**
   * Initializes the array.
   */
  template <typename T> void cArray<T>::Init() {
    this->table_size = 0;
    this->block_count = 0;
    this->pointer = 0;
    this->items = NULL;
    this->Alloc_Block();
  }

  /**
   * Frees the array of blocks.
   */
  template <typename T> void cArray<T>::Free() {
    if (this->items) {
      for (int entry_index = 0; entry_index < this->block_count; entry_index++) {
        delete[] this->items[entry_index]; // Will call value destructor if object.
      }
      delete[] this->items;
    }
  }

  /**
   * Gets the max size of the array.
   * @return The size of the array in items.
   */
  template <typename T> int cArray<T>::Get_Size() {
    return (this->block_count * BLOCK_SIZE);
  }

  /**
   * Clears out the array.
   */
  template <typename T> void cArray<T>::Clear() {
    this->pointer = 0;
  }

  /**
   * Accesses an item from the front of the array.
   * @return The item on the front.
   */
  template <typename T> T& cArray<T>::Peek_Front() {
    return (*this)[0];
  }

  /**
   * Accesses an item from the back of the array.
   * @return The item on the back.
   */
  template <typename T> T& cArray<T>::Peek_Back() {
    return (*this)[this->pointer - 1];
  }

  // **************************************************************************
  // Hash Implementation
  // **************************************************************************

  /**
   * Adds a new key/value pair.
   * @param key The key value.
   * @param value The value.
   */
  template <typename K, typename V> void cHash<K, V>::Add(K key, V value) {
    // Look for key.
    int hash_key = this->Get_Hash_Key(key);
    if (hash_key == NO_VALUE_FOUND) {
      this->keys.Add(key);
      this->values.Add(value);
    }
    else {
      this->values[hash_key] = value;
    }
  }

  /**
   * Removes a key/value pair from the hash.
   * @param key The key to match to the pair.
   * @throws An error if the pair does not exist.
   */
  template <typename K, typename V> void cHash<K, V>::Remove(K key) {
    int hash_key = this->Get_Hash_Key(key);
    if (hash_key == NO_VALUE_FOUND) {
      throw cError("Key was not found!");
    }
    else {
      this->keys.Remove(hash_key);
      this->values.Remove(hash_key);
    }
  }

  /**
   * Retrieves a value given a key.
   * @param key The key associated with the value.
   * @return The value associated with the key.
   */
  template <typename K, typename V> V& cHash<K, V>::operator[] (K key) {
    int hash_key = this->Get_Hash_Key(key);
    if (hash_key == NO_VALUE_FOUND) {
      V value{}; // Initialize default value.
      this->Add(key, value);
      hash_key = this->keys.Count() - 1;
    }
    return this->values[hash_key];
  }

  /**
   * Gets the index key associated with the key of the hash.
   * @param key The key to lookup.
   * @return The index of the key or NO_VALUE_FOUND if the key was not found.
   */
  template <typename K, typename V> int cHash<K, V>::Get_Hash_Key(K key) {
    int count = this->keys.Count();
    int hash_key = NO_VALUE_FOUND;
    for (int key_index = 0; key_index < count; key_index++) {
      if (this->keys[key_index] == key) {
        hash_key = key_index;
        break;
      }
    }
    return hash_key;
  }

  /**
   * Clears out the hash.
   */
  template <typename K, typename V> void cHash<K, V>::Clear() {
    this->keys.Clear();
    this->values.Clear();
  }

  /**
   * Gets the number of keys/values in the hash.
   * @return The count of items.
   */
  template <typename K, typename V> int cHash<K, V>::Count() {
    return this->keys.Count();
  }

  /**
   * Checks to see if a key exists.
   * @param key The key.
   * @return True if the key exists, false otherwise.
   */
  template <typename K, typename V> bool cHash<K, V>::Does_Key_Exist(K key) {
    int hash_key = this->Get_Hash_Key(key);
    return (hash_key != NO_VALUE_FOUND);
  }

  // **************************************************************************
  // Error Implementation
  // **************************************************************************

  /**
   * Initializes an error with a message.
   * @param message The message to give the error.
   */
  cError::cError(std::string message) {
    this->message = message;
  }

  /**
   * Prints an error to the console.
   */
  void cError::Print() {
    std::cout << "Error: " << this->message << std::endl;
  }

  // **************************************************************************
  // File Implementation
  // **************************************************************************

  /**
   * Creates a new file object.
   * @param name The name of the file.
   */
  cFile::cFile(std::string name) {
    this->name = name;
    this->pointer = 0;
  }

  /**
   * Reads a file from disk.
   * @throws An error if something went wrong.
   */
  void cFile::Read() {
    std::ifstream file(this->name, std::ios::binary);
    if (file) {
      this->Clear(); // Clear out lines.
      file.seekg(0, std::ios::end);
      int size = file.tellg();
      file.seekg(0);
      std::string line = "";
      bool new_line_read = false;
      for (int byte_index = 0; byte_index < size; byte_index++) {
        char letter = 0;
        file.get(letter);
        if (file.good()) {
          if (letter == '\r') { // Windows/Mac
            this->lines.Add(line);
            line = "";
            new_line_read = true;
          }
          else if (letter == '\n') { // Unix/Linux
            if (!new_line_read) {
              this->lines.Add(line);
              line = "";
            }
            new_line_read = false;
          }
          else {
            line += letter;
          }
        }
        else {
          throw cError("Problem reading file " + this->name + ".");
        }
      }
      // Add the last line.
      if (line.length() > 0) {
        this->lines.Add(line);
      }
    }
    else {
      throw cError("Could not read file " + this->name + ".");
    }
  }

  /**
   * Writes the file to disk.
   * @throws An error if the file could not be saved.
   */
  void cFile::Write() {
    std::ofstream file(this->name, std::ios::binary);
    if (file) {
      int line_count = this->lines.Count();
      for (int line_index = 0; line_index < line_count; line_index++) {
        int letter_count = this->lines[line_index].length();
        for (int letter_index = 0; letter_index < letter_count; letter_index++) {
          file << this->lines[line_index][letter_index];
        }
        file << '\n';
      }
    }
    else {
      throw cError("Could not write file " + this->name + ".");
    }
  }

  /**
   * Adds a line to the file.
   * @param line The line to add.
   */
  void cFile::Add(std::string line) {
    this->lines.Add(line);
  }

  /**
   * Adds a number to the file.
   * @param number The number to add.
   */
  void cFile::Add(int number) {
    this->lines.Add(Number_To_Text(number));
  }

  /**
   * Adds an object to the file.
   * @param object The object to add to the file.
   */
  void cFile::Add(tObject& object) {
    int field_count = object.Count();
    this->Add("object");
    for (int field_index = 0; field_index < field_count; field_index++) {
      std::string name = object.keys[field_index];
      if (object.values[field_index].type == eVALUE_NUMBER) {
        this->Add(name + "=" + Number_To_Text(object.values[field_index].number));
      }
      else if (object.values[field_index].type == eVALUE_STRING) {
        this->Add(name + "=" + object.values[field_index].string);
      }
    }
    this->Add("end");
  }

  /**
   * Removes a line at a specified index.
   * @param index The index of the line to remove.
   * @throws An error if the index is not valid.
   */
  void cFile::Remove(int index) {
    this->lines.Remove(index);
  }

  /**
   * Gets the number of lines in the file.
   * @return The number of lines in the file.
   */
  int cFile::Count() {
    return this->lines.Count();
  }

  /**
   * Gets the string at the index.
   * @param index The index of the string.
   * @return The string at the index.
   * @throws An error if the string is not present.
   */
  std::string cFile::operator[](int index) {
    return this->lines[index];
  }

  /**
   * Gets a line from the file sequentially.
   * @return The read line.
   * @throws An error if no more lines can be read.
   */
  std::string cFile::Get_Line() {
    Check_Condition(this->Has_More_Lines(), "No more lines to read.");
    return this->lines[this->pointer++];
  }

  /**
   * Reads a numeric value from an index.
   * @param number The number to read.
   * @throws An error if the number could not be read.
   */
  void cFile::operator>>(int& number) {
    Check_Condition(this->Has_More_Lines(), "No more lines to read.");
    number = Text_To_Number(this->lines[this->pointer++]);
  }

  /**
   * Reads an object from the file.
   * @param object The object to read in.
   * @throws An error if the object could not be read.
   */
  void cFile::operator>>=(tObject& object) {
    Check_Condition(this->Has_More_Lines(), "No more lines to read.");
    std::string line = this->lines[this->pointer++];
    if (line != "object") {
      throw cError("Object identifier missing.");
    }
    while (line != "end") {
      Check_Condition(this->Has_More_Lines(), "No more lines to read.");
      line = this->lines[this->pointer++];
      cArray<std::string> pair = Parse_Sausage_Text(line, "=");
      if (pair.Count() == 2) {
        std::string name = pair[0];
        std::string value = pair[1];
        try {
          object[name] = cValue(Text_To_Number(value));
        }
        catch (cError number_error) {
          object[name] = cValue(value);
        }
      }
    }
  }

  /**
   * Clears out the file's lines.
   */
  void cFile::Clear() {
    this->lines.Clear();
    this->pointer = 0;
  }

  /**
   * Determines if a file has more lines.
   * @return True if there are more lines, false otherwise.
   */
  bool cFile::Has_More_Lines() {
    return (this->pointer < this->lines.Count());
  }

  // **************************************************************************
  // Config Module Implementation
  // **************************************************************************

  /**
   * Creates a new config file.
   * @param name The name of the config file.
   * @throws An error if the config file could not be loaded.
   */
  cConfig::cConfig(std::string name) {
    cFile config_file(name + ".txt");
    config_file.Read();
    int line_count = config_file.Count();
    for (int line_index = 0; line_index < line_count; line_index++) {
      std::string line = config_file.lines[line_index];
      cArray<std::string> pair = Parse_Sausage_Text(line, "=");
      if (pair.Count() == 2) {
        std::string name = pair[0];
        cValue value;
        try {
          value.Set_Number(Text_To_Number(pair[1]));
        }
        catch (cError number_error) {
          value.Set_String(pair[1]);
        }
        this->config[name] = value;
      }
    }
  }

  /**
   * Gets a numeric property value.
   * @param name The name of the property.
   * @return The value of the property.
   * @throws An error if the property does not exist.
   */
  int cConfig::Get_Property(std::string name) {
    if (!this->config.Does_Key_Exist(name)) {
      throw Frankus::cError("Property value " + name + " does not exist.");
    }
    return this->config[name].number;
  }

  /**
   * Gets a string property value.
   * @param name The name of the property.
   * @return The value of the property. 
   * @throws An error if the property does not exist.
   */
  std::string cConfig::Get_Text_Property(std::string name) {
    Check_Condition(this->config.Does_Key_Exist(name), "Property value " + name + " does not exist.");
    return this->config[name].string;
  }

  // **************************************************************************
  // Value Implementation
  // **************************************************************************

  /**
   * Creates a new value.
   */
  cValue::cValue() {
    this->Set_Number(0);
  }

  /**
   * Create a numeric value.
   * @param number The numeric value.
   */
  cValue::cValue(int number) {
    this->Set_Number(number);
  }

  /**
   * Creates a string value.
   * @param string The string value.
   */
  cValue::cValue(std::string string) {
    this->Set_String(string);
  }

  /**
   * Sets a numeric value.
   * @param number The number.
   */
  void cValue::Set_Number(int number) {
    this->type = eVALUE_NUMBER;
    this->number = number;
    this->string = Number_To_Text(number);
  }

  /**
   * Sets a string value.
   * @param string The string value.
   */
  void cValue::Set_String(std::string string) {
    this->type = eVALUE_STRING;
    this->string = string;
    try {
      this->number = Text_To_Number(string);
    }
    catch (cError number_error) {
      this->number = 0;
    }
  }

  /**
   * Copies another value to this value.
   * @param other The other value.
   */
  cValue& cValue::operator=(const cValue& other) {
    this->type = other.type;
    this->number = other.number;
    this->string = other.string;
    return (*this);
  }

  /**
   * Assigns a numeric value.
   * @param number The numeric value.
   */
  void cValue::operator=(const int number) {
    this->Set_Number(number);
  }

  /**
   * Assigns a string value. It can be numeric which will convert it to a number.
   * @param string The string value.
   */
  void cValue::operator=(const std::string string) {
    try {
      this->Set_Number(Text_To_Number(string)); // Try to convert to number.
    }
    catch (cError number_error) {
      this->Set_String(string);
    }
  }

  /**
   * Converts the value to numeric form.
   * @throws An error if the numeric string is invalid.
   */
  void cValue::Convert_To_Number() {
    this->number = Text_To_Number(this->string);
  }

  /**
   * Converts the value to a string.
   */
  void cValue::Convert_To_String() {
    this->string = Number_To_Text(this->number);
  }

  // **************************************************************************
  // I/O Control Implementation
  // **************************************************************************

  /**
   * Initializes the I/O control.
   */
  cIO_Control::cIO_Control() {
    std::srand(std::time(NULL));
    this->use_canvas = false;
    this->width = 400;
    this->height = 300;
  }

  /**
   * Reads a signal from the signal buffer.
   * @return The signal from the signal buffer.
   */
  sSignal cIO_Control::Read_Signal() {
    sSignal signal = { eSIGNAL_NONE, 0, 0, eBUTTON_NONE };
    if (this->signal_buffer.Count() > 0) {
      signal = this->signal_buffer.Shift();
    }
    return signal;
  }

  /**
   * Reads a key from the buffer. Leaves any other signals in.
   * @return The read key or nothing.
   */
  sSignal cIO_Control::Read_Key() {
    sSignal signal = { eSIGNAL_NONE, 0, 0, eBUTTON_NONE };
    // Find a key signal.
    int signal_count = this->signal_buffer.Count();
    for (int signal_index = signal_count - 1; signal_index >= 0; signal_index--) { // Back to front.
      if (this->signal_buffer[signal_index].code != eSIGNAL_MOUSE) {
        signal = this->signal_buffer.Remove(signal_index);
        break;
      }
    }
    return signal;
  }

  /**
   * Adds a key signal to the buffer.
   * @param key The key to add.
   */
  void cIO_Control::Add_Key(int key) {
    this->signal_buffer.Push({ key, 0, 0, eBUTTON_NONE });
  }

  /**
   * Adds a mouse signal.
   * @param button The pressed button or none.
   * @param x The mouse x coordinate.
   * @param y The mouse y coordinate.
   */
  void cIO_Control::Add_Mouse(int button, int x, int y) {
    // std::cout << "button=" << button << ", x=" << x << ", y=" << y << std::endl;
    this->signal_buffer.Push({ eSIGNAL_MOUSE, { x, y }, button});
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
   */
  void cIO_Control::Draw_Image(std::string name, int x, int y, int width, int height, int angle, bool flip_x, bool flip_y) {
    // To be implemented in the app.
  }

  /**
   * Draws the background canvas to the screen.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param width The width of the clipping rectangle.
   * @param height The height of the clipping rectangle.
   */
  void cIO_Control::Draw_Canvas(int x, int y, int width, int height) {
    // To be implemented in the app.
  }

  /**
   * Outputs text to the screen.
   * @param text The text to output.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param red The red component of the color.
   * @param green The green component of the color.
   * @param blue The blue component of the color.
   */
  void cIO_Control::Output_Text(std::string text, int x, int y, int red, int green, int blue) {
    // To be implemented in the app.
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
  void cIO_Control::Box(int x, int y, int width, int height, int red, int green, int blue) {
    // To be implemented in the app.
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
  void cIO_Control::Frame(int x, int y, int width, int height, int red, int green, int blue) {
    // To be implemented in app.
  }

  /**
   * Plays a sound.
   * @param name The name of the sound.
   */
  void cIO_Control::Play_Sound(std::string name) {
    // To be implemented in the app.
  }

  /**
   * Plays a music track.
   * @param name The name of the music track.
   */
  void cIO_Control::Play_Music(std::string name) {
    // To be implemented in the app.
  }

  /**
   * Turns off the sounds playing.
   */
  void cIO_Control::Silence() {
    // To be implemented in the app.
  }

  /**
   * Delays execution for specified number of milliseconds.
   * @param delay The number of milliseconds to delay execution.
   */
  void cIO_Control::Timeout(int delay) {
    auto start = std::chrono::system_clock::now();
    bool done = false;
    while (!done) {
      auto end = std::chrono::system_clock::now();
      auto diff = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
      if (diff.count() >= delay) { // Time is up!
        break;
      }
    }
  }

  /**
   * Refreshes the screen.
   */
  void cIO_Control::Refresh() {
    // To be implemented in the app.
  }

  /**
   * Colors the screen.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   */
  void cIO_Control::Color(int red, int green, int blue) {
    // To be implemented in the app.
  }

  /**
   * Causes the screen to update.
   * param pp The picture processor.
   */
  void cIO_Control::Update_Display(cPicture_Processor* pp) {
    // To be implemented in subclass.
  }

  /**
   * Loads an array of objects from a file.
   * @param name The name of the file.
   * @param objects The array objects to load.
   * @throws An error if the file could not be loaded.
   */
  void cIO_Control::Load(std::string name, cArray<tObject>& objects) {
    cFile file(name);
    file.Read();
    while (file.Has_More_Lines()) {
      tObject object;
      file >>= object;
      objects.Add(object);
    }
  }

  /**
   * Saves a file from a list of blocks.
   * @param name The name of the file.
   * @param objects The objects to save.
   * @throws An error if the file could not be saved.
   */
  void cIO_Control::Save(std::string name, cArray<tObject>& objects) {
    cFile file(name);
    int obj_count = objects.Count();
    for (int obj_index = 0; obj_index < obj_count; obj_index++) {
      tObject& object = objects[obj_index];
      file.Add(object);
    }
    file.Write();
  }

  /**
   * Loads a file into a matrix.
   * @param name The name of the file.
   * @param matrix The matrix to load.
   * @throws An error if the file could not be loaded.
   */
  void cIO_Control::Load(std::string name, cMatrix& matrix) {
    cFile file(name);
    file.Read();
    int width = 0;
    int height = 0;
    file >> width;
    file >> height;
    matrix.Resize(width, height);
    for (int row_index = 0; row_index < height; row_index++) {
      std::string line = file.Get_Line();
      cArray<std::string> tokens = Parse_C_Lesh_Line(line);
      if (tokens.Count() == width) {
        for (int col_index = 0; col_index < width; col_index++) {
          matrix[row_index][col_index] = Text_To_Number(tokens[col_index]);
        }
      }
      else {
        throw cError("Invalid row width.");
      }
    }
  }

  /**
   * Saves a file from a matrix.
   * @param name The name of the file.
   * @param matrix The matrix to save.
   * @throws An error if the file could not be saved.
   */
  void cIO_Control::Save(std::string name, cMatrix& matrix) {
    cFile file(name);
    for (int row_index = 0; row_index < matrix.height; row_index++) {
      std::string line = "";
      for (int col_index = 0; col_index < matrix.width; col_index++) {
        line += Number_To_Text(matrix[row_index][col_index]);
        if (col_index < (matrix.width - 1)) {
          line += " ";
        }
      }
      file.Add(line);
    }
    file.Write();
  }

  /**
   * Gets a new random number.
   * @param lower The lower bound.
   * @param upper The upper bound.
   * @return The random number.
   */
  int cIO_Control::Get_Random_Number(int lower, int upper) {
    return (lower + ((std::rand() << 8) % (upper - lower + 1)));
  }

  /**
   * Gets the width of the text.
   * @param text The text to measure.
   * @return The width of the text.
   */
  int cIO_Control::Get_Text_Width(std::string text) {
    // To be implemented in app.
    return 0;
  }

  /**
   * Gets the height of the text.
   * @param text The text to measure.
   * @return The height of the text.
   */
  int cIO_Control::Get_Text_Height(std::string text) {
    // To be implemented in app.
    return 0;
  }

  /**
   * Sets the canvas mode based on the flag.
   */
  void cIO_Control::Set_Canvas_Mode() {
    // To be implemented in app.
  }

  /**
   * Sets the screen drawing mode.
   */
  void cIO_Control::Set_Screen_Target() {
    this->use_canvas = false;
  }

  /**
   * Sets the canvas drawing mode.
   */
  void cIO_Control::Set_Canvas_Target() {
    this->use_canvas = true;
  }

  /**
   * Gets the width of the image.
   * @param name The name of the image.
   * @return The width of the image in pixels.
   */
  int cIO_Control::Get_Image_Width(std::string name) {
    // To be implemented in app.
    return 0;
  }

  /**
   * Gets the height of the image.
   * @param name The name of the image.
   * @return The height of the image in pixels.
   */
  int cIO_Control::Get_Image_Height(std::string name) {
    // To be implemented in app.
    return 0;
  }

  /**
   * Gets a list of files from a directory path.
   * @param path The path to browse.
   * @return A list of files in the folder.
   */
  cArray<std::string> cIO_Control::Get_File_List(std::string path) {
    // To be implemented in the app.
    cArray<std::string> files;
    return files;
  }

  /**
   * Gets the current folder where the app is running.
   * @return The folder path.
   */
  std::string cIO_Control::Get_Current_Folder() {
    return "";
  }

  /**
   * Gets the extension of a file based on the path.
   * @param path The file path.
   * @return The file extension.
   */
  std::string cIO_Control::Get_File_Extension(std::string path) {
    // To be implemented in the app.
    return "";
  }

  /**
   * Gets the title of the file.
   * @param path The file path.
   * @return The file title which is the base name.
   */
  std::string cIO_Control::Get_File_Title(std::string path) {
    // To be implemented in the app.
    return "";
  }

  /**
   * Gets the name of the file.
   * @param path The file path.
   * @return The name of the file.
   */
  std::string cIO_Control::Get_File_Name(std::string path) {
    // To be implemented in the app.
    return "";
  }

  /**
   * Sets the transparency for the display.
   * @param value The value of the transparency from 0 to 1.
   */
  void cIO_Control::Set_Transparency(float value) {
    // To be implemented in the app.
  }

  // **************************************************************************
  // List Implementation
  // **************************************************************************

  /**
   * Creates a list with one item.
   */
  cList::cList() {
    this->items.Add(0);
  }

  /**
   * Creates a new list of the specified size.
   * @param size The size of the list.
   */
  cList::cList(int size) {
    for (int item_index = 0; item_index < size; item_index++) {
      this->items.Add(0);
    }
  }

  /**
   * Accesses the item at the index.
   * @param index The index of the item.
   * @return The reference to the item.
   * @throws An error if the index is out of bounds.
   */
  int& cList::operator[](int index) {
    if ((index < 0) || (index >= this->items.Count())) {
      throw cError("List index is out of bounds.");
    }
    return this->items[index];
  }

  /**
   * Assigns a list to another.
   * @param other The other list.
   * @return This list.
   */
  cList& cList::operator=(const cList& other) {
    this->items = other.items;
    return (*this);
  }

  /**
   * Clears out the list.
   */
  void cList::Clear() {
    int item_count = this->items.Count();
    for (int item_index = 0; item_index < item_count; item_index++) {
      this->items[item_index] = 0;
    }
  }

  /**
   * Adds a value to the list.
   * @param value The value to add.
   */
  void cList::Add(int value) {
    this->items.Add(value);
  }

  /**
   * Removes an item from the list.
   * @param index The index of the item.
   * @throws An error if the index is invalid.
   */
  void cList::Remove(int index) {
    if ((index < 0) || (index >= this->items.Count())) {
      throw cError("Invalid index.");
    }
    this->items.Remove(index);
  }

  /**
   * Gets the count of the items.
   * @return The number of items.
   */
  int cList::Count() {
    return this->items.Count();
  }

  // **************************************************************************
  // Matrix Implementation
  // **************************************************************************

  /**
   * Creates a 1x1 matrix.
   */
  cMatrix::cMatrix() {
    this->Resize(1, 1);
  }

  /**
   * Creates a new matrix with a specified size.
   * @param width The width of the matrix.
   * @param height The height of the matrix.
   */
  cMatrix::cMatrix(int width, int height) {
    this->Resize(width, height);
  }

  /**
   * Gets the list at the index.
   * @param index The index of the list.
   * @return The list reference.
   * @throws An error if the index is out of bounds.
   */
  cList& cMatrix::operator[](int index) {
    if ((index < 0) || (index >= this->height)) {
      throw cError("Index is out of bounds for matrix.");
    }
    return this->rows[index];
  }

  /**
   * Clears out the matrix.
   */
  void cMatrix::Clear() {
    int row_count = this->rows.Count();
    for (int row_index = 0; row_index < row_count; row_index++) {
      this->rows[row_index].Clear();
    }
  }

  /**
   * Resizes the matrix.
   * @param width The new width.
   * @param height The new height.
   */
  void cMatrix::Resize(int width, int height) {
    this->width = width;
    this->height = height;
    this->rows.Clear();
    for (int row_index = 0; row_index < height; row_index++) {
      cList list(width);
      this->rows.Add(list);
    }
  }

  // **************************************************************************
  // Terminal Implementation
  // **************************************************************************

  /**
   * Creates a new terminal.
   * @param width The width of the terminal, in characters.
   * @param height The height of the terminal, in characters.
   * @param letter_w The width of a single letter.
   * @param letter_h The height of a single letter.
   * @param io The I/O control.
   */
  cTerminal::cTerminal(int width, int height, int letter_w, int letter_h, cIO_Control* io) {
    this->width = width;
    this->height = height;
    this->letter_w = letter_w;
    this->letter_h = letter_h;
    this->red = 0;
    this->green = 0;
    this->blue = 0;
    this->io = io;
    this->status = eSTATUS_OUTPUT;
    this->counter = 0;
    // Add first line.
    tLine first_line;
    this->lines.Add(first_line);
    // Add time stamp.
    this->time_stamp = std::chrono::system_clock::now();
    this->scroll_x = 0;
    this->scroll_y = 0;
  }

  /**
   * Writes a letter to the line buffer.
   * @param letter The letter to write.
   */
  void cTerminal::Write_Letter(int letter) {
    if (letter == '\n') {
      tLine new_line;
      this->lines.Add(new_line); // Push in new line.
      if (this->lines.Count() > this->height) {
        this->scroll_y++;
      }
    }
    else {
      tLine& last_line = this->lines.Peek_Back(); // Get last line.
      sLetter l;
      l.letter = letter;
      l.red = this->red;
      l.green = this->green;
      l.blue = this->blue;
      last_line.Add(l);
    }
  }

  /**
   * Writes a string to the terminal.
   * @param text The text to output to the terminal.
   */
  void cTerminal::Write_String(std::string text) {
    int letter_count = text.length();
    for (int letter_index = 0; letter_index < letter_count; letter_index++) {
      this->Write_Letter(text[letter_index]);
    }
  }

  /**
   * Sets the color of the terminal text.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   */
  void cTerminal::Set_Color(int red, int green, int blue) {
    this->red = red;
    this->green = green;
    this->blue = blue;
  }

  /**
   * This clears out the terminal.
   */
  void cTerminal::Clear() {
    this->lines.Clear();
    // Add first line.
    tLine first_line;
    this->lines.Add(first_line);
    this->status = eSTATUS_OUTPUT;
  }

  /**
   * Reads input from the user. Stops when enter is hit.
   */
  void cTerminal::Read_Input() {
    if (this->status != eSTATUS_INPUT) {
      this->status = eSTATUS_INPUT;
      this->Set_Color(0, 128, 0);
      this->Write_String(": ");
    }
  }

  /**
   * Processes keys.
   */
  void cTerminal::Process_Keys() {
    sSignal key = this->io->Read_Key();
    switch (key.code) {
      case eSIGNAL_ENTER: {
        if (this->status == eSTATUS_INPUT) {
          this->Write_Letter('\n');
          this->Set_Error_Mode(false);
          this->On_Read(this->Buffer_To_String());
        }
        break;
      }
      case eSIGNAL_BACKSPACE: {
        this->Backspace();
        break;
      }
      case eSIGNAL_LEFT: {
        if (this->scroll_x > 0) {
          this->scroll_x--;
        }
        break;
      }
      case eSIGNAL_RIGHT: {
        this->scroll_x++;
        break;
      }
      case eSIGNAL_UP: {
        if (this->scroll_y > 0) {
          this->scroll_y--;
        }
        break;
      }
      case eSIGNAL_DOWN: {
        this->scroll_y++;
        break;
      }
      default: { // Any character.
        if ((key.code >= ' ') && (key.code <= '~')) { // Data characters.
          if (this->status == eSTATUS_INPUT) {
            this->Write_Letter(key.code);
            this->input_buffer.Add(key.code);
          }
        }
      }
    }
  }

  /**
   * Renders the terminal screen.
   */
  void cTerminal::Render() {
    // Clear the screen.
    this->io->Color(255, 255, 255);
    // Render current screenfull of lines.
    int line_count = this->lines.Count();
    for (int row_index = 0; row_index < line_count; row_index++) {
      tLine& line = this->lines[row_index];
      int letter_count = line.Count();
      for (int letter_index = 0; letter_index < letter_count; letter_index++) {
        sLetter& letter = line[letter_index];
        char buffer[2] = { (char)letter.letter, 0 };
        this->io->Output_Text(buffer, (letter_index - this->scroll_x) * this->letter_w, (row_index - this->scroll_y) * this->letter_h, letter.red, letter.green, letter.blue);
      }
    }
    // Draw the cursor.
    if (this->status == eSTATUS_INPUT) {
      auto now = std::chrono::system_clock::now();
      auto diff = std::chrono::duration_cast<std::chrono::milliseconds>(now - this->time_stamp);
      if (diff.count() >= BLINK_RATE) {
        this->time_stamp = std::chrono::system_clock::now();
        this->counter++;
      }
      if ((this->counter % 2) == 0) {
        int x = (this->lines.Peek_Back().Count() > 0) ? this->lines.Peek_Back().Count() - 1 : 0;
        int y = this->lines.Count() - 1;
        this->io->Box((x + 1 - this->scroll_x) * this->letter_w, (y - this->scroll_y) * this->letter_h, this->letter_w, this->letter_h, 0, 0, 0);
      }
    }
    // Refresh the screen.
    this->io->Refresh();
  }

  /**
   * Backspaces a character out.
   */
  void cTerminal::Backspace() {
    if (this->status == eSTATUS_INPUT) {
      if (this->input_buffer.Count() > 2) { // Compensate for marker text.
        tLine& line = this->lines.Peek_Back();
        if (line.Count() > 0) {
          line.Pop(); // Remove character.
          this->input_buffer.Pop(); // Remove from input buffer as well.
        }
      }
    }
  }

  /**
   * Called when the input has been read.
   * @param text The text that was read.
   */
  void cTerminal::On_Read(std::string text) {
    // To be implemented in app.
  }

  /**
   * Converts the buffer to a string.
   * @return The text from the buffer.
   */
  std::string cTerminal::Buffer_To_String() {
    std::string text = "";
    while (this->input_buffer.Count() > 0) {
      int letter = this->input_buffer.Peek_Front();
      text += (char)letter;
      this->input_buffer.Shift();
    }
    return text;
  }

  /**
   * Sets the error mode.
   * @param error If true then error mode is set, otherwise it is set to output.
   */
  void cTerminal::Set_Error_Mode(bool error) {
    if (error) {
      this->status = eSTATUS_ERROR;
      this->Set_Color(128, 0, 0);
    }
    else {
      this->status = eSTATUS_OUTPUT;
      this->Set_Color(0, 0, 0);
    }
  }

  // **************************************************************************
  // Parameters Implementation
  // **************************************************************************

  /**
   * Parses the incoming parameters and creates a new parameter object.
   * @param argc The number of arguments in the command line.
   * @param argv The argument vector.
   * @param names The names of the parameters.
   * @throws An error if there are parameters missing.
   */
  cParameters::cParameters(int argc, char** argv, cArray<std::string> names) {
    int param_count = names.Count();
    Check_Condition((argc == (param_count + 1)), "Missing parameters! Arguments are: " + Join(names, " ")); // Accounts for program name.
    for (int arg_index = 1; arg_index < argc; arg_index++) { // Don't want first parameter.
      std::string name = names[arg_index - 1];
      std::string param = argv[arg_index];
      cValue value;
      try {
        value.Set_Number(Text_To_Number(param));
      }
      catch (cError number_error) {
        value.Set_String(param);
      }
      this->params[name] = value;
    }
  }

  /**
   * Gets the parameter value given the name.
   * @param name The name of the parameter to retrieve.
   * @return The value at the parameter.
   * @throws An error if the parameter does not exist.
   */
  cValue& cParameters::operator[] (std::string name) {
    Check_Condition(this->params.Does_Key_Exist(name), "Parameter " + name + " does not exist.");
    return this->params[name];
  }

  // **************************************************************************
  // Table Implementation
  // **************************************************************************

  /**
   * Creates a new table of the specified width and height.
   * @param width The width of the table.
   * @param height The height of the table.
   */
  cTable::cTable(int width, int height) {
    this->width = width;
    this->height = height;
    this->row_pointer = 0;
    this->col_pointer = 0;
    this->rows = new int* [height];
    for (int row_index = 0; row_index < height; row_index++) {
      this->rows[row_index] = new int[width];
      for (int col_index = 0; col_index < width; col_index++) {
        this->rows[row_index][col_index] = 0;
      }
    }
  }

  /**
   * Frees up the table.
   */
  cTable::~cTable() {
    for (int row_index = 0; row_index < this->height; row_index++) {
      delete[] this->rows[row_index];
    }
    delete[] this->rows;
  }

  /**
   * Moves to the next row.
   * @throws An error if are no more rows to move to.
   */
  void cTable::Move_To_Next_Row() {
    if (this->row_pointer < this->height) {
      this->row_pointer++;
      this->col_pointer = 0; // Reset column pointer.
    }
    else {
      throw cError("No more rows to move to!");
    }
  }

  /**
   * Reads a single column from the table.
   * @return The numeric value of the column.
   * @throws An error if there are no more columns to read.
   */
  int cTable::Read_Column() {
    int value = 0;
    if (this->col_pointer < this->width) {
      value = this->rows[this->row_pointer][this->col_pointer];
      this->col_pointer++;
    }
    else {
      throw cError("No more columns to read!");
    }
    return value;
  }

  /**
   * Moves to a specified column.
   * @param index The index of the column to move to.
   * @throws An error if the index is out of bounds.
   */
  void cTable::Move_To_Column(int index) {
    if ((index >= 0) && (index < this->width)) {
      this->col_pointer = index;
    }
    else {
      throw cError("Column is out of bounds.");
    }
  }

  /**
   * Writes a value to a column.
   * @param value The value to write to the column.
   * @throws An error if there are no more columns to write to.
   */
  void cTable::Write_Column(int value) {
    if (this->col_pointer < this->width) {
      this->rows[this->row_pointer][this->col_pointer] = value;
      this->col_pointer++;
    }
    else {
      throw cError("No more columns to write to!");
    }
  }

  /**
   * Rewinds the pointers to read and write from the beginning of the table.
   */
  void cTable::Rewind() {
    this->row_pointer = 0;
    this->col_pointer = 0;
  }

  /**
   * Allows a table to be assigned to another table.
   * @param other The other table to assign from.
   * @return The reference to this table.
   */
  cTable& cTable::operator=(cTable& other) {
    // Delete our rows.
    for (int row_index = 0; row_index < this->height; row_index++) {
      delete[] this->rows[row_index];
    }
    delete[] this->rows;
    // Allocate new rows.
    this->width = other.width;
    this->height = other.height;
    this->row_pointer = 0;
    this->col_pointer = 0;
    this->rows = new int* [this->height];
    for (int row_index = 0; row_index < this->height; row_index++) {
      this->rows[row_index] = new int[this->width];
      for (int col_index = 0; col_index < this->width; col_index++) {
        this->rows[row_index][col_index] = other.rows[row_index][col_index];
      }
    }
    return (*this);
  }

  /**
   * Clears out the table's rows.
   */
  void cTable::Clear() {
    for (int row_index = 0; row_index < this->height; row_index++) {
      for (int col_index = 0; col_index < this->width; col_index++) {
        this->rows[row_index][col_index] = 0;
      }
    }
  }

  /**
   * Moves to a specific row.
   * @param index The index of the row to move to.
   * @throws An error if the row does not exist.
   */
  void cTable::Move_To_Row(int index) {
    if ((index >= 0) && (index < this->height)) {
      this->row_pointer = index;
      this->col_pointer = 0;
    }
    else {
      throw cError("Invalid row access at " + Number_To_Text(index) + ".");
    }
  }

  /**
   * Loads a file into a table.
   * @param name The name of the file.
   * @throws An error if the file could not be loaded.
   */
  void cTable::Load_From_File(std::string name) {
    cFile file(name);
    file.Read();
    this->Rewind();
    // Read dimensions.
    std::string dimensions = file.Get_Line();
    cArray<std::string> pair = Parse_Sausage_Text(dimensions, "x");
    if (pair.Count() == 2) {
      int width = Text_To_Number(pair[0]);
      int height = Text_To_Number(pair[1]);
      this->Resize(width, height); // Resize the table to fit the data.
      // Read the table data.
      while (file.Has_More_Lines()) {
        std::string line = file.Get_Line();
        cArray<std::string> columns = Parse_Sausage_Text(line, " ");
        int column_count = columns.Count();
        for (int column_index = 0; column_index < column_count; column_index++) {
          this->Write_Column(Text_To_Number(columns[column_index]));
        }
        this->Move_To_Next_Row();
      }
      this->Rewind(); // Rewind after loading.
    }
    else {
      throw cError("Missing width or height in " + name + ".");
    }
  }

  /**
   * Saves a table to a file.
   * @param name The name of the file to save to.
   */
  void cTable::Save_To_File(std::string name) {
    cFile file(name);
    this->Rewind();
    for (int row_index = 0; row_index < this->height; row_index++) {
      std::string line = "";
      for (int col_index = 0; col_index < this->width; col_index++) {
        line += Number_To_Text(this->rows[row_index][col_index]);
        if (col_index < (this->width - 1)) {
          line += " ";
        }
      }
      file.Add(line);
    }
    file.Write();
  }

  /**
   * Resizes the table to a new width and height.
   * @param width The new width of the table.
   * @param height The new height of the table.
   */
  void cTable::Resize(int width, int height) {
    // Delete rows.
    for (int row_index = 0; row_index < this->height; row_index++) {
      delete[] this->rows[row_index];
    }
    delete[] this->rows;
    // Allocate new rows.
    this->width = width;
    this->height = height;
    this->rows = new int* [height];
    for (int row_index = 0; row_index < height; row_index++) {
      this->rows[row_index] = new int[width];
      for (int col_index = 0; col_index < width; col_index++) {
        this->rows[row_index][col_index] = 0;
      }
    }
    this->Rewind();
  }

  /**
   * Dumps the contents of a table to the console.
   */
  void cTable::Dump() {
    std::cout << "table=" << this->width << "x" << this->height << std::endl;
    std::cout << "row-pointer=" << this->row_pointer << std::endl;
    std::cout << "col-pointer=" << this->col_pointer << std::endl;
    std::cout << "*** data ***" << std::endl;
    for (int row_index = 0; row_index < this->height; row_index++) {
      for (int col_index = 0; col_index < this->width; col_index++) {
        std::cout << this->rows[row_index][col_index];
        if (col_index < (this->width - 1)) {
          std::cout << " ";
        }
      }
      std::cout << std::endl;
    }
  }

  // **************************************************************************
  // Picture Processor Implementation
  // **************************************************************************

  /**
   * Creates a new picture processor with screen of the specified dimensions.
   * @param width The width of the screen.
   * @param height The height of the screen.
   */
  cPicture_Processor::cPicture_Processor(int width, int height) {
    this->width = width;
    this->height = height;
    this->palette_size = 0;
    this->palette = NULL;
    this->screen = new int* [height];
    for (int y = 0; y < height; y++) {
      this->screen[y] = new int[width];
      for (int x = 0; x < width; x++) {
        this->screen[y][x] = 0;
      }
    }
  }

  /**
   * Frees the picture processor.
   */
  cPicture_Processor::~cPicture_Processor() {
    // Free the screen.
    for (int y = 0; y < height; y++) {
      delete[] this->screen[y];
    }
    delete[] this->screen;
    // Free the palette.
    if (this->palette) {
      delete[] this->palette;
    }
  }

  /**
   * Loads the palette from a file.
   * @param name The name of the palette to load. No extension.
   * @throws An error if the palette could not be loaded.
   */
  void cPicture_Processor::Load_Palette(std::string name) {
    cFile pal_file(name + ".txt");
    cArray<sColor> pal_entries;
    while (pal_file.Has_More_Lines()) {
      std::string line = pal_file.Get_Line();
      cArray<std::string> tripplet = Parse_Sausage_Text(line, " ");
      if (tripplet.Count() == 3) {
        sColor color = { 0, 0, 0 };
        color.red = Text_To_Number(tripplet[0]);
        color.green = Text_To_Number(tripplet[1]);
        color.blue = Text_To_Number(tripplet[2]);
        pal_entries.Add(color);
      }
      else {
        throw cError("Invalid palette entry " + line + ".");
      }
    }
    // Allocate and load the palette.
    if (pal_entries.Count() > 0) {
      this->palette_size = pal_entries.Count();
      this->palette = new sColor[this->palette_size];
      for (int entry_index = 0; entry_index < this->palette_size; entry_index++) {
        sColor& color = this->palette[entry_index];
        sColor& pal_entry = pal_entries[entry_index];
        color = pal_entry;
      }
    }
    else {
      throw cError("Empty palette!");
    }
  }

  /**
   * Draws a picture to the screen.
   * @param picture The picture grid.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param mode The drawing mode.
   * @throws An error if the wrong mode was set.
   */
  void cPicture_Processor::Draw_Picture(cTable& picture, int x, int y, int mode) {
    // The first row stores the meta data.
    int width = picture.Read_Column();
    int height = picture.Read_Column();
    picture.Move_To_Next_Row(); // Move to where pixel data is.
    // Check if image is on the screen.
    if ((x > -width) && (x < this->width) && (y > -height) && (y < this->height)) {
      // Clip picture source coordinates.
      int x_edge = x + width - 1;
      int y_edge = y + height - 1;
      int clip_left = (x < 0) ? x * -1 : 0;
      int clip_right = (x_edge >= this->width) ? (width - (x_edge - this->width - 1) - 1) : width - 1;
      int clip_top = (y < 0) ? y * -1 : 0;
      int clip_bottom = (y_edge >= this->height) ? (height - (y_edge - this->height - 1) - 1) : height - 1;
      if (mode == eDRAW_NORMAL) {
        for (int row_index = clip_top; row_index <= clip_bottom; row_index++) {
          for (int col_index = clip_left; col_index <= clip_right; col_index++) {
            int pixel = picture.rows[picture.row_pointer + row_index][col_index]; // Skip meta data row.
            if (pixel) {
              this->screen[y + row_index][x + col_index] = pixel;
            }
          }
        }
      }
      else {
        if (((mode & eDRAW_FLIPPED_X) == 0) && ((mode & eDRAW_FLIPPED_Y) != 0)) {
          for (int row_index = clip_top; row_index <= clip_bottom; row_index++) {
            int screen_col = x;
            for (int col_index = clip_right; col_index >= clip_left; col_index--) {
              int pixel = picture.rows[picture.row_pointer + row_index][col_index]; // Skip meta data row.
              if (pixel) {
                this->screen[y + row_index][x + col_index] = pixel;
              }
            }
          }
        }
        else if (((mode & eDRAW_FLIPPED_Y) == 0) && ((mode & eDRAW_FLIPPED_X) != 0)) {
          int screen_row = y;
          for (int row_index = clip_bottom; row_index >= clip_top; row_index--) {
            for (int col_index = clip_left; col_index <= clip_right; col_index++) {
              int pixel = picture.rows[picture.row_pointer + row_index][col_index]; // Skip meta data row.
              if (pixel) {
                this->screen[y + row_index][x + col_index] = pixel;
              }
            }
            screen_row++;
          }
        }
        else if (((mode & eDRAW_FLIPPED_X) == 0) && ((mode & eDRAW_FLIPPED_Y) == 0)) {
          int screen_row = y;
          for (int row_index = clip_bottom; row_index >= clip_top; row_index--) {
            int screen_col = x;
            for (int col_index = clip_right; col_index >= clip_left; col_index--) {
              int pixel = picture.rows[picture.row_pointer + row_index][col_index]; // Skip meta data row.
              if (pixel) {
                this->screen[y + row_index][x + col_index] = pixel;
              }
            }
            screen_row++;
          }
        }
        else {
          throw cError("Wrong drawing mode set for picture.");
        }
      }
    }
  }

  /**
   * Clears the screen to a specified color.
   * @param color The color of the screen.
   * @throws An error if the color is not on the palette.
   */
  void cPicture_Processor::Clear_Screen(sColor color) {
    int color_index = this->Scan_Palette(color);
    for (int y = 0; y < this->height; y++) {
      for (int x = 0; x < this->height; x++) {
        this->screen[y][x] = color_index;
      }
    }
  }

  /**
   * Scans the palette looking for a color.
   * @param color The color to look for.
   * @return The color index.
   * @throws An error if the color was not found.
   */
  int cPicture_Processor::Scan_Palette(sColor color) {
    int color_index = -1;
    for (int entry_index = 0; entry_index < this->palette_size; entry_index++) {
      sColor entry = this->palette[entry_index];
      if ((color.red == entry.red) && (color.green == entry.green) && (color.blue == entry.blue)) {
        color_index = entry_index;
        break;
      }
    }
    if (color_index == -1) { // No color found.
      throw cError("Color not found in palette.");
    }
    return color_index;
  }

  /**
   * Dumps the picture processor.
   */
  void cPicture_Processor::Dump() {
    // Dump the palette.
    std::cout << "*** palette ***" << std::endl;
    for (int entry_index = 0; entry_index < this->palette_size; entry_index++) {
      sColor entry = this->palette[entry_index];
      std::cout << entry.red << "," << entry.green << "," << entry.blue << std::endl;
    }
    std::cout << "*** screen ***" << std::endl;
    for (int row_index = 0; row_index < this->height; row_index++) {
      for (int col_index = 0; col_index < this->width; col_index++) {
        std::cout << this->screen[row_index][col_index];
        if (col_index < (this->width - 1)) {
          std::cout << " ";
        }
      }
      std::cout << std::endl;
    }
  }

  // **************************************************************************
  // Bump Map Implementation
  // **************************************************************************

  /**
   * Creates a new bump map with a 16x16 box. 
   */
  cBump_Map::cBump_Map() {
    this->rect.left = 0;
    this->rect.top = 0;
    this->rect.right = 15;
    this->rect.bottom = 15;
  }

  /**
   * Creates a new bump map with x and y coordinates and a specified width and height.
   * @param x The x coordinate.
   * @param y The y coordinate.
   * @param width The width of the bump map.
   * @param height The height of the bump map. 
   */
  cBump_Map::cBump_Map(int x, int y, int width, int height) {
    this->rect.left = x;
    this->rect.top = y;
    this->rect.right = x + width - 1;
    this->rect.bottom = y + height - 1;
  }

  /**
   * Loads a bump map from a file.
   * @param file The bump map file.
   * @param tile_size The size of the tiles in pixels.
   * @throws An error if the bump map could not be loaded. 
   */
  cBump_Map::cBump_Map(cFile& file, int tile_size = 1) {
    file >> this->rect.left;
    file >> this->rect.top;
    file >> this->rect.right;
    file >> this->rect.bottom;
    this->rect.left *= tile_size;
    this->rect.top *= tile_size;
    this->rect.right *= tile_size;
    this->rect.bottom *= tile_size;
  }

  /**
   * Determines if this bump map is touching the right.
   * @param bump_map The other bump map.
   * @return True if this bump map is touching the right, false otherwise.
   */
  bool cBump_Map::Is_Touching_Right(cBump_Map& bump_map) {
    bool touching = false;
    if (this->Is_In_Y_Range(bump_map)) {
      touching = (this->rect.right == (bump_map.rect.left - 1));
    }
    return touching;
  }

  /**
   * Determines if this bump map is touching the left.
   * @param bump_map The other bump map.
   * @return True if this bump map is touching the left, false otherwise.
   */
  bool cBump_Map::Is_Touching_Left(cBump_Map& bump_map) {
    bool touching = false;
    if (this->Is_In_Y_Range(bump_map)) {
      touching = (this->rect.left == (bump_map.rect.right + 1));
    }
    return touching;
  }

  /**
   * Determines if this bump map is touching the bottom.
   * @param bump_map The other bump map.
   * @return True if this bump map is touching the bottom, false otherwise.
   */
  bool cBump_Map::Is_Touching_Bottom(cBump_Map& bump_map) {
    bool touching = false;
    if (this->Is_In_X_Range(bump_map)) {
      touching = (this->rect.bottom == (bump_map.rect.top - 1));
    }
    return touching;
  }

  /**
   * Determines if this bump map is touching the top.
   * @param bump_map The other bump map.
   * @return True if this bump map is touching the top, false otherwise.
   */
  bool cBump_Map::Is_Touching_Top(cBump_Map& bump_map) {
    bool touching = false;
    if (this->Is_In_X_Range(bump_map)) {
      touching = (this->rect.top == (bump_map.rect.bottom + 1));
    }
    return touching;
  }

  /**
   * Determines if this bump map is touching the top left corner.
   * @param bump_map The other bump map.
   * @return True if the top left corner is being touched, false otherwise.
   */
  bool cBump_Map::Is_Touching_Top_Left_Corner(cBump_Map& bump_map) {
    return ((bump_map.rect.right == (this->rect.left - 1)) && (bump_map.rect.bottom == (this->rect.top - 1)));
  }

  /**
   * Determines if this bump map is touching the bottom left corner.
   * @param bump_map The other bump map.
   * @return True if the bottom left corner is being touched, false otherwise.
   */
  bool cBump_Map::Is_Touching_Bottom_Left_Corner(cBump_Map& bump_map) {
    return ((bump_map.rect.right == (this->rect.left - 1)) && (bump_map.rect.top == (this->rect.bottom + 1)));
  }

  /**
   * Determines if this bump map is touching the top right corner.
   * @param bump_map The other bump map.
   * @return True if the top right corner is being touched, false otherwise.
   */
  bool cBump_Map::Is_Touching_Top_Right_Corner(cBump_Map& bump_map) {
    return ((bump_map.rect.left == (this->rect.right + 1)) && (bump_map.rect.bottom == (this->rect.top - 1)));
  }

  /**
   * Determines if this bump map is touching the bottom right corner.
   * @param bump_map The other bump map.
   * @return True if the bottom right corner is being touched, false otherwise.
   */
  bool cBump_Map::Is_Touching_Bottom_Right_Corner(cBump_Map& bump_map) {
    return ((bump_map.rect.left == (this->rect.right + 1)) && (bump_map.rect.top == (this->rect.bottom + 1)));
  }

  /**
   * Determines if a bump map is inside another bump map.
   * @param bump_map The bump map which is inside another.
   * @return True if a bump map is inside another.
   */
  bool cBump_Map::Is_Inside(cBump_Map& bump_map) {
    sPoint left_top = { this->rect.left, this->rect.top };
    sPoint right_top = { this->rect.right, this->rect.top };
    sPoint left_bottom = { this->rect.left, this->rect.bottom };
    sPoint right_bottom = { this->rect.right, this->rect.bottom };
    return (Is_Point_In_Box(left_top, bump_map.rect) ||
            Is_Point_In_Box(right_top, bump_map.rect) ||
            Is_Point_In_Box(left_bottom, bump_map.rect) ||
            Is_Point_In_Box(right_bottom, bump_map.rect));
  }

  /**
   * Checks to see if the bump maps are in range of each other on the x-axis.
   * @param bump_map The other bump map.
   * @return True if the bump maps are in range of each other, false otherwise.
   */
  bool cBump_Map::Is_In_X_Range(cBump_Map& bump_map) {
    return (((bump_map.rect.left >= this->rect.left) && (bump_map.rect.left <= this->rect.right)) ||
            ((bump_map.rect.right >= this->rect.left) && (bump_map.rect.right <= this->rect.right)) ||
            ((this->rect.left >= bump_map.rect.left) && (this->rect.left <= bump_map.rect.right)) ||
            ((this->rect.right >= bump_map.rect.left) && (this->rect.right <= bump_map.rect.right)));
  }

  /**
   * Checks to see if the bump maps are in range of each other on the y-axis.
   * @param bump_map The other bump map.
   * @return True if the bump maps are in range of each other, false otherwise. 
   */
  bool cBump_Map::Is_In_Y_Range(cBump_Map& bump_map) {
    return (((bump_map.rect.top >= this->rect.top) && (bump_map.rect.top <= this->rect.bottom)) ||
            ((bump_map.rect.bottom >= this->rect.top) && (bump_map.rect.bottom <= this->rect.bottom)) ||
            ((this->rect.top >= bump_map.rect.top) && (this->rect.top <= bump_map.rect.bottom)) ||
            ((this->rect.bottom >= bump_map.rect.top) && (this->rect.bottom <= bump_map.rect.bottom)));
  }

  // **************************************************************************
  // Pointer Implementation
  // **************************************************************************

  /**
   * Creates a blank pointer module.
   */
  template <typename T> cPointer<T>::cPointer() {
    this->pointer = NULL;
  }

  /**
   * Initializes the pointer.
   * @param pointer The pointer.
   */
  template <typename T> void cPointer<T>::Init(T* pointer) {
    this->pointer = pointer;
  }

  /**
   * Frees up the pointer. 
   */
  template <typename T> cPointer<T>::~cPointer() {
    if (this->pointer) {
      delete this->pointer;
    }
  }

  // **************************************************************************
  // Array Pointer Implementation
  // **************************************************************************

  /**
   * Creates a new array pointer that is blank.
   */
  template <typename T> cArray_Pointer<T>::cArray_Pointer() {
    this->pointer = NULL;
  }

  /**
   * Initializes the array pointer.
   * @param pointer The pointer to assign. 
   */
  template <typename T> void cArray_Pointer<T>::Init(T* pointer) {
    this->pointer = pointer;
  }

  /**
   * Frees the array pointer. 
   */
  template <typename T> cArray_Pointer<T>::~cArray_Pointer() {
    if (this->pointer) {
      delete[] this->pointer;
    }
  }

  // **************************************************************************
  // Layout Implementation
  // **************************************************************************

  /**
   * Creates a new layout module.
   * @param config The name of the config file.
   * @param io The I/O control.
   * @throws An error if the layout could not be loaded.
   */
  cLayout::cLayout(std::string config, cIO_Control* io) {
    this->io = io;
    // Load the config file.
    cConfig layout_config(config);
    this->width = layout_config.Get_Property("width");
    this->height = layout_config.Get_Property("height");
    this->cell_w = layout_config.Get_Property("cell-w");
    this->cell_h = layout_config.Get_Property("cell-h");
    this->red = layout_config.Get_Property("red");
    this->green = layout_config.Get_Property("green");
    this->blue = layout_config.Get_Property("blue");
    this->mouse_coords.x = 0;
    this->mouse_coords.y = 0;
    this->mouse_down_coords.x = 0;
    this->mouse_down_coords.y = 0;
    this->mouse_up_coords.x = 0;
    this->mouse_up_coords.y = 0;
    this->mouse_over_coords.x = 0;
    this->mouse_over_coords.y = 0;
    this->not_clicked = true;
    this->key = eSIGNAL_NONE;
    this->button = eBUTTON_NONE;
    // Recalculate dimensions to grid dimensions.
    this->width /= this->cell_w;
    this->height /= this->cell_h;
    // Create the grid.
    this->grid = new char* [this->height];
    for (int row_index = 0; row_index < this->height; row_index++) {
      this->grid[row_index] = new char[this->width];
      for (int col_index = 0; col_index < this->width; col_index++) {
        this->grid[row_index][col_index] = ' ';
      }
    }
  }

  /**
   * Frees the layout module.
   */
  cLayout::~cLayout() {
    for (int row_index = 0; row_index < this->height; row_index++) {
      delete[] this->grid[row_index];
    }
    delete[] this->grid;
  }

  /**
   * Clears out the grid.
   */
  void cLayout::Clear_Grid() {
    for (int row_index = 0; row_index < this->height; row_index++) {
      for (int col_index = 0; col_index < this->width; col_index++) {
        this->grid[row_index][col_index] = ' ';
      }
    }
  }

  /**
   * Parses the grid given the layout.
   * @param file The instance of the layout file.
   * @throws An error if the grid could not be loaded.
   */
  void cLayout::Parse_Grid(cFile& file) {
    for (int row_index = 0; row_index < this->height; row_index++) {
      std::string line = file.Get_Line();
      int col_count = (line.length() > this->width) ? this->width : line.length();
      for (int col_index = 0; col_index < col_count; col_index++) {
        char letter = line[col_index];
        this->grid[row_index][col_index] = letter;
      }
    }
  }

  /**
   * Parses the layout.
   * @param name The name of the layout.
   * @throws An error if something went wrong.
   */
  void cLayout::Parse_Layout(std::string name) {
    cFile layout_file(name + ".txt");
    layout_file.Read();
    // Parse grid first.
    this->Parse_Grid(layout_file);
    // Parse the entities.
    while (this->Has_Entity()) {
      this->Parse_Entity();
    }
    // Parse the properties here!
    this->Parse_Properties(layout_file);
    // Run all component initializers.
    int comp_count = this->components.Count();
    for (int comp_index = 0; comp_index < comp_count; comp_index++) {
      this->On_Component_Init(this->components.values[comp_index]);
    }
  }

  /**
   * Checks to see if there is an entity to parse.
   * @return True if there is an entity, false otherwise.
   */
  bool cLayout::Has_Entity() {
    bool has_entity = false;
    for (int cell_y = 0; cell_y < this->height; cell_y++) {
      for (int cell_x = 0; cell_x < this->width; cell_x++) {
        char cell = this->grid[cell_y][cell_x];
        if ((cell == '[') || (cell == '{') || (cell == '(') || (cell == '+')) { // Entity identifier.
          has_entity = true;
          break;
        }
      }
    }
    return has_entity;
  }

  /**
   * Parses an entity and adds it to the component stack.
   * @throws An error if the entity is invalid.
   */
  void cLayout::Parse_Entity() {
    tObject entity;
    entity["id"] = cValue("");
    entity["type"] = cValue("");
    entity["x"] = cValue(0);
    entity["y"] = cValue(0);
    entity["width"] = cValue(0);
    entity["height"] = cValue(0);
    for (int cell_y = 0; cell_y < this->height; cell_y++) {
      for (int cell_x = 0; cell_x < this->width; cell_x++) {
        char cell = this->grid[cell_y][cell_x];
        if (cell == '+') {
          entity["x"] = cell_x;
          entity["y"] = cell_y;
          entity["width"] = 1;
          entity["height"] = 1;
          entity["type"] = "box";
          this->Parse_Box(entity);
          // Break out of double loop.
          cell_y = this->height;
          break;
        }
        else if (cell == '[') {
          entity["x"] = cell_x;
          entity["y"] = cell_y;
          entity["width"] = 1;
          entity["height"] = 1;
          entity["type"] = "field";
          this->Parse_Field(entity);
          // Break out of double loop.
          cell_y = this->height;
          break;
        }
        else if (cell == '{') {
          entity["x"] = cell_x;
          entity["y"] = cell_y;
          entity["width"] = 1;
          entity["height"] = 1;
          entity["type"] = "panel";
          this->Parse_Panel(entity);
          // Break out of double loop.
          cell_y = this->height;
          break;
        }
        else if (cell == '(') {
          entity["x"] = cell_x;
          entity["y"] = cell_y;
          entity["width"] = 1;
          entity["height"] = 1;
          entity["type"] = "button";
          this->Parse_Button(entity);
          // Break out of double loop.
          cell_y = this->height;
          break;
        }
        else {
          continue; // Ignore but allow looking for other entities.
        }
      }
    }
    // Add to components.
    this->components[entity["id"].string] = entity;
  }

  /**
   * Parses a box structure.
   * @param entity The associated entity.
   * @throws An error if the box is invalid.
   */
  void cLayout::Parse_Box(tObject& entity) {
    // We'll navigate in this path: right -> down -> left -> up
    int pos_x = entity["x"].number; // Skip the plus.
    int pos_y = entity["y"].number;
    int rev_width = 1;
    int rev_height = 1;
    std::string id_str = "";
    // Clear out first plus.
    this->grid[pos_y][pos_x] = ' ';
    // Navigate right.
    pos_x++;
    while (pos_x < this->width) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == '+') {
        entity["width"].number++;
        entity["id"].string = id_str;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (this->Is_Identifier(cell)) { // Box Edge
        if (this->Is_Identifier(cell)) {
          id_str += cell; // Collect ID letter.
        }
        entity["width"].number++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else if (cell == '-') { // The box's side.
        entity["width"].number++;
      }
      else {
        throw cError("Not a valid box. (right)");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this->width) {
      throw cError("Truncated box. (width)");
    }
    // Navigate down.
    pos_y++; // Skip the first plus.
    while (pos_y < this->height) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == '+') {
        entity["height"].number++;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (cell == '|') {
        entity["height"].number++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else {
        throw cError("Not a valid box. (down)");
      }
      pos_y++;
    }
    // Check for truncated object.
    if (pos_y == this->height) {
      throw cError("Truncated box. (height)");
    }
    // Navigate left.
    pos_x--; // Skip that first plus.
    while (pos_x >= 0) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == '+') {
        rev_width++;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (cell == '-') {
        rev_width++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else {
        throw cError("Not a valid box. (left)");
      }
      pos_x--;
    }
    if (rev_width != entity["width"].number) {
      throw cError("Not a valid box. (width mismatch)");
    }
    // Navigate up.
    pos_y--;
    while (pos_y >= 0) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == ' ') { // Plus was removed but validated before.
        rev_height++;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (cell == '|') {
        rev_height++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else {
        throw cError("Not a valid box. (up)");
      }
      pos_y--;
    }
    if (rev_height != entity["height"].number) {
      throw cError("Not a valid box. (height mismatch)");
    }
  }

  /**
   * Parses a field entity.
   * @param entity The associated entity.
   * @throws An error if the field is invalid.
   */
  void cLayout::Parse_Field(tObject& entity) {
    int pos_x = entity["x"].number;
    int pos_y = entity["y"].number;
    std::string id_str = "";
    // Clear out initial bracket.
    this->grid[pos_y][pos_x] = ' ';
    // Parse out field.
    pos_x++; // Pass over initial bracket.
    while (pos_x < this->width) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == ']') {
        entity["width"].number++;
        entity["id"].string = id_str;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (this->Is_Identifier(cell) || (cell == ' ')) {
        if (this->Is_Identifier(cell)) {
          id_str += cell;
        }
        entity["width"].number++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else {
        throw cError("Not a valid field.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this->width) {
      throw cError("Truncated field.");
    }
  }

  /**
   * Parses a panel entity.
   * @param entity The associated entity.
   * @throws An error if the panel is invalid.
   */
  void cLayout::Parse_Panel(tObject& entity) {
    int pos_x = entity["x"].number;
    int pos_y = entity["y"].number;
    std::string id_str = "";
    // Clear out initial curly.
    this->grid[pos_y][pos_x] = ' ';
    // Skip over initial curly.
    pos_x++;
    // Go ahead and parse the rest.
    while (pos_x < this->width) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == '}') {
        entity["width"].number++;
        entity["id"].string = id_str;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (this->Is_Identifier(cell) || (cell == ' ')) {
        if (this->Is_Identifier(cell)) {
          id_str += cell;
        }
        entity["width"].number++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else {
        throw cError("Not a valid panel.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this->width) {
      throw cError("Truncated panel.");
    }
  }

  /**
   * Parses a button entity.
   * @param entity The associated entity.
   * @throws An error if the button is invalid.
   */
  void cLayout::Parse_Button(tObject& entity) {
    int pos_x = entity["x"].number;
    int pos_y = entity["y"].number;
    std::string id_str = "";
    this->grid[pos_y][pos_x] = ' ';
    pos_x++;
    while (pos_x < this->width) {
      char cell = this->grid[pos_y][pos_x];
      if (cell == ')') {
        entity["width"].number++;
        entity["id"].string = id_str;
        this->grid[pos_y][pos_x] = ' ';
        break;
      }
      else if (this->Is_Identifier(cell) || (cell == ' ')) {
        if (this->Is_Identifier(cell)) {
          id_str += cell;
        }
        entity["width"].number++;
        this->grid[pos_y][pos_x] = ' ';
      }
      else {
        throw cError("Not a valid button.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this->width) {
      throw cError("Truncated button.");
    }
  }

  /**
   * Parses the properties associated with the layout.
   * @param file The instance of the layout file.
   * @throws An error if there is a problem with the layout.
   */
  void cLayout::Parse_Properties(cFile& file) {
    while (file.Has_More_Lines()) {
      std::string line = file.Get_Line();
      cArray<std::string> pair = Parse_Sausage_Text(line, "->");
      if (pair.Count() == 2) { // Property signature.
        std::string entity_id = pair[0];
        std::string value = pair[1];
        if (this->components.Does_Key_Exist(entity_id)) {
          cArray<std::string> props = Parse_Sausage_Text(value, ",");
          int prop_count = props.Count();
          for (int prop_index = 0; prop_index < prop_count; prop_index++) {
            cArray<std::string> prop = Parse_Sausage_Text(props[prop_index], "=");
            if (prop.Count() == 2) {
              std::string name = prop[0];
              std::string value = prop[1];
              try {
                this->components[entity_id][name] = cValue(Text_To_Number(value));
              }
              catch (cError number_error) { // A string.
                this->components[entity_id][name] = cValue(value);
              }
            }
            else {
              throw cError("Property is missing value.");
            }
          }
        }
        else {
          throw cError("Entity " + entity_id + " is not defined.");
        }
      }
      else {
        throw cError("Entity ID is missing properties.");
      }
    }
  }

  /**
   * Renders the entities.
   */
  void cLayout::Render() {
    // Render a background color.
    this->io->Set_Screen_Target();
    this->io->Color(this->red, this->green, this->blue);
    int entity_count = this->components.Count();
    this->clicked = "";
    this->mouse_down = "";
    this->mouse_over = "";
    this->mouse_up = "";
    // Read a mouse signal.
    sSignal signal = this->io->Read_Signal();
    if (signal.code == eSIGNAL_MOUSE) {
      // Try reading key signal.
      sSignal key_signal = this->io->Read_Key();
      this->key = key_signal.code;
    }
    else {
      this->key = signal.code;
    }
    for (int entity_index = 0; entity_index < entity_count; entity_index++) {
      tObject& entity = this->components.values[entity_index];
      if (signal.code == eSIGNAL_MOUSE) {
        this->button = signal.button;
        sRectangle bump_map = this->Get_Entity_Dimensions(entity);
        if (Is_Point_In_Box(signal.coords, bump_map) && ((this->button == eBUTTON_LEFT) || (this->button == eBUTTON_RIGHT)) && this->not_clicked) { // Input focus.
          this->sel_component = this->components.keys[entity_index];
          this->clicked = this->components.keys[entity_index];
          // Normalize mouse coordinates to entity space.
          this->mouse_coords.x = signal.coords.x - (entity["x"].number * this->cell_w);
          this->mouse_coords.y = signal.coords.y - (entity["y"].number * this->cell_h);
          this->not_clicked = false;
          this->mouse_down = this->clicked;
        }
        else if (Is_Point_In_Box(signal.coords, bump_map) && ((this->button == eBUTTON_LEFT) || (this->button == eBUTTON_RIGHT))) {
          this->mouse_down = this->components.keys[entity_index];
          // Normalize mouse coordinates to entity space.
          this->mouse_down_coords.x = signal.coords.x - (entity["x"].number * this->cell_w);
          this->mouse_down_coords.y = signal.coords.y - (entity["y"].number * this->cell_h);
        }
        else if (this->button == eBUTTON_UP) {
          this->not_clicked = true;
          if (Is_Point_In_Box(signal.coords, bump_map)) {
            this->mouse_up = this->components.keys[entity_index];
            // Normalize mouse coordinates to entity space.
            this->mouse_up_coords.x = signal.coords.x - (entity["x"].number * this->cell_w);
            this->mouse_up_coords.y = signal.coords.y - (entity["y"].number * this->cell_h);
          }
        }
        else { // No buttons, mouse over event.
          if (Is_Point_In_Box(signal.coords, bump_map)) {
            this->mouse_over = this->components.keys[entity_index];
            // Normalize mouse coordinates to entity space.
            this->mouse_over_coords.x = signal.coords.x - (entity["x"].number * this->cell_w);
            this->mouse_over_coords.y = signal.coords.y - (entity["y"].number * this->cell_h);
          }
        }
      }
      this->io->Set_Canvas_Target();
      this->On_Component_Render(this->components.values[entity_index]);
    }
    // Render the screen.
    this->io->Refresh();
  }

  /**
   * Called when the component is initialized.
   * @param entity The associated entity.
   */
  void cLayout::On_Component_Init(tObject& entity) {
    // To be implemented in app.
  }

  /**
   * Called when the component is rendered.
   * @param entity The associated entity.
   */
  void cLayout::On_Component_Render(tObject& entity) {
    // To be implemented in app.
  }

  /**
   * Gets the dimensions of an entity.
   * @param entity The entity.
   * @return The rectangle with the dimensions.
   */
  sRectangle cLayout::Get_Entity_Dimensions(tObject& entity) {
    sRectangle dimensions;
    dimensions.left = entity["x"].number * this->cell_w;
    dimensions.top = entity["y"].number * this->cell_h;
    dimensions.right = dimensions.left + (entity["width"].number * this->cell_w) - 1;
    dimensions.bottom = dimensions.top + (entity["height"].number * this->cell_h) - 1;
    return dimensions;
  }

  /**
   * Determines if a letter is part of an identifier.
   * @param letter The letter to test.
   * @return True if the letter is an identifier, false if not.
   */
  bool cLayout::Is_Identifier(char letter) {
    return (((letter >= 'a') && (letter <= 'z')) || ((letter >= 'A') && (letter <= 'Z')) || ((letter >= '0') && (letter <= '9')) || (letter == '_'));
  }

  /**
   * Clears the layout of selected components. 
   */
  void cLayout::Clear() {
    this->sel_component = "";
    this->clicked = "";
    this->not_clicked = false;
    this->key = 0;
    this->mouse_coords.x = 0;
    this->mouse_coords.y = 0;
  }

  // **************************************************************************
  // Page Implementation
  // **************************************************************************

  /**
   * Creates a new layout tester.
   * @param config The config file name.
   * @param io The I/O control.
   */
  cPage::cPage(std::string config, cIO_Control* io) : cLayout(config, io) {
    // Nothing here.
  }

  /**
   * Called when a component is initialized.
   * @param entity The entity that is initialized.
   */
  void cPage::On_Component_Init(tObject& entity) {
    if (entity["type"].string == "field") {
      this->Init_Field(entity);
    }
    else if (entity["type"].string == "grid-view") {
      this->Init_Grid_View(entity);
    }
    else if (entity["type"].string == "list") {
      this->Init_List(entity);
    }
    else if (entity["type"].string == "toolbar") {
      this->Init_Toolbar(entity);
    }
    else if (entity["type"].string == "bump-map-editor") {
      this->Init_Bump_Map_Editor(entity);
    }
  }

  /**
   * Called when a component needs to be rendered.
   * @param entity The entity to be rendered.
   * @throws An error if an invalid component is rendered.
   */
  void cPage::On_Component_Render(tObject& entity) {
    // Clear out the component. Make background white.
    this->io->Color(255, 255, 255);
    if (entity["type"].string == "field") {
      this->Render_Field(entity);
    }
    else if (entity["type"].string == "label") {
      this->Render_Label(entity);
    }
    else if (entity["type"].string == "grid-view") {
      this->Render_Grid_View(entity);
    }
    else if (entity["type"].string == "button") {
      this->Render_Button(entity);
    }
    else if (entity["type"].string == "toolbar") {
      this->Render_Toolbar(entity);
    }
    else if (entity["type"].string == "list") {
      this->Render_List(entity);
    }
    else if (entity["type"].string == "bump-map-editor") {
      this->Render_Bump_Map_Editor(entity);
    }
    else {
      throw cError("Invalid component " + entity["type"].string + ".");
    }
    // Draw the canvas of the component.
    this->io->Draw_Canvas(entity["x"].number * this->cell_w, entity["y"].number * this->cell_h, entity["width"].number * this->cell_w, entity["height"].number * this->cell_h);
  }

  /**
   * Called when the layout is initialized.
   */
  void cPage::On_Init() {
    // Nothing here.
  }

  /**
   * Initializes the field component.
   * @param entity The field entity.
   */
  void cPage::Init_Field(tObject& entity) {
    entity["text"].Set_String("");
  }

  /**
   * Renders a field entity.
   * @param entity The field component.
   */
  void cPage::Render_Field(tObject& entity) {
    int dy = ((entity["height"].number * this->cell_h) - this->io->Get_Text_Height(entity["text"].string)) / 2;
    int width = this->io->Get_Text_Width(entity["text"].string);
    int char_w = this->io->Get_Text_Width("X");
    int limit = (entity["width"].number * this->cell_w) - 2 - char_w; // Don't allow extra character.
    if (this->sel_component == entity["id"].string) { // Does field have input focus?
      if ((this->key >= ' ') && (this->key <= '~')) {
        if (width < limit) { // Only allow text if input has space.
          entity["text"].string += (char)this->key;
        }
      }
      else if (this->key == eSIGNAL_BACKSPACE) {
        entity["text"].string = entity["text"].string.substr(0, entity["text"].string.length() - 1); // Decrease string.
      }
      else if (this->key == eSIGNAL_DELETE) {
        entity["text"].string = ""; // Clear out
      }
      // Highlight the field.
      this->io->Box(0, 0, entity["width"].number * this->cell_w, entity["height"].number * this->cell_h, 0, 255, 0);
    }
    else {
      this->io->Box(0, 0, entity["width"].number * this->cell_w, entity["height"].number * this->cell_h, 0, 0, 0);
    }
    // Render the field.
    this->io->Box(1, 1, entity["width"].number * this->cell_w - 2, entity["height"].number * this->cell_h - 2, 255, 255, 255);
    this->io->Output_Text(entity["text"].string, 2, dy, 0, 0, 0);
  }

  /**
   * Initializes a grid view component.
   * @param entity The grid view entity.
   */
  void cPage::Init_Grid_View(tObject& entity) {
    Check_Condition(entity.Does_Key_Exist("columns"), "No column count specified for grid view.");
    Check_Condition(entity.Does_Key_Exist("rows"), "No row count specified for grid view.");
    entity["grid-x"].Set_Number(NO_VALUE_FOUND);
    entity["grid-y"].Set_Number(NO_VALUE_FOUND);
    entity["scroll-x"].Set_Number(0);
    entity["scroll-y"].Set_Number(0);
    entity["text"].Set_String("");
    this->Clear_Grid(entity);
  }

  /**
   * Renders a grid view component.
   * @param entity The grid view entity.
   */
  void cPage::Render_Grid_View(tObject& entity) {
    int row_count = entity["rows"].number;
    int col_count = entity["columns"].number;
    int cell_width = (entity["width"].number * this->cell_w) / col_count;
    int cell_height = this->io->Get_Text_Height(entity["text"].string) + 4;
    int highlight = 0;
    cArray<std::string> rows = Parse_Sausage_Text(entity["text"].string, ";");
    for (int grid_y = 0; grid_y < row_count; grid_y++) {
      cArray<std::string> cells = Parse_Sausage_Text(rows[grid_y], ",");
      for (int grid_x = 0; grid_x < col_count; grid_x++) {
        std::string& text = cells[grid_x];
        if (this->sel_component == entity["id"].string) { // Does field have input focus?
          sRectangle cell_map = { grid_x * cell_width - entity["scroll-x"].number,
                                  grid_y * cell_height - entity["scroll-y"].number,
                                  grid_x * cell_width + cell_width - 1 - entity["scroll-x"].number,
                                  grid_y * cell_height + cell_height - 1 - entity["scroll-y"].number };
          if (Is_Point_In_Box(this->mouse_coords, cell_map) && (this->clicked == entity["id"].string)) { // Check to see if we clicked into the cell.
            entity["grid-x"].Set_Number(grid_x); // Set selected grid cell.
            entity["grid-y"].Set_Number(grid_y);
          }
          if ((entity["grid-x"].number == grid_x) && (entity["grid-y"].number == grid_y)) { // Do we have a selected grid cell.
            if ((this->key >= ' ') && (this->key <= '~')) {
              int width = this->io->Get_Text_Width(text);
              int char_w = this->io->Get_Text_Width("X");
              if (width < (cell_width - char_w)) { // Only allow text if input has space.
                if ((this->key != ';') && (this->key != ',')) { // Do not allow delimiting characters.
                  if (text == "free") { // Replace free text.
                    text = (char)this->key;
                  }
                  else {
                    text += (char)this->key;
                  }
                }
              }
            }
            else if (this->key == eSIGNAL_BACKSPACE) {
              text = text.substr(0, text.length() - 1); // Decrease string.
            }
            else if (this->key == eSIGNAL_DELETE) {
              text = "free"; // Clear out.
            }
            if (text.length() == 0) {
              text = "free"; // Replace with free text.
            }
            rows[grid_y] = Join(cells, ",");
            entity["text"].Set_String(Join(rows, ";"));
            highlight = 255;
          }
          else {
            highlight = 0;
          }
        }
        this->io->Box(grid_x * cell_width - entity["scroll-x"].number, grid_y * cell_height - entity["scroll-y"].number, cell_width, cell_height, 255, 255, 255);
        this->io->Output_Text(text, grid_x * cell_width + 2 - entity["scroll-x"].number, grid_y * cell_height + 2 - entity["scroll-y"].number, 0, highlight, 0);
      }
    }
    // Allow scrolling of component.
    this->Scroll_Component(entity);
  }

  /**
   * Renders the label component.
   * @param entity The label entity.
   */
  void cPage::Render_Label(tObject& entity) {
    Check_Condition(entity.Does_Key_Exist("label"), "No label specified for label.");
    Check_Condition(entity.Does_Key_Exist("red"), "Red component missing for label color.");
    Check_Condition(entity.Does_Key_Exist("green"), "Green component missing for label color.");
    Check_Condition(entity.Does_Key_Exist("blue"), "Blue component missing for label color.");
    this->io->Output_Text(entity["label"].string, 0, 0, entity["red"].number, entity["green"].number, entity["blue"].number);
  }

  /**
   * Initializes a list component.
   * @param entity The list entity.
   */
  void cPage::Init_List(tObject& entity) {
    entity["scroll-x"].Set_Number(0);
    entity["scroll-y"].Set_Number(0);
    entity["text"].Set_String("");
    entity["sel-item"].Set_Number(NO_VALUE_FOUND);
    if (entity.Does_Key_Exist("items")) {
      cArray<std::string> items = Parse_Sausage_Text(entity["items"].string, ";");
      entity["text"].Set_String(Join(items, ","));
    }
  }

  /**
   * Renders a list entity.
   * @param entity The entity component.
   */
  void cPage::Render_List(tObject& entity) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    int item_count = items.Count();
    int height = this->io->Get_Text_Height(entity["text"].string) + 2;
    for (int item_index = 0; item_index < item_count; item_index++) {
      std::string item = items[item_index];
      int highlight = 0;
      if (entity["sel-item"].number == item_index) {
        highlight = 255;
      }
      this->io->Box(0 - entity["scroll-x"].number, item_index * height - entity["scroll-y"].number, entity["width"].number * this->cell_w, height, 255, 255, 255);
      this->io->Output_Text(item, 2 - entity["scroll-x"].number, item_index * height + 2 - entity["scroll-y"].number, 0, highlight, 0);
      if (this->clicked == entity["id"].string) { // Was item clicked?
        sRectangle item_map = { 0,
                                item_index * height - entity["scroll-y"].number,
                                entity["width"].number * this->cell_w - 1,
                                item_index * height + height - 1 - entity["scroll-y"].number };
        if (Is_Point_In_Box(this->mouse_coords, item_map)) { // Was item clicked on?
          entity["sel-item"].Set_Number(item_index);
          this->On_List_Click(entity, item);
        }
      }
    }
    this->Scroll_Component(entity);
  }

  /**
   * Renders a button component.
   * @param entity The button entity.
   */
  void cPage::Render_Button(tObject& entity) {
    Check_Condition(entity.Does_Key_Exist("label"), "No label for button.");
    Check_Condition(entity.Does_Key_Exist("red"), "Missing red component for button color.");
    Check_Condition(entity.Does_Key_Exist("green"), "Missing green component for button color.");
    Check_Condition(entity.Does_Key_Exist("blue"), "Missing blue component for button color.");
    int dx = (entity["width"].number * this->cell_w - this->io->Get_Text_Width(entity["label"].string)) / 2;
    int dy = (entity["height"].number * this->cell_h - this->io->Get_Text_Height(entity["label"].string)) / 2;
    this->io->Box(0, 0, entity["width"].number * this->cell_w, entity["height"].number * this->cell_h, entity["red"].number, entity["green"].number, entity["blue"].number);
    this->io->Output_Text(entity["label"].string, dx, dy, 255, 255, 255); // White
    if (this->clicked == entity["id"].string) { // Was the button clicked?
      this->On_Button_Click(entity);
    }
  }

  /**
   * Called when the button was clicked.
   * @param entity The button entity.
   */
  void cPage::On_Button_Click(tObject& entity) {
    // To be implemented in app.
  }

  /**
   * Initializes a toolbar component.
   * @param entity The toolbar entity.
   */
  void cPage::Init_Toolbar(tObject& entity) {
    Check_Condition(entity.Does_Key_Exist("columns"), "No column count specified for toolbar.");
    entity["scroll-x"].Set_Number(0);
    entity["scroll-y"].Set_Number(0);
    entity["text"].Set_String("");
    entity["item-x"].Set_Number(NO_VALUE_FOUND);
    entity["item-y"].Set_Number(NO_VALUE_FOUND);
    if (entity.Does_Key_Exist("items")) {
      cArray<std::string> items = Parse_Sausage_Text(entity["items"].string, ";");
      entity["text"].Set_String(Join(items, ","));
    }
  }

  /**
   * Renders the toolbar component.
   * @param entity The toolbar entity.
   */
  void cPage::Render_Toolbar(tObject& entity) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    int item_count = items.Count();
    int cell_width = (entity["width"].number * this->cell_w) / entity["columns"].number;
    int grid_x = 0;
    int grid_y = 0;
    for (int item_index = 0; item_index < item_count; item_index++) {
      std::string item = items[item_index];
      cArray<std::string> pair = Parse_Sausage_Text(item, ":");
      Check_Condition((pair.Count() == 2), "Invalid data format in toolbar item.");
      std::string label = pair[0];
      std::string icon = pair[1];
      int image_width = this->io->Get_Image_Width(icon);
      int image_height = this->io->Get_Image_Height(icon);
      int dx = (cell_width - image_width) / 2;
      int dy = (cell_width - image_height) / 2;
      int text_x = (cell_width - this->io->Get_Text_Width(label)) / 2;
      int text_y = dy + image_height + 1;
      if (this->clicked == entity["id"].string) {
        sRectangle box = { grid_x * cell_width - entity["scroll-x"].number,
                           grid_y * cell_width - entity["scroll-y"].number,
                           grid_x * cell_width + cell_width - 1 - entity["scroll-x"].number,
                           grid_y * cell_width + cell_width - 1 - entity["scroll-y"].number };
        if (Is_Point_In_Box(this->mouse_coords, box)) {
          entity["item-x"].Set_Number(grid_x);
          entity["item-y"].Set_Number(grid_y);
          this->On_Toolbar_Click(entity, label);
        }
      }
      int highlight = 0;
      if ((entity["item-x"].number == grid_x) && (entity["item-y"].number == grid_y)) {
        highlight = 255;
      }
      this->io->Draw_Image(icon, (grid_x * cell_width) + dx - entity["scroll-x"].number, (grid_y * cell_width) + dy - entity["scroll-y"].number, image_width, image_height, 0, false, false);
      this->io->Output_Text(label, (grid_x * cell_width) + text_x - entity["scroll-x"].number, (grid_y * cell_width) + text_y - entity["scroll-y"].number, 0, highlight, 0);
      if (((item_index + 1) % entity["columns"].number) == 0) { // Go to next row.
        grid_y++;
        grid_x = 0;
      }
      else {
        grid_x++;
      }
    }
    this->Scroll_Component(entity);
  }

  /**
   * Fires when a list item is clicked.
   * @param entity The list entity.
   * @param text The text of the item that was clicked.
   */
  void cPage::On_List_Click(tObject& entity, std::string text) {
    // To be implemented in app.
  }

  /**
   * Fires when a toolbar item is clicked.
   * @param entity The toolbar entity.
   * @param label The label of the clicked item.
   */
  void cPage::On_Toolbar_Click(tObject& entity, std::string label) {
    // To be implemented in app.
  }

  /**
   * Scrolls a component when the user presses the arrow keys.
   * @param entity The component to scroll.
   */
  void cPage::Scroll_Component(tObject& entity) {
    Check_Condition(entity.Does_Key_Exist("scroll-x"), "Scroll x coordinate missing.");
    Check_Condition(entity.Does_Key_Exist("scroll-y"), "Scroll y coordinate missing.");
    if (this->sel_component == entity["id"].string) { // Input focus?
      switch (this->key) {
        case eSIGNAL_LEFT: {
          entity["scroll-x"].number -= this->cell_w;
          break;
        }
        case eSIGNAL_RIGHT: {
          entity["scroll-x"].number += this->cell_w;
          break;
        }
        case eSIGNAL_UP: {
          entity["scroll-y"].number -= this->cell_h;
          break;
        }
        case eSIGNAL_DOWN: {
          entity["scroll-y"].number += this->cell_h;
        }
      }
    }
  }

  /**
   * Clears a grid component.
   * @param entity The grid component. 
   */
  void cPage::Clear_Grid(tObject& entity) {
    // Allocate new rows.
    cArray<std::string> rows;
    int row_count = entity["rows"].number;
    int col_count = entity["columns"].number;
    for (int grid_y = 0; grid_y < row_count; grid_y++) {
      cArray<std::string> cells;
      for (int grid_x = 0; grid_x < col_count; grid_x++) {
        cells.Add("free");
      }
      rows.Add(Join(cells, ","));
    }
    entity["text"].Set_String(Join(rows, ";"));
  }

  /**
   * Parses a rectangle from text.
   * @param text The text containing the rectangle string.
   * @return A rectangle object.
   * @throws An error if the rectangle is not valid.
   */
  sRectangle cPage::Parse_Rectangle(std::string text) {
    cArray<std::string> str_rect = Parse_Sausage_Text(text, ",");
    sRectangle rect;
    Check_Condition((str_rect.Count() == 4), "Rectangle is not formatted correctly.");
    rect.left = Text_To_Number(str_rect[0]);
    rect.top = Text_To_Number(str_rect[1]);
    rect.right = Text_To_Number(str_rect[2]);
    rect.bottom = Text_To_Number(str_rect[3]);
    return rect;
  }

  /**
   * Gets the value of a grid cell.
   * @param entity The grid component.
   * @param x The x coordinate of the cell.
   * @param y The y coordinate of the cell.
   * @return The cell value or blank if the cell is a free cell. 
   * @throws An error if an invalid cell is accessed.
   */
  std::string cPage::Get_Grid_Cell(tObject& entity, int x, int y) {
    std::string value = "";
    int row_count = entity["rows"].number;
    int col_count = entity["columns"].number;
    Check_Condition(((x >= 0) && (x < col_count)), "Invalid column accessed.");
    Check_Condition(((y >= 0) && (y < row_count)), "Invalid row accessed.");
    cArray<std::string> rows = Parse_Sausage_Text(entity["text"].string, ";");
    for (int grid_y = 0; grid_y < row_count; grid_y++) {
      cArray<std::string> cells = Parse_Sausage_Text(rows[grid_y], ",");
      for (int grid_x = 0; grid_x < col_count; grid_x++) {
        if ((x == grid_x) && (y == grid_y)) {
          value = cells[grid_x];
          if (value == "free") {
            value = "";
          }
          break;
        }
      }
    }
    return value;
  }

  /**
   * Sets a value for a given grid cell.
   * @param entity The grid component.
   * @param x The x coordinate of the cell.
   * @param y The y coordinate of the cell.
   * @param value The value to set for the cell. 
   * @throws An error if an invalid cell is accessed or if the value has invalid characters.
   */
  void cPage::Set_Grid_Cell(tObject& entity, int x, int y, std::string value) {
    int row_count = entity["rows"].number;
    int col_count = entity["columns"].number;
    Check_Condition(((x >= 0) && (x < col_count)), "Invalid column accessed.");
    Check_Condition(((y >= 0) && (y < row_count)), "Invalid row accessed.");
    cArray<std::string> rows = Parse_Sausage_Text(entity["text"].string, ";");
    for (int grid_y = 0; grid_y < row_count; grid_y++) {
      cArray<std::string> cells = Parse_Sausage_Text(rows[grid_y], ",");
      for (int grid_x = 0; grid_x < col_count; grid_x++) {
        if ((x == grid_x) && (y == grid_y)) {
          // Check for invalid characters.
          Check_Condition(((value.find(';') == std::string::npos) && (value.find(',') == std::string::npos)), "Invalid characters in grid cell.");
          if (value == "") {
            value = "free";
          }
          cells[grid_x] = value;
          rows[grid_y] = Join(cells, ",");
          entity["text"].Set_String(Join(rows, ";"));
          break;
        }
      }
    }
  }

  /**
   * Adds an item to a list.
   * @param entity The list component.
   * @param value The value to add.
   * @throws An error if the value has invalid values.
   */
  void cPage::Add_List_Item(tObject& entity, std::string value) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    Check_Condition((value.find(',') == std::string::npos), "Invalid character in value.");
    items.Add(value);
    entity["text"].Set_String(Join(items, ","));
  }

  /**
   * Removes an item from the list.
   * @param entity The list component.
   * @param index The index of the item to remove from the list.
   * @throws An error if the index is invalid.
   */
  void cPage::Remove_List_Item(tObject& entity, int index) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    if (items.Count() > 0) {
      items.Remove(index);
    }
    entity["text"].Set_String(Join(items, ","));
  }

  /**
   * Gets the number of items in the list.
   * @param entity The list component.
   * @return The list item count.
   */
  int cPage::Get_List_Item_Count(tObject& entity) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    return items.Count();
  }

  /**
   * Gets the item of the list given the index.
   * @param index The index of the list item to get.
   * @param entity The list component.
   * @return The value at the list index.
   * @throws An error if the index is invalid.
   */
  std::string cPage::Get_List_Item(tObject& entity, int index) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    return items[index];
  }

  /**
   * Clears a list.
   * @param entity The list component.
   */
  void cPage::Clear_List(tObject& entity) {
    entity["text"].Set_String("");
  }

  /**
   * Adds an item to a toolbar.
   * @param entity The toolbar component.
   * @param value The value to add.
   * @throws An error if the value has invalid values.
   */
  void cPage::Add_Toolbar_Item(tObject& entity, std::string value) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    Check_Condition((value.find(',') == std::string::npos), "Invalid character in value.");
    items.Add(value);
    entity["text"].Set_String(Join(items, ","));
  }

  /**
   * Removes an item from the toolbar.
   * @param entity The toolbar component.
   * @param index The index of the item to remove from the toolbar.
   * @throws An error if the index is invalid.
   */
  void cPage::Remove_Toolbar_Item(tObject& entity, int index) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    if (items.Count() > 0) {
      items.Remove(index);
    }
    entity["text"].Set_String(Join(items, ","));
  }

  /**
   * Gets the number of items in the toolbar.
   * @param entity The toolbar component.
   * @return The toolbar item count.
   */
  int cPage::Get_Toolbar_Item_Count(tObject& entity) {
    cArray<std::string> items = Parse_Sausage_Text(entity["text"].string, ",");
    return items.Count();
  }

  /**
   * Clears a toolbar.
   * @param entity The toolbar component.
   */
  void cPage::Clear_Toolbar(tObject& entity) {
    entity["text"].Set_String("");
  }

  /**
   * Initializes the bump map editor.
   * @param entity The bump map editor component.
   */
  void cPage::Init_Bump_Map_Editor(tObject& entity) {
    entity["corner-hit"].Set_String("");
    entity["box"].Set_String("0,0,15,15");
    entity["sprite"].Set_String("");
    entity["sprite-loaded"].Set_Number(0);
  }

  /**
   * Renders the bump map editor.
   * @param entity The bump map editor component.
   */
  void cPage::Render_Bump_Map_Editor(tObject& entity) {
    if (this->mouse_down == entity["id"].string) {
      entity["corner-hit"].Set_String("");
      sRectangle box = this->Get_Box_Coords(entity);
      if ((this->mouse_down_coords.x >= (box.left - 4)) && (this->mouse_down_coords.x <= (box.left + 4)) && (mouse_down_coords.y >= (box.top - 4)) && (mouse_down_coords.y <= (box.top + 4))) {
        // We're in left-top box.
        entity["corner-hit"].Set_String("left-top");
        int width = box.right - box.left + 1;
        int height = box.bottom - box.top + 1;
        box.left = this->mouse_down_coords.x;
        box.top = this->mouse_down_coords.y;
        box.right = box.left + width - 1;
        box.bottom = box.top + height - 1;
        this->Set_Box_Coords(entity, box);
        this->Refresh_Bump_Map_Editor(entity);
      }
      else if ((this->mouse_down_coords.x >= (box.right - 4)) && (this->mouse_down_coords.x <= (box.right + 4)) && (this->mouse_down_coords.y >= (box.top - 4)) && (this->mouse_down_coords.y <= (box.top + 4))) {
        // We're in right-top box.
        entity["corner-hit"].Set_String("right-top");
        if (box.right > box.left) {
          box.right = this->mouse_down_coords.x;
          this->Set_Box_Coords(entity, box);
          this->Refresh_Bump_Map_Editor(entity);
        }
      }
      else if ((this->mouse_down_coords.x >= (box.right - 4)) && (this->mouse_down_coords.x <= (box.right + 4)) && (this->mouse_down_coords.y >= (box.bottom - 4)) && (this->mouse_down_coords.y <= (box.bottom + 4))) {
        // We're in right-bottom box.
        entity["corner-hit"].Set_String("right-bottom");
        if ((box.right > box.left) && (box.bottom > box.top)) {
          box.right = this->mouse_down_coords.x;
          box.bottom = this->mouse_down_coords.y;
          this->Set_Box_Coords(entity, box);
          this->Refresh_Bump_Map_Editor(entity);
        }
      }
      else if ((this->mouse_down_coords.x >= (box.left - 4)) && (this->mouse_down_coords.x <= (box.left + 4)) && (this->mouse_down_coords.y >= (box.bottom - 4)) && (this->mouse_down_coords.y <= (box.bottom + 4))) {
        // We're in left-bottom box.
        entity["corner_hit"].Set_String("left-bottom");
        if (box.bottom > box.top) {
          box.bottom = this->mouse_down_coords.y;
          this->Set_Box_Coords(entity, box);
          this->Refresh_Bump_Map_Editor(entity);
        }
      }
    }
    if (this->mouse_up == entity["id"].string) {
      entity["corner-hit"].Set_String("");
    }
    if (this->mouse_over == entity["id"].string) {
      sRectangle box = this->Get_Box_Coords(entity);
      if (entity["corner-hit"].string == "left-top") {
        int width = box.right - box.left + 1;
        int height = box.bottom - box.top + 1;
        box.left = this->mouse_over_coords.x;
        box.top = this->mouse_over_coords.y;
        box.right = box.left + width - 1;
        box.bottom = box.top + height - 1;
        this->Set_Box_Coords(entity, box);
        this->Refresh_Bump_Map_Editor(entity);
      }
      else if (entity["corner-hit"].string == "right-top") {
        if (box.right > box.left) {
          box.right = this->mouse_over_coords.x;
          this->Set_Box_Coords(entity, box);
          this->Refresh_Bump_Map_Editor(entity);
        }
      }
      else if (entity["corner-hit"].string == "right-bottom") {
        if ((box.right > box.left) && (box.bottom > box.top)) {
          box.right = this->mouse_over_coords.x;
          box.bottom = this->mouse_over_coords.y;
          this->Set_Box_Coords(entity, box);
          this->Refresh_Bump_Map_Editor(entity);
        }
      }
      else if (entity["corner-hit"].string == "left-bottom") {
        if (box.bottom > box.top) {
          box.bottom = this->mouse_over_coords.y;
          this->Set_Box_Coords(entity, box);
          this->Refresh_Bump_Map_Editor(entity);
        }
      }
    }
  }

  /**
   * Gets box coordinates for a component.
   * @param entity The component with the box coordinates.
   * @return A rectangle.
   * @throws An error if the component lacks box coordinates.
   */
  sRectangle cPage::Get_Box_Coords(tObject& entity) {
    sRectangle box = { 0, 0, 0, 0 };
    Check_Condition(entity.Does_Key_Exist("box"), "Missing box property.");
    cArray<std::string> coords = Parse_Sausage_Text(entity["box"].string, ",");
    Check_Condition((coords.Count() == 4), "Invalid box format.");
    box.left = Text_To_Number(coords[0]);
    box.top = Text_To_Number(coords[1]);
    box.right = Text_To_Number(coords[2]);
    box.bottom = Text_To_Number(coords[3]);
    return box;
  }

  /**
   * Sets box coordinates for a component.
   * @param entity The component.
   * @param box The box.
   */
  void cPage::Set_Box_Coords(tObject& entity, sRectangle box) {
    cArray<std::string> coords;
    coords.Add(Number_To_Text(box.left));
    coords.Add(Number_To_Text(box.top));
    coords.Add(Number_To_Text(box.right));
    coords.Add(Number_To_Text(box.bottom));
    entity["box"].Set_String(Join(coords, ","));
  }

  /**
   * Refreshes the bump map editor.
   * @param entity The bump map editor component.
   */
  void cPage::Refresh_Bump_Map_Editor(tObject& entity) {
    sRectangle box = this->Get_Box_Coords(entity);
    this->io->Box(0, 0, entity["width"].number * this->cell_w, entity["height"].number * this->cell_h, 255, 255, 255);
    if (entity["sprite-loaded"].number) {
      int width = this->io->Get_Image_Width(entity["sprite"].string);
      int height = this->io->Get_Image_Height(entity["sprite"].string);
      this->io->Draw_Image(entity["sprite"].string, 0, 0, width, height, 0, false, false);
    }
    int width = box.right - box.left + 1;
    int height = box.bottom - box.top + 1;
    this->io->Set_Transparency(0.5);
    this->io->Box(box.left, box.top, width, height, 0, 255, 0);
    // Draw corners.
    this->io->Set_Transparency(1.0);
    this->io->Box(box.left - 4, box.top - 4, 9, 9, 0, 0, 128);
    this->io->Box(box.left - 4, box.bottom - 4, 9, 9, 0, 0, 128);
    this->io->Box(box.right - 4, box.top - 4, 9, 9, 0, 0, 128);
    this->io->Box(box.right - 4, box.bottom - 4, 9, 9, 0, 0, 128);
  }

  /**
   * Loads a bump map from an object.
   * @param entity The bump map editor.
   * @param bump_map The bump map object.
   * @throws An error if bump map is invalid.
   */
  void cPage::Load_Bump_Map(tObject& entity, tObject& bump_map) {
    sRectangle box = this->Get_Box_Coords(entity);
    Check_Condition(bump_map.Does_Key_Exist("left"), "No left property in box.");
    Check_Condition(bump_map.Does_Key_Exist("top"), "No top property in box.");
    Check_Condition(bump_map.Does_Key_Exist("right"), "No right property in box.");
    Check_Condition(bump_map.Does_Key_Exist("bottom"), "No bottom property in box.");
    box.left = bump_map["left"].number;
    box.top = bump_map["top"].number;
    box.right = bump_map["right"].number;
    box.bottom = bump_map["bottom"].number;
    this->Set_Box_Coords(entity, box);
    this->Refresh_Bump_Map_Editor(entity);
  }

  /**
   * Saves a bump map to an object.
   * @param entity The bump map editor.
   * @param bump_map The bump map object.
   */
  void cPage::Save_Bump_Map(tObject& entity, tObject& bump_map) {
    sRectangle box = this->Get_Box_Coords(entity);
    bump_map["left"].Set_Number(box.left);
    bump_map["top"].Set_Number(box.top);
    bump_map["right"].Set_Number(box.right);
    bump_map["bottom"].Set_Number(box.bottom);
    this->Refresh_Bump_Map_Editor(entity);
  }

  /**
   * Loads a sprite.
   * @param entity The bump map editor.
   * @param name The name of the sprite.
   */
  void cPage::Load_Sprite_For_Bump_Map(tObject& entity, std::string name) {
    entity["sprite"].Set_String(name);
    entity["sprite-loaded"].Set_Number(1);
    this->Refresh_Bump_Map_Editor(entity);
  }

  /**
   * Clears out the bump map editor.
   * @param entity The bump map editor.
   */
  void cPage::Clear_Bump_Map_Editor(tObject& entity) {
    this->io->Box(0, 0, entity["width"].number * this->cell_w, entity["height"].number * this->cell_h, 255, 255, 255);
  }
  
  /**
   * Initializes the map editor.
   * @param entity The map editor component.
   */
  void cPage::Init_Map_Editor(tObject& entity) {
    entity["sel-sprite"].Set_Number(NO_VALUE_FOUND);
    entity["music-track"].Set_String("");
    entity["background"].Set_String("");
    entity["sel-sprite-type"].Set_String("");
    entity["scroll-x"].Set_Number(0);
    entity["scroll-y"].Set_Number(0);
    entity["timer"].Set_Number(0);
    this->sprite_layers.Clear();
    Check_Condition(entity.Does_Key_Exist("layers"), "No layers defined.");
    cArray<std::string> layers = Parse_Sausage_Text(entity["layers"].string, ";");
    int layer_count = layers.Count();
    Check_Condition((layer_count > 0), "Zero layers.");
    for (int layer_index = 0; layer_index < layer_count; layer_index++) {
      std::string layer = layers[layer_index];
      this->sprite_layers[layer] = tObject_List();
    }
    entity["sel-layer"].Set_String(layers[0]); // Set to lowest layer.
    this->sprite_palette.Clear();
  }
  
  /**
   * Renders the map editor.
   * @param entity The map editor component.
   */
  void cPage::Render_Map_Editor(tObject& entity) {
    if (entity["timer"].number > 0) {
      entity["timer"].number--;
    }
    this->Process_Map_Editor_Keys(entity);
    this->Process_Map_Editor_Mouse(entity);
    this->Render_Sprites(entity);
  }
  
  /**
   * Loads the sprite palette.
   * @param name The name of the sprite palette.
   * @param entity The map editor component.
   */
  void cPage::Load_Sprite_Palette(std::string name, tObject& entity) {
    cFile palette_file(name + ".txt");
    palette_file.Read();
    while (palette_file.Has_More_Lines()) {
      std::string sprite_name = palette_file.Get_Line();
      tObject sprite;
      palette_file >>= sprite;
      this->Destar_Sprite(sprite); // Important because properties can be starred from object catalog.
      Check_Condition(sprite.Does_Key_Exist("name"), "No sprite name present.");
      Check_Condition(sprite.Does_Key_Exist("layer"), "No layer present.");
      Check_Condition(sprite.Does_Key_Exist("x"), "No x coordinate.");
      Check_Condition(sprite.Does_Key_Exist("y"), "No y coordinate.");
      Check_Condition(sprite.Does_Key_Exist("size-x"), "No size x specifier.");
      Check_Condition(sprite.Does_Key_Exist("size-y"), "No size y specifier.");
      Check_Condition(sprite.Does_Key_Exist("icon"), "No icon present.");
      this->sprite_palette[sprite_name] = sprite;
    }
    Check_Condition((this->sprite_palette.Count() > 0), "No sprites in palette!");
    entity["sel-sprite-type"].Set_String(this->sprite_palette.keys[0]);
  }
  
  /**
   * Clears a level.
   * @param entity The map editor component.
   */
  void cPage::Clear_Level(tObject& entity) {
    int layer_count = this->sprite_layers.Count();
    for (int layer_index = 0; layer_index < layer_count; layer_index++) {
      this->sprite_layers.values[layer_index].Clear();
    }
    entity["sel-sprite"].Set_Number(NO_VALUE_FOUND);
    entity["music-track"].Set_String("");
    entity["background"].Set_String("");
    entity["scroll-x"].Set_Number(0);
    entity["scroll-y"].Set_Number(0);
  }
  
  /**
   * Loads a level.
   * @param name The name of the level.
   * @param entity The map editor component.
   */
  void cPage::Load_Level(std::string name, tObject& entity) {
    cFile level_file(name + ".map");
    try {
      level_file.Read();
      tObject meta_data;
      level_file >>= meta_data;
      Check_Condition(meta_data.Does_Key_Exist("background"), "No background property.");
      entity["background"].Set_String(meta_data["background"].string);
      Check_Condition(meta_data.Does_Key_Exist("music-track"), "No music track property.");
      entity["music-track"].Set_String(meta_data["music-track"].string);
      while (level_file.Has_More_Lines()) {
        tObject sprite;
        level_file >>= sprite;
        Check_Condition(sprite.Does_Key_Exist("name"), "No sprite name present.");
        Check_Condition(sprite.Does_Key_Exist("layer"), "No layer present.");
        Check_Condition(sprite.Does_Key_Exist("x"), "No x coordinate.");
        Check_Condition(sprite.Does_Key_Exist("y"), "No y coordinate.");
        Check_Condition(sprite.Does_Key_Exist("size-x"), "No size x specifier.");
        Check_Condition(sprite.Does_Key_Exist("size-y"), "No size y specifier.");
        Check_Condition(sprite.Does_Key_Exist("icon"), "No icon present.");
        std::string layer = sprite["layer"].string;
        Check_Condition(this->sprite_layers.Does_Key_Exist(layer), "Layer " + layer + " does not exist in layers.");
        this->sprite_layers[layer].Add(sprite);
      }
    }
    catch (cError error) {
      error.Print();
    }
  }
  
  /**
   * Saves a level to a file.
   * @param name The name of the level.
   * @param entity The map editor component.
   */
  void cPage::Save_Level(std::string name, tObject& entity) {
    cFile level_file(name + ".map");
    tObject meta_data;
    meta_data["background"].Set_String(this->background);
    meta_data["music-track"].Set_String(this->music_track);
    level_file.Add(meta_data);
    int layer_count = this->sprite_layers.Count();
    for (int layer_index = 0; layer_index < layer_count; layer_index++) {
      std::string layer = this->sprite_layers.keys[layer_index];
      int sprite_count = this->sprite_layers[layer].Count();
      for (int sprite_index = 0; sprite_index < sprite_count; sprite_index++) {
        tObject& sprite = this->sprite_layers[layer][sprite_index];
        level_file.Add(sprite);
      }
    }
    level_file.Write();
  }
  
  /**
   * Handles the key processing in the map editor. 
   * @param entity The map editor component.
   */
  void cPage::Process_Map_Editor_Keys(tObject& entity) {
    if (this->timer == 0) {
      if (entity["sel-sprite"].number == NO_VALUE_FOUND) {
        if (this->key == eSIGNAL_LEFT) {
          entity["scroll-x"].Set_Number(entity["scroll-x"].number - 20);
          this->Set_Timer(entity); // Pause keyboard.
        }
        else if (this->key == eSIGNAL_RIGHT) {
          entity["scroll-x"].Set_Number(entity["scroll-x"].number + 20);
          this->Set_Timer(entity);
        }
        if (this->key == eSIGNAL_UP) {
          entity["scroll-y"].Set_Number(entity["scroll-y"].number - 20);
          this->Set_Timer(entity);
        }
        else if (this->key == eSIGNAL_DOWN) {
          entity["scroll-y"].Set_Number(entity["scroll-y"].number + 20);
          this->Set_Timer(entity);
        }
        // Play/stop music track.
        if (this->key == 'p') {
          this->io->Play_Music(entity["music-track"].string);
        }
        else if (this->key == 's') {
          this->io->Silence();
        }
      }
      else { // Sprite is selected.
        tObject& sprite = this->sprite_layers[entity["sel-layer"].string][entity["sel-sprite"].number];
        // Nudge sprite.
        if (this->key == eSIGNAL_LEFT) {
          sprite["x"].number--;
          this->On_Sprite_Nudge(entity, sprite);
          this->Set_Timer(entity);
        }
        else if (this->key == eSIGNAL_RIGHT) {
          sprite["x"].number++;
          this->On_Sprite_Nudge(entity, sprite);
          this->Set_Timer(entity);
        }
        if (this->key == eSIGNAL_UP) {
          sprite["y"].number--;
          this->On_Sprite_Nudge(entity, sprite);
          this->Set_Timer(entity);
        }
        else if (this->key == eSIGNAL_DOWN) {
          sprite["y"].number++;
          this->On_Sprite_Nudge(entity, sprite);
          this->Set_Timer(entity);
        }
        // Sizing of sprite.
        if (this->key == 'i') {
          if (sprite["size-y"].number > 1) {
            sprite["size-y"].number--;
            this->On_Sprite_Resize(entity, sprite);
          }
          this->Set_Timer(entity);
        }
        else if (this->key == 'j') {
          if (sprite["size-x"].number > 1) {
            sprite["size-x"].number--;
            this->On_Sprite_Resize(entity, sprite);
          }
          this->Set_Timer(entity);
        }
        else if (this->key == 'm') {
          sprite["size-y"].number++;
          this->On_Sprite_Resize(entity, sprite);
          this->Set_Timer(entity);
        }
        else if (this->key == 'l') {
          sprite["size-x"].number++;
          this->On_Sprite_Resize(entity, sprite);
          this->Set_Timer(entity);
        }
        // Deleting of sprite.
        if (this->key == eSIGNAL_DELETE) {
          this->On_Sprite_Delete(entity, sprite);
          this->sprite_layers[entity["sel-layer"].string].Remove(entity["sel-sprite"].number);
          entity["sel-sprite"].Set_Number(NO_VALUE_FOUND);
        }
      }
    }
  }
  
  /**
   * Processes the mouse for the map editor. 
   * @param entity The map editor component.
   */
  void cPage::Process_Map_Editor_Mouse(tObject& entity) {
    if (this->mouse_down == entity["id"].string) {
      if (this->button == eBUTTON_LEFT) {
        if (entity["sel-sprite"].number == NO_VALUE_FOUND) { // No sprite selected?
          entity["sel-sprite"].Set_Number(this->Select_Sprite(this->mouse_down_coords, entity));
          if (entity["sel-sprite"].number == NO_VALUE_FOUND) {
            entity["sel-sprite"].Set_Number(this->Create_Sprite(this->mouse_down_coords, entity)); // Create a new sprite.
          }
          // Call on click handler here.
          tObject& sprite = this->sprite_layers[entity["sel-layer"].string][entity["sel-sprite"].number];
          this->On_Sprite_Click(entity, sprite);
        }
      }
      else if (this->button == eBUTTON_RIGHT) {
        entity["sel-sprite"].Set_Number(NO_VALUE_FOUND);
      }
    }
    if (this->mouse_over == entity["id"].string) {
      if (entity["sel-sprite"].number != NO_VALUE_FOUND) {
        tObject& sprite = this->sprite_layers[entity["sel-layer"].string][entity["sel-sprite"].number];
        sprite["x"].Set_Number(this->mouse_over_coords.x + entity["scroll-x"].number);
        sprite["y"].Set_Number(this->mouse_over_coords.y + entity["scroll-y"].number);
        this->On_Sprite_Move(entity, sprite);
      }
    } 
  }
  
  /**
   * Sets the timer for the keyboard. 
   * @param entity The map editor component.
   */
  void cPage::Set_Timer(tObject& entity) {
    entity["timer"].Set_Number(60 / 5);
  }
  
  /**
   * Determines if a sprite was select and which one was.
   * @param coords The coordinates of the mouse.
   * @param entity The map editor component.
   * @return The index of the sprite selected or NO_VALUE_FOUND. 
   */
  int cPage::Select_Sprite(sPoint coords, tObject& entity) {
    int sel_sprite = NO_VALUE_FOUND;
    int sprite_count = this->sprite_layers[entity["sel-layer"].string].Count();
    for (int sprite_index = 0; sprite_index < sprite_count; sprite_index++) {
      tObject& sprite = this->sprite_layers[entity["sel-layer"].string][sprite_index];
      if (sprite["layer"].string == entity["sel-layer"].string) { // Make sure the sprite is in the correct layer.
        sRectangle bump_map;
        bump_map.left = sprite["x"].number - entity["scroll-x"].number;
        bump_map.top = sprite["y"].number - entity["scroll-y"].number;
        bump_map.right = bump_map.left + this->io->Get_Image_Width(sprite["icon"].string) - 1 - entity["scroll-x"].number;
        bump_map.bottom = bump_map.top + this->io->Get_Image_Height(sprite["icon"].string) - 1 - entity["scroll-y"].number;
        if (Is_Point_In_Box(coords, bump_map)) {
          sel_sprite = sprite_index;
          break;
        }
      }
    }
    return sel_sprite;
  }
  
  /**
   * Creates a new sprite.
   * @param coords The mouse coordinates where to lay down the sprite.
   * @param entity The map editor component.
   * @return The index of the new sprite.
   */
  int cPage::Create_Sprite(sPoint coords, tObject& entity) {
    int sel_sprite = NO_VALUE_FOUND;
    tObject& sprite = this->sprite_palette[entity["sel-sprite-type"].string];
    if (sprite["layer"].string == entity["sel-layer"].string) {
      sprite["x"].Set_Number(entity["scroll-x"].number + coords.x);
      sprite["y"].Set_Number(entity["scroll-y"].number + coords.y);
      this->sprite_layers[entity["sel-layer"].string].Add(sprite);
      sel_sprite = this->sprite_layers[entity["sel-layer"].string].Count() - 1;
    }
    return sel_sprite;
  }
  
  /**
   * Renders the level.
   * @param entity The map editor component.
   */
  void cPage::Render_Sprites(tObject& entity) {
    // Color background white.
    this->io->Color(255, 255, 255);
    // Draw the background.
    int bkg_width = this->io->Get_Image_Width(entity["background"].string + "_Bkg");
    int bkg_height = this->io->Get_Image_Height(entity["background"].string + "_Bkg");
    this->io->Draw_Image(entity["background"].string + "_Bkg", 0, 0, bkg_width, bkg_height, 0, false, false);
    // Draw the sprites.
    int layer_count = this->sprite_layers.Count();
    for (int layer_index = 0; layer_index < layer_count; layer_index++) {
      std::string layer = this->sprite_layers.keys[layer_index];
      int sprite_count = this->sprite_layers[layer].Count();
      for (int sprite_index = 0; sprite_index < sprite_count; sprite_index++) {
        tObject& sprite = this->sprite_layers[layer][sprite_index];
        int x = sprite["x"].number;
        int y = sprite["y"].number;
        int size_x = sprite["size-x"].number;
        int size_y = sprite["size-y"].number;
        int sprite_width = this->io->Get_Image_Width(sprite["icon"].string);
        int sprite_height = this->io->Get_Image_Height(sprite["icon"].string);
        for (int sprite_y = 0; sprite_y < size_y; sprite_y++) {
          for (int sprite_x = 0; sprite_x < size_x; sprite_x++) {
            this->io->Draw_Image(sprite["icon"].string, x + (sprite_x * sprite_width) - entity["scroll-x"].number, y + (sprite_y * sprite_height) - entity["scroll-y"].number, sprite_width, sprite_height, 0, false, false);
          }
        }
      }
      // Render level console.
      this->io->Box(0, bkg_height, bkg_width, 32, 255, 255, 255); // Render white box.
      tObject& sprite_entry = this->sprite_palette[entity["sel-sprite-type"].number];
      this->io->Draw_Image(sprite_entry["icon"].string, 5, bkg_height + 5, 20, 20, 0, false, false);
      this->io->Output_Text(sprite_entry["layer"].string, 30, bkg_height + 3, 0, 0, 0); // Output the name of the layer that the sprite is on.
      int text_width = this->io->Get_Text_Width("Layer: " + entity["sel-layer"].string);
      int text_height = this->io->Get_Text_Height("Layer: " + entity["sel-layer"].string);
      this->io->Output_Text("Layer: " + entity["sel-layer"].string, bkg_width - 5 - text_width, bkg_height + 3, 0, 0, 0);
    }
  }
  
  /**
   * Destars starred sprite properties.
   * @param sprite The sprite properties to destar.
   */
  void cPage::Destar_Sprite(tObject& sprite) {
    int prop_count = sprite.Count();
    for (int prop_index = 0; prop_index < prop_count; prop_index++) {
      Check_Condition((sprite.keys[prop_index].length() > 0), "Key is NULL.");
      if (sprite.keys[prop_index][0] == '*') {
        sprite.keys[prop_index] = sprite.keys[prop_index].substr(1); // Destar the key.
      }
    }
  }
  
  /**
   * Gets the list of levels.
   * @return The list of levels without the extension.
   */
  cArray<std::string> cPage::Get_Level_List() {
    cArray<std::string> level_list;
    cArray<std::string> files = this->io->Get_File_List(this->io->Get_Current_Folder());
    int file_count = files.Count();
    level_list.Add("None"); // Add no level option.
    for (int file_index = 0; file_index < file_count; file_index++) {
      std::string file = files[file_index];
      std::string ext = this->io->Get_File_Extension(file);
      if (ext == "map") {
        std::string level = this->io->Get_File_Title(file);
        level_list.Add(level);
      }
    }
    return level_list;
  }
  
  /**
   * Called when a sprite is clicked on or created.
   * @param entity The map editor component.
   * @param sprite The sprite that was clicked.
   */
  void cPage::On_Sprite_Click(tObject& entity, tObject& sprite) {
    // To be implemented in app.
  }
  
  /**
   * Called when the sprite is clicked.
   * @param entity The map editor component.
   * @param sprite The sprite that was clicked.
   */
  void cPage::On_Sprite_Click(tObject& entity, tObject& sprite) {
    // To be implemented in app.
  }
  
  /**
   * Called when the sprite is moved.
   * @param entity The map editor component.
   * @param sprite The sprite that was moved.
   */
  void cPage::On_Sprite_Move(tObject& entity, tObject& sprite) {
    // Clicked when the sprite is moved.
  }
  
  /**
   * Called when the sprite is resized.
   * @param entity The map editor component.
   * @param sprite The sprite that was resized.
   */
  void cPage::On_Sprite_Resize(tObject& entity, tObject& sprite) {
    // To be implemented in app.
  }
  
  /**
   * Called when the sprite is nudged.
   * @param entity The map editor component.
   * @param sprite The sprite that was nudged.
   */
  void cPage::On_Sprite_Nudge(tObject& entity, tObject& sprite) {
    // To be implemented in app.
  }
  
  /**
   * Called when the sprite is deleted.
   * @param entity The map editor component.
   * @param sprite The sprite that was deleted.
   */
  void cPage::On_Sprite_Delete(tObject& entity, tObject sprite) {
    // To be implemented in app.
  }
  
  /**
   * Loads an object from a grid.
   * @param object The object.
   * @param name The name of the grid component.
   * @throws An error if the grid component does not exist.
   */
  void cPage::Load_Object_From_Grid(tObject& object, std::string name) {
    Check_Condition(this->components.Does_Key_Exist(name), "Component " + name + " does not exist.");
    object.Clear();
    tObject& grid = this->components[name];
    int row_count = grid["rows"].number;
    for (int row_index = 0; row_index < row_count; row_index++) {
      std::string key = this->Get_Grid_Cell(grid, 0, row_index);
      std::string value = this->Get_Grid_Cell(grid, 1, row_index);
      if ((key.length() > 0) && (key != "free")) { // Ignore blank names.
        object[key] = value;
      }
    }
  }
  
  /**
   * Saves an object to a grid.
   * @param object The object.
   * @param name The name of the grid component.
   * @throws An error if the object has too many properties or grid does not exist.
   */
  void cPage::Save_Object_To_Grid(tObject& object, std::string name) {
    Check_Condition(this->components.Does_Key_Exist(name), "Grid does not exist.");
    tObject& grid = this->components[name];
    int prop_count = object.Count();
    Check_Condition((prop_count <= grid["rows"].number), "Too many properties in object.");
    this->Clear_Grid(grid);
    for (int prop_index = 0; prop_index < prop_count; prop_index++) {
      std::string key = object.keys[prop_index];
      std::string value = object[name].string;
      this->Set_Grid_Cell(grid, 0, prop_index, key);
      this->Set_Grid_Cell(grid, 1, prop_index, value);
    }
  }
  
  // **************************************************************************
  // Page Manager Implementation
  // **************************************************************************

  /**
   * Retrieves a component from a page given the reference.
   * @param ref The component reference. References look like this: page->component
   * @throws An error if the component could not retrieved.
   */
  tObject& cPage_Manager::operator[] (std::string ref) {
    cArray<std::string> pair = Parse_Sausage_Text(ref, "->");
    Check_Condition((pair.Count() == 2), "Invalid object reference format.");
    std::string page = pair[0];
    std::string component = pair[1];
    Check_Condition(this->pages.Does_Key_Exist(page), "No paged named " + page + ".");
    cPage* page_ptr = this->pages[page].pointer;
    Check_Condition(page_ptr->components.Does_Key_Exist(component), "No component named " + component + " in page " + page + ".");
    return page_ptr->components[component];
  }

  /**
   * Renders the currently selected page. 
   */
  void cPage_Manager::Render() {
    this->pages[this->sel_page].pointer->Render();
  }

  /**
   * Goes to a specific page.
   * @param name The name of the page to go to.
   * @throws An error if the page does not exist. 
   */
  void cPage_Manager::Go_To_Page(std::string name) {
    Check_Condition(this->pages.Does_Key_Exist(name), "No page named " + name + ".");
    this->sel_page = name;
  }

  /**
   * Adds a page to the page manager.
   * @param page The instantiated page object.
   * @param name The name of the page.
   */
  void cPage_Manager::Add_Page(cPage* page, std::string name) {
    this->pages[name].Init(page);
    // Initialize page.
    this->pages[name].pointer->Parse_Layout(name);
    this->pages[name].pointer->On_Init();
    // Select as initial page.
    this->Go_To_Page(name);
  }

  // **************************************************************************
  // General Purpose API
  // **************************************************************************

  /**
   * Parses sausage text which is like sausages bound with delimiter.
   * @param text The text to parse.
   * @param delimiter The delimiter separating the text.
   * @return A vector of parsed texts.
   */
  cArray<std::string> Parse_Sausage_Text(std::string text, std::string delimiter) {
    cArray<std::string> tokens;
    try {
      std::size_t start = 0;
      std::size_t end = text.find(delimiter, start);
      while (end != std::string::npos) {
        std::size_t count = end - start;
        std::string token = text.substr(start, count);
        if (token.length() > 0) { // No NULL tokens!
          tokens.Add(token);
        }
        start = end + delimiter.length();
        end = text.find(delimiter, start);
      }
      // Get last token.
      std::string token = text.substr(start);
      if (token.length() > 0) {
        tokens.Add(token);
      }
    }
    catch (std::out_of_range error) {
      // Do nothing.
    }
    return tokens;
  }

  /**
   * Converts text to a number.
   * @param text The numeric text.
   * @return The integer number.
   * @throws An error if the number is invalid.
   */
  int Text_To_Number(std::string text) {
    int number = 0;
    if (text.length() > 0) {
      char letter = text[0];
      int start = 0;
      int sign = 1;
      if (letter == '0') {
        start = 0;
        sign = 0;
      }
      else if (letter == '-') {
        start = 1;
        sign = -1;
      }
      else if ((letter >= '1') && (letter <= '9')) { // Positive
        start = 0;
        sign = 1;
      }
      else {
        throw cError("Invalid starting digit in " + text + ".");
      }
      // Process digits.
      int digit_count = text.length();
      for (int digit_index = start; digit_index < digit_count; digit_index++) {
        letter = text[digit_index];
        if (digit_index == start) { // Start digit testing.
          if (sign < 0) { // Negative
            if ((letter >= '1') && (letter <= '9')) {
              number = (number * 10) + (letter - '0'); // Add digit.
            }
            else {
              throw cError("Invalid start digit for negative number in " + text + ".");
            }
          }
          else if (sign > 0) { // Positive
            number = (number * 10) + (letter - '0');
          }
          else { // Zero
            if (digit_count == 1) {
              number = 0;
            }
            else {
              throw cError("More than one digit for zero in " + text + ".");
            }
          }
        }
        else { // Rest of number.
          if ((letter >= '0') && (letter <= '9')) {
            number = (number * 10) + (letter - '0');
          }
          else {
            throw cError("Invalid digit in next part of number for " + text + ".");
          }
        }
      }
      number *= sign;
    }
    else {
      throw cError(text + " is not a number.");
    }
    return number;
  }

  /**
   * Converts a number to text.
   * @param number The number to convert to text.
   * @return The text version of the number.
   */
  std::string Number_To_Text(int number) {
    cArray<char> buffer;
    char sign = 0;
    if (number == 0) {
      buffer.Unshift('0');
    }
    else if (number < 0) {
      sign = '-';
      number *= -1; // Make positive.
    }
    while (number > 0) {
      int remainder = (number % 10);
      char digit = remainder + '0'; // Normalize to character.
      number -= remainder;
      number /= 10;
      buffer.Unshift(digit);
    }
    if (sign) {
      buffer.Unshift(sign);
    }
    int letter_count = buffer.Count();
    std::string text = "";
    for (int letter_index = 0; letter_index < letter_count; letter_index++) {
      text += buffer[letter_index];
    }
    return text;
  }

  /**
   * Parses a C-Lesh line.
   * @param line The line of text.
   * @return An array of tokens. None are NULL.
   */
  cArray<std::string> Parse_C_Lesh_Line(std::string line) {
    int letter_count = line.length();
    std::string token = "";
    cArray<std::string> tokens;
    for (int letter_index = 0; letter_index < letter_count; letter_index++) {
      char letter = line[letter_index];
      if ((letter == ' ') || (letter == '\t')) {
        if (token.length() > 0) {
          tokens.Add(token);
          token = "";
        }
      }
      else { // Non-whitespace.
        token += letter;
      }
    }
    // Add last token.
    if (token.length() > 0) {
      tokens.Add(token);
    }
    return tokens;
  }

  /**
   * Converts a C-Lesh string to a C/C++ string.
   * @param text The text to convert.
   * @return A C++ string.
   */
  std::string C_Lesh_String_To_Cpp_String(std::string text) {
    cArray<std::string> words = Parse_Sausage_Text(text, "\\s");
    int word_count = words.Count();
    std::string cpp_text = "";
    for (int word_index = 0; word_index < word_count; word_index++) {
      cpp_text += words[word_index];
      if (word_index < (word_count - 1)) {
        cpp_text += " ";
      }
    }
    return cpp_text;
  }

  /**
   * Determines if a point is in a box.
   * @param point The point to test.
   * @param box The box.
   * @return True if the point is in the box, false otherwise.
   */
  bool Is_Point_In_Box(sPoint point, sRectangle box) {
    bool result = false;
    if ((point.x >= box.left) && (point.x <= box.right) && (point.y >= box.top) && (point.y <= box.bottom)) {
      result = true;
    }
    return result;
  }

  /**
   * Joins an array of strings into a single string using a glue string to join them.
   * @param tokens The array of token strings.
   * @param glue The glue string.
   * @return The joined string.
   */
  std::string Join(cArray<std::string>& tokens, std::string glue) {
    std::string text = "";
    int token_count = tokens.Count();
    for (int token_index = 0; token_index < token_count; token_index++) {
      text += tokens[token_index];
      if (token_index < (token_count - 1)) {
        text += glue;
      }
    }
    return text;
  }

  /**
   * Checks to see if a condition holds. If not throws an error.
   * @param condition The condition to test.
   * @param message The error message.
   * @throws An error if the condition is false.
   */
  void Check_Condition(bool condition, std::string message) {
    if (!condition) {
      throw cError(message);
    }
  }

}