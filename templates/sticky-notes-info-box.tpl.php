<div id="sticky-notes-info-box-wrapper">
  <div id="sticky-notes-info-box" class="<?php if ($classes) { print $classes; } ?>">
    <div class="content">
      
      <?php if ($add_link): ?>
        <div id="sticky-notes-add-note-button">
          <a href="<?php print $add_link; ?>">+ Add Note</a>
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