import fs from 'fs';
['src/App.tsx', 'src/lib/auth.tsx'].forEach(file => {
   let content = fs.readFileSync(file, 'utf8');
   content = content.replace(/import\.meta\.env\.VITE_API_URL\s*\|\|\s*'http:\/\/localhost:3001'/g, "''");
   fs.writeFileSync(file, content);
});
