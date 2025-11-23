export interface CheckPattern {
    pattern: RegExp;
    message: string;
    severity: "error" | "warning" | "info";
    category: string;
    replacement?: string;
}

/**
 * Bad Things Check - Malicious code and forbidden functions
 */
export const BAD_THINGS_PATTERNS: CheckPattern[] = [
    {
        pattern: /(?<![_|a-z0-9|\.])eval\s?\(/i,
        message: "eval() is not allowed",
        severity: "error",
        category: "security",
    },
    {
        pattern:
            /[^a-z0-9](?<!_)(popen|proc_open|[^_]exec|shell_exec|system|passthru)\(/,
        message:
            "PHP system calls are often disabled by server admins and should not be in themes",
        severity: "error",
        category: "security",
    },
    {
        pattern: /base64_decode/,
        message: "base64_decode() is not allowed",
        severity: "error",
        category: "security",
    },
    {
        pattern: /pub-[0-9]{16}/i,
        message: "Google advertising code detected",
        severity: "error",
        category: "security",
    },
    {
        pattern: /sharesale\.com/i,
        message: "ShareSale affiliate link detected",
        severity: "error",
        category: "security",
    },
    {
        pattern: /ini_set\(/,
        message:
            "Changing server settings is not allowed. Use wp_raise_memory_limit() instead",
        severity: "warning",
        category: "security",
    },
    {
        pattern: /uname\s?\(/,
        message: "uname() is not allowed",
        severity: "error",
        category: "security",
    },
    {
        pattern: /getmyuid\s?\(/,
        message: "getmyuid() is not allowed",
        severity: "error",
        category: "security",
    },
    {
        pattern: /getmypid\s?\(/,
        message: "getmypid() is not allowed",
        severity: "error",
        category: "security",
    },
    {
        pattern: /<\?php\s+@/,
        message: "Error suppression with @ is not recommended",
        severity: "warning",
        category: "security",
    },
    {
        pattern: /\$_(GET|POST|REQUEST|COOKIE|SERVER)\[/,
        message:
            "Direct access to superglobals is not recommended. Sanitize and validate all input data",
        severity: "warning",
        category: "security",
    },
];

/**
 * Escaping Check - Missing output escaping
 */
export const ESCAPING_PATTERNS: CheckPattern[] = [
    {
        pattern: /echo\s+\$[a-zA-Z_][a-zA-Z0-9_]*(?!\s*\))/,
        message:
            "Found echo $. Possible data validation issues found. All dynamic data must be correctly escaped for the context where it is rendered",
        severity: "warning",
        category: "escaping",
    },
    {
        pattern: /<\?=\s*\$[a-zA-Z_][a-zA-Z0-9_]*/,
        message:
            "Short echo tag with unescaped variable. Use esc_html() or esc_attr()",
        severity: "warning",
        category: "escaping",
    },
    {
        pattern: />\s*<\?php\s+echo\s+esc_attr\(/,
        message:
            "Found ><?php echo esc_attr(. Only use esc_attr() inside HTML attributes. Use esc_html() between HTML tags. A manual review is needed",
        severity: "warning",
        category: "escaping",
    },
];

/**
 * Deprecated Functions Check
 */
export const DEPRECATED_PATTERNS: CheckPattern[] = [
    {
        pattern: /\bget_bloginfo\s*\(\s*['"]url['"]\s*\)/,
        message: "get_bloginfo('url') is deprecated. Use home_url() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "home_url()",
    },
    {
        pattern: /\bget_bloginfo\s*\(\s*['"]wpurl['"]\s*\)/,
        message: "get_bloginfo('wpurl') is deprecated. Use site_url() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "site_url()",
    },
    {
        pattern: /\bbloginfo\s*\(\s*['"]url['"]\s*\)/,
        message: "bloginfo('url') is deprecated. Use echo home_url() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "echo home_url()",
    },
    {
        pattern: /\bbloginfo\s*\(\s*['"]wpurl['"]\s*\)/,
        message: "bloginfo('wpurl') is deprecated. Use echo site_url() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "echo site_url()",
    },
    {
        pattern: /\bwp_get_post_tags\s*\(/,
        message: "wp_get_post_tags() is deprecated. Use get_the_tags() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "get_the_tags()",
    },
    {
        pattern: /\bwp_get_post_categories\s*\(/,
        message:
            "wp_get_post_categories() is deprecated. Use get_the_category() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "get_the_category()",
    },
    {
        pattern: /\bscreen_icon\s*\(/,
        message: "screen_icon() is deprecated since WordPress 3.8",
        severity: "warning",
        category: "deprecated",
    },
    {
        pattern: /\bget_currentuserinfo\s*\(/,
        message:
            "get_currentuserinfo() is deprecated. Use wp_get_current_user() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "wp_get_current_user()",
    },
    {
        pattern: /\bget_current_theme\s*\(/,
        message:
            "get_current_theme() is deprecated. Use wp_get_theme() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "wp_get_theme()",
    },
    {
        pattern: /\bget_theme_data\s*\(/,
        message: "get_theme_data() is deprecated. Use wp_get_theme() instead",
        severity: "warning",
        category: "deprecated",
        replacement: "wp_get_theme()",
    },
];

/**
 * Text Domain Check
 */
export const TEXT_DOMAIN_PATTERNS: CheckPattern[] = [
    {
        pattern: /__\s*\(\s*['"][^'"]+['"]\s*\)/,
        message: "Translation function __() is missing text domain parameter",
        severity: "warning",
        category: "text-domain",
    },
    {
        pattern: /_e\s*\(\s*['"][^'"]+['"]\s*\)/,
        message: "Translation function _e() is missing text domain parameter",
        severity: "warning",
        category: "text-domain",
    },
    {
        pattern: /_x\s*\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*\)/,
        message: "Translation function _x() is missing text domain parameter",
        severity: "warning",
        category: "text-domain",
    },
    {
        pattern: /_n\s*\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,/,
        message: "Translation function _n() is missing text domain parameter",
        severity: "warning",
        category: "text-domain",
    },
    {
        pattern: /_nx\s*\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,/,
        message: "Translation function _nx() is missing text domain parameter",
        severity: "warning",
        category: "text-domain",
    },
];

/**
 * Required Features Check
 */
export const REQUIRED_FEATURES: CheckPattern[] = [
    {
        pattern: /register_nav_menus?\s*\(/,
        message: "REQUIRED: register_nav_menu() or register_nav_menus()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]post-thumbnails['"]/,
        message: "REQUIRED: add_theme_support('post-thumbnails')",
        severity: "error",
        category: "required",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]automatic-feed-links['"]/,
        message: "REQUIRED: add_theme_support('automatic-feed-links')",
        severity: "error",
        category: "required",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]title-tag['"]/,
        message: "REQUIRED: add_theme_support('title-tag')",
        severity: "error",
        category: "required",
    },
    {
        pattern: /register_sidebar\s*\(/,
        message: "REQUIRED: register_sidebar()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /wp_enqueue_style\s*\(/,
        message: "REQUIRED: wp_enqueue_style() for CSS files",
        severity: "error",
        category: "required",
    },
    {
        pattern: /wp_enqueue_script\s*\(/,
        message: "REQUIRED: wp_enqueue_script() for JavaScript files",
        severity: "error",
        category: "required",
    },
    {
        pattern: /add_action\s*\(\s*['"]wp_enqueue_scripts['"]/,
        message: "REQUIRED: add_action('wp_enqueue_scripts', ...)",
        severity: "error",
        category: "required",
    },
    {
        pattern: /comments_template\s*\(/,
        message: "REQUIRED: comments_template()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /wp_list_comments\s*\(/,
        message: "REQUIRED: wp_list_comments()",
        severity: "error",
        category: "required",
    },
];

/**
 * Recommended Features Check
 */
export const RECOMMENDED_FEATURES: CheckPattern[] = [
    {
        pattern: /register_block_style\s*\(/,
        message:
            "RECOMMENDED: No reference to register_block_style was found in the theme. Theme authors are encouraged to implement new block styles as a transition to block themes",
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /register_block_pattern\s*\(/,
        message:
            "RECOMMENDED: No reference to register_block_pattern was found in the theme. Theme authors are encouraged to implement custom block patterns as a transition to block themes",
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]wp-block-styles['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "wp-block-styles" ) was found in the theme. It is recommended that the theme implement this functionality',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]responsive-embeds['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "responsive-embeds" ) was found in the theme. It is recommended that the theme implement this functionality',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]html5['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "html5", $args ) was found in the theme. It is strongly recommended that the theme implement this functionality',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]custom-background['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "custom-background", $args ) was found in the theme. If the theme uses background images or solid colors for the background, then it is recommended that the theme implement this functionality',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]align-wide['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "align-wide" ) was found in the theme. It is recommended that the theme implement this functionality',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_editor_style\s*\(/,
        message:
            "RECOMMENDED: No reference to add_editor_style() was found in the theme. It is recommended that the theme implement editor styling, so as to make the editor content match the resulting post output in the theme, for a better user experience",
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]custom-header['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "custom-header", $args ) was found in the theme',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /add_theme_support\s*\(\s*['"]custom-logo['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "custom-logo" ) was found in the theme',
        severity: "info",
        category: "recommended",
    },
    {
        pattern: /the_custom_logo\s*\(/,
        message: "RECOMMENDED: No reference to the_custom_logo() was found",
        severity: "info",
        category: "recommended",
    },
    {
        pattern:
            /add_theme_support\s*\(\s*['"]customize-selective-refresh-widgets['"]/,
        message:
            'RECOMMENDED: No reference to add_theme_support( "customize-selective-refresh-widgets" ) was found',
        severity: "info",
        category: "recommended",
    },
];

/**
 * Plugin Territory Check
 */
export const PLUGIN_TERRITORY_PATTERNS: CheckPattern[] = [
    {
        pattern: /register_post_type\s*\(/,
        message:
            "WARNING: The theme appears to use register_post_type(). This is plugin territory functionality",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /register_taxonomy\s*\(/,
        message:
            "WARNING: The theme appears to use register_taxonomy(). This is plugin territory functionality",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /add_shortcode\s*\(/,
        message:
            "WARNING: The theme appears to use add_shortcode(). Custom post-content shortcodes are plugin territory",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /wp_mail\s*\(/,
        message:
            "WARNING: The theme appears to use wp_mail(). Sending emails is plugin territory",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /add_role\s*\(/,
        message:
            "WARNING: The theme appears to use add_role(). User roles and capabilities are plugin territory",
        severity: "warning",
        category: "plugin-territory",
    },
];

/**
 * CDN Check
 */
export const CDN_PATTERNS: CheckPattern[] = [
    {
        pattern: /fonts\.googleapis\.com/i,
        message:
            "WARNING: Google Fonts should be enqueued using wp_enqueue_style()",
        severity: "warning",
        category: "cdn",
    },
    {
        pattern: /code\.jquery\.com/i,
        message:
            "WARNING: jQuery from CDN detected. Use WordPress bundled jQuery instead",
        severity: "warning",
        category: "cdn",
    },
    {
        pattern: /ajax\.googleapis\.com/i,
        message:
            "WARNING: Google CDN detected. Use WordPress bundled libraries instead",
        severity: "warning",
        category: "cdn",
    },
    {
        pattern: /cdn\.jsdelivr\.net/i,
        message: "WARNING: jsDelivr CDN detected. Host files locally instead",
        severity: "warning",
        category: "cdn",
    },
    {
        pattern: /cdnjs\.cloudflare\.com/i,
        message: "WARNING: Cloudflare CDN detected. Host files locally instead",
        severity: "warning",
        category: "cdn",
    },
];

/**
 * Script/Style Tags Check
 */
export const SCRIPT_STYLE_PATTERNS: CheckPattern[] = [
    {
        pattern: /<script[^>]*src=/i,
        message: "WARNING: <script> tag found. Use wp_enqueue_script() instead",
        severity: "warning",
        category: "enqueue",
    },
    {
        pattern: /<link[^>]*rel=['"]stylesheet['"]/i,
        message:
            "WARNING: <link rel='stylesheet'> tag found. Use wp_enqueue_style() instead",
        severity: "warning",
        category: "enqueue",
    },
    {
        pattern: /role=['"]search['"]/i,
        message:
            'WARNING: role="search" was found. Use get_search_form() instead of hard coding forms. Otherwise, the form can not be filtered',
        severity: "warning",
        category: "best-practices",
    },
];

/**
 * Basic Patterns - Required WordPress functions
 */
export const BASIC_PATTERNS: CheckPattern[] = [
    {
        pattern: /wp_head\s*\(\s*\)/,
        message: "REQUIRED: wp_head()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /wp_footer\s*\(\s*\)/,
        message: "REQUIRED: wp_footer()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /body_class\s*\(\s*\)/,
        message: "REQUIRED: body_class()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /wp_link_pages\s*\(/,
        message: "REQUIRED: wp_link_pages()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /post_class\s*\(/,
        message: "REQUIRED: post_class()",
        severity: "error",
        category: "required",
    },
];

/**
 * Comment Patterns
 */
export const COMMENT_PATTERNS: CheckPattern[] = [
    {
        pattern: /comment_form\s*\(/,
        message: "REQUIRED: comment_form()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /wp_list_comments\s*\(/,
        message: "REQUIRED: wp_list_comments()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /comments_template\s*\(/,
        message: "REQUIRED: comments_template()",
        severity: "error",
        category: "required",
    },
];

/**
 * Pagination Patterns
 */
export const PAGINATION_PATTERNS: CheckPattern[] = [
    {
        pattern: /posts_nav_link\s*\(/,
        message: "REQUIRED: posts_nav_link() or paginate_links()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /paginate_links\s*\(/,
        message: "REQUIRED: paginate_links()",
        severity: "error",
        category: "required",
    },
    {
        pattern: /the_posts_pagination\s*\(/,
        message: "REQUIRED: the_posts_pagination()",
        severity: "error",
        category: "required",
    },
];

/**
 * Widget Patterns
 */
export const WIDGET_PATTERNS: CheckPattern[] = [
    {
        pattern:
            /class\s+\w+\s+extends\s+WP_Widget\s*{[^}]*function\s+\w+\s*\(/,
        message:
            "WARNING: Deprecated widget constructor found. Use __construct() instead of PHP4 style constructor",
        severity: "warning",
        category: "deprecated",
    },
];

/**
 * Deregister Patterns
 */
export const DEREGISTER_PATTERNS: CheckPattern[] = [
    {
        pattern: /wp_deregister_script\s*\(\s*['"]jquery['"]\s*\)/,
        message:
            "WARNING: Deregistering jQuery is not allowed. Use WordPress bundled jQuery",
        severity: "warning",
        category: "best-practices",
    },
];

/**
 * Content Width Pattern
 */
export const CONTENT_WIDTH_PATTERN: CheckPattern = {
    pattern: /\$content_width\s*=/,
    message: "REQUIRED: $content_width must be defined",
    severity: "error",
    category: "required",
};

/**
 * Menu Pattern
 */
export const MENU_PATTERN: CheckPattern = {
    pattern: /wp_nav_menu\s*\([^)]*\)/,
    message:
        "WARNING: A menu without a theme_location was found. You must manually check if the theme_location is included",
    severity: "warning",
    category: "best-practices",
};

/**
 * Flaticon Pattern
 */
export const FLATICON_PATTERN: CheckPattern = {
    pattern: /flaticon/i,
    message:
        "REQUIRED: Found a reference to flaticon. Assets from this website does not use a license that is compatible with GPL",
    severity: "error",
    category: "licensing",
};

/**
 * All prohibited patterns (checked per file)
 */
export const ALL_PATTERNS: CheckPattern[] = [
    ...BAD_THINGS_PATTERNS,
    ...ESCAPING_PATTERNS,
    ...DEPRECATED_PATTERNS,
    ...TEXT_DOMAIN_PATTERNS,
    ...PLUGIN_TERRITORY_PATTERNS,
    ...CDN_PATTERNS,
    ...SCRIPT_STYLE_PATTERNS,
    ...WIDGET_PATTERNS,
    ...DEREGISTER_PATTERNS,
    MENU_PATTERN,
    FLATICON_PATTERN,
];

/**
 * Required patterns (checked globally - must exist somewhere in theme)
 */
export const REQUIRED_PATTERNS: CheckPattern[] = [
    ...BASIC_PATTERNS,
    ...COMMENT_PATTERNS,
    ...PAGINATION_PATTERNS,
    CONTENT_WIDTH_PATTERN,
];
