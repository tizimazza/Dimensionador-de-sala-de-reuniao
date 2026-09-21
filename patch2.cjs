const fs = require('fs');
let content = fs.readFileSync('dimensionador-de-sala.php', 'utf8');

content = content.replace(
    /if \(!empty\(\$logo_image\[0\]\)\) \{/,
    'if (is_array($logo_image) && !empty($logo_image[0])) {'
);

fs.writeFileSync('dimensionador-de-sala.php', content);
