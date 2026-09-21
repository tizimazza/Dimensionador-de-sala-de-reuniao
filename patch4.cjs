const fs = require('fs');
let content = fs.readFileSync('src/views/FrontendView.tsx', 'utf8');

content = content.replace("    <style>{", "    <>\n      <style>{");
content = content.replace("    </div>\n  );\n}", "    </div>\n    </>\n  );\n}");

fs.writeFileSync('src/views/FrontendView.tsx', content);
