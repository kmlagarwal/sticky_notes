<?php
// $Id: sticky-notes-priority-image.tpl.php,v 1.1 2010/03/09 16:45:34 berliner Exp $

/**
 * @file
 * Template for the priority image.
 *
 * Available variables
 *  $priority_image_url The url to the image.
 *  $priority_label     A label for the image, used as values for alt and title.
 *
 * @author berliner
 */


?>

<img src="<?php print $priority_image_url; ?>" alt="<?php print $priority_label; ?>"  title="<?php print $priority_label; ?>" />