// $Id: sticky_notes.js,v 1.1.2.7 2010/09/24 10:38:02 berliner Exp $

/**
 * TODO centralize css class names !
 */

/**
 * Drupal JS theming
 */
 
Drupal.theme.prototype.sticky_notes_wrapper = function() {
    return '<div id="sticky-notes-wrapper" />';
};

Drupal.theme.prototype.sticky_notes_overlay = function() {
    return '<div id="sticky-notes-overlay" class="ui-widget-overlay" />';
};

Drupal.theme.prototype.sticky_notes_info_box = function() {
  return '<div id="sticky-notes-info-box-wrapper" />';
};


/*
 * Behaviors for this stript
 */
Drupal.behaviors.sticky_notes = function(context) {
  
  /*
   * Main script constants
   */
  var settings = {
    callbacks: Drupal.settings.sticky_notes.urls,
    query:     (Drupal.settings.sticky_notes.clean_urls_enabled ? '?' : '&') 
               + 'pattern=' + Drupal.settings.sticky_notes.current_pattern 
               + '&path=' + Drupal.settings.sticky_notes.current_path 
               + '&title=' + Drupal.settings.sticky_notes.origin_title,
    containerSelector: Drupal.settings.sticky_notes.container_selector, //F
    wrapperSelector: '#sticky-notes-wrapper',
    elementsSelector: 'div.sticky-notes-note-item-wrapper', //F
    infoboxWrapperSelector: '#sticky-notes-info-box-wrapper',
    resizable: Drupal.settings.sticky_notes.resizable,
    toggleVisibilityState: Drupal.settings.sticky_notes.toggle_visibility_state, //F
    hideOnPageLoad: Drupal.settings.sticky_notes.hide_on_page_load, //F
    minimal_z_index: Drupal.settings.sticky_notes.minimal_z_index,
    visibilityStateMemory: Drupal.settings.sticky_notes.visibility_state_memory,   
    noteDisplayDefaults: {
      width: parseInt(Drupal.settings.sticky_notes.note_width, 10),
      height: parseInt(Drupal.settings.sticky_notes.note_height, 10),
      fontBody:   12,
      fontAuthor: 10,
      lineHeight: 16
      },
    expose: {
       // We want the notes to be squared in exposé mode. 
       // We use the default width as the max note width and height in expose mode
       noteMaxSize: parseInt(Drupal.settings.sticky_notes.note_width, 10),
       // Minimum padding between the notes in expose mode
       minPadding: 20,  /*In pixels*/
       padding: 0.10,    /*Padding in % of note width*/
       windowPadding: 50,/*In pixels*/
       autoSize: Drupal.settings.sticky_notes.auto_size /*recompute grid on window resize ?*/
    }
  };
  
  // Main settings & general use functions
  var Main = {};  
  
  /*
   * Open modalFrame window on button click
   */
  Main.attachModalFrameBehaviours = function(selector, showNotesAfterSubmit) {
    var self = this;
  
    $(selector + ':not(.modalframe-sticky-notes-processed)')
      .addClass('modalframe-sticky-notes-processed')
      .click(function() {
        var element = this;
    
        // Hide the messages before opening a new dialog.
        $('.modalframe-sticky-notes-messages').hide('fast');
      
        // Build modal frame options.
        var modalOptions = {
            url: $(element).attr('href'),
            autoFit: true,
            width: 450,
            height: 212,
            onSubmit: function() {
              StickyNotes.update();
              if (showNotesAfterSubmit) {
                StickyNotes.setVisibility(true);
              }
            }
         };
    
        // make sure all notes are displayed normally, if we are in expose view
        // this will return to normal view
        StickyNotes.showPositioned();
  
        // Open the modal frame dialog.
        Drupal.modalFrame.open(modalOptions);
    
        // Prevent default action of the link click event.
        return false;
      });
  };
  
  Main.prepareDOM = function() {
    
    // make all other major dom elements droppable, but not the sticky notes themselves
  	$("body").children().not(settings.wrapperSelector).not(settings.infoboxWrapperSelector).find('*:visible').droppable({
      accept: settings.elementsSelector,
      activeClass: "ui-state-hover",
      hoverClass: "ui-state-active",
      addClasses: false,
      tolerance: 'pointer',
      greedy: true,
      over: function(event, ui) {
        $(this).css('outline', 'red solid 1px').addClass('sticky-note-hovered');
      },
      out: function(event, ui) {
        $(this).css('outline', 'none');
        $('.sticky-note-hovered').css('outline', 'none').removeClass('sticky-note-hovered');
      },
      drop: function( event, ui ) {
        
        // get the affected note
        var note = StickyNotes.getNote(parseInt(ui.draggable.find('span.sticky-note-nid').html(), 10));
        
        // get the path to the notes parent object
        var path = Main.getSelectorForElement($(this));
        
        // update the attached info and save
        note.attachTo(path);
        
        // remove all outlining information that was useful during drag
        $('.sticky-note-hovered').css('outline', 'none').removeClass('sticky-note-hovered');
        
      }
    });
  };
  
  // Each time the notes are loaded, we re-display them and update the infobox
  Main.stickyNotesLoaded = function() {
    StickyNotes.init();
    Infobox.updateOptionsVisibility();  
  };

  /* Cookie handling functions
   *
   * Taken from the examples at http://www.quirksmode.org/js/cookies.html
   *
   */
   
  Main.createCookie = function(name, value, days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value+expires + "; path=/";
  };
  
  Main.readCookie = function(name) {
   var nameEQ = name + "=";
   var ca = document.cookie.split(';');
   for(var i=0; i < ca.length; i++) {
     var c = ca[i];
     while (c.charAt(0) == ' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
   return null;
  };
  
  Main.eraseCookie = function(name) {
   this.createCookie(name, "", -1);
  };
  
  /**
   * Recursive helper function to get a jquery selector for the given dom
   * element.
   */
   
  Main.getSelectorForElement = function(element, path) {
    
    // first time calling
    if (typeof path == 'undefined') {
      path = '';
    }

    // If this element is <html> we've reached the end of the path.
    if ( $(element).is('html') ) {
      return 'html ' + path;
    }

    // get the local name, which is the HTML element, e.g. "a" or "div"
    var name  = $(element).attr('localName');
    var id    = $(element).attr('id');
    
    // basic element is always the name
    new_path = name;
    
    // Add the id if there is one.
    if (id) { new_path += '#' + id; }
    
    // we don't use classes and assume that we will always be able to count :-)
    var siblings = $(element).parent().children(name);
    if (siblings.length > 1 && !$(element).attr('id')) {
      new_path += ':eq(' + siblings.index(element) + ')';
    }
    
    // continue to the parent
    return Main.getSelectorForElement($(element).parent(), ' > ' + new_path + path);
    
  };
  
  
  /*
   * Infobox management functions
   */
  var Infobox = {};
  
  /**
   * Load the sticky notes info box for this page
   */
  Infobox.load = function() {
    var self = this;
    $.ajaxSetup ({ cache: false});

    $.getJSON(settings.callbacks.info_box + settings.query, function(data) {
      if (data) {
        $('body').append(Drupal.theme('sticky_notes_info_box'));
        $(settings.infoboxWrapperSelector).replaceWith(data);        

        // Once the infobox is loaded, we start the initial loading of all sticky notes for this page
        StickyNotes.load();
  
        // we attach the infobox behaviors && option handlers
        self.attachBehaviors();
        self.enableOptions();
        
        self.updateOptionsVisibility();
      }
    });
  };
  
  
  /**
  * Attach behaviors and handlers to the info box
  */
  Infobox.attachBehaviors = function() {
      
    // set up modalframe behaviors
    Main.attachModalFrameBehaviours('#sticky-notes-add-note-button a', true);

    // implement info box display on hover
    $('div#sticky-notes-info-box-wrapper .hide-info-box').bind('mouseenter', function() {
      $('#sticky-notes-info-box .content').fadeIn('fast');
    }).bind('mouseleave', function() {
      $('#sticky-notes-info-box .content').fadeOut('fast');
    });
  
    // attach destination string to links to node/add/sticky-notes
    $('a[href$=sticky-notes/add]').each(function() {
      $(this).attr('href', $(this).attr('href') + settings.query);
    });
  };
  

  /**
   * Enable the info box options links
   */
  Infobox.enableOptions = function() {
    /*
     * Enable expose link
     */
    $('#sticky-notes-options-display-expose').click(function() {
      if (StickyNotes.count() > 0) {
        StickyNotes.showGrid(StickyNotes.elements_selector);
      }
      return false;
    });    

    /*
     * Hide notes button handler
     */
    $('#sticky-notes-options-display-hidden').click(function() {
      StickyNotes.setVisibility(false);
      return false;
    });    

    /*
     * Show notes button handler
     */
    $('#sticky-notes-options-display-normal').click(function() {
      StickyNotes.setVisibility(true);
      return false;
    });
    
    $('#sticky-notes-options a').removeClass('disabled');
  };

  
  /**
   * Disable the info box options links
   * 
   * -> Replace with a simple wrapper hide ??
   */
  Infobox.disableOptions = function() {
    $('#sticky-notes-options a').unbind('click').addClass('disabled');
  };

  
  /**
   * Update the visibility of the options links in the info box, so that they are
   * hidden of there are no notes on the current page
   */
  Infobox.updateOptionsVisibility = function() {
     // show the additional options if there are any notes on the page
     if (StickyNotes.count() > 0) {
       $('#sticky-notes-options').show();
     } 
     else {
       $('#sticky-notes-options').hide();
     }    
  };

  
  /**
   * Update the current pages note counter
   */
  Infobox.updateNotesCount = function() {
   $('#sticky-notes-page-count').html(Drupal.formatPlural(StickyNotes.count(), '1 note', '@count notes'));
  };
  
  
  var StickyNotes = {
    wrapper: '', /* The notes wrapper element, initialized on bootstrap */
    items:     [],
    zIndex: 0,   /* The highest Z index at a given moment. */
    hidden: true, /* Initially the notes are hidden */
    expose: false, /* Current display mode */
    resize_timeout: null, /* Implements a delay between window resize events and the display 
                             movements. */
    
  };

  StickyNotes.count = function() {
    return $(settings.elementsSelector).length;
  };
  

  /*
  * Prepare the page to receive the notes
  */
  StickyNotes.bootstrap = function () {
    var self = this;
    // the sticky notes container
    $('body').prepend(Drupal.theme('sticky_notes_wrapper'));
   
    //initialize the wrapper object with the newly added element
    this.wrapper = $('div#sticky-notes-wrapper');
   
    // set the z-index so that fading works smoothly
    this.wrapper.css('z-index', settings.minimal_z_index);
    
    $(window).resize(function() {
      // only do this in normal view mode
      if (StickyNotes.expose) {
        return;
      }
      
      // update the positions of all notes
      for(nid in StickyNotes.items) {
        StickyNotes.items[nid].updatePosition();
      }
    });    
  };  
  
  /**
   * Load the notes for this page
   */  
  StickyNotes.load = function() {
    var self = this;
   
    $.ajaxSetup ({ cache: false});
    $.getJSON(settings.callbacks.load + settings.query, function(data) {
      
      // update the notes wrapper with the returned data
      self.wrapper.html($(data).html());
      
      // check if the notes should be hidden on initial page load
      self.setVisibility(settings.toggleVisibilityState ? 
        Main.readCookie('sticky_notes_visibility') == 'visible' && !settings.hideOnPageLoad : false, false);
      
      Main.stickyNotesLoaded();
    });    
  };
  
  /**
   * Update the notes for this page
   */
  StickyNotes.update = function() {
    var self = this;
    $.ajaxSetup ({ cache: false});
    $.getJSON(settings.callbacks.load + settings.query, function(data) {
      self.wrapper.html($(data).html());
      
      if (Main.readCookie('sticky_notes_visibility') == 'visible') {
        self.setVisibility(true);
      }
      Main.stickyNotesLoaded();
    });
  };
  
  /**
   * Init the sticky notes, attach behaviors, update page counter ...
   */
  StickyNotes.init = function() {
    var self = this;
    this.zIndex = settings.minimal_z_index;

    $(settings.elementsSelector).each(function() {
      
      //get the note's NID
      var nid = parseInt($(this).find('span.sticky-note-nid').html(), 10);
      
      // register the note
      self.items[nid] = new Note(this);
      
      // find the one with the highest z-index and store the z-index
      if ($(this).css('z-index') > self.zIndex) {
        self.zIndex = $(this).css('z-index');
      }
      
      // make sure that a note the user clicks on will pop up immediately
      $(this).click(function() {
        if (self.zIndex > $(this).css('z-index')) { //Put note on top
          $(this).css('z-index', ++self.zIndex);
        }
      });
      
    });
      
    // Attach destination string to all actions, so that we have a context for the node form
    $('.sticky-notes-note-item-actions a').each(function() {
      $(this).attr('href', $(this).attr('href') + settings.query);
    });
    
    // attach the modalframe behavior to the actions buttons
    Main.attachModalFrameBehaviours('div.sticky-notes-note-item-actions a');
    
    // update the notes page count
    Infobox.updateNotesCount();
  };
  
  StickyNotes.getNote = function(nid) {
    return StickyNotes.items[nid];
  };
  
  /**
   * Small wrapper function to set the visibility of the notes
   */
   
  StickyNotes.setVisibility = function(visible, update_cookie) {
    visible = settings.toggleVisibilityState ? visible : true;
    
    // only show the nodes when they are hidden
    if (visible && this.hidden) {
      this.showAll();
    } else if (!visible) {
      this.hideAll();
    }
    this.hidden = visible ? false : true;
    
    // check if the cookie should be updated, the first initial call in
    // StickyNotes.load doesn't need the cookie to be updated
    if (typeof update_cookie == 'undefined' || update_cookie == true) {
      Main.createCookie('sticky_notes_visibility', visible ? 'visible' : 'hidden', settings.visibility_state_memory);
    }
  };
  
  /**
   * Show all sticky notes
   */
   
  StickyNotes.showAll = function() {
    $('#sticky-notes-options-display-normal').hide();
    $('#sticky-notes-options-display-hidden').show();
    $(this.wrapper).fadeIn();
  };
  
  
  /**
   * Hide all sticky notes
   */
  
  StickyNotes.hideAll = function() {
    $(this.wrapper).hide();
    $('#sticky-notes-options-display-normal').show();
    $('#sticky-notes-options-display-hidden').hide();
  };
  
  
  /**
   * Move the sticky notes to their positions, as set by the user
   * Also make sure they have the right size, since this function also gets
   * called when leaving the expose mode.
   */
   
  StickyNotes.showPositioned = function(speed) {
    
    var self = this;
    
    if (typeof speed != 'string') { speed = 'slow'; }
    
    for (nid in StickyNotes.items) {
      StickyNotes.items[nid].reset(speed);
    }

    $('#sticky-notes-overlay').hide();
    Infobox.enableOptions();
  };  
  

  /**
   * Create the overlay if it doesn't exist
   * 
   * The overlay is appended to the notes container. 
   * In a perfect world, it would be appended to the body, but in our case this
   * would place the notes under the overlay, not over it.
   */
   
  StickyNotes.setOverlay = function() {

    function ie_set_overlay_positionning() {
      $('#sticky-notes-overlay').css({
        top:  $(window).scrollTop(),
        left: $(window).scrollLeft(),        
        width: $(window).width(),
        height: $(window).height()              
      });
    }
    
    if ($('#sticky-notes-overlay').length != 0) return $('#sticky-notes-overlay');
    
    $('body').append(Drupal.theme('sticky_notes_overlay'));
    
    
    $('#sticky-notes-overlay')
      .css({opacity: '0.8', 'z-index': settings.minimal_z_index - 1})
      .hide()
      .click(function() { $(this).hide(); });
    
    /*
     * IE <= 6.0 ignore the 'position: fixed' css property
     * We have to position the overlay using position absolute and a few JS event handlers
     */
    if (($.browser.msie) && (parseInt($.browser.version, 10) < 7)) {
      var containerOffset = $('body').offset();
      
      $('#sticky-notes-overlay').css({position: 'absolute'});
 
      $(window).resize(function() {
        if (!$('#sticky-notes-overlay').is(':visible')) {
          ie_set_overlay_positionning();
        };
      });
      
      $(window).scroll(function() {
        if ($('#sticky-notes-overlay').is(':visible')) {
          ie_set_overlay_positionning();
        };
      });
    }
    else {
      $('#sticky-notes-overlay').css({
        position: 'fixed', top: '0', right: '0', bottom: '0', left: '0'});
    }
    
    return $('#sticky-notes-overlay');
    
  };
  
  
  StickyNotes.showOverlay = function() {
    $('#sticky-notes-overlay').show();
    if (($.browser.msie) && (parseInt($.browser.version, 10) < 7)) {
      $(window).resize(); /* Update the overlay's dimensions */
    }
    return $('#sticky-notes-overlay');
  };
  
  
  StickyNotes.showGrid = function() {
    var self = this;
  
    this.expose = true;
  
    // if the notes are currently hidden make sure they will appear and that
    // they will disappear once expose view is left
    if (this.hidden) {
      this.setVisibility(true);
      self.hidden = true;
    }  

    Infobox.disableOptions();
  
    // disable dragging
    $(settings.elementsSelector).draggable('destroy');
    // disable resizing
    if (settings.resizable) { 
      $(settings.elementsSelector).resizable('destroy');
    };
  
    // handler for the window resizing
    var reposition = function() {
      this.old_window = {height: -1, width: -1};
      
      //do not reposition notes if the window dimensions haven't changed
      if ((this.old_window.height == $(window).height()) &&
          (this.old_window.width == $(window).width())) return;
      
      this.old_window.height = $(window).height();
      this.old_window.width = $(window).width();
      
      self.positionGrid(false);
    };
    
    var overlay_hide = function() {
      self.expose = false;
      self.showPositioned();
      if (self.hidden) { self.setVisibility(false); }
      Infobox.enableOptions();
      $(window).unbind('resize', reposition);
      $(this).unbind('click', overlay_hide);
      
    };
    
    this.setOverlay();
    this.showOverlay().click(overlay_hide);

    this.positionGrid(true,'slow');
    $(window).bind('resize', reposition);
  };
  
  
  
  StickyNotes.positionGrid = function(reset, animation_speed) {
  
    var self = this;
    
    //Current window dimensions
    var window_width = $(window).width() - 2 * settings.expose.windowPadding;
    var window_height = $(window).height() - 2 * settings.expose.windowPadding;    
    var vertical_offset = $(window).scrollTop() - $('#sticky-notes-wrapper').offset().top + settings.expose.windowPadding;
    var horizontal_offset = $(window).scrollLeft() - $('#sticky-notes-wrapper').offset().left + settings.expose.windowPadding;    
    
    //current note count
    var noteCount = this.count();

    if (typeof animation_speed == 'undefined') {
      animation_speed = 1; // do it really fast
    }

    
    function compute_fixed_grid() {
      
      var notePadding = Math.max(
          Math.floor(settings.expose.padding * settings.expose.noteMaxSize), 
          settings.expose.minPadding);
      
      var gridCols = Math.floor( window_width /(settings.expose.noteMaxSize + 2*notePadding));
      var gridRows = Math.ceil(noteCount / gridCols);
      /*To insure the last row (the one with empty cells in most cases) is centered*/
      var gridLastRowPadding = Math.floor((gridCols * gridRows - noteCount) * (settings.expose.noteMaxSize + 2*notePadding) / 2);
      
      
      return {
        nSize:          settings.expose.noteMaxSize,
        bodyFontSize:   settings.noteDisplayDefaults.fontBody,
        authorFontSize: settings.noteDisplayDefaults.fontAuthor,
        lineHeight:     settings.noteDisplayDefaults.lineHeight,
        nPadding:       notePadding, /*spacing around the notes*/
        h_offset:       (window_width - gridCols * (settings.expose.noteMaxSize + 2*notePadding))/2,
        v_offset:       0, /*The offsets center our grid in the viewport*/
        cols:           gridCols,
        rows:           gridRows,
        lastRowPadding: gridLastRowPadding
      };
    };    
    
    
    /*
     * In autosize mode, we resize and place the notes so that all of them fit the window
     * Since the notes are squared in expose mode, the optimum solution is always the same :
     * The grid with the notes should have the same ratio as the window
     */
    function compute_autosize_grid() {
      //Determine optimum grid (exact computation, as floats)
      var rows_f = Math.sqrt(noteCount * window_height/ window_width);
      var cols_f = noteCount / rows_f;

      //Rounding these floats to ints yields 1 to 3 possible solutions
      //Amongst the valid ones, we choose the one that minimizes empty cells
      var solTable = new Array(
          {rows: Math.floor(rows_f), cols: Math.ceil(cols_f)},
          {rows: Math.ceil(rows_f), cols: Math.floor(cols_f)},
          {rows: Math.ceil(rows_f), cols: Math.ceil(cols_f)});
      
      var goodOne = 0;
      var smallestErr = -1;
      var err;
      for(var i=0 ; i < solTable.length ; i++) {
        err = solTable[i].rows * solTable[i].cols - noteCount;
        if (err < 0) continue;
        if ((smallestErr != -1) && (err > smallestErr)) continue; 
        goodOne = i;
        smallestErr = err;
      }
      
      rows = solTable[goodOne].rows;
      cols = solTable[goodOne].cols;
      
      //compute the reduction so that all the notes fit in the window, no magnifying allowed
      //The padding remains constant in this mode
      var reduction = Math.min(
          Math.min( window_width/(cols * (settings.expose.noteMaxSize + 2 * settings.expose.minPadding)), 
                    window_height/(rows * (settings.expose.noteMaxSize + 2 * settings.expose.minPadding)))
          , 1);
  
      var noteSize = reduction * settings.expose.noteMaxSize;
          
      return {
        nSize:          noteSize,
        bodyFontSize:   settings.noteDisplayDefaults.fontBody * reduction,
        authorFontSize: settings.noteDisplayDefaults.fontAuthor * reduction,
        lineHeight:     settings.noteDisplayDefaults.lineHeight * reduction,
        nPadding:       settings.expose.minPadding,
        h_offset:       (window_width - cols * (noteSize + 2*settings.expose.minPadding))/2,
        v_offset:       (window_height - rows * (noteSize + 2*settings.expose.minPadding))/2,
        cols:           cols,
        rows:           rows,
        lastRowPadding: Math.floor((cols * rows - noteCount) * (noteSize + 2*settings.expose.minPadding) / 2)
      };  
    }
    
    /*
     * Compare the positions with the old ones
     */
    function grid_changed(grid) {
      
      this.grid_data = null;
      var changed = false;
      
      if (this.grid_data == null) {
        this.grid_data = grid;
        return true;
      }
      
      for(var x in grid) {
        if (grid[x] == this.grid_data[x]) continue;
        changed = true;
        
        this.grid_data = grid;
        break;
      }
      
      return changed;
    }
    
    if (settings.expose.autoSize) {
      var grid = compute_autosize_grid();
    }
    else {
      var grid = compute_fixed_grid();
      
    }
    
    //don't move notes if the positions haven't changed
    if (!reset && !grid_changed(grid)) return;
    
    var row = 0; 
    var col = 0;
    var left = 0;
    var top = 0;
    
    for (nid in StickyNotes.items) {
    
      // switch row
      if (col/grid.cols == 1) {
        col = 0;
        row++;
      }
      
      left = horizontal_offset + grid.h_offset + col * (grid.nSize + 2 * grid.nPadding) + grid.nPadding;
      if (row == (grid.rows - 1)) {
        left = left + grid.lastRowPadding;
      }
      top = vertical_offset + grid.v_offset + row * (grid.nSize + 2 * grid.nPadding) + grid.nPadding;
      
      StickyNotes.items[nid].animate(animation_speed, {
        outer: {
          left: left,
          top: top,
          width: grid.nSize,
          height: grid.nSize
        },
        inner: {
          width: grid.nSize,
          height: grid.nSize
        },
        body: {
          fontSize: grid.bodyFontSize,
          lineHeight: grid.lineHeight
        },
        footer: {
          fontSize: grid.authorFontSize
        }
      });
    
      col++;         
    };
  };  
  
  /**
  * The note object
  */
  
  Note = function(element) {
    
    // some basic attributes
    this.nid = parseInt($(element).find('span.sticky-note-nid').html(), 10);
    this.element = $(element);
    this.visible = false;
    this.collapsed = false;
    this.updated = false;
    
    // position attributes
    this.top = null;
    this.left = null;
    this.width = null;
    this.height = null;
    this.attached = {path: null, top: null, left: null};
    
    /**
     * load a note and initialize it's attributes
     */
    
    this.load = function() {
      
      // get the path of the element that this note is attached to if any
      var path = $(this.element).find('.sticky-note-parent-path').html();
      if (path) {
        path = path.replace(/&gt;/g, '>');
      }
      
      this.attached = {
        path : path,
        top  : parseInt($(this.element).find('.sticky-note-parent-top').html(), 10),
        left : parseInt($(this.element).find('.sticky-note-parent-left').html(), 10)
      };
      
      this.top = $(this.element).css('top').replace('px', '');
      this.left = $(this.element).css('left').replace('px', '');
      this.width = $(this.element).css('width').replace('px', '');
      this.height = $(this.element).css('height').replace('px', '');
      
      this.updatePosition();
      
      this.draggable();
      this.resizable();
      this.collapsible();
      
    };
    
    this.show = function() {
      $(this.element).show();
    };
    
    this.hide = function() {
      $(this.element).hide();
    };
    
    this.minimize = function() {
      
    };
    
    /**
     * Collapse the note
     */
    
    this.collapse = function(speed) {
      
      if (typeof speed == 'undefined') {
        speed = 'fast';
      }
      
      if (!this.collapsed) {
        $(this.element).find('.sticky-notes-note-item-body-wrapper').hide();
        $(this.element).find('.sticky-notes-note-item-author-wrapper').hide();
        $(this.element).find('.sticky-notes-note-item').animate({height: 15}, speed);
        $(this.element).animate({height: 15}, speed);
        this.resizable("destroy");
      }
      else {
        $(this.element).animate({height: this.height}, speed);
        $(this.element).find('.sticky-notes-note-item').animate({height: this.height}, speed);
        $(this.element).find('.sticky-notes-note-item-body-wrapper').show();
        $(this.element).find('.sticky-notes-note-item-author-wrapper').show();
        this.resizable();
      }
      this.collapsed = !this.collapsed;
    };
    
    /**
     * Move the note where it should be
     */
    
    this.move = function() {
      this.updated = $(this.element).css('top').replace('px', '') != this.top || $(this.element).css('left').replace('px', '') !=  this.left;
      if (this.updated) {
        this.moveTo(this.left, this.top);
        this.save();
      }
    };
    
    /**
     * Move the note to the specified coordinates
     */
    
    this.moveTo = function(x, y) {
      this.updated = true;
      $(this.element).css('top', y + 'px');
      $(this.element).css('left', x + 'px');
    };
    
    /**
     * Save the notes attributes
     */
    
    this.save = function() {
      
      if (!this.updated) {
        // nothing has changed since the last storage, so don't send anything to the server
        return;
      }
      
      var args = {
        z:      1,
        parent: this.attached.path,
        top:    this.attached.top,
        left:   this.attached.left
      };
      
      url_args = [this.nid, this.left, this.top, this.width, this.height];
      
      $.get(settings.callbacks.save + '/' + url_args.join('/'), args);
      
      this.updated = false;
    };
    
    /**
     * Attach this note to the DOM element with the given xpath
     */
     
    this.attachTo = function(path) {
      var parent_offset = $(path).offset();
      this.attached = {
        path : path,
        top  : $(this.element).css('top').replace('px', '') - parent_offset.top,
        left : $(this.element).css('left').replace('px', '') - parent_offset.left
      };
      this.updatePosition();
      this.updated = true;
      this.save();
    };
    
    /**
     * Update the position of the note
     */
    
    this.updatePosition = function() {
      
      // get the absolute positions of the parent element if there is a parent
      if (this.attached.path != null && this.attached.path.length > 0 && $(this.attached.path).length == 1) {
        
        // get the parents offset
        var parent_offset = $(this.attached.path).offset();
        
        // calculate the resulting position on the screen
        this.top = parent_offset.top + this.attached.top;
        this.left = parent_offset.left + this.attached.left;
        
      }
      else {
        
        // calculate the resulting position on the screen
        this.top = $(this.element).css('top').replace('px', '');
        this.left = $(this.element).css('left').replace('px', '');
        
      }
      
      this.move();
      
    }
    
    /**
     * Make this note draggable
     */
    
    this.draggable = function(destroy) {
      
      if (typeof destroy != 'undefined') {
        $(this.element).draggable("destroy");
      }
      else {
        var self = this;
        $(self.element).draggable({
          containment:'document',
          start: function(e,ui){ 
            if (StickyNotes.zIndex > ui.helper.css('z-index')) {
              ui.helper.css('z-index', ++StickyNotes.zIndex); 
            }
          },
        });
      }
    };
    
    /**
     * Make this note resizable
     */
    
    this.resizable = function(destroy) {
      
      if (!settings.resizable) {
        return;
      }
      
      if (typeof destroy != 'undefined') {
        $(this.element).resizable("destroy");
      }
      else {
        var self = this;
        $(self.element).resizable({
          containment: 'document',
          alsoResize:  '#' + $(self.element).attr('id') + ' .sticky-notes-note-item',
          stop: function(event, ui) {
            self.updated = true;
            // save the current height and width
            self.width = $(self.element).css('width').replace('px', '');
            self.height = $(self.element).css('height').replace('px', '');
            self.save();
          }
        });
      }
      
    };
    
    /**
    * Make the note collapsible
    */
    
    this.collapsible = function(destroy) {
      
      if (typeof destroy != 'undefined') {
        $(this.element).find('.sticky-notes-note-item-header').unbind('dblclick');
      }
      else {
        var self = this;
        $(this.element).find('.sticky-notes-note-item-header').dblclick(function () {
          self.collapse();
        });
      }
    };
    
    /**
     * Animate the note with the given options or defaults
     */
    
    this.animate = function(speed, options) {
      
      var outer = (typeof options != 'undefined' && options.outer) || {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height
      };
      
      var inner = (typeof options != 'undefined' && options.inner) || {
        width: this.width - 4,
        height: this.height - 4
      };
      
      var body = (typeof options != 'undefined' && options.body) || {
        fontSize: settings.noteDisplayDefaults.fontBody, 
        lineHeight: settings.noteDisplayDefaults.lineHeight
      };
      
      var footer = (typeof options != 'undefined' && options.footer) || {
        fontSize: settings.noteDisplayDefaults.fontAuthor
      };
      
      $(this.element).animate(outer, speed).find('.sticky-notes-note-item').animate(inner, speed);
      $(this.element).find('.sticky-notes-note-item-body').animate(body, speed);
      $(this.element).find('.sticky-notes-note-item-author').animate(footer);
      
    };
    
    /**
     * Reset position, width, and font sizes for this note
     */
    
    this.reset = function(speed) {
      
      // animate to original parameters (position, size, ...)
      this.animate();
      
      // make draggable and resizable
      this.draggable();
      this.resizable();
      
    };
    
    this.load();
    
  };

  /**
   * Set the page up for StickyNote display
   */
   
  StickyNotes.bootstrap();
  
  /**
   * Make some adjustments to the dom, e.g. make all elements droppable so that
   * notes can be attached to them.
   */
   
  Main.prepareDOM();
  
  /**
   * Loading the infoBox launches a reload of all the available notes for this page.
   */
   
  Infobox.load();
  
  // mark this page as processed
  $('body').addClass('sticky-notes-enabled');    
};
