<div id="sticky-notes-info-box-wrapper">
  <div id="sticky-notes-info-box" class="<?php if ($classes) { print $classes; } ?>">
    <div class="content">
      
      <?php if ($add_link): ?>
        <div id="sticky-notes-add-note-button">
          <a href="<?php print $add_link; ?>"><?php print t('+ Add note'); ?></a>
        </div>
      <?php endif; ?>
      
      <div id="sticky-notes-page-count"></div>
      
      <div id="sticky-notes-options">
        <a id="sticky-notes-options-show-all" href="#"><?php print t('show all'); ?></a>
      </div>
      
    </div>
  </div>
</div>