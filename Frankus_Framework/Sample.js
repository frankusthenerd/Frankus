// CODE OF THE WEEK - Binary Tree

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
