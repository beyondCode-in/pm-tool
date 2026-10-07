console.log('📊 Auditing Work-In-Progress (WIP) Column Limits...');

const columns = [
  { name: 'In Progress', limit: 5, currentCards: 3 },
  { name: 'Code Review', limit: 3, currentCards: 2 },
  { name: 'QA & Testing', limit: 4, currentCards: 1 }
];

columns.forEach(col => {
  const isOk = col.currentCards <= col.limit;
  console.log(`  - Column "${col.name}": ${col.currentCards}/${col.limit} cards [${isOk ? 'OK' : 'EXCEEDED'}]`);
});

console.log('✓ WIP limit audit complete.');
