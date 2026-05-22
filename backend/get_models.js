require('dotenv').config();
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY)
  .then(res => res.json())
  .then(data => {
    const fs = require('fs');
    fs.writeFileSync('models_list.txt', data.models.map(m => `- ${m.name} (${m.displayName})`).join('\n'));
    console.log('Done');
  })
  .catch(console.error);
