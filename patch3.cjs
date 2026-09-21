const fs = require('fs');
let content = fs.readFileSync('src/views/FrontendView.tsx', 'utf8');

content = content.replace("backgroundColor: 'var(--color-selection)' }}>\n                                            Adicionar ao Pedido", "backgroundColor: 'var(--color-action)' }}>\n                                            Adicionar ao Pedido");
fs.writeFileSync('src/views/FrontendView.tsx', content);
