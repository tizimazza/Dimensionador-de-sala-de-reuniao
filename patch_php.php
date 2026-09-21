<?php
$content = file_get_contents('dimensionador-de-sala.php');

// Fix scandir
$content = str_replace(
    'if (file_exists($dist_path)) {
        $files = scandir($dist_path);
        foreach ($files as $file) {',
    'if (is_dir($dist_path)) {
        $files = scandir($dist_path);
        if (is_array($files)) {
            foreach ($files as $file) {',
    $content
);
$content = str_replace(
    'wp_enqueue_style(\'discabos-sala-style\', $css_file, array(), \'1.0.6\');
            }
        }
    }',
    'wp_enqueue_style(\'discabos-sala-style\', $css_file, array(), \'2.0.0\');
            }
        }
        }
    }',
    $content
);

// Fix version
$content = str_replace('Version: 1.0.6', 'Version: 2.0.0', $content);
$content = str_replace('\'1.0.6\'', '\'2.0.0\'', $content);

// Fix array() to (object)array() for productSkus
$content = preg_replace(
    '/\'productSkus\' => get_option\(\'discabos_sala_product_skus\', array\(\)\)/',
    '\'productSkus\' => get_option(\'discabos_sala_product_skus\', (object)array())',
    $content
);

// Fix sanitize_hex_color to sanitize_text_field to prevent any fatal error
$content = str_replace('sanitize_hex_color', 'sanitize_text_field', $content);

file_put_contents('dimensionador-de-sala.php', $content);
