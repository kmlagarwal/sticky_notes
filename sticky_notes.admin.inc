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
  
  $form['basic'] = array(
    '#type' => 'fieldset',
    '#title' => t('Basic settings'),
  );
  
  $form['basic']['container_selector'] = array(
    '#type' => 'textfield',
    '#title' => t('Container selector'),
    '#description' => t('If you have a centered layout you should change this to your content containers CSS ID. A possible value could be "#wrapper". If you are not sure, look in the HTML source of your frontpage and identify the element that contains your content area. Changing this after having added notes will change the former position of those notes on the document, so handle with care!'),
    '#default_value' => variable_get('sticky_notes_container_selector', STICKY_NOTES_DEFAULT_CONTAINER_SELECTOR),
  );
  
  $form['basic']['minimal_zindex'] = array(
    '#type' => 'textfield',
    '#title' => t('Minimal z-index for sticky notes'),
    '#description' => t('If you encounter problems with the display of sticky notes, like partially hidden notes, you can try to increase this value.'),
    '#default_value' => variable_get('sticky_notes_minimal_zindex', STICKY_NOTES_DEFAULT_ZINDEX),
  );
  
  $form['basic']['show_on_admin'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show on admin pages'),
    '#description' => t('Check this option if you want to see Sticky Notes on admin pages.'),
    '#default_value' => variable_get('sticky_notes_show_on_admin', STICKY_NOTES_DEFAULT_SHOW_ON_ADMIN),
  );
  
  $form['info_box'] = array(
    '#type' => 'fieldset',
    '#title' => t('Info box'),
    '#description' => t('The info box provides a quick way to access sticky notes. It will be displayed in one of the four corners of your screen and contains links to add and hide the sticky notes or to show an exposé of all notes on the current page.')
  );
  
  $form['info_box']['info_box_corner'] = array(
    '#type' => 'select',
    '#title' => t('Position'),
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
    '#title' => t('Automatically hide the info box'),
    '#description' => t('Check this, if you want that the info box will be hidden until you move your mouse in the selected corner.'),
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
  variable_set('sticky_notes_container_selector', $values['container_selector']);
  variable_set('sticky_notes_minimal_zindex', $values['minimal_zindex']);
  variable_set('sticky_notes_show_on_admin', $values['show_on_admin']);
  variable_set('sticky_notes_info_box_corner', $values['info_box_corner']);
  variable_set('sticky_notes_info_box_hide', $values['info_box_hide']);
}
