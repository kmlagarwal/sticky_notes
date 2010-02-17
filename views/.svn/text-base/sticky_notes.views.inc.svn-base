<?php
// $Id$

/**
 * @file
 * Views integration for the sticky_notes module.
 */

/**
 * Implementation of hook_views_data().
 *
 * @return void
 * @author Ralf Baumbach
 */

function sticky_notes_views_data() {
  
  $data = array();
  $data['node_sticky_note']['table']['group'] = 'Sticky Notes';
  $data['node_sticky_note']['table']['join'] = array(
    'node' => array(
      'field' => 'nid',
      'left_field' => 'nid',
    ),
  );
  $data['node_sticky_note']['priority'] = array(
    'title' => t('Priority'),
    'help' => t('The notes priority'),
    'field' => array(
      'handler' => 'views_handler_field_sticky_notes_priority',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_sticky_notes_priority',
    ),
  );
  return $data;
}

/**
 * Implementation of hook_views_handlers().
 *
 * @return void
 * @author Ralf Baumbach
 */

function sticky_notes_views_handlers() {
  return array(
    'info' => array(
      'path' => drupal_get_path('module', 'sticky_notes') . '/views',
    ),
    'handlers' => array(
      'views_handler_field_sticky_notes_priority' => array('parent' => 'views_handler_field'),
      'views_handler_filter_sticky_notes_priority' => array('parent' => 'views_handler_filter'),
    ),
  );
}
