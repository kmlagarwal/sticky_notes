<?php
// $Id$

/**
 * @file
 * Provides a views filter handler class for the sticky_notes priority field.
 */

 /**
  * Simple filter class to select field for priority
  *
  * @author Ralf Baumbach
  */
 
class views_handler_filter_sticky_notes_priority extends views_handler_filter {

  /**
   * Provide simple equality operator
   */
  function operator_options() {
    return array(
      '=' => t('Is equal to'),
      '!=' => t('Is not equal to'),
    );
  }

  /**
   * Provide a simple textfield for equality
   */
  function value_form(&$form, &$form_state) {
    $form['value'] = array(
      '#type' => 'select',
      '#title' => t('Priority'),
      '#size' => 1,
      '#default_value' => $this->value,
      '#options' => sticky_notes_get_priority_array(),
    );

    if (!empty($form_state['exposed'])) {
      $identifier = $this->options['expose']['identifier'];
      if (!isset($form_state['input'][$identifier])) {
        $form_state['input'][$identifier] = $this->value;
      }
    }
  }
}

