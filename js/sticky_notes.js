// $Id$

StickyNotes = function(){};

StickyNotes.query;
StickyNotes.path;
StickyNotes.positions = [];
StickyNotes.elements_selector = 'div.sticky-notes-note-item-wrapper';
StickyNotes.zIndex;

$(document).ready(function() {
  
  StickyNotes.path = Drupal.settings.sticky_notes.current_path;
  StickyNotes.query = 'pattern=' + Drupal.settings.sticky_notes.current_pattern + '&path=' + StickyNotes.path;
  
  $(document).bind('popups_form_success', function() {
    // sticky note has been added, now we can reload all available notes
    // for the current page and display them, including the newly added
    StickyNotes.updatePage();
  });
  
  // fix for Popups API fixed z-index values
  $(document).bind('popups_open_path_done', function() {
    $('.popups-box').css('z-index', StickyNotes.zIndex + 2);
    $('#popups-loading').css('z-index', StickyNotes.zIndex + 3);
    return false;
  });
  $('div#sticky-notes-add-note-button a').click(function() {
    $('#sticky-notes-overlay').css('z-index', StickyNotes.zIndex + 1);
    return false;
  });
  
  // implement info box display on hover
  $('div#sticky-notes-info-box-wrapper').bind('mouseenter', function() {
    $('#sticky-notes-info-box .content').fadeIn('fast');
    return false;
  }).bind('mouseleave', function() {
    $('#sticky-notes-info-box .content').fadeOut('fast');
    return false;
  });
  
  // initial loading of all sticky notes for this page
  StickyNotes.loadPage();
  
});

/**
* Load the notes for this page
*/
StickyNotes.loadPage = function() {
  $.getJSON('/sticky-notes/load?' + StickyNotes.query, function(data) {
    $('body').append(data);
    StickyNotes.init();
  });
}

/**
* Update the notes for this page
*/
StickyNotes.updatePage = function() {
  $.getJSON('/sticky-notes/load?' + StickyNotes.query, function(data) {
    $('#sticky-notes-wrapper').replaceWith(data);
    StickyNotes.init();
  });
}

/**
* Init the sticky notes, attach behaviours, update page counter ...
*/
StickyNotes.init = function() {
  
  StickyNotes.zIndex = Drupal.settings.sticky_notes.minimal_z_index;
  
  $(StickyNotes.elements_selector).each(function() { 
    // save the initial element positions
    var nid = parseInt($(this).find('span.sticky-note-nid').html());
    StickyNotes.positions[nid] = {left: $(this).css('left'), top: $(this).css('top')};
    
    // find the one with the highest z-index
    if ($(this).css('z-index') > StickyNotes.zIndex) {
      StickyNotes.zIndex = $(this).css('z-index');
    }
  });
  
  // make sure that a note the user clicks on will pop up immediately
  $(StickyNotes.elements_selector).click(function() {
    if (StickyNotes.zIndex > $(this).css('z-index')) {
      $(this).css('z-index', ++StickyNotes.zIndex);
    }
    if ($(this).hasClass('ui-draggable')) {
      var nid = parseInt($(this).find('span.sticky-note-nid').html());
      StickyNotes.savePosition(nid, $(this).css('left').replace('px', ''), $(this).css('top').replace('px', ''));
    }
    return false;
  });
  
  // make them draggable
	StickyNotes.makeDraggable(StickyNotes.elements_selector);
	
	$('.sticky-notes-note-item-actions a').each(function() {
	  $(this).attr('href', $(this).attr('href') + '?' + StickyNotes.query + 'destination=node');
	});
  
  // attach the popup behaviour to the actions buttons
  Popups.attach('', 'div.sticky-notes-note-item-actions a', Popups.options({
    updateMethod: 'none',
    doneTest: 'node',
    noUpdate: 'true',
    noMessage: true
  }));
  
  $('div.sticky-notes-note-item-actions a').bind('click', function() {
    if ($('#popups-overlay').length > 0) {
      StickyNotes.showPositioned(StickyNotes.elements_selector);
    }
    $('#popups-overlay').css('z-index', StickyNotes.zIndex + 1);
    return false;
  });
  
  // show all sticky notes in a grid to give overview
  $('#sticky-notes-options-show-all').click(function() {
    StickyNotes.showGrid(StickyNotes.elements_selector);
  });
  
  // update the notes page count
  StickyNotes.updatePageCount();
  
}

/**
* Show all sticky notes of this page as a grid. Kind of exposé function.
*/
StickyNotes.showGrid = function() {
  
  var window_width = $(window).width();
  var vertical_offset = $(window).scrollTop()
  var offset = 50;
  var cols = 0;
  var rows = 0;
  var left, top;
  var positions;
  
  // define the overlay, from Popups API
  var $overlay = $('#popups-overlay');
  if (!$overlay.length) {
    $overlay = $(Drupal.theme('popupOverlay'));
    $overlay.css('opacity', '0.4'); // for ie6(?)
    // Doing absolute positioning, so make overlay's size equal the entire body.
    var $doc = $(document);
    $overlay.width($doc.width()).height($doc.height()); 
    $overlay.click(function(){
      StickyNotes.showPositioned(StickyNotes.elements_selector);
    });
    $('body').prepend($overlay);
  }
  
  // move each element to its new positions
  $(StickyNotes.elements_selector).each(function() {
    
    // get the current nid
    var nid = parseInt($(this).find('span.sticky-note-nid').html());
    
    // update the positions array
    StickyNotes.positions[nid] = {left: $(this).css('left'), top: $(this).css('top')};
    
    // calculate the target coordinates
    if (cols * (150 + offset) + offset < (window_width - 150 + offset)) {
      left = cols * (150 + offset) + offset;
    } else {
      rows++;
      cols = 0;
      left = cols * (150 + offset) + offset;
    }
    top = vertical_offset + rows * (150 + offset) + offset;
    
    // and trigger the aninmation
    $(this).animate({'left': left, 'top': top}, "slow");
    cols++;
    
  });
  
  // disable dragging
  $(StickyNotes.elements_selector).draggable('destroy');
}

/**
* Move the sticky notes to there positions, as set by the user
*/
StickyNotes.showPositioned = function() {
  $(StickyNotes.elements_selector).each(function() {
    var nid = parseInt($(this).find('span.sticky-note-nid').html());
    $(this).animate({'left': StickyNotes.positions[nid].left, 'top': StickyNotes.positions[nid].top}, "slow");
  });
  Popups.removeOverlay();
  StickyNotes.makeDraggable(StickyNotes.elements_selector);
}

/**
* Make all sticky notes draggable
*/
StickyNotes.makeDraggable = function() {
  
  // make all notes draggables
	$(StickyNotes.elements_selector).draggable({
		containment:'document',
		start:function(e,ui){ if (StickyNotes.zIndex > ui.helper.css('z-index')) {ui.helper.css('z-index', ++StickyNotes.zIndex) }},
		stop:function(e,ui){
		  
		  // get the nid of this note
		  var nid = parseInt(ui.helper.find('span.sticky-note-nid').html());
      
	    // Save the positon of the note
		  StickyNotes.savePosition(nid, ui.position.left, ui.position.top);
		  
		}
	});
}

/**
* Update the pages note counter
*/
StickyNotes.updatePageCount = function() {
  $.getJSON('/sticky-notes/count?' + StickyNotes.query, function(data) {
    $('#sticky-notes-page-count').html(data);
  });
}

/**
* Save the given positions for the given node nid, the handling of the
* z-index happens on the server side, in assumption that the given node must
* be the one on the top
*/
StickyNotes.savePosition = function(nid, x, y) {
  StickyNotes.positions[nid] = {left: x, top: y};
  $.get('/sticky-notes/save-position/' + nid + '/' + x + '/' + y);
}