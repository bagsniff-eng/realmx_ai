const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'testsprite_tests', 'testsprite_frontend_test_plan.json');
let plan = JSON.parse(fs.readFileSync(file, 'utf8'));

// Remove hallucinated tests
plan = plan.filter(t => !['TC010', 'TC011', 'TC012', 'TC013'].includes(t.id));

// Fix TC001
const tc1 = plan.find(t => t.id === 'TC001');
if (tc1) {
  tc1.steps = [
    { type: "action", description: "Navigate to /" },
    { type: "assertion", description: "Verify text 'Dashboard' is visible" },
    { type: "action", description: "Hover over or interact with the User Profile icon to open the dropdown" },
    { type: "assertion", description: "Verify text 'Connect Identity' is visible" },
    { type: "assertion", description: "Verify text 'Connect Wallet' is visible" }
  ];
}

fs.writeFileSync(file, JSON.stringify(plan, null, 2));
console.log('Fixed test plan.');
