<?php
// $Id: sticky-notes-note.tpl.php,v 1.1.2.4 2010/09/07 11:51:47 berliner Exp $

/**
 * @file
 * The template for an individaul sticky note
 *
 * Available variables
 *  $node                 The full node object with some sticky notes specific
 *                        attributes.
 *    position_x          The x position.
 *    position_y          The y position.
 *    position_z          The z position.
 *  $note_can_be_modified Flags a note to be editable.
 *  $note_can_be_deleted  Flags a note to be deletable.
 *  $priority_image       The image that represents the priority.
 *  $content              The output save content of the note.
 *  $author               The output save author of the note.
 *  $sticky_note_width    The default width of a sticky note.
 *  $sticky_note_height   The default height of a sticky note.
 *
 * This template can be overridden by placing a file with the same name into
 * the theme directory.
 *
 * @author berliner
 */

?>

<div id="sticky-note-<?php print $node->nid; ?>" class="sticky-notes-note-item-wrapper <?php print $edit_link ? 'editable' : ''; ?> sticky-note-priority-<?php print $node->priority; ?>" style="width: <?php print $sticky_note_width; ?>px; height: <?php print $sticky_note_height; ?>px; position: absolute; top: <?php print $node->position_y; ?>px; left: <?php print $node->position_x; ?>px; z-index: <?php print $node->position_z; ?>;">
  
  <?php if ($priority_image): ?>
    <div class="sticky-notes-note-item-priority"><?php print $priority_image; ?></div>
  <?php endif; ?>
  
  <?php if ($edit_link || $delete_link): ?>
    <div class="sticky-notes-note-item-actions-wrapper">
      <div class="sticky-notes-note-item-actions">
        <?php if ($edit_link): ?>
          <?php print $edit_link; ?>
        <?php endif; ?>
        <?php if ($delete_link): ?>
          <?php print $delete_link; ?>
        <?php endif; ?>
      </div>
    </div>
  <?php endif; ?>
  
  <div class="sticky-notes-note-item" style="width: <?php print $sticky_note_width - 4; ?>px; height: <?php print $sticky_note_height - 4; ?>px; <?php if ($sticky_note_note_color): ?>background-color: <?php print $sticky_note_note_color; ?>;<?php endif; ?> <?php if ($sticky_note_border_color): ?>border: 1px solid <?php print $sticky_note_border_color; ?><?php endif; ?>">
    <div class="sticky-notes-note-item-header" style="background-color: <?php print $sticky_note_header_color; ?>"></div>
    <span class="sticky-note-nid"><?php print $node->nid; ?></span>
    <?php if ($node->attached_to): ?>
      <span class="sticky-note-parent">
        <span class="sticky-note-parent-path"><?php print $node->attached_to['path']; ?></span>
        <span class="sticky-note-parent-top"><?php print $node->attached_to['top']; ?></span>
        <span class="sticky-note-parent-left"><?php print $node->attached_to['left']; ?></span>
      </span>
    <?php endif; ?>
    <div class="sticky-notes-note-item-body-wrapper" style="color: <?php print $sticky_note_text_color; ?>;">
      <div class="sticky-notes-note-item-body">
        <?php print $content; ?>
      </div>
    </div>
    <?php if (theme_get_setting('toggle_node_info_sticky_notes')) : ?>
      <div class="sticky-notes-note-item-author-wrapper" style="background-color: <?php print $sticky_note_note_color; ?>; color: <?php print $sticky_note_text_color; ?>;">
        <div class="sticky-notes-note-item-author">
          <?php print $author; ?>, <?php print format_date($node->created, 'small'); ?>
        </div>
      </div>
    <?php endif; ?>
  </div>

</div>