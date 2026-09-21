const fs = require('fs');
let content = fs.readFileSync('dimensionador-de-sala.php', 'utf8');

// Fix scandir
content = content.replace(
    /if \(file_exists\(\$dist_path\)\) \{\s+\$files = scandir\(\$dist_path\);\s+foreach \(\$files as \$file\) \{/,
    'if (is_dir($dist_path)) {\n        $files = scandir($dist_path);\n        if (is_array($files)) {\n            foreach ($files as $file) {'
);

content = content.replace(
    /wp_enqueue_style\('discabos-sala-style', \$css_file, array\(\), '1\.0\.6'\);\s+\}\s+\}\s+\}/,
    'wp_enqueue_style(\'discabos-sala-style\', $css_file, array(), \'2.0.0\');\n            }\n        }\n        }\n    }'
);

// Fix version
content = content.replace(/Version: 1\.0\.6/g, 'Version: 2.0.0');
content = content.replace(/'1\.0\.6'/g, "'2.0.0'");

// Fix productSkus
content = content.replace(
    /'productSkus' => get_option\('discabos_sala_product_skus', array\(\)\)/g,
    "'productSkus' => get_option('discabos_sala_product_skus', (object)array())"
);

// Fix sanitize_hex_color
content = content.replace(/sanitize_hex_color/g, 'sanitize_text_field');

fs.writeFileSync('dimensionador-de-sala.php', content);
