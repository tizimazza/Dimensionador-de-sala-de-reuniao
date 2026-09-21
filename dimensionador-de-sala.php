<?php
/**
 * Plugin Name: Dimensionador de Sala de Reunião
 * Plugin URI: https://discabos.com.br
 * Description: Calculadora e dimensionador de equipamentos de áudio e vídeo para salas de reunião (Câmeras, Speakerphones, etc).
 * Version: 2.0.0
 * Author: Discabos
 * Author URI: https://discabos.com.br
 * Text Domain: dimensionador-de-sala
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// 1. Register the Admin Menu
add_action('admin_menu', 'discabos_sala_calculator_admin_menu');
function discabos_sala_calculator_admin_menu() {
    add_menu_page(
        'Dimensionador de Salas',
        'Dimensionador de Salas',
        'manage_options',
        'discabos-sala-calculator',
        'discabos_sala_calculator_admin_page',
        'dashicons-video-alt2',
        100
    );
}

// 2. Output the root div for the React Admin App
function discabos_sala_calculator_admin_page() {
    echo '<div class="wrap"><div id="discabos-sala-admin-root"></div></div>';
}

// 3. Register Shortcode for the Frontend
add_shortcode('dimensionador_de_sala', 'discabos_sala_calculator_shortcode');
function discabos_sala_calculator_shortcode($atts) {
    return '<div id="discabos-sala-frontend-root"></div>';
}

// 4. Enqueue Scripts and Styles
add_action('admin_enqueue_scripts', 'discabos_sala_calc_enqueue_admin_scripts');
function discabos_sala_calc_enqueue_admin_scripts($hook) {
    if ($hook !== 'toplevel_page_discabos-sala-calculator') {
        return;
    }
    discabos_sala_calc_enqueue_react_app('admin');
}

add_action('wp_enqueue_scripts', 'discabos_sala_calc_enqueue_frontend_scripts');
function discabos_sala_calc_enqueue_frontend_scripts() {
    global $post;
    // Somente carrega o script se o shortcode estiver na página
    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'dimensionador_de_sala')) {
        discabos_sala_calc_enqueue_react_app('frontend');
    }
}

function discabos_sala_calc_enqueue_react_app($mode) {
    $plugin_dir = plugin_dir_path(__FILE__);
    $plugin_url = plugin_dir_url(__FILE__);
    $dist_path = $plugin_dir . 'dist/assets/';
    $dist_url  = $plugin_url . 'dist/assets/';

    $js_file = '';
    $css_file = '';

    // Vasculha a pasta dist/assets gerada pelo React
    if (is_dir($dist_path)) {
        $files = scandir($dist_path);
        if (is_array($files)) {
            foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'js') {
                $js_file = $dist_url . $file;
                wp_enqueue_script('discabos-sala-script', $js_file, array(), '2.0.0', true);
            }
            if (pathinfo($file, PATHINFO_EXTENSION) === 'css') {
                $css_file = $dist_url . $file;
                wp_enqueue_style('discabos-sala-style', $css_file, array(), '2.0.0');
            }
        }
        }
    }

    $default_colors = array(
        'selection' => '#df1319',
        'action' => '#9ebf24'
    );

    // Passar configurações salvas do WordPress para o React
    $settings = array(
        'hubspotKey'  => get_option('discabos_sala_hubspot_key', ''),
        'copyEmail'   => get_option('discabos_sala_copy_email', ''),
        'productSkus' => get_option('discabos_sala_product_skus', (object)array()),
        'colors'      => get_option('discabos_sala_colors', $default_colors),
        'mode'        => $mode,
        'ajaxUrl'     => rest_url('discabos-sala/v1/')
    );

    // Na prática do React App local, usamos localStorage no Preview
    // mas no WP real o frontend consumiria essa variável global
    wp_localize_script('discabos-sala-script', 'discabosSalaCalcSettings', $settings);
}

// 5. REST API para salvar configurações do React App no painel Admin
add_action('rest_api_init', function () {
    register_rest_route('discabos-sala/v1', '/settings', array(
        'methods' => 'POST',
        'callback' => 'discabos_sala_calc_save_settings',
        'permission_callback' => function () {
            return current_user_can('manage_options');
        }
    ));

    register_rest_route('discabos-sala/v1', '/settings', array(
        'methods' => 'GET',
        'callback' => 'discabos_sala_calc_get_settings',
        'permission_callback' => function () {
            return current_user_can('manage_options');
        }
    ));

    register_rest_route('discabos-sala/v1', '/send-email', array(
        'methods' => 'POST',
        'callback' => 'discabos_sala_calc_send_email',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('discabos-sala/v1', '/products', array(
        'methods' => 'GET',
        'callback' => 'discabos_sala_calc_get_products',
        'permission_callback' => '__return_true'
    ));
});

function discabos_sala_calc_get_products($request) {
    $skus_param = $request->get_param('skus');
    if (empty($skus_param)) {
        return rest_ensure_response(array());
    }
    
    $skus = explode(',', $skus_param);
    $results = array();
    
    if (class_exists('WooCommerce')) {
        foreach($skus as $sku) {
            $sku_clean = sanitize_text_field(trim($sku));
            if (empty($sku_clean)) continue;
            
            $product_id = wc_get_product_id_by_sku($sku_clean);
            if ($product_id) {
                $product = wc_get_product($product_id);
                if ($product) {
                    $image_id = $product->get_image_id();
                    $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'thumbnail') : '';
                    $results[$sku_clean] = array(
                        'id' => $product->get_id(),
                        'name' => $product->get_name(),
                        'url' => $product->get_permalink(),
                        'image' => $image_url,
                        'price' => $product->get_price_html()
                    );
                }
            }
        }
    }
    
    return rest_ensure_response($results);
}

function discabos_sala_calc_save_settings($request) {
    $params = $request->get_json_params();
    
    if (isset($params['hubspotKey'])) update_option('discabos_sala_hubspot_key', sanitize_text_field($params['hubspotKey']));
    if (isset($params['copyEmail'])) update_option('discabos_sala_copy_email', sanitize_email($params['copyEmail']));
    if (isset($params['productSkus']) && is_array($params['productSkus'])) {
        $clean_skus = array();
        foreach($params['productSkus'] as $k => $v) {
            $clean_skus[sanitize_text_field($k)] = sanitize_text_field($v);
        }
        update_option('discabos_sala_product_skus', $clean_skus);
    }
    if (isset($params['colors']) && is_array($params['colors'])) {
        $clean_colors = array(
            'selection' => sanitize_text_field($params['colors']['selection']),
            'action' => sanitize_text_field($params['colors']['action'])
        );
        update_option('discabos_sala_colors', $clean_colors);
    }
    
    return rest_ensure_response(array('success' => true));
}

function discabos_sala_calc_get_settings() {
    $default_colors = array(
        'selection' => '#df1319',
        'action' => '#9ebf24'
    );
    return rest_ensure_response(array(
        'hubspotKey'  => get_option('discabos_sala_hubspot_key', ''),
        'copyEmail'   => get_option('discabos_sala_copy_email', ''),
        'productSkus' => get_option('discabos_sala_product_skus', (object)array()),
        'colors'      => get_option('discabos_sala_colors', $default_colors)
    ));
}

function discabos_sala_calc_send_email($request) {
    $params = $request->get_json_params();
    $userEmail = sanitize_email($params['userEmail']);
    $htmlContent = isset($params['htmlContent']) ? $params['htmlContent'] : '';
    $imageBase64 = isset($params['imageBase64']) ? $params['imageBase64'] : '';

    if (empty($userEmail)) {
        return new WP_Error('no_email', 'Email do usuário não fornecido', array('status' => 400));
    }

    $attachments = array();
    $temp_file = '';

    // Handle Image Attachment
    if (!empty($imageBase64)) {
        $image_parts = explode(";base64,", $imageBase64);
        if (count($image_parts) == 2) {
            $image_type_aux = explode("image/", $image_parts[0]);
            if (isset($image_type_aux[1])) {
                $image_type = $image_type_aux[1];
                $image_base64 = base64_decode($image_parts[1]);
                $upload_dir = wp_upload_dir();
                $temp_file = $upload_dir['path'] . '/diagrama-projeto-' . time() . '.' . $image_type;
                file_put_contents($temp_file, $image_base64);
                $attachments[] = $temp_file;
            }
        }
    }

    $copyEmail = get_option('discabos_sala_copy_email', '');
    $to = $userEmail;
    if (!empty($copyEmail)) {
        $to .= ',' . $copyEmail;
    }

    $subject = 'Seu Dimensionamento de Sonorização - Discabos';
    
    $headers = array('Content-Type: text/html; charset=UTF-8');

    $logoUrl = get_site_icon_url();
    if (!$logoUrl && function_exists('get_custom_logo')) {
        $custom_logo_id = get_theme_mod('custom_logo');
        $logo_image = wp_get_attachment_image_src($custom_logo_id, 'full');
        if (is_array($logo_image) && !empty($logo_image[0])) {
            $logoUrl = $logo_image[0];
        }
    }

    $headerHtml = '';
    if (!empty($logoUrl)) {
        $headerHtml = '<div style="text-align:center; margin-bottom: 20px;"><img src="' . esc_url($logoUrl) . '" alt="Logo" style="max-height: 80px;" /></div>';
    }

    $footerHtml = '
        <br/><br/>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"/>
        <div style="color: #666; font-size: 12px; font-family: sans-serif;">
            <p style="margin: 0;"><strong>Grupo Discabos</strong></p>
            <p style="margin: 0;">11 4138-8373</p>
            <p style="margin: 0;"><a href="mailto:vendas@discabos.com.br" style="color: #DF1319;">vendas@discabos.com.br</a></p>
        </div>
    ';

    // Se a imagem não for anexo, poderíamos usar CID, mas anexar é mais seguro.
    $body = '<html><body style="font-family: sans-serif; color: #333; line-height: 1.5; padding: 20px;">' . $headerHtml . wp_kses_post($htmlContent) . '<br/><p>Enviamos em anexo o diagrama/mapa do seu projeto.</p>' . $footerHtml . '</body></html>';

    $sent = wp_mail($to, $subject, $body, $headers, $attachments);

    if ($temp_file && file_exists($temp_file)) {
        unlink($temp_file);
    }

    if ($sent) {
        return rest_ensure_response(array('success' => true));
    } else {
        return new WP_Error('mail_failed', 'Falha ao enviar e-mail', array('status' => 500));
    }
}
