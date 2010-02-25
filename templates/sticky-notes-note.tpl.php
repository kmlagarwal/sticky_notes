<div class="sticky-notes-note-item-wrapper <?php if ($note_can_be_modified) { print 'editable'; } ?>" style="position: absolute; top: <?php print $node->position_y; ?>px; left: <?php print $node->position_x; ?>px; z-index: <?php print $node->position_z; ?>;">
  
  <div class="sticky-notes-note-item-priority"><?php print $priority_image; ?></div>
  
  <div class="sticky-notes-note-item-actions-wrapper">
    <div class="sticky-notes-note-item-actions">
      <?php if ($note_can_be_modified): ?>
        <a href="/node/<?php print $node->nid; ?>/edit" class="sticky-notes-edit-button" title="<?php print t('Edit Sticky Note'); ?>"><?php print t('Edit'); ?></a>
      <?php endif; ?>
      <?php if ($note_can_be_deleted): ?>
        <a href="/node/<?php print $node->nid; ?>/delete" class="sticky-notes-delete-button"><?php print t('Delete'); ?></a>
      <?php endif; ?>
    </div>
  </div>
  
  <div class="sticky-notes-note-item">
    <span class="sticky-note-nid"><?php print $node->nid; ?></span>
    <div class="sticky-notes-note-item-body">
      <?php print $content; ?>
    </div>
    <div class="sticky-notes-note-item-author">
      <div class="position"></div>
      <?php print $author; ?>, <?php print date('d.m.Y', $node->created); ?>
    </div>
  </div>
  
</div>