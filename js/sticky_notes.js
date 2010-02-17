// $Id$

var sticky_notes_query_string;
var sticky_notes_current_path;

$(document).ready(function() {
  
  sticky_notes_current_path = Drupal.settings.sticky_notes.current_path;
  sticky_notes_query_string = 'pattern=' + Drupal.settings.sticky_notes.current_pattern + '&path=' + sticky_notes_current_path;
  
  $(document).bind('popups_form_success', function() {
    // sticky note has been added, now we can reload all available notes
    // for the current page and display them, including the newly added
    $.getJSON('/sticky-notes/load?' + sticky_notes_query_string, function(data) {
      $('#sticky-notes-wrapper').replaceWith(data);
      sticky_notes_init();
    });
  });
  
  // fix for Popups API fixed z-index values
  $(document).bind('popups_open_path_done', function() {
    $('.popups-box').css('z-index', zIndex + 2);
    $('#popups-loading').css('z-index', zIndex + 3);
    return false;
  });
  $('div#sticky-notes-add-note-button a').click(function() {
    $('#popups-overlay').css('z-index', zIndex + 1);
  });
  
  // initial loading of all sticky notes for this page
  $.getJSON('/sticky-notes/load?' + sticky_notes_query_string, function(data) {
    $('body').append(data);
    sticky_notes_init();
  });
  
});

var zIndex;

// Init the sticky notes, attach behaviours, update page counter ...
function sticky_notes_init() {
  
  zIndex = 0;
  elements = 'div.sticky-notes-note-item-wrapper';
  
  // iterate over all notes to find the one with the highest z-index
  $(elements).each(function() {
    if ($(this).css('z-index') > zIndex) {
      zIndex = $(this).css('z-index');
    }
  });
  
  // make sure that a note the user clicks on will pop up immediately
  $(elements).click(function() {
    if (zIndex > $(this).css('z-index')) {
      $(this).css('z-index', ++zIndex);
    }
    var nid = parseInt($(this).find('span.sticky-note-nid').html());
    sticky_notes_save_position(nid, $(this).css('left').replace('px', ''), $(this).css('top').replace('px', ''));
  });
  
	// make all notes draggables
	$(elements).draggable({
		containment:'document',
		start:function(e,ui){ if (zIndex > ui.helper.css('z-index')) {ui.helper.css('z-index', ++zIndex) }},
		stop:function(e,ui){
		  
		  // get the nid of this note
		  var nid = parseInt(ui.helper.find('span.sticky-note-nid').html());
      
	    // Save the positon of the note
		  sticky_notes_save_position(nid, ui.position.left, ui.position.top);
		  
		}
	});
	
	$('.sticky-notes-note-item-actions a').each(function() {
	  $(this).attr('href', $(this).attr('href') + '?' + sticky_notes_query_string + 'destination=node');
	});
  
  // attach th epopup behaviour to the actions buttons
  Popups.attach('', 'div.sticky-notes-note-item-actions a', Popups.options({
    updateMethod: 'none',
    doneTest: 'node',
    noUpdate: 'true',
    noMessage: true
  }));
  
  $('div.sticky-notes-note-item-actions a').bind('click', function() {
    $('#popups-overlay').css('z-index', zIndex + 1);
    return false;
  });
  
  sticky_notes_update_page_count();
  
}

function sticky_notes_update_page_count() {
  $.getJSON('/sticky-notes/count?' + sticky_notes_query_string, function(data) {
    $('#sticky-notes-page-count').html(data);
  });
}

// save the given positions for the given node nid, the handling of the
// z-index happens on the server side, in assumption that the given node must
// be the one on the top
function sticky_notes_save_position(nid, x, y) {
  $.get('/sticky-notes/save-position/' + nid + '/' + x + '/' + y);
}
