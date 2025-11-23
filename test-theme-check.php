<?php
/**
 * Test File for Envato Theme Check Extension
 * This file contains intentional errors to test pattern detection
 */

// 1. ESCAPING ISSUES - Should trigger warnings
echo $variable_not_escaped; // Should warn: echo $variable
echo esc_html($safe_variable); // OK
$output = $some_data; // OK - not echo

// 2. SHORT ECHO TAG - Should trigger warning
<?= $another_variable ?>

// 3. DEPRECATED FUNCTIONS - Should trigger warnings
$user_data = get_usermeta(1, 'key'); // Deprecated
wp_title(); // Deprecated
bloginfo('url'); // Should use home_url()

// 4. BAD THINGS - Should trigger errors
eval('some code'); // FORBIDDEN
base64_decode($data); // FORBIDDEN

// 5. PLUGIN TERRITORY - Should trigger warnings
register_post_type('custom_type', []); // Plugin territory
add_shortcode('my_shortcode', 'callback'); // Plugin territory

// 6. TEXT DOMAIN ISSUES
__('Text without domain'); // Missing text domain
__('Text', 'theme-one'); // Domain: theme-one
__('More text', 'theme-two'); // Domain: theme-two - Multiple domains!

// 7. DEPRECATED CONSTANTS
$path = STYLESHEETPATH; // Deprecated constant

// 8. INCORRECT ESCAPING CONTEXT
?><div><?php echo esc_attr($content); ?></div><?php // Wrong: esc_attr between tags

// 9. HARD-CODED FAVICON
?><link rel="icon" href="favicon.ico"><?php // Should use wp_head()

// 10. CDN USAGE
?><script src="https://code.jquery.com/jquery.min.js"></script><?php // Should enqueue

// 11. DEREGISTER CORE SCRIPT
wp_deregister_script('jquery'); // Don't deregister jQuery!

// 12. FLATICON
// Icon from flaticon.com - GPL incompatible!

// 13. ADMIN BAR HIDING
?>
<style>
#wpadminbar { display: none !important; }
</style>
<?php

// 14. MISSING REQUIRED FUNCTIONS (should be detected globally)
// This file intentionally doesn't have:
// - wp_head()
// - wp_footer()
// - body_class()
// - post_class()
// - language_attributes()
// - $content_width
// - wp_list_comments()
// - comment_form()
// - paginate_links()

?>
