<div id="sticky-notes-info-box-wrapper">
  <div id="sticky-notes-info-box" class="<?php if ($classes) { print $classes; } ?>">
    <div class="content">
      
      <?php if ($sticky_notes_add_button): ?>
        <div id="sticky-notes-add-note-button">
          <a href="<?php print $link; ?>">+ Add Note</a>
        </div>
        <br />
      <?php endif; ?>
      <div id="sticky-notes-page-count"></div>
      <br />
      <div id="sticky-notes-options">
        <a id="sticky-notes-options-show-all" href="#">show all</a>
      </div>
      
    </div>
  </div>
</div>