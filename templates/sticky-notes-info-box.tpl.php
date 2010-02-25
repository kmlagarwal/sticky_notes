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
        <a id="sticky-notes-options-display-expose" href="#"><?php print t('Exposé'); ?></a>
        |
        <a id="sticky-notes-options-display-hidden" href="#"><?php print t('Hide notes'); ?></a>
        <a id="sticky-notes-options-display-normal" href="#"><?php print t('Show notes'); ?></a>
      </div>
      
    </div>
  </div>
</div>