<?php
// $Id$

/**
 * @file
 * Ajax callbacks for the sticky_notes module.
 */

/**
 * Ajax callback: Load notes for the current page
 *
 * @return void
 * @author Ralf Baumbach
 */

function js_sticky_notes_load() {
  
  global $user;
  if (!sticky_notes_access('view', $node, $user)) {
    return;
  }
  
  $menu_item = menu_get_item();
  $pattern = !$_REQUEST['pattern'] ? $menu_item['path'] : $_REQUEST['pattern'];
  $path = !$_REQUEST['path'] ? $menu_item['href'] : $_REQUEST['path'];
  
  $nodes = sticky_notes_load_by_path($pattern, $path);
  
  $items = array();
  foreach ($nodes as $node) {
    $items[] = theme('sticky_notes_note', $node);
  }
  
  drupal_json(theme('sticky_notes_wrapper', implode('', $items)));
  exit();
  
}

/**
 * Ajax callback: Delete the given node
 *
 * @param object $node 
 * @return void
 * @author Ralf Baumbach
 */

function js_sticky_notes_delete($node) {
  
  global $user;
  if (!sticky_notes_access('delete', $node, $user)) {
    return;
  }
  
  if ($node->nid) {
    node_delete($node->nid);
    drupal_get_messages();
    $result = TRUE;
  }
  else {
    $result = FALSE;
  }
  
  drupal_json($result);
  exit();
  
}

/**
 * Ajax Callback: Save the position of a sticky note relative to the document
 *
 * @param object $node 
 * @param int $x 
 * @param int $y 
 * @return void
 * @author Ralf Baumbach
 */

function js_sticky_notes_save_position($node, $x, $y) {
  
  // check if the user has permission to modify the node
  global $user;
  if (!sticky_notes_access('update', $node, $user)) {
    return;
  }
  else {
    
    // reestablish order of the notes on the page and retrieve the highest z_index
    $z_index = sticky_notes_reorder_page_notes($node->link_path, $node->link_pattern);
  
    // update the notes position in the database and increase the z-index so
    // that this note will be on top of all the others
    db_query('UPDATE {node_sticky_note} SET position_x = %d, position_y = %d, position_z = %d WHERE nid = %d', $x, $y, $z_index++, $node->nid);
    
  }
  
}

/**
 * Ajax Callback: Get the note count for the current page
 *
 * @return string
 *  JSON output: A translated string containing the number of notes
 * @author Ralf Baumbach
 */

function js_sticky_notes_page_count() {
  $menu_item = menu_get_item();
  $pattern = !$_REQUEST['pattern'] ? $menu_item['path'] : $_REQUEST['pattern'];
  $path = !$_REQUEST['path'] ? $menu_item['href'] : $_REQUEST['path'];
  $notes = sticky_notes_load_by_path($pattern, $path);
  $count_notes = format_plural(count($notes), '1 note', '@count notes');
  drupal_json($count_notes);
  exit();
}
