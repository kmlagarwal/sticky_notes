<?php
// $Id$

/**
 * @file
 * Handles the admin page for the configuration of the sticky_notes module.
 */

/**
 * Formbuilder for the sticky notes admin form
 *
 * @param array $form_state 
 *
 * @return array
 *  Form array
 *
 * @author Ralf Baumbach
 * @see sticky_notes_admin_form_validate()
 * @see sticky_notes_admin_form_submit()
 * @ingroup forms
 */

function sticky_notes_admin_form($form_state) {
  
  $form = array();
  
  $form['minimal_zindex'] = array(
    '#type' => 'textfield',
    '#title' => t('Minimal z-index for sticky notes'),
    '#description' => t('If you encounter problems with the display of sticky notes, like partially hidden notes, you can try to increase this value.'),
    '#default_value' => variable_get('sticky_notes_minimal_zindex', STICKY_NOTES_DEFAULT_ZINDEX),
  );
  
  $form['show_on_admin'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show on admin pages'),
    '#description' => t('Check this option if you want to see Sticky Notes on admin pages.'),
    '#default_value' => variable_get('sticky_notes_show_on_admin', STICKY_NOTES_DEFAULT_SHOW_ON_ADMIN),
  );
  
  $form['info_box'] = array(
    '#type' => 'fieldset',
    '#title' => t('Settings for the sticky notes info box'),
  );
  
  $form['info_box']['info_box_corner'] = array(
    '#type' => 'select',
    '#title' => t('Corner'),
    '#options' => array(
      STICKY_NOTES_INFO_BOX_CORNER_TOP_LEFT => t('top left'),
      STICKY_NOTES_INFO_BOX_CORNER_TOP_RIGHT => t('top right'),
      STICKY_NOTES_INFO_BOX_CORNER_BOTTOM_LEFT => t('bottom left'),
      STICKY_NOTES_INFO_BOX_CORNER_BOTTOM_RIGHT => t('bottom right'),
    ),
    '#description' => t('Where to show the info box.'),
    '#default_value' => variable_get('sticky_notes_info_box_corner', STICKY_NOTES_DEFAULT_INFO_BOX_CORNER),
  );
  
  $form['info_box']['info_box_hide'] = array(
    '#type' => 'checkbox',
    '#title' => t('Hide info box'),
    '#description' => t('Check this, if you want that the info box wille be hidden until you move your mouse in the selectd corner.'),
    '#default_value' => variable_get('sticky_notes_info_box_hide', STICKY_NOTES_DEFAULT_INFO_BOX_HIDE),
  );
  
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
  );
  
  return $form;
  
}

/**
 * Implementation of hook_validate
 *
 * @author Ralf Baumbach
 * @see sticky_notes_admin_form()
 * @see sticky_notes_admin_form_submit()
 */

function sticky_notes_admin_form_validate($form, &$form_state) {
  
  $values = $form_state['values'];
  if (!is_numeric($values['minimal_zindex'])) {
    form_set_error('minimal_zindex', t('You must specify an integer value.'));
  }
  
}

/**
 * Implementation of hook_submit
 *
 * @author Ralf Baumbach
 * @see sticky_notes_admin_form()
 * @see sticky_notes_admin_form_validate()
 */

function sticky_notes_admin_form_submit($form, &$form_state) {
  
  $values = $form_state['values'];
  variable_set('sticky_notes_minimal_zindex', $values['minimal_zindex']);
  variable_set('sticky_notes_show_on_admin', $values['show_on_admin']);
  variable_set('sticky_notes_info_box_corner', $values['info_box_corner']);
  variable_set('sticky_notes_info_box_hide', $values['info_box_hide']);
}
