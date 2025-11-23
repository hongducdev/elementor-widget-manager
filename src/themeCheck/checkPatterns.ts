export interface CheckPattern {
    pattern: RegExp;
    message: string;
    severity: "error" | "warning" | "info";
    category: string;
    replacement?: string;
}

/**
 * Bad Things Check - Mã độc và hàm bị cấm
 */
export const BAD_THINGS_PATTERNS: CheckPattern[] = [
    {
        pattern: /(?<![_|a-z0-9|\.])eval\s?\(/i,
        message: "Không được phép sử dụng eval()",
        severity: "error",
        category: "security",
    },
    {
        pattern:
            /[^a-z0-9](?<!_)(popen|proc_open|[^_]exec|shell_exec|system|passthru)\(/,
        message:
            "Các lệnh gọi hệ thống PHP thường bị vô hiệu hóa bởi quản trị viên server và không nên có trong theme",
        severity: "error",
        category: "security",
    },
    {
        pattern: /base64_decode/,
        message: "base64_decode() không được phép",
        severity: "error",
        category: "security",
    },
    {
        pattern: /pub-[0-9]{16}/i,
        message: "Phát hiện mã quảng cáo Google",
        severity: "error",
        category: "security",
    },
    {
        pattern: /sharesale\.com/i,
        message: "Phát hiện liên kết affiliate ShareSale",
        severity: "error",
        category: "security",
    },
    {
        pattern: /ini_set\(/,
        message:
            "Không được phép thay đổi cài đặt server. Sử dụng wp_raise_memory_limit() thay thế",
        severity: "warning",
        category: "security",
    },
    {
        pattern: /error_reporting\(/,
        message: "Không được phép thay đổi error_reporting trong theme",
        severity: "warning",
        category: "security",
    },
    {
        pattern: /\$_SERVER\['HTTP_USER_AGENT'\]/,
        message: "Tránh dựa vào User Agent để phát hiện trình duyệt",
        severity: "info",
        category: "security",
    },
    {
        pattern: /file_get_contents\s*\(\s*['"]http/i,
        message:
            "file_get_contents() với URL từ xa không được khuyến khích. Sử dụng wp_remote_get() thay thế",
        severity: "warning",
        category: "security",
    },
    {
        pattern: /curl_exec\(/,
        message: "Sử dụng wp_remote_get() thay vì cURL",
        severity: "warning",
        category: "security",
    },
    {
        pattern: /fsockopen\(/,
        message: "Sử dụng wp_remote_get() thay vì fsockopen()",
        severity: "warning",
        category: "security",
    },
];

/**
 * Escaping Check - Thiếu escape dữ liệu đầu ra
 */
export const ESCAPING_PATTERNS: CheckPattern[] = [
    {
        pattern: /echo\s+\$[a-zA-Z_][a-zA-Z0-9_]*(?!\s*\))/,
        message:
            "Tất cả dữ liệu động phải được escape. Sử dụng esc_html(), esc_attr(), hoặc esc_url()",
        severity: "warning",
        category: "escaping",
    },
    {
        pattern: /<\?=\s*\$[a-zA-Z_][a-zA-Z0-9_]*/,
        message:
            "Thẻ echo ngắn với biến chưa escape. Sử dụng esc_html() hoặc esc_attr()",
        severity: "warning",
        category: "escaping",
    },
];

/**
 * Deprecated Functions Check - Hàm đã lỗi thời
 */
export const DEPRECATED_PATTERNS: CheckPattern[] = [
    {
        pattern: /\bwp_title\s*\(/,
        message: "wp_title() đã lỗi thời từ WordPress 4.4",
        severity: "warning",
        category: "deprecated",
        replacement: "wp_get_document_title()",
    },
    {
        pattern: /\bget_usermeta\s*\(/,
        message: "get_usermeta() đã lỗi thời từ WordPress 3.0",
        severity: "warning",
        category: "deprecated",
        replacement: "get_user_meta()",
    },
    {
        pattern: /\bget_the_author_login\s*\(/,
        message: "get_the_author_login() đã lỗi thời từ WordPress 2.8",
        severity: "warning",
        category: "deprecated",
        replacement: "the_author_meta('login')",
    },
    {
        pattern: /\bget_the_author_firstname\s*\(/,
        message: "get_the_author_firstname() đã lỗi thời từ WordPress 2.8",
        severity: "warning",
        category: "deprecated",
        replacement: "the_author_meta('first_name')",
    },
    {
        pattern: /\bget_the_author_lastname\s*\(/,
        message: "get_the_author_lastname() đã lỗi thời từ WordPress 2.8",
        severity: "warning",
        category: "deprecated",
        replacement: "the_author_meta('last_name')",
    },
    {
        pattern: /\bget_the_author_email\s*\(/,
        message: "get_the_author_email() đã lỗi thời từ WordPress 2.8",
        severity: "warning",
        category: "deprecated",
        replacement: "the_author_meta('user_email')",
    },
    {
        pattern: /\bget_the_author_url\s*\(/,
        message: "get_the_author_url() đã lỗi thời từ WordPress 2.8",
        severity: "warning",
        category: "deprecated",
        replacement: "the_author_meta('user_url')",
    },
    {
        pattern: /\bget_the_author_ID\s*\(/,
        message: "get_the_author_ID() đã lỗi thời từ WordPress 2.8",
        severity: "warning",
        category: "deprecated",
        replacement: "get_the_author_meta('ID')",
    },
    {
        pattern: /\bwp_get_http\s*\(/,
        message: "wp_get_http() đã lỗi thời từ WordPress 4.4",
        severity: "warning",
        category: "deprecated",
        replacement: "wp_remote_get()",
    },
    {
        pattern: /\bscreen_icon\s*\(/,
        message: "screen_icon() đã lỗi thời từ WordPress 3.8",
        severity: "warning",
        category: "deprecated",
        replacement: "Không cần thay thế - icon tự động hiển thị",
    },
];

/**
 * Text Domain Check - Vấn đề i18n
 */
export const TEXTDOMAIN_PATTERNS: CheckPattern[] = [
    {
        pattern: /__\s*\(\s*['"][^'"]+['"]\s*\)/,
        message: "Hàm dịch thiếu tham số text domain",
        severity: "warning",
        category: "i18n",
    },
    {
        pattern: /_e\s*\(\s*['"][^'"]+['"]\s*\)/,
        message: "Hàm dịch thiếu tham số text domain",
        severity: "warning",
        category: "i18n",
    },
    {
        pattern: /esc_html__\s*\(\s*['"][^'"]+['"]\s*\)/,
        message: "Hàm dịch thiếu tham số text domain",
        severity: "warning",
        category: "i18n",
    },
    {
        pattern: /esc_attr__\s*\(\s*['"][^'"]+['"]\s*\)/,
        message: "Hàm dịch thiếu tham số text domain",
        severity: "warning",
        category: "i18n",
    },
    {
        pattern: /esc_html__\s*\(\s*['"][^'"]+['"]\s*,\s*['"]pixelart['"]\s*\)/,
        message:
            "Text domain không nhất quán. Nên dùng 'northway' thay vì 'pixelart'",
        severity: "warning",
        category: "i18n",
    },
];

/**
 * Plugin Territory - Chức năng nên để trong plugin
 */
export const PLUGIN_TERRITORY_PATTERNS: CheckPattern[] = [
    {
        pattern: /register_post_type\s*\(/,
        message:
            "Custom post types nên được đăng ký trong plugin, không phải theme",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /register_taxonomy\s*\(/,
        message:
            "Custom taxonomies nên được đăng ký trong plugin, không phải theme",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /add_shortcode\s*\(/,
        message:
            "Shortcodes nên được tạo trong plugin để tránh mất dữ liệu khi đổi theme",
        severity: "info",
        category: "plugin-territory",
    },
];

/**
 * Constants Check - Hằng số đã lỗi thời
 */
export const CONSTANTS_PATTERNS: CheckPattern[] = [
    {
        pattern: /\bSTYLESHEETPATH\b/,
        message: "STYLESHEETPATH đã lỗi thời",
        severity: "error",
        category: "deprecated",
        replacement: "get_stylesheet_directory()",
    },
    {
        pattern: /\bTEMPLATEPATH\b/,
        message: "TEMPLATEPATH đã lỗi thời",
        severity: "error",
        category: "deprecated",
        replacement: "get_template_directory()",
    },
    {
        pattern: /\bHEADER_IMAGE\b/,
        message: "HEADER_IMAGE đã lỗi thời",
        severity: "error",
        category: "deprecated",
        replacement: "add_theme_support('custom-header')",
    },
    {
        pattern: /\bBACKGROUND_COLOR\b/,
        message: "BACKGROUND_COLOR đã lỗi thời",
        severity: "error",
        category: "deprecated",
        replacement: "add_theme_support('custom-background')",
    },
];

/**
 * iFrame Check - Phát hiện iframe
 */
export const IFRAME_PATTERNS: CheckPattern[] = [
    {
        pattern: /<iframe[^>]*>/i,
        message:
            "iframes đôi khi được sử dụng để load quảng cáo và mã độc. Cần kiểm tra thủ công",
        severity: "info",
        category: "security",
    },
];

/**
 * Include Check - Sử dụng include/require
 */
export const INCLUDE_PATTERNS: CheckPattern[] = [
    {
        pattern: /(?<![a-z0-9_'"])(?:require|include)(?:_once)?\s?['"\(]/i,
        message:
            "Nên sử dụng get_template_part() thay vì include/require cho template files",
        severity: "info",
        category: "best-practice",
        replacement: "get_template_part()",
    },
];

/**
 * CDN Check - Hard-coded CDN URLs
 */
export const CDN_PATTERNS: CheckPattern[] = [
    {
        pattern:
            /https?:\/\/[^'"]*(?:googleapis|cloudflare|jsdelivr|unpkg|cdnjs)/i,
        message:
            "Phát hiện CDN URL hard-coded. Nên enqueue scripts/styles qua WordPress",
        severity: "warning",
        category: "best-practice",
    },
];

/**
 * Script/Style Tags - Hard-coded tags
 */
export const SCRIPT_STYLE_PATTERNS: CheckPattern[] = [
    {
        pattern: /<script[^>]*src=/i,
        message:
            "Phát hiện thẻ <script> hard-coded. Sử dụng wp_enqueue_script() thay thế",
        severity: "warning",
        category: "best-practice",
    },
    {
        pattern: /<link[^>]*rel=['"]stylesheet['"]/i,
        message:
            "Phát hiện thẻ <link> hard-coded. Sử dụng wp_enqueue_style() thay thế",
        severity: "warning",
        category: "best-practice",
    },
];

/**
 * Admin Menu Check
 */
export const ADMIN_MENU_PATTERNS: CheckPattern[] = [
    {
        pattern: /add_menu_page\s*\(/,
        message:
            "Theme không nên thêm admin menu pages. Chức năng này thuộc về plugin",
        severity: "warning",
        category: "plugin-territory",
    },
    {
        pattern: /add_submenu_page\s*\(/,
        message:
            "Theme không nên thêm admin submenu pages. Chức năng này thuộc về plugin",
        severity: "warning",
        category: "plugin-territory",
    },
];

/**
 * Favicon Check
 */
export const FAVICON_PATTERNS: CheckPattern[] = [
    {
        pattern: /<link[^>]*rel=['"](?:shortcut )?icon['"]/i,
        message:
            "Không nên hard-code favicon. Sử dụng Site Icon trong Customizer",
        severity: "warning",
        category: "best-practice",
    },
];

/**
 * Hidden Admin Bar
 */
export const ADMIN_BAR_PATTERNS: CheckPattern[] = [
    {
        pattern: /show_admin_bar\s*\(\s*false\s*\)/,
        message:
            "Theme không được ẩn admin bar. Người dùng có thể tự ẩn nếu muốn",
        severity: "error",
        category: "required",
    },
];

/**
 * All patterns combined
 */
export const ALL_PATTERNS: CheckPattern[] = [
    ...BAD_THINGS_PATTERNS,
    ...ESCAPING_PATTERNS,
    ...DEPRECATED_PATTERNS,
    ...TEXTDOMAIN_PATTERNS,
    ...PLUGIN_TERRITORY_PATTERNS,
    ...CONSTANTS_PATTERNS,
    ...IFRAME_PATTERNS,
    ...INCLUDE_PATTERNS,
    ...CDN_PATTERNS,
    ...SCRIPT_STYLE_PATTERNS,
    ...ADMIN_MENU_PATTERNS,
    ...FAVICON_PATTERNS,
    ...ADMIN_BAR_PATTERNS,
];
