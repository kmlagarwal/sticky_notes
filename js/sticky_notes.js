// $Id: sticky_notes.js,v 1.1.2.7 2010/09/24 10:38:02 berliner Exp $

/**
 * TODO centralize css class names !
 */

/*
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
      width: parseInt(Drupal.settings.sticky_notes.note_width),
      height: parseInt(Drupal.settings.sticky_notes.note_height),
      fontBody:   12,
      fontAuthor: 10,
      lineHeight: 16
      },
    expose: {
       // We want the notes to be squared in exposé mode. 
       // We use the default width as the max note width and height in expose mode
       noteMaxSize: parseInt(Drupal.settings.sticky_notes.note_width),
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
        
        // get the nid of this note
  		  var nid = parseInt(ui.draggable.find('span.sticky-note-nid').html(), 10);
        var note = $('#sticky-note-' + nid);

        $('.sticky-note-hovered').css('outline', 'none').removeClass('sticky-note-hovered');
        
        // get the path to the notes parent object
        var path = Main.getSelectorForElement($(this));
        
        StickyNotes.storeData(note, path);
        StickyNotes.saveNote(nid, true);
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
    if ( $(element).is('html') )
      return 'html ' + path;

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
      $(settings.elementsSelector).each(function() {
        // get the note's NID
        var nid = parseInt($(this).find('span.sticky-note-nid').html(), 10);
        var note = $('#sticky-note-' + nid);
        StickyNotes.updateRelativePosition(note, true);
      });
    });    
  };  
  
  
//  StickyNotes.windowResizeHandler = function() {
//    var self = this;
//    
//    function resizeOverlay() {
//      if ((typeof this.windowDimensions != 'undefined') &&
//          (this.windowDimensions.width == $(window).width()) &&
//          (this.windowDimensions.heigth == $(window).height())) {
//        return false;
//      };
//      
//      self.setOverlay();
//      
//      this.windowDimensions = {
//          width: $(window).width(),
//          heigth: $(window).height()
//      };      
//      
//      return true;
//    } 
//    
//    /*if not in expose mode, don't do anything*/
//    if (!this.expose) return;
//    
//    if (!resizeOverlay()) return;
//    
//    //reposition notes
//    
//    return;
//    
//  };
  
  
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
      
      /*
       * save the initial element positions
       */
      self.initRelativePosition(nid, true);
       
      /*
       * find the one with the highest z-index and store the z-index
       */
      if ($(this).css('z-index') > self.zIndex) {
        self.zIndex = $(this).css('z-index');
      }
      
      /*
       * make sure that a note the user clicks on will pop up immediately
       */
      $(this).click(function() {
        if (self.zIndex > $(this).css('z-index')) { //Put note on top
          $(this).css('z-index', ++self.zIndex);
        }
        
        if ($(this).hasClass('ui-draggable')) {
          self.saveNote(nid);
        }
      });
      
      self.makeDraggable(this);
      
      if (settings.resizable) { 
        self.makeResizable(this);
      };      
    });
      
    /*
     * Attach destination string to all actions, so that we have a context for the node form
     */
    $('.sticky-notes-note-item-actions a').each(function() {
      $(this).attr('href', $(this).attr('href') + settings.query);
    });
    
    // attach the modalframe behavior to the actions buttons
    Main.attachModalFrameBehaviours('div.sticky-notes-note-item-actions a');
    
    // update the notes page count
    Infobox.updateNotesCount();
  };
  
  
  StickyNotes.makeResizable = function(element) {
    var self = this;
    $(element).resizable({
      containment: 'document',
      alsoResize:  '#' + $(element).attr('id') + ' .sticky-notes-note-item',
      stop: function(event, ui) {
        var nid = parseInt(ui.helper.find('span.sticky-note-nid').html(), 10);
        self.saveNote(nid);
      }
    });
  };
  
  
  StickyNotes.makeDraggable = function(element) {
    var self = this;
    $(element).draggable({
      containment:'document',
      start: function(e,ui){ 
        if (self.zIndex > ui.helper.css('z-index')) {
          ui.helper.css('z-index', ++self.zIndex); 
        }
      },
      stop: function(e,ui){
        var nid = parseInt(ui.helper.find('span.sticky-note-nid').html(), 10);
        self.saveNote(nid);
      }
    });
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
   * Save the given positions for the given node nid, the handling of the
   * z-index happens on the server side, in assumption that the given node must
   * be the one on the top
   */
  StickyNotes.saveNote = function(nid, force) {
    
    var note = $('#sticky-note-' + nid);
    if (note.length == 0) return; //invalid nid
    
    var status = this.storeData(note);
    
    if (!status.posChanged && !status.zIndexChanged && (typeof force == 'undefined' || force == false)) {
      // nothing has changed since the last storage, so don't send anything to the server
      return;
    }
    
    var args = {
      z:      Number(status.zIndexChanged),
      parent: status.data.path,
      top:    status.data.top_rel,
      left:   status.data.left_rel
    };
    
    $.get(settings.callbacks.save 
            + '/' + nid 
            + '/' + status.data.left 
            + '/' + status.data.top
            + '/' + status.data.width
            + '/' + status.data.height,
          args
    );
  };


  /**
   * Stores the note's current position, size and z-index
   * 
   * @param note
   *  jQuery wrapper with the DOM element
   *  
   * @return object
   *  {posChanged: BOOL, zIndexChanged: BOOL, data: Array}
   */
  StickyNotes.storeData = function(note, path) {
    
    if (typeof path == 'undefined' || $(path).length != 1) {
      path = note.data('path') ? note.data('path') : settings.containerSelector;
    }
    
    // get the parents offset
    parent_offset = $(path).offset();
    
    // get the note's current position, size and zIndex
    var pos = {
        top:      note.css('top').replace('px', ''),
        left:     note.css('left').replace('px', ''),
        width:    note.css('width').replace('px', ''),
        height:   note.css('height').replace('px', ''),
        zIndex:   note.css('z-index'),
        path:     path,
        top_rel:  note.css('top').replace('px', '') - parent_offset.top,
        left_rel: note.css('left').replace('px', '') - parent_offset.left
      };
    
    // get the last stored data for this note
    var stored = this.getStoredData(note);
    
    // determine the changes since the note was last stored
    var returnObj = {
        posChanged: ((pos.left      != stored.left) ||
                     (pos.top       != stored.top) ||
                     (pos.width     != stored.width) ||
                     (pos.height    != stored.height) ||
                     (pos.path      != stored.path)),
        zIndexChanged: (pos.zIndex  != stored.zIndex)
    };
    
    // store if necessary
    if (returnObj.posChanged) {
      note.data('top',      pos.top);
      note.data('left',     pos.left);
      note.data('width',    pos.width);
      note.data('height',   pos.height);
      note.data('path',     pos.path);
      note.data('top_rel',  pos.top_rel);
      note.data('left_rel', pos.left_rel);
    }
    
    if (returnObj.zIndexChanged) {
      note.data('zIndex',   pos.zIndex);
    }
    
    // return also the current positions in case they are needed
    returnObj.data = pos;
    
    return returnObj;
  };  
  
  
  /**
   * gets the position store in the note's 'data' jQuery container
   * 
   * @param note
   *  jQuery wrapper with the DOM element
   *  
   * @return object
   *  {...}
   */
  StickyNotes.getStoredData = function(note) {
    
    return {
      left:     note.data('left'),
      top:      note.data('top'),
      width:    note.data('width'),
      height:   note.data('height'),
      zIndex:   note.data('zIndex'),
      path:     note.data('path'),
      top_rel:  note.data('top_rel'),
      left_rel: note.data('left_rel')
    };
    
  }
  
  /**
  * Initialize the relative position of the given note
  */
  StickyNotes.initRelativePosition = function(nid, move) {
    
    var note = $('#sticky-note-' + nid);
    
    // get the path of the element that this note is attached to if any
    var parent_path = $(note).find('.sticky-note-parent-path').html();
    
    if (parent_path) {
      parent_path = parent_path.replace(/&gt;/g, '>')
    }
    
    if (!parent_path || $(parent_path).length != 1) {
      parent_path = settings.containerSelector;
    }
    
    note.data('path', parent_path);
    note.data('top_rel', parseInt($(note).find('.sticky-note-parent-top').html(), 10));
    note.data('left_rel', parseInt($(note).find('.sticky-note-parent-left').html(), 10));
    
    this.updateRelativePosition(note, move);
    
    // return the object that defines this relation
    this.storeData(note, parent_path);
    
  };
  
  StickyNotes.updateRelativePosition = function(note, move) {
    
    // get the parents offset
    var parent_offset = $(note.data('path')).offset();
    
    // calculate the resulting position on the screen
    var top = parent_offset.top + note.data('top_rel');
    var left = parent_offset.left + note.data('left_rel');
    
    if (typeof move == 'undefined') {
      note.data('top', top);
      note.data('left', left);
    }
    else {
      // move the note to the according position so that it appears relative to
      // it's semantical parent
      $(note).css('top', top);
      $(note).css('left', left);
    }
  }
  
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
  
  
  /*
   * Move the sticky notes to their positions, as set by the user
   * Also make sure they have the right size, since this function also gets
   * called when leaving the expose mode.
   */
  StickyNotes.showPositioned = function(speed) {
    var self = this;
    var pos;
    
    if (typeof speed != 'string') { speed = 'slow'; }
    
    $(settings.elementsSelector).each(function() {
      
      var nid = parseInt($(this).find('span.sticky-note-nid').html(), 10);
      var note = $('#sticky-note-' + nid);
      StickyNotes.updateRelativePosition(note);
      
      pos = self.getStoredData($(this));
      
      $(this)
        .animate({
          left: pos.left,
          top: pos.top,
          width: pos.width,
          height: pos.height
        },speed)
        .find('.sticky-notes-note-item')
        .animate({
          width: pos.width - 4,
          height: pos.height - 4
        },speed);
      
      $(this)
        .find('.sticky-notes-note-item-body')
        .animate({
          fontSize: settings.noteDisplayDefaults.fontBody, 
          lineHeight: settings.noteDisplayDefaults.lineHeight
        }, speed);
      
      $(this)
        .find('.sticky-notes-note-item-author')
        .animate({
          fontSize: settings.noteDisplayDefaults.fontAuthor
        });
      
      self.makeDraggable(this);
    });

    $('#sticky-notes-overlay').hide();
    Infobox.enableOptions();
  };  
  

  /*
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
    if (($.browser.msie) && (parseInt($.browser.version) < 7)) {
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
    if (($.browser.msie) && (parseInt($.browser.version) < 7)) {
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
  
  
  
  StickyNotes.positionGrid = function(reset,animation_speed) {
  
    var self = this;
    
    //Current window dimensions
    var window_width = $(window).width() - 2*settings.expose.windowPadding;
    var window_height = $(window).height() - 2*settings.expose.windowPadding;    
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
          Math.min( window_width/(cols * (settings.expose.noteMaxSize + 2*settings.expose.minPadding)), 
                    window_height/(rows * (settings.expose.noteMaxSize + 2*settings.expose.minPadding)))
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
    
    $(settings.elementsSelector).each(function() {
    
      // switch row
      if (col/grid.cols == 1) {
        col = 0;
        row++;
      }
      
      left = horizontal_offset + grid.h_offset + col*(grid.nSize + 2*grid.nPadding) + grid.nPadding;
      if (row == (grid.rows - 1)) {
        left = left + grid.lastRowPadding;
      }
      top = vertical_offset + grid.v_offset + row*(grid.nSize + 2*grid.nPadding) + grid.nPadding;
      
      // and trigger the animation
      $(this).animate({
        left: left,
        top: top,
        width: grid.nSize,
        height: grid.nSize
      }, animation_speed).find('.sticky-notes-note-item').animate({
        width: grid.nSize,
        height: grid.nSize
      }, animation_speed).find('.sticky-notes-note-item-body').animate({
        fontSize: grid.bodyFontSize,
        lineHeight: grid.lineHeight
      }, animation_speed);
    
      $(this).find('.sticky-notes-note-item-author').animate({
        fontSize: grid.authorFontSize
      }, animation_speed);
    
      col++;         
    });
  };  
  

  /*
   * Set the page up for stickyNote display
   */
  StickyNotes.bootstrap();
  
  /**
  * Make some adjustments to the dom, e.g. make all elements droppable so that
  * notes can be attached to them.
  */
  Main.prepareDOM();
  
  /*
   * Loading the infoBox launches a reload of all the available notes for this page.
   */
  Infobox.load();
  
  // mark this page as processed
  $('body').addClass('sticky-notes-enabled');    
};
  
